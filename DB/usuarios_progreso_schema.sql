-- Tablas sin datos (Supabase no deja exportarlas vacías).
-- Esquemas exactos, copiados de Supabase ("Copy table schema").

create table public.usuarios (
  id uuid not null,
  nombre text not null default ''::text,
  correo text null,
  nivel_actual integer not null default 1,
  puntos integer not null default 0,
  vidas integer not null default 5,
  fecha_registro timestamp with time zone not null default now(),
  constraint usuarios_pkey primary key (id),
  constraint usuarios_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint usuarios_nivel_actual_check check ((nivel_actual >= 1)),
  constraint usuarios_puntos_check check ((puntos >= 0)),
  constraint usuarios_vidas_check check ((vidas >= 0))
) TABLESPACE pg_default;

create table public.progreso_usuarios (
  id uuid not null default gen_random_uuid (),
  usuario_id uuid not null,
  leccion_id uuid not null,
  completada boolean not null default false,
  aciertos integer not null default 0,
  intentos integer not null default 0,
  puntuacion integer not null default 0,
  actualizado_en timestamp with time zone not null default now(),
  constraint progreso_usuarios_pkey primary key (id),
  constraint progreso_usuarios_usuario_id_leccion_id_key unique (usuario_id, leccion_id),
  constraint progreso_usuarios_leccion_id_fkey foreign KEY (leccion_id) references lecciones (id) on delete CASCADE,
  constraint progreso_usuarios_usuario_id_fkey foreign KEY (usuario_id) references usuarios (id) on delete CASCADE,
  constraint progreso_usuarios_intentos_check check ((intentos >= 0)),
  constraint progreso_usuarios_aciertos_check check ((aciertos >= 0)),
  constraint progreso_usuarios_puntuacion_check check ((puntuacion >= 0))
) TABLESPACE pg_default;

create index IF not exists idx_progreso_usuario on public.progreso_usuarios using btree (usuario_id) TABLESPACE pg_default;

-- ===== Estado real en Supabase (consultado 2026-11-08) =====
-- Triggers en auth.users: NINGUNO -> la app debe insertar su fila en usuarios tras el sign-up.
-- Políticas RLS (resumen; la de ejercicios se veía cortada en la captura):
--   usuarios.usuario_crear_perfil           INSERT  authenticated       check id = auth.uid()
--   usuarios.usuario_ver_perfil             SELECT  authenticated       using id = auth.uid()
--   categorias.categorias_lectura           SELECT  anon,authenticated  using activa = true
--   palabras.palabras_lectura               SELECT  anon,authenticated  using validada = true
--   lecciones.lecciones_lectura             SELECT  anon,authenticated  using activa = true
--   ejercicios.ejercicios_lectura           SELECT  anon,authenticated  using activo = true and exists(...)
--   progreso_usuarios.progreso_actualizar_propio  UPDATE  authenticated  using usuario_id = auth.uid()
--   progreso_usuarios.progreso_consultar_propio   SELECT  authenticated  using usuario_id = auth.uid()
--   progreso_usuarios.progreso_insertar_propio    INSERT  authenticated  check usuario_id = auth.uid()
--   usuarios.usuario_actualizar_perfil      UPDATE  authenticated       using/check id = auth.uid()  (agregada 2026-11-08)
-- shortcut: el usuario puede editar sus propios puntos/vidas; si importa el anti-trampa, mover a una función security definer.
