-- Encuesta v3: nombres finales de las columnas de los reactivos 4, 5 y 9.
-- Seguro de correr más de una vez: si existe la columna de la v2 la renombra (conserva sus datos);
-- si no existe ninguna de las dos, la crea. No borra filas ni columnas.

do $$
declare
  cambio record;
begin
  for cambio in select * from (values
    ('audios', 'audio_pronunciacion'),
    ('tarjetas', 'retencion_vocabulario'),
    ('volveria', 'continuidad')
  ) as t(anterior, nueva)
  loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'encuestas_usabilidad' and column_name = cambio.anterior)
       and not exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'encuestas_usabilidad' and column_name = cambio.nueva) then
      execute format('alter table public.encuestas_usabilidad rename column %I to %I', cambio.anterior, cambio.nueva);
    end if;
  end loop;
end $$;

alter table public.encuestas_usabilidad
  add column if not exists navegacion smallint check (navegacion between 1 and 5),
  add column if not exists diseno smallint check (diseno between 1 and 5),
  add column if not exists instrucciones smallint check (instrucciones between 1 and 5),
  add column if not exists audio_pronunciacion smallint check (audio_pronunciacion between 1 and 5),
  add column if not exists retencion_vocabulario smallint check (retencion_vocabulario between 1 and 5),
  add column if not exists retroalimentacion smallint check (retroalimentacion between 1 and 5),
  add column if not exists motivacion smallint check (motivacion between 1 and 5),
  add column if not exists utilidad smallint check (utilidad between 1 and 5),
  add column if not exists continuidad smallint check (continuidad between 1 and 5),
  add column if not exists comentario text check (char_length(comentario) <= 1000);

-- Estadísticas del tablero con los nombres nuevos. Solo agregados y comentarios, nunca usuario_id.
create or replace function public.estadisticas_encuesta()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from encuestas_usabilidad),
    'ultima', (select max(creado_en) from encuestas_usabilidad),
    'likert', (
      select json_object_agg(clave, stats)
      from (
        select clave, json_build_object(
          'promedio', round(avg(valor)::numeric, 2),
          'distribucion', json_build_array(
            count(*) filter (where valor = 1), count(*) filter (where valor = 2), count(*) filter (where valor = 3),
            count(*) filter (where valor = 4), count(*) filter (where valor = 5))
        ) as stats
        from encuestas_usabilidad,
          lateral (values ('navegacion', navegacion), ('diseno', diseno), ('instrucciones', instrucciones),
                          ('audio_pronunciacion', audio_pronunciacion), ('retencion_vocabulario', retencion_vocabulario),
                          ('retroalimentacion', retroalimentacion), ('motivacion', motivacion), ('utilidad', utilidad),
                          ('continuidad', continuidad)) as l(clave, valor)
        where valor is not null
        group by clave
      ) por_reactivo
    ),
    'por_dia', (
      select coalesce(json_agg(json_build_object('dia', dia, 'n', n) order by dia), '[]'::json)
      from (select creado_en::date as dia, count(*) as n from encuestas_usabilidad group by 1) d
    ),
    'comentarios', (
      select coalesce(json_agg(json_build_object('texto', comentario, 'fecha', creado_en) order by creado_en desc), '[]'::json)
      from encuestas_usabilidad where comentario is not null
    )
  );
$$;

revoke all on function public.estadisticas_encuesta() from public;
grant execute on function public.estadisticas_encuesta() to anon, authenticated;
