-- SOLO PARA brilliand_minds_test. Recarga:  psql ... -f 90-datos-prueba.sql
-- Solo borrar:                              psql ... -v solo_borrar=1 -f 90-datos-prueba.sql

\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DELETE FROM calificacion
WHERE id_inscripcion IN (
  SELECT ins.id_inscripcion FROM inscripcion ins
  JOIN curso cu ON cu.id_curso = ins.id_curso
  JOIN estudiante es ON es.id_estudiante = ins.id_estudiante
  WHERE cu.nombre LIKE 'TEST\_%' OR es.nombre LIKE 'TEST\_%'
);
DELETE FROM historial_inscripciones
WHERE curso LIKE 'TEST\_%' OR estudiante LIKE 'TEST\_%';
DELETE FROM inscripcion
WHERE id_curso IN (SELECT id_curso FROM curso WHERE nombre LIKE 'TEST\_%')
   OR id_estudiante IN (SELECT id_estudiante FROM estudiante WHERE nombre LIKE 'TEST\_%');
DELETE FROM evaluacion WHERE id_curso IN (SELECT id_curso FROM curso WHERE nombre LIKE 'TEST\_%');
DELETE FROM historial_plazo_inscripcion
WHERE ambito = 'global'
  AND modificado_por IN (SELECT id_usuarios FROM usuarios WHERE email LIKE 'TEST\_%');
DELETE FROM curso WHERE nombre LIKE 'TEST\_%';
DELETE FROM estudiante WHERE nombre LIKE 'TEST\_%';
DELETE FROM profesor WHERE nombre LIKE 'TEST\_%';
DELETE FROM administradores WHERE nombre LIKE 'TEST\_%';
DELETE FROM padre_tutor WHERE nombre LIKE 'TEST\_%';
DELETE FROM pre_inscripcion_estudiante WHERE nombre LIKE 'TEST\_%';
DELETE FROM usuarios WHERE email LIKE 'TEST\_%';
UPDATE configuracion_sistema SET dias_plazo_inscripcion = 10, actualizado_por = NULL, actualizado_en = NOW();

COMMIT;

\if :{?solo_borrar}
  \echo 'Datos TEST_ borrados'
  \quit
\endif

BEGIN;

CREATE TEMP TABLE usuarios_prueba (email TEXT, clave TEXT, roles TEXT[]) ON COMMIT DROP;
INSERT INTO usuarios_prueba VALUES
  ('TEST_super@academia.test',       'Super123!',  ARRAY['administrador']),
  ('TEST_admin@academia.test',       'Admin123!',  ARRAY['administrador']),
  ('TEST_profe1@academia.test',      'Profe123!',  ARRAY['profesor']),
  ('TEST_profe2@academia.test',      'Profe123!',  ARRAY['profesor']),
  ('TEST_est1@academia.test',        'Estu123!',   ARRAY['estudiante']),
  ('TEST_est2@academia.test',        'Estu123!',   ARRAY['estudiante']),
  ('TEST_est3@academia.test',        'Estu123!',   ARRAY['estudiante']),
  ('TEST_est4@academia.test',        'Estu123!',   ARRAY['estudiante']),
  ('TEST_profe_est@academia.test',   'Multi123!',  ARRAY['profesor', 'estudiante']),
  ('TEST_admin_profe@academia.test', 'Multi123!',  ARRAY['administrador', 'profesor']);

INSERT INTO usuarios (email, password_hash)
SELECT email, crypt(clave, gen_salt('bf', 10)) FROM usuarios_prueba;

INSERT INTO usuario_roles (id_usuario, role)
SELECT u.id_usuarios, unnest(p.roles)
FROM usuarios_prueba p JOIN usuarios u ON u.email = p.email;

CREATE TEMP TABLE ids ON COMMIT DROP AS
SELECT email, id_usuarios FROM usuarios WHERE email LIKE 'TEST\_%';

INSERT INTO administradores (id_usuarios, nombre, a_paterno, a_materno, ci, telefono, email, es_super)
SELECT id_usuarios, v.nombre, 'Prueba', NULL, v.ci, v.telefono, ids.email, v.es_super
FROM ids JOIN (VALUES
  ('TEST_super@academia.test',       'TEST_Super',      '9000001', '79000001', true),
  ('TEST_admin@academia.test',       'TEST_Admin',      '9000002', '79000002', false),
  ('TEST_admin_profe@academia.test', 'TEST_AdminProfe', '9000010', '79000010', false)
) AS v(email, nombre, ci, telefono, es_super) ON v.email = ids.email;

INSERT INTO profesor (id_usuario, nombre, a_paterno, ci, telefono, email, especialidad)
SELECT id_usuarios, v.nombre, 'Prueba', v.ci, v.telefono, ids.email, 'Robótica'
FROM ids JOIN (VALUES
  ('TEST_profe1@academia.test',      'TEST_Profe1',     '9000003', '79000003'),
  ('TEST_profe2@academia.test',      'TEST_Profe2',     '9000004', '79000004'),
  ('TEST_profe_est@academia.test',   'TEST_ProfeEst',   '9000009', '79000009'),
  ('TEST_admin_profe@academia.test', 'TEST_AdminProfe', '9000010', '79000010')
) AS v(email, nombre, ci, telefono) ON v.email = ids.email;

INSERT INTO padre_tutor (nombre, a_paterno, ci, telefono, direccion)
VALUES ('TEST_Tutor', 'Prueba', '9000100', '79000100', 'Calle Prueba 1');

INSERT INTO estudiante (id_usuario, id_tutor, nombre, a_paterno, ci, direccion, telefono, email, colegio)
SELECT id_usuarios, (SELECT id_tutor FROM padre_tutor WHERE nombre = 'TEST_Tutor'),
       v.nombre, 'Prueba', v.ci, 'Calle Prueba', v.telefono, ids.email, 'Colegio Prueba'
FROM ids JOIN (VALUES
  ('TEST_est1@academia.test',      'TEST_Est1',     '9000005', '79000005'),
  ('TEST_est2@academia.test',      'TEST_Est2',     '9000006', '79000006'),
  ('TEST_est3@academia.test',      'TEST_Est3',     '9000007', '79000007'),
  ('TEST_est4@academia.test',      'TEST_Est4',     '9000008', '79000008'),
  ('TEST_profe_est@academia.test', 'TEST_ProfeEst', '9000009', '79000009')
) AS v(email, nombre, ci, telefono) ON v.email = ids.email;

INSERT INTO curso (nombre, descripcion, duracion, costo, cupo_total, fecha_creacion, id_profesor, estado, dias_plazo_inscripcion)
SELECT v.nombre, v.descripcion, v.duracion::interval, 150, v.cupos,
       ((NOW() AT TIME ZONE 'America/La_Paz')::date + v.desfase_inicio)::timestamp,
       (SELECT id_profesor FROM profesor WHERE nombre = v.profesor),
       v.estado, v.dias
FROM (VALUES
  ('TEST_C01_AbiertoGlobal',    'Inició hace 3 días, usa el global (10)',          -3,  '2 mons',  NULL::int, 20, 'Activo',   'TEST_Profe1'),
  ('TEST_C02_Extendido20',      'Inició hace 15 días, plazo propio 20',             -15, '3 mons',  20,        20, 'Activo',   'TEST_Profe1'),
  ('TEST_C03_Vencido',          'Inició hace 15 días, usa el global: vencido',      -15, '3 mons',  NULL,      20, 'Activo',   'TEST_Profe1'),
  ('TEST_C04_ParaReabrir',      'Vencido con el global; la prueba sube a 20',       -15, '3 mons',  NULL,      20, 'Activo',   'TEST_Profe2'),
  ('TEST_C05_ParaReducir',      'Inició hace 5 días, abierto; la prueba baja a 2',  -5,  '2 mons',  NULL,      20, 'Activo',   'TEST_Profe2'),
  ('TEST_C06_CeroHoy',          'Inicia hoy con 0 días: abierto solo hoy',          0,   '1 mon',   0,         20, 'Activo',   'TEST_Profe2'),
  ('TEST_C07_CeroAyer',         'Inició ayer con 0 días: cerrado',                  -1,  '1 mon',   0,         20, 'Activo',   'TEST_Profe2'),
  ('TEST_C08_CortoMandaFin',    'Dura 4 días con 20 de plazo: manda la fecha fin',  -2,  '4 days',  20,        20, 'Activo',   'TEST_Profe1'),
  ('TEST_C09_Terminado',        'Terminó hace 30 días',                             -60, '1 mon',   NULL,      20, 'Activo',   'TEST_Profe1'),
  ('TEST_C10_Inactivo',         'Inicia en 5 días pero está inactivo',              5,   '1 mon',   NULL,      20, 'Inactivo', 'TEST_Profe1'),
  ('TEST_C11_UnCupo',           'Un solo cupo libre (prueba de concurrencia)',      3,   '1 mon',   NULL,      1,  'Activo',   'TEST_Profe2'),
  ('TEST_C12_SinCupos',         'Cupo 1 ya ocupado',                                3,   '1 mon',   NULL,      1,  'Activo',   'TEST_Profe2'),
  ('TEST_C13_Futuro',           'Inicia en 10 días: abierto',                       10,  '2 mons',  NULL,      20, 'Activo',   'TEST_ProfeEst')
) AS v(nombre, descripcion, desfase_inicio, duracion, dias, cupos, estado, profesor);

INSERT INTO inscripcion (id_estudiante, id_curso)
SELECT es.id_estudiante, cu.id_curso
FROM (VALUES
  ('TEST_Est4', 'TEST_C12_SinCupos'),
  ('TEST_Est1', 'TEST_C03_Vencido')
) AS v(estudiante, curso)
JOIN estudiante es ON es.nombre = v.estudiante
JOIN curso cu ON cu.nombre = v.curso;

COMMIT;

SELECT u.email, string_agg(ur.role, ', ' ORDER BY ur.role) AS roles,
       COALESCE(a.es_super, false) AS es_super
FROM usuarios u
JOIN usuario_roles ur ON ur.id_usuario = u.id_usuarios
LEFT JOIN administradores a ON a.id_usuarios = u.id_usuarios
WHERE u.email LIKE 'TEST\_%'
GROUP BY u.email, a.es_super
ORDER BY u.email;
