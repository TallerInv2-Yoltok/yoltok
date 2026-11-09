-- Cuestionario final de usabilidad ISO 9241-11 (protocolo, sección de instrumentos).
-- Una fila por usuario. Columnas separadas para exportar a CSV/Excel y analizar directo.
-- Escala Likert 1-5 (1 = muy en desacuerdo, 5 = muy de acuerdo).

create table public.encuestas_usabilidad (
  id uuid not null default gen_random_uuid() primary key,
  usuario_id uuid not null default auth.uid() references public.usuarios (id) on delete cascade,
  -- Bloque 1: eficiencia y navegación
  navegacion smallint not null check (navegacion between 1 and 5),
  diseno smallint not null check (diseno between 1 and 5),
  instrucciones smallint not null check (instrucciones between 1 and 5),
  -- Bloque 2: eficacia en el reconocimiento léxico inmediato (reactivos correctos de 3)
  aciertos_lexicos smallint not null check (aciertos_lexicos between 0 and 3),
  -- Bloque 3: satisfacción y utilidad pedagógica percibida
  motivacion smallint not null check (motivacion between 1 and 5),
  utilidad smallint not null check (utilidad between 1 and 5),
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
