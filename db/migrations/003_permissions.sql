BEGIN;

DO $$
BEGIN
  IF to_regclass('public.configuracion_sistema') IS NULL THEN
    RAISE EXCEPTION 'Falta la tabla configuracion_sistema: ejecutar antes 02-plazo-inscripcion.sql';
  END IF;
  IF to_regclass('public.historial_plazo_inscripcion') IS NULL THEN
    RAISE EXCEPTION 'Falta la tabla historial_plazo_inscripcion: ejecutar antes 02-plazo-inscripcion.sql';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'curso' AND column_name = 'dias_plazo_inscripcion'
  ) THEN
    RAISE EXCEPTION 'Falta curso.dias_plazo_inscripcion: ejecutar antes 02-plazo-inscripcion.sql';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'curso' AND column_name = 'estado'
  ) THEN
    RAISE EXCEPTION 'Falta curso.estado: el helper de inscripción la necesita';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS roles (
  code        TEXT PRIMARY KEY CHECK (code ~ '^[a-z_]+$'),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  code        TEXT PRIMARY KEY CHECK (code ~ '^[a-z_]+(\.[a-z_]+)+$'),
  module      TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code       TEXT NOT NULL REFERENCES roles(code) ON UPDATE CASCADE ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_code, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions (permission_code);

INSERT INTO roles (code, name, description) VALUES
  ('super_administrador', 'Super administrador', 'Se suma al administrador cuando administradores.es_super = true'),
  ('administrador', 'Administrador', 'Gestión administrativa de la academia'),
  ('profesor', 'Profesor', 'Cursos asignados, evaluaciones y calificaciones'),
  ('estudiante', 'Estudiante', 'Inscripción a cursos y consulta de resultados propios')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, module, description) VALUES
  ('students.read', 'students', 'Listar estudiantes'),
  ('students.create', 'students', 'Registrar estudiantes'),
  ('students.update', 'students', 'Editar estudiantes'),
  ('students.delete', 'students', 'Dar de baja estudiantes'),
  ('teachers.read', 'teachers', 'Listar profesores'),
  ('teachers.create', 'teachers', 'Registrar profesores'),
  ('teachers.update', 'teachers', 'Editar profesores'),
  ('teachers.delete', 'teachers', 'Dar de baja profesores'),
  ('guardians.read', 'guardians', 'Listar padres y tutores'),
  ('guardians.create', 'guardians', 'Registrar padres y tutores'),
  ('guardians.update', 'guardians', 'Editar padres y tutores'),
  ('guardians.delete', 'guardians', 'Dar de baja o activar padres y tutores'),
  ('courses.read', 'courses', 'Listar cursos y cursos por vencer'),
  ('courses.create', 'courses', 'Crear cursos'),
  ('courses.update', 'courses', 'Editar cursos'),
  ('courses.delete', 'courses', 'Dar de baja o activar cursos'),
  ('courses.enrollment_deadline.update', 'courses', 'Editar el plazo de inscripción de un curso'),
  ('enrollments.read', 'enrollments', 'Consultar inscripciones'),
  ('enrollments.create', 'enrollments', 'Inscribir estudiantes a cursos'),
  ('enrollments.delete', 'enrollments', 'Eliminar inscripciones'),
  ('payments.read', 'payments', 'Consultar control de pagos'),
  ('payments.mark_paid', 'payments', 'Marcar inscripciones como pagadas'),
  ('receipts.read', 'receipts', 'Consultar recibos'),
  ('receipts.create', 'receipts', 'Registrar recibos'),
  ('preregistrations.read', 'preregistrations', 'Listar preinscripciones'),
  ('preregistrations.approve', 'preregistrations', 'Aprobar preinscripciones'),
  ('preregistrations.reject', 'preregistrations', 'Rechazar preinscripciones'),
  ('users.enable', 'users', 'Habilitar usuarios y roles'),
  ('admins.super_status.read', 'admins', 'Consultar si el usuario actual es super administrador'),
  ('admins.read', 'admins', 'Listar administradores'),
  ('admins.create', 'admins', 'Registrar administradores'),
  ('admins.update', 'admins', 'Editar administradores'),
  ('admins.delete', 'admins', 'Dar de baja administradores'),
  ('admins.activate', 'admins', 'Activar administradores'),
  ('settings.enrollment_deadline.read', 'settings', 'Consultar el plazo de inscripción global'),
  ('settings.enrollment_deadline.update', 'settings', 'Editar el plazo de inscripción global'),
  ('teaching.courses.read', 'teaching', 'Ver cursos asignados'),
  ('teaching.students.read', 'teaching', 'Ver estudiantes de mis cursos'),
  ('teaching.evaluations.read', 'teaching', 'Ver evaluaciones de mis cursos'),
  ('teaching.evaluations.create', 'teaching', 'Crear evaluaciones'),
  ('teaching.evaluations.update', 'teaching', 'Editar evaluaciones'),
  ('teaching.evaluations.delete', 'teaching', 'Eliminar evaluaciones'),
  ('teaching.grades.read', 'teaching', 'Ver calificaciones de mis evaluaciones'),
  ('teaching.grades.create', 'teaching', 'Calificar evaluaciones'),
  ('teaching.grades.update', 'teaching', 'Editar calificaciones'),
  ('learning.courses.read', 'learning', 'Ver mis cursos'),
  ('learning.grades.read', 'learning', 'Ver mis calificaciones'),
  ('learning.available_courses.read', 'learning', 'Ver cursos disponibles para inscribirme'),
  ('learning.enrollments.create', 'learning', 'Inscribirme a un curso'),
  ('learning.debts.read', 'learning', 'Ver mis deudas')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'administrador', code FROM permissions
WHERE module IN ('students', 'teachers', 'guardians', 'courses', 'enrollments',
                 'payments', 'receipts', 'preregistrations', 'users')
   OR code IN ('admins.super_status.read', 'settings.enrollment_deadline.read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'super_administrador', code FROM permissions
WHERE code IN ('admins.read', 'admins.create', 'admins.update', 'admins.delete',
               'admins.activate', 'settings.enrollment_deadline.update')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'profesor', code FROM permissions WHERE module = 'teaching'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code)
SELECT 'estudiante', code FROM permissions WHERE module = 'learning'
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación posterior (esperado: administrador 30, estudiante 5, profesor 9, super_administrador 6)
--   SELECT role_code, COUNT(*) FROM role_permissions GROUP BY role_code ORDER BY role_code;
-- Roles en uso que no están en el catálogo (esperado: 0 filas):
--   SELECT DISTINCT role FROM usuario_roles WHERE role NOT IN (SELECT code FROM roles);

-- Rollback --------------------------------------------------------------------------
-- BEGIN;
-- DROP TABLE IF EXISTS role_permissions;
-- DROP TABLE IF EXISTS permissions;
-- DROP TABLE IF EXISTS roles;
-- COMMIT;
