-- Tago usa el audio recortado (solo «Tago», sin el «Pia» de «Pia tago»).
-- Antes de ejecutarlo, sube tago_muchacha.mp3 al bucket «Audios».

-- 1. La palabra.
update public.palabras set audio_path = 'tago_muchacha.mp3' where palabra_nahuat = 'Tago';

-- 2. El par de Tago dentro del ejercicio de emparejar.
update public.ejercicios e
set opciones = jsonb_set(e.opciones::jsonb, '{pares}', (
  select jsonb_agg(
    case when par->>'nahuat' = 'Tago' then par || '{"audio_path": "tago_muchacha.mp3"}'::jsonb else par end
    order by ord)
  from jsonb_array_elements(e.opciones::jsonb -> 'pares') with ordinality as t(par, ord)
))
where e.tipo = 'emparejar_pares';
