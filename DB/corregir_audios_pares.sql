-- Corrige los audios del ejercicio «emparejar_pares»: cada par toma el audio_path (y la descripcion)
-- de su palabra en la tabla palabras, que sí coinciden con los archivos del bucket «Audios».
-- Antes apuntaban a sentarse.mp3, Muchacha.mp3, pavo.mp3 y frijol.mp3, que no existen en el bucket.
-- Se puede ejecutar más de una vez sin dañar nada.

-- PASO 1 (solo mira): audio actual del par vs. el audio de su palabra.
select e.id, par->>'nahuat' as nahuat, par->>'audio_path' as audio_par, p.audio_path as audio_palabra
from public.ejercicios e
cross join lateral jsonb_array_elements(e.opciones::jsonb -> 'pares') as par
left join lateral (
  select audio_path from public.palabras
  where palabra_nahuat = par->>'nahuat' and audio_path is not null
  limit 1
) p on true
where e.tipo = 'emparejar_pares';

-- PASO 2: corrige los pares.
update public.ejercicios e
set opciones = jsonb_set(e.opciones::jsonb, '{pares}', (
  select jsonb_agg(
    par || coalesce((
      select jsonb_strip_nulls(jsonb_build_object('audio_path', p.audio_path, 'descripcion', p.descripcion))
      from public.palabras p
      where p.palabra_nahuat = par->>'nahuat' and p.audio_path is not null
      limit 1
    ), '{}'::jsonb)
    order by ord)
  from jsonb_array_elements(e.opciones::jsonb -> 'pares') with ordinality as t(par, ord)
))
where e.tipo = 'emparejar_pares';
