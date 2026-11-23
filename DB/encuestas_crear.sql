-- Simulación de carga: 50 cuentas que completan el Módulo 1 y responden la encuesta.
-- Sirve para comprobar la app y el tablero con volumen realista antes de la aplicación real. Son datos simulados,
-- no forman parte de la muestra de la investigación. Para quitarlos: encuestas_borrar.sql.
--
-- Cómo se identifican: marca interna en raw_app_meta_data en auth.users (el usuario no puede editarlo). Los correos son
-- @gmail.com inventados: no pidas "recuperar contraseña" con ellos, el correo podría llegarle a alguien real.
-- Contraseña de todas las cuentas, por si quieres entrar con alguna en la app: YoltokPrueba-2026
-- Generado con semilla fija: correrlo de nuevo produce las mismas 50 cuentas.

begin;

do $$
begin
  if exists (select 1 from auth.users where raw_app_meta_data ->> 'prueba' = 'true') then
    raise exception 'Ya hay cuentas simuladas. Corre primero encuestas_borrar.sql.';
  end if;
end $$;

create temp table _simulacion (
  id uuid, nombre text, correo text, registro timestamptz, completado timestamptz, encuesta timestamptz,
  aciertos int, intentos int, puntuacion int, vidas int,
  navegacion smallint, diseno smallint, instrucciones smallint, audio_pronunciacion smallint, retencion_vocabulario smallint,
  retroalimentacion smallint, motivacion smallint, utilidad smallint, continuidad smallint, comentario text
) on commit drop;

insert into _simulacion values
  ('bef7e268-ffe9-46ab-a058-1ccace1d62e0', 'Angel G. P.', 'angel.gp178@gmail.com', '2026-11-22 14:56:14+00', '2026-11-22 15:21:14+00', '2026-11-22 15:32:49+00', 4, 6, 75, 4, 4, 4, 3, 5, 3, 4, 3, 4, 5, null),
  ('397a7623-9355-4840-867f-0cfcce1fd3d9', 'María O. O.', 'maria99oo@gmail.com', '2026-11-21 16:56:41+00', '2026-11-21 17:20:41+00', '2026-11-21 17:26:42+00', 5, 5, 90, 5, 4, 5, 3, 5, 4, 3, 4, 3, 4, null),
  ('85dc0a68-cdb5-4088-b54e-64f4f5ee8c72', 'José G. T.', 'gtjose304@gmail.com', '2026-11-21 16:30:56+00', '2026-11-21 16:43:56+00', '2026-11-21 16:47:36+00', 4, 7, 75, 3, 5, 4, 4, 5, 4, 5, 5, 5, 5, null),
  ('94a4d29c-7383-4496-800e-05d017985d06', 'Guadalupe V. Z.', 'guadalupevz2006@gmail.com', '2026-11-21 22:42:58+00', '2026-11-21 22:49:58+00', '2026-11-21 22:56:18+00', 4, 6, 75, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 'Me gustó mucho, los audios se escuchan claros.'),
  ('6041f10e-325a-4dec-8e91-82088520bf0c', 'Juan G. C.', 'juan.gc2@gmail.com', '2026-11-22 16:42:48+00', '2026-11-22 16:59:48+00', '2026-11-22 17:03:48+00', 3, 8, 55, 2, 2, 4, 2, 4, 3, 4, 2, 4, 2, 'No entendí bien para qué sirven las vidas, me regresó al inicio.'),
  ('c134a79b-de3b-4dd3-b3aa-881e0c56037f', 'Fernanda R. R.', 'fernandarr83@gmail.com', '2026-11-18 14:32:30+00', '2026-11-18 14:47:30+00', '2026-11-18 14:56:50+00', 5, 5, 90, 5, 5, 4, 4, 4, 3, 5, 4, 5, 5, null),
  ('8b890fec-6872-496b-9497-db67a54b3b83', 'Luis L. H.', 'luislh127@gmail.com', '2026-11-20 00:54:11+00', '2026-11-20 01:13:11+00', '2026-11-20 01:23:37+00', 4, 6, 65, 4, 5, 3, 4, 3, 4, 4, 4, 4, 4, 'Las vidas se acaban rápido, pondría que se recuperen con el tiempo.'),
  ('ddd284e8-6961-4452-838d-04fb1018d7f5', 'Daniela R. L.', 'daniela.rl33@gmail.com', '2026-11-18 23:45:17+00', '2026-11-19 00:09:17+00', '2026-11-19 00:14:53+00', 4, 6, 65, 4, 5, 4, 5, 4, 4, 4, 5, 5, 5, 'Todo bien, solo agregaría más ejercicios de escuchar.'),
  ('b1ff38d8-480b-4b8b-860e-cc8ae0dff709', 'Carlos M. A.', 'carlos_ma43@gmail.com', '2026-11-20 15:06:43+00', '2026-11-20 15:23:43+00', '2026-11-20 15:31:32+00', 5, 5, 90, 5, 3, 4, 3, 3, 4, 4, 3, 4, 5, 'Pondría la traducción también en los ejercicios de repaso.'),
  ('8a94a6ef-ef46-4c53-b79e-cb4ea95c2c0b', 'Andrea T. P.', 'andreatp506@gmail.com', '2026-11-22 14:34:21+00', '2026-11-22 14:46:21+00', '2026-11-22 14:56:24+00', 5, 5, 90, 5, 3, 5, 4, 3, 4, 4, 4, 4, 4, null),
  ('f9e65abf-b50f-4e6c-a629-bc24df2986b2', 'Miguel M. A.', 'miguel_ma338@gmail.com', '2026-11-18 18:34:30+00', '2026-11-18 18:50:30+00', '2026-11-18 18:55:10+00', 3, 9, 60, 1, 3, 5, 3, 3, 3, 4, 3, 3, 3, null),
  ('d9452ba0-d98d-4098-b795-587b888debe9', 'Valeria L. R.', 'lrvaleria90@gmail.com', '2026-11-20 21:40:29+00', '2026-11-20 22:01:29+00', '2026-11-20 22:14:06+00', 5, 5, 90, 5, 5, 5, 5, 5, 5, 4, 4, 5, 4, null),
  ('b8d3b186-2bbf-4273-8991-47e0ff2ef417', 'Jesús S. J.', 'jesus283sj@gmail.com', '2026-11-22 14:05:09+00', '2026-11-22 14:23:09+00', '2026-11-22 14:30:44+00', 3, 7, 55, 3, 5, 4, 4, 4, 3, 2, 3, 4, 2, null),
  ('5859b6d7-95d7-471d-aaed-9e2974b8146a', 'Ximena H. J.', 'hjximena11@gmail.com', '2026-11-18 15:32:42+00', '2026-11-18 15:38:42+00', '2026-11-18 15:45:46+00', 4, 6, 65, 4, 5, 5, 5, 5, 5, 4, 5, 5, 5, 'Algunas instrucciones de los ejercicios no me quedaron claras al principio.'),
  ('4436734f-51ed-48e2-9e2b-2935d5ece6d3', 'Diego O. N.', 'diegoon248@gmail.com', '2026-11-19 16:20:27+00', '2026-11-19 16:36:27+00', '2026-11-19 16:44:25+00', 5, 5, 90, 5, 4, 5, 4, 5, 4, 5, 5, 4, 5, 'Me ayudó a recordar las palabras con las tarjetas, está bien hecha.'),
  ('b3a2159e-8f15-49f2-845d-b50502b12374', 'Paola P. H.', 'phpaola@gmail.com', '2026-11-22 14:17:18+00', '2026-11-22 14:41:18+00', '2026-11-22 14:50:58+00', 5, 5, 90, 5, 5, 5, 4, 5, 4, 5, 5, 5, 5, null),
  ('221cd724-8f24-414b-96cc-afffae5f364a', 'Jorge Z. P.', 'jorge.zp@gmail.com', '2026-11-18 14:48:14+00', '2026-11-18 15:02:14+00', '2026-11-18 15:09:15+00', 5, 5, 90, 5, 5, 5, 4, 5, 4, 5, 5, 5, 4, 'Los colores y el diseño están bonitos, se entiende todo.'),
  ('ae9b41ba-824b-46c5-a941-c30ca53c9521', 'Karla J. M.', 'jmkarla978@gmail.com', '2026-11-22 00:42:21+00', '2026-11-22 00:58:21+00', '2026-11-22 01:05:41+00', 4, 6, 75, 4, 4, 4, 4, 4, 5, 4, 4, 5, 5, 'Me motivó ver los puntos XP, estaría bien una tabla con los de mis compañeros.'),
  ('d7308713-adb1-4993-8f13-3eed22ff7c2e', 'Ricardo D. P.', 'ricardodp@gmail.com', '2026-11-21 19:42:21+00', '2026-11-21 19:59:21+00', '2026-11-21 20:03:25+00', 4, 7, 70, 3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 'Las vidas se acaban rápido, pondría que se recuperen con el tiempo.'),
  ('77342c58-178c-48e4-8af1-654be355a107', 'Alejandra L. H.', 'alejandra_lh2005@gmail.com', '2026-11-22 15:46:09+00', '2026-11-22 15:56:09+00', '2026-11-22 16:08:45+00', 3, 8, 50, 2, 4, 4, 4, 4, 4, 3, 3, 4, 4, 'A veces tardaba en cargar el audio.'),
  ('b47da864-5cfa-4862-9b2d-cfad759a5eb1', 'Eduardo H. C.', 'eduardohc@gmail.com', '2026-11-21 14:03:06+00', '2026-11-21 14:20:06+00', '2026-11-21 14:32:00+00', 5, 5, 90, 5, 4, 3, 5, 5, 5, 5, 4, 5, 5, 'Que se pueda repasar el vocabulario sin tener que repetir toda la lección.'),
  ('24dcac35-cb17-473f-9b82-aef2235086b5', 'Brenda Z. D.', 'zdbrenda@gmail.com', '2026-11-20 01:12:07+00', '2026-11-20 01:29:07+00', '2026-11-20 01:41:46+00', 4, 6, 70, 4, 5, 5, 4, 5, 5, 5, 5, 5, 4, null),
  ('4144498c-dc48-4871-88e6-823d2b0d86d4', 'Óscar C. P.', 'oscar3cp@gmail.com', '2026-11-21 00:05:29+00', '2026-11-21 00:28:29+00', '2026-11-21 00:39:21+00', 5, 5, 90, 5, 4, 4, 5, 4, 4, 5, 5, 5, 5, 'Está muy padre la app, ojalá agreguen más lecciones pronto.'),
  ('6e84840c-c459-418e-846e-48af505a3117', 'Itzel G. P.', 'itzel126gp@gmail.com', '2026-11-19 18:30:15+00', '2026-11-19 18:50:15+00', '2026-11-19 18:55:40+00', 4, 6, 75, 4, 3, 4, 4, 5, 4, 4, 4, 4, 4, 'Los colores y el diseño están bonitos, se entiende todo.'),
  ('72888c53-e63e-4667-9d9d-d1338ff59cc6', 'Fernando J. G.', 'jgfernando136@gmail.com', '2026-11-22 16:51:13+00', '2026-11-22 17:15:13+00', '2026-11-22 17:18:48+00', 3, 7, 45, 3, 5, 5, 3, 5, 4, 5, 5, 5, 5, null),
  ('acc42b03-70ee-47e3-96e1-34138e4e45ae', 'Diana C. L.', 'dianacl2001@gmail.com', '2026-11-21 14:18:05+00', '2026-11-21 14:29:05+00', '2026-11-21 14:41:09+00', 3, 8, 45, 2, 3, 3, 3, 3, 3, 3, 4, 3, 3, 'Pondría instrucciones más claras en el primer ejercicio, me perdí un poco.'),
  ('ae80d8a2-be19-4269-954d-fd6d5b205ee1', 'Alberto L. P.', 'albertolp765@gmail.com', '2026-11-21 18:41:41+00', '2026-11-21 18:52:41+00', '2026-11-21 19:01:46+00', 1, 10, 15, 1, 3, 4, 4, 5, 4, 5, 4, 3, 4, null),
  ('4ba535db-9bc7-40e7-b1be-4d880531b3ae', 'Yareli G. S.', 'gsyareli20@gmail.com', '2026-11-19 18:38:43+00', '2026-11-19 19:02:43+00', '2026-11-19 19:07:02+00', 4, 6, 75, 4, 5, 5, 4, 3, 4, 5, 4, 4, 4, 'Todo bien, solo agregaría más ejercicios de escuchar.'),
  ('ccd2fa2d-2a76-4010-934f-7317aa2939cf', 'Emmanuel G. G.', 'emmanuel2001gg@gmail.com', '2026-11-20 03:20:28+00', '2026-11-20 03:38:28+00', '2026-11-20 03:44:56+00', 5, 5, 90, 5, 5, 5, 5, 5, 4, 4, 3, 4, 3, null),
  ('d61f7e74-4c46-4afb-8fd0-35b356627387', 'Lizbeth P. S.', 'lizbeth807ps@gmail.com', '2026-11-19 23:35:19+00', '2026-11-19 23:58:19+00', '2026-11-20 00:07:03+00', 4, 6, 75, 4, 5, 4, 4, 4, 4, 4, 4, 5, 4, null),
  ('58d5a0f7-99fb-4cf8-b515-d9ef1f850e07', 'Iván R. R.', 'rrivan82@gmail.com', '2026-11-21 22:14:00+00', '2026-11-21 22:33:00+00', '2026-11-21 22:43:27+00', 2, 8, 35, 2, 5, 4, 4, 5, 4, 4, 4, 3, 4, 'Que se pueda repasar el vocabulario sin tener que repetir toda la lección.'),
  ('76b9b1fe-af8d-4b95-8545-8fc81756930d', 'Abigail M. P.', 'abigail.mp@gmail.com', '2026-11-20 14:06:56+00', '2026-11-21 20:06:56+00', '2026-11-21 20:19:05+00', 2, 9, 30, 1, 4, 4, 4, 3, 4, 5, 5, 4, 3, null),
  ('db9ba0e6-6d4a-46dd-91b4-932643a366d4', 'Roberto V. Z.', 'robertovz692@gmail.com', '2026-11-21 01:06:03+00', '2026-11-21 01:25:03+00', '2026-11-21 01:37:07+00', 3, 8, 45, 2, 3, 4, 3, 4, 4, 4, 3, 4, 3, null),
  ('67eff5ed-5620-4849-a937-cbcf1f6eb192', 'Citlali J. T.', 'citlalijt@gmail.com', '2026-11-20 14:35:39+00', '2026-11-20 14:55:39+00', '2026-11-20 15:02:05+00', 4, 7, 75, 3, 4, 4, 4, 5, 4, 5, 5, 4, 3, null),
  ('b5ab3e9a-f3d8-448a-9d61-3171ea1bc8a9', 'Héctor S. G.', 'hector.sg2000@gmail.com', '2026-11-21 03:52:27+00', '2026-11-21 04:12:27+00', '2026-11-21 04:23:47+00', 5, 5, 90, 5, 4, 3, 4, 4, 3, 5, 3, 4, 4, 'Me gustaría que explicara un poco más cómo se pronuncian algunas letras.'),
  ('c1a52505-0623-4012-bc5a-b5838fd56b45', 'Monserrat D. M.', 'monserrat_dm@gmail.com', '2026-11-19 14:45:23+00', '2026-11-19 15:10:23+00', '2026-11-19 15:20:52+00', 5, 5, 90, 5, 4, 5, 4, 4, 3, 3, 3, 4, 4, null),
  ('e2f4c4c9-07f2-464c-8b8c-1753b091d372', 'Raúl V. L.', 'raul.vl@gmail.com', '2026-11-18 20:19:09+00', '2026-11-18 20:42:09+00', '2026-11-18 20:46:47+00', 4, 6, 70, 4, 4, 4, 4, 5, 4, 5, 4, 4, 4, 'En algunos audios no se entiende bien cuando hablan rápido.'),
  ('2d903bb6-c293-4ca1-b00a-cd2130e95ec9', 'Estefanía R. S.', 'estefania2003rs@gmail.com', '2026-11-19 03:00:23+00', '2026-11-19 03:08:23+00', '2026-11-19 03:14:58+00', 5, 5, 90, 5, 3, 3, 5, 4, 4, 3, 3, 3, 4, null),
  ('4a84c014-1164-474f-ad0c-22300c1f82a3', 'Kevin O. C.', 'kevinoc2003@gmail.com', '2026-11-22 16:54:59+00', '2026-11-22 17:07:59+00', '2026-11-22 17:14:29+00', 5, 5, 90, 5, 4, 4, 5, 4, 4, 4, 4, 5, 5, null),
  ('670c3456-cc2f-4992-982a-d4248658a07d', 'Araceli A. A.', 'araceli.aa69@gmail.com', '2026-11-20 17:01:40+00', '2026-11-20 17:10:40+00', '2026-11-20 17:17:11+00', 5, 5, 90, 5, 4, 4, 4, 5, 4, 4, 3, 5, 5, null),
  ('b3800e45-32ec-40ed-9085-977621dc40c1', 'Brayan T. V.', 'tvbrayan283@gmail.com', '2026-11-19 00:38:02+00', '2026-11-19 00:59:02+00', '2026-11-19 01:07:09+00', 5, 5, 90, 5, 3, 4, 5, 4, 4, 5, 3, 5, 5, null),
  ('c613e610-b8c7-42b5-b87a-0a052d01e7e4', 'Nayeli O. T.', 'otnayeli@gmail.com', '2026-11-21 22:27:12+00', '2026-11-21 22:35:12+00', '2026-11-21 22:43:36+00', 5, 5, 90, 5, 3, 4, 3, 4, 2, 3, 2, 4, 2, 'Pondría instrucciones más claras en el primer ejercicio, me perdí un poco.'),
  ('452b81ff-ac63-45a2-9d39-036243e80903', 'Uriel V. C.', 'uriel2005vc@gmail.com', '2026-11-21 03:46:56+00', '2026-11-21 03:54:56+00', '2026-11-21 04:06:58+00', 2, 9, 40, 1, 4, 4, 3, 4, 3, 5, 5, 5, 2, null),
  ('f19c9fee-97e6-4536-8487-04f6c4f4c178', 'Rocío N. Z.', 'rocionz14@gmail.com', '2026-11-20 21:33:48+00', '2026-11-20 21:41:48+00', '2026-11-20 21:51:56+00', 5, 5, 90, 5, 3, 4, 4, 5, 4, 4, 3, 4, 4, null),
  ('00e1d03c-34c7-48f6-a13f-1127016fa668', 'Saúl H. Z.', 'saulhz@gmail.com', '2026-11-19 17:02:23+00', '2026-11-19 17:14:23+00', '2026-11-19 17:16:42+00', 4, 7, 65, 3, 4, 5, 4, 4, 4, 4, 4, 4, 4, null),
  ('30b5e455-e58e-4e8e-a09b-2a16bc17c7d6', 'Jazmín V. D.', 'vdjazmin2003@gmail.com', '2026-11-21 21:06:21+00', '2026-11-21 21:23:21+00', '2026-11-21 21:28:13+00', 3, 7, 60, 3, 3, 5, 3, 5, 4, 3, 4, 4, 4, 'Algunas instrucciones de los ejercicios no me quedaron claras al principio.'),
  ('76be0529-94ef-4a26-910a-72f2d043a70c', 'Gerardo G. T.', 'gerardogt26@gmail.com', '2026-11-18 19:35:55+00', '2026-11-20 00:35:55+00', '2026-11-20 00:47:33+00', 4, 6, 65, 4, 5, 5, 4, 5, 4, 5, 4, 5, 3, null),
  ('85850845-29c3-467b-a74a-600d22d33a28', 'Mariana N. G.', 'mariana29ng@gmail.com', '2026-11-22 00:43:45+00', '2026-11-22 00:54:45+00', '2026-11-22 01:03:01+00', 3, 8, 55, 2, 3, 4, 3, 4, 2, 5, 4, 4, 4, null),
  ('cdd85f79-d304-47bc-b0e6-458286a614b6', 'Josué R. C.', 'josue18rc@gmail.com', '2026-11-21 14:56:41+00', '2026-11-21 15:05:41+00', '2026-11-21 15:16:14+00', 4, 6, 65, 4, 4, 4, 4, 5, 4, 4, 5, 5, 4, null),
  ('bf04b781-f176-4aaa-9e7a-55ca338cf060', 'Elizabeth H. G.', 'hgelizabeth47@gmail.com', '2026-11-22 17:40:06+00', '2026-11-22 17:51:06+00', '2026-11-22 17:54:18+00', 5, 5, 90, 5, 4, 3, 3, 3, 4, 4, 3, 3, 4, 'Algunas instrucciones de los ejercicios no me quedaron claras al principio.');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo,
  extensions.crypt('YoltokPrueba-2026', extensions.gen_salt('bf')), registro, completado,
  '{"provider": "email", "providers": ["email"], "prueba": true}'::jsonb, jsonb_build_object('nombre', nombre),
  registro, encuesta, '', '', '', ''
from _simulacion;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', correo, 'email_verified', true), completado, registro, registro
from _simulacion;

insert into public.usuarios (id, nombre, correo, nivel_actual, puntos, vidas, fecha_registro)
select id, nombre, correo, 1, puntuacion, vidas, registro from _simulacion;

insert into public.progreso_usuarios (usuario_id, leccion_id, completada, aciertos, intentos, puntuacion, actualizado_en)
select id, '11111111-1111-4111-8111-111111111101', true, aciertos, intentos, puntuacion, completado from _simulacion;

insert into public.encuestas_usabilidad (
  usuario_id, navegacion, diseno, instrucciones, audio_pronunciacion, retencion_vocabulario, retroalimentacion,
  motivacion, utilidad, continuidad, comentario, creado_en
)
select id, navegacion, diseno, instrucciones, audio_pronunciacion, retencion_vocabulario, retroalimentacion,
  motivacion, utilidad, continuidad, comentario, encuesta
from _simulacion;

commit;

-- Comprobación: debe decir 50 en las tres columnas.
select
  (select count(*) from auth.users where raw_app_meta_data ->> 'prueba' = 'true') as cuentas,
  (select count(*) from public.progreso_usuarios p join auth.users u on u.id = p.usuario_id where u.raw_app_meta_data ->> 'prueba' = 'true') as progreso,
  (select count(*) from public.encuestas_usabilidad e join auth.users u on u.id = e.usuario_id where u.raw_app_meta_data ->> 'prueba' = 'true') as encuestas;
