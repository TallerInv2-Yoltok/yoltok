-- NO CORRER EN LA BASE ACTUAL: la tabla ya existe. Para actualizarla usa encuesta_v3_columnas.sql.
-- Cuestionario final de usabilidad ISO 9241-11 (protocolo, sección de instrumentos).
-- Una fila por usuario. Columnas separadas para exportar a CSV/Excel y analizar directo.
-- Escala Likert 1-5 (1 = muy en desacuerdo, 5 = muy de acuerdo). Reactivos 1-9 obligatorios en la app, 10 opcional.
-- Esquema de referencia para una base nueva. En la base existente se llegó aquí con encuesta_v2.sql y
-- encuesta_v3_columnas.sql (por eso allá las columnas nuevas admiten null para las filas anteriores).

create table public.encuestas_usabilidad (
  id uuid not null default gen_random_uuid() primary key,
  usuario_id uuid not null default auth.uid() references public.usuarios (id) on delete cascade,
  -- Bloque 1: eficiencia y navegación
  navegacion smallint not null check (navegacion between 1 and 5),
  diseno smallint not null check (diseno between 1 and 5),
  instrucciones smallint not null check (instrucciones between 1 and 5),
  -- Bloque 2: eficacia para el aprendizaje del náhuat
  audio_pronunciacion smallint not null check (audio_pronunciacion between 1 and 5),
  retencion_vocabulario smallint not null check (retencion_vocabulario between 1 and 5),
  retroalimentacion smallint not null check (retroalimentacion between 1 and 5),
  -- Bloque 3: satisfacción y utilidad didáctica
  motivacion smallint not null check (motivacion between 1 and 5),
  utilidad smallint not null check (utilidad between 1 and 5),
  continuidad smallint not null check (continuidad between 1 and 5),
  -- Encuesta v1 (bloque léxico, ya no se pregunta)
  aciertos_lexicos smallint check (aciertos_lexicos between 0 and 3),
  -- 10. Pregunta abierta opcional
  comentario text check (char_length(comentario) <= 1000),
  creado_en timestamp with time zone not null default now(),
  constraint encuestas_usabilidad_usuario_key unique (usuario_id)
);

alter table public.encuestas_usabilidad enable row level security;

create policy encuesta_insertar_propia on public.encuestas_usabilidad
  for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy encuesta_consultar_propia on public.encuestas_usabilidad
  for select to authenticated
  using (usuario_id = (select auth.uid()));
