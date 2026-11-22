-- Encuesta v2: 9 reactivos Likert en 3 bloques (ISO 9241-11) + pregunta abierta; se quita el bloque léxico.
-- Correr completo en el SQL Editor de Supabase. No borra respuestas anteriores: las filas viejas quedan
-- con las columnas nuevas en null y los promedios las ignoran.

alter table public.encuestas_usabilidad
  add column if not exists audios smallint check (audios between 1 and 5),
  add column if not exists tarjetas smallint check (tarjetas between 1 and 5),
  add column if not exists retroalimentacion smallint check (retroalimentacion between 1 and 5),
  add column if not exists volveria smallint check (volveria between 1 and 5),
  alter column aciertos_lexicos drop not null;

-- Estadísticas para el tablero (reemplaza la versión anterior). Solo agregados y comentarios, nunca usuario_id.
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
                          ('audios', audios), ('tarjetas', tarjetas), ('retroalimentacion', retroalimentacion),
                          ('motivacion', motivacion), ('utilidad', utilidad), ('volveria', volveria)) as l(clave, valor)
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
