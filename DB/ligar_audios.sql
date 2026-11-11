-- Liga cada MP3 del bucket "Audios" con su palabra (columna palabras.audio_path = nombre del archivo).
-- Empareja el nombre del archivo, sin «.mp3», sin « - copia», sin acentos ni mayúsculas,
-- con la traducción al español o con la palabra en náhuatl.

-- PASO 1 (solo mira, no cambia nada): qué archivo va con qué palabra.
-- Las filas con palabra vacía son archivos que no encontraron pareja: hay que ligarlos a mano.
with archivos as (
  select o.name,
         lower(translate(regexp_replace(regexp_replace(o.name, '\.mp3$', '', 'i'), '\s*-\s*copia$', '', 'i'),
                         'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')) as clave
  from storage.objects o
  where o.bucket_id = (select id from storage.buckets where name = 'Audios')
),
palabras_n as (
  select id, palabra_nahuat, traduccion_espanol, audio_path,
         lower(translate(trim(traduccion_espanol), 'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')) as esp,
         lower(translate(trim(palabra_nahuat), 'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')) as nah
  from public.palabras
)
select a.name as archivo, p.palabra_nahuat, p.traduccion_espanol, p.audio_path as audio_actual
from archivos a
left join palabras_n p on a.clave in (p.esp, p.nah)
order by p.palabra_nahuat nulls first, a.name;

-- PASO 2: guarda el archivo en audio_path (solo en palabras que aún no tienen audio).
-- Si una palabra tiene dos archivos (ej. «Pescado» y «Pescado - copia»), se queda con el primero.
with archivos as (
  select o.name,
         lower(translate(regexp_replace(regexp_replace(o.name, '\.mp3$', '', 'i'), '\s*-\s*copia$', '', 'i'),
                         'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')) as clave
  from storage.objects o
  where o.bucket_id = (select id from storage.buckets where name = 'Audios')
),
pareja as (
  select distinct on (p.id) p.id, a.name
  from public.palabras p
  join archivos a on a.clave in (lower(translate(trim(p.traduccion_espanol), 'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')),
                                 lower(translate(trim(p.palabra_nahuat), 'áéíóúüÁÉÍÓÚÜñÑ', 'aeiouuAEIOUUnN')))
  where p.audio_path is null
  order by p.id, a.name
)
update public.palabras p set audio_path = pareja.name from pareja where p.id = pareja.id;
