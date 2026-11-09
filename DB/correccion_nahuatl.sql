-- Corrección de escritura: «náhuat» -> «náhuatl» en los textos que ve el usuario.
-- \M = fin de palabra, así «náhuatl» no se vuelve «náhuatll» si se corre dos veces.
-- No se toca palabras.variante_regional ('Náhuat de Pajapan (AVELI)'): es el nombre de la fuente.

update public.categorias set descripcion = regexp_replace(descripcion, '([Nn])áhuat\M', '\1áhuatl', 'g') where descripcion ~ '[Nn]áhuat\M';
update public.lecciones  set titulo      = regexp_replace(titulo,      '([Nn])áhuat\M', '\1áhuatl', 'g') where titulo      ~ '[Nn]áhuat\M';
update public.lecciones  set descripcion = regexp_replace(descripcion, '([Nn])áhuat\M', '\1áhuatl', 'g') where descripcion ~ '[Nn]áhuat\M';
update public.ejercicios set instruccion = regexp_replace(instruccion, '([Nn])áhuat\M', '\1áhuatl', 'g') where instruccion ~ '[Nn]áhuat\M';
update public.palabras   set descripcion = regexp_replace(descripcion, '([Nn])áhuat\M', '\1áhuatl', 'g') where descripcion ~ '[Nn]áhuat\M';

-- Comprobación: debe regresar 0 filas.
select 'categorias' t, descripcion from public.categorias where descripcion ~ '[Nn]áhuat\M'
union all select 'lecciones', titulo || ' / ' || coalesce(descripcion, '') from public.lecciones where titulo ~ '[Nn]áhuat\M' or descripcion ~ '[Nn]áhuat\M'
union all select 'ejercicios', instruccion from public.ejercicios where instruccion ~ '[Nn]áhuat\M';
