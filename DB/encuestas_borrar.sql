-- Borra TODAS las cuentas simuladas creadas con encuestas_crear.sql (identificadas por su marca interna en
-- raw_app_meta_data) y, en cascada, su perfil, progreso, encuesta e identidades.
-- No toca cuentas reales (no tienen esa marca). Seguro de correr más de una vez.

begin;

-- Explícito por si alguna tabla no tuviera "on delete cascade".
delete from public.encuestas_usabilidad where usuario_id in (select id from auth.users where raw_app_meta_data ->> 'prueba' = 'true');
delete from public.progreso_usuarios where usuario_id in (select id from auth.users where raw_app_meta_data ->> 'prueba' = 'true');
delete from public.usuarios where id in (select id from auth.users where raw_app_meta_data ->> 'prueba' = 'true');
delete from auth.users where raw_app_meta_data ->> 'prueba' = 'true';

commit;

-- Comprobación: debe decir 0.
select count(*) as cuentas_de_simulacion_restantes from auth.users where raw_app_meta_data ->> 'prueba' = 'true';
