-- La nota de Tago debe coincidir con su audio recortado: solo «Tago = Muchacha», sin «Pia tago».

-- 1. La palabra.
update public.palabras
set descripcion = 'Joven o muchacha en náhuat del sur de Veracruz (Ej: Tago = Muchacha)'
where palabra_nahuat = 'Tago';

-- 2. El par de Tago dentro del ejercicio de emparejar (guarda una copia de la descripción).
update public.ejercicios e
set opciones = jsonb_set(e.opciones::jsonb, '{pares}', (
  select jsonb_agg(
    case when par->>'nahuat' = 'Tago'
      then par || jsonb_build_object('descripcion', 'Joven o muchacha en náhuat del sur de Veracruz (Ej: Tago = Muchacha)')
      else par end
    order by ord)
  from jsonb_array_elements(e.opciones::jsonb -> 'pares') with ordinality as t(par, ord)
))
where e.tipo = 'emparejar_pares';
