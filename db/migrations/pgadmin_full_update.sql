-- Brilliant Minds · actualización completa para pgAdmin 4
-- Uso: abrir el Query Tool sobre la base de la academia, pegar todo este archivo y ejecutar con F5.
-- Contiene 002 (plazo de inscripción) + 003/004 (roles, permisos, menú y permisos por usuario).
-- Idempotente: sirve en una base sin 002/003, con 002/003 ya aplicadas, y se puede ejecutar dos veces.
-- No contiene datos de prueba ni contraseñas. Todo corre en una sola transacción: si algo falla, no cambia nada.
-- Requiere las tablas base de la academia (usuarios, usuario_roles, administradores, curso, ...).

BEGIN;

-- ============================================================================
-- Parte A · Plazo de inscripción dinámico (002)
-- ============================================================================

-- 1) Configuración global (una sola fila, columnas tipadas) ------------------------
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id                      SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  dias_plazo_inscripcion  INT NOT NULL DEFAULT 10
                          CHECK (dias_plazo_inscripcion BETWEEN 0 AND 90),
  actualizado_por         INT REFERENCES usuarios(id_usuarios) ON DELETE SET NULL,
  actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO configuracion_sistema (id, dias_plazo_inscripcion)
VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

-- 2) Sobrescritura opcional por curso (NULL = usa el global) ----------------------
ALTER TABLE curso
  ADD COLUMN IF NOT EXISTS dias_plazo_inscripcion INT
    CHECK (dias_plazo_inscripcion BETWEEN 0 AND 90),
  ADD COLUMN IF NOT EXISTS plazo_actualizado_por INT
    REFERENCES usuarios(id_usuarios) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plazo_actualizado_en TIMESTAMPTZ;

-- Cursos existentes: se dejan en NULL a propósito (heredan los 10 días globales).

-- 3) Historial de cambios (trazabilidad completa: quién, cuándo, de cuánto a cuánto)
CREATE TABLE IF NOT EXISTS historial_plazo_inscripcion (
  id_historial    SERIAL PRIMARY KEY,
  ambito          TEXT NOT NULL CHECK (ambito IN ('global', 'curso')),
  id_curso        INT REFERENCES curso(id_curso) ON DELETE CASCADE,
  dias_anterior   INT,
  dias_nuevo      INT,
  modificado_por  INT REFERENCES usuarios(id_usuarios) ON DELETE SET NULL,
  modificado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((ambito = 'global' AND id_curso IS NULL) OR (ambito = 'curso' AND id_curso IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_historial_plazo_curso
  ON historial_plazo_inscripcion (id_curso, modificado_en DESC);


-- ============================================================================
-- Parte B · Roles, permisos dinámicos, menú y permisos por usuario (003 + 004)
-- ============================================================================

DO $$
BEGIN
  IF to_regclass('public.configuracion_sistema') IS NULL THEN
    RAISE EXCEPTION 'Falta configuracion_sistema: ejecutar antes 002_enrollment_deadline.sql';
  END IF;
  IF to_regclass('public.usuario_roles') IS NULL OR to_regclass('public.administradores') IS NULL THEN
    RAISE EXCEPTION 'Faltan las tablas base usuario_roles / administradores';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'activo',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  module      TEXT NOT NULL,
  description TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'action',
  route       TEXT,
  label       TEXT,
  icon        TEXT,
  section     TEXT,
  sort_order  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

DO $$
DECLARE
  restriccion RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'id') THEN
    ALTER TABLE roles ADD COLUMN id SERIAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'id') THEN
    ALTER TABLE permissions ADD COLUMN id SERIAL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'role_permissions' AND column_name = 'role_code') THEN
    ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id INT;
    ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_id INT;
    UPDATE role_permissions rp SET role_id = r.id FROM roles r WHERE r.code = rp.role_code;
    UPDATE role_permissions rp SET permission_id = p.id FROM permissions p WHERE p.code = rp.permission_code;
    DELETE FROM role_permissions WHERE role_id IS NULL OR permission_id IS NULL;
    FOR restriccion IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.role_permissions'::regclass AND contype IN ('p', 'f')
    LOOP
      EXECUTE format('ALTER TABLE role_permissions DROP CONSTRAINT %I', restriccion.conname);
    END LOOP;
    DROP INDEX IF EXISTS idx_role_permissions_permission;
    ALTER TABLE role_permissions DROP COLUMN role_code, DROP COLUMN permission_code;
    ALTER TABLE role_permissions ALTER COLUMN role_id SET NOT NULL, ALTER COLUMN permission_id SET NOT NULL;
    ALTER TABLE role_permissions ADD PRIMARY KEY (role_id, permission_id);
  END IF;

  IF pg_get_constraintdef((SELECT oid FROM pg_constraint
       WHERE conrelid = 'public.roles'::regclass AND contype = 'p')) = 'PRIMARY KEY (code)' THEN
    ALTER TABLE roles DROP CONSTRAINT roles_pkey;
    ALTER TABLE roles ADD PRIMARY KEY (id);
    ALTER TABLE roles ADD CONSTRAINT roles_code_key UNIQUE (code);
  END IF;

  IF pg_get_constraintdef((SELECT oid FROM pg_constraint
       WHERE conrelid = 'public.permissions'::regclass AND contype = 'p')) = 'PRIMARY KEY (code)' THEN
    ALTER TABLE permissions DROP CONSTRAINT permissions_pkey;
    ALTER TABLE permissions ADD PRIMARY KEY (id);
    ALTER TABLE permissions ADD CONSTRAINT permissions_code_key UNIQUE (code);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_fkey') THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_fkey') THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_permission_id_fkey
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'activo';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roles ALTER COLUMN id SET NOT NULL;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_code_check;
ALTER TABLE roles ADD CONSTRAINT roles_code_check CHECK (code ~ '^[a-z][a-z0-9_]*$');
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_status_check;
ALTER TABLE roles ADD CONSTRAINT roles_status_check CHECK (status IN ('activo', 'inactivo'));

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'action';
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS route TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS sort_order INT;
ALTER TABLE permissions ALTER COLUMN id SET NOT NULL;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_code_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_code_check CHECK (code ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$');
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_type_check;
ALTER TABLE permissions ADD CONSTRAINT permissions_type_check CHECK (type IN ('menu', 'action'));
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_menu_check;

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissions_version INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id       INT NOT NULL REFERENCES usuarios(id_usuarios) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  effect        TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  created_by    INT REFERENCES usuarios(id_usuarios) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions (permission_id);

INSERT INTO roles (code, name, description, status, is_system) VALUES
  ('super_administrador', 'Super administrador', 'Se deriva de administradores.es_super: tiene todos los permisos', 'activo', true),
  ('administrador', 'Administrador', 'Gestión administrativa de la academia', 'activo', true),
  ('profesor', 'Profesor', 'Cursos asignados, evaluaciones y calificaciones', 'activo', true),
  ('estudiante', 'Estudiante', 'Inscripción a cursos y consulta de resultados propios', 'activo', true)
ON CONFLICT (code) DO UPDATE SET is_system = true, status = 'activo';

INSERT INTO roles (code, name, description, status, is_system)
SELECT DISTINCT ur.role, initcap(replace(ur.role, '_', ' ')), 'Rol migrado desde usuario_roles', 'activo', false
FROM usuario_roles ur
WHERE ur.role ~ '^[a-z][a-z0-9_]*$'
  AND NOT EXISTS (SELECT 1 FROM roles r WHERE r.code = ur.role)
ON CONFLICT (code) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM usuario_roles ur WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.code = ur.role)) THEN
    RAISE EXCEPTION 'Hay valores de usuario_roles.role con formato inválido: revisar antes de migrar';
  END IF;
END $$;

ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS role_id INT;
UPDATE usuario_roles ur SET role_id = r.id FROM roles r WHERE r.code = ur.role AND ur.role_id IS DISTINCT FROM r.id;
ALTER TABLE usuario_roles ALTER COLUMN role_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuario_roles_role_id_fkey') THEN
    ALTER TABLE usuario_roles ADD CONSTRAINT usuario_roles_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES roles(id);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuario_roles_usuario_role_id ON usuario_roles (id_usuario, role_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_role_id ON usuario_roles (role_id);

-- La columna texto usuario_roles.role se conserva por compatibilidad y se sincroniza con role_id.
CREATE OR REPLACE FUNCTION fn_usuario_roles_sincronizar_rol() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role_id IS DISTINCT FROM OLD.role_id THEN
    SELECT code INTO NEW.role FROM roles WHERE id = NEW.role_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT id INTO NEW.role_id FROM roles WHERE code = NEW.role;
  ELSIF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id FROM roles WHERE code = NEW.role;
  ELSE
    SELECT code INTO NEW.role FROM roles WHERE id = NEW.role_id;
  END IF;
  IF NEW.role_id IS NULL OR NEW.role IS NULL THEN
    RAISE EXCEPTION 'Rol desconocido: %', COALESCE(NEW.role, NEW.role_id::text) USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_usuario_roles_sincronizar_rol ON usuario_roles;
CREATE TRIGGER trg_usuario_roles_sincronizar_rol
  BEFORE INSERT OR UPDATE ON usuario_roles
  FOR EACH ROW EXECUTE FUNCTION fn_usuario_roles_sincronizar_rol();

CREATE OR REPLACE FUNCTION fn_incrementar_version_permisos() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ids INT[] := '{}';
BEGIN
  IF TG_OP <> 'DELETE' THEN
    ids := ids || (to_jsonb(NEW) ->> TG_ARGV[0])::int;
  END IF;
  IF TG_OP <> 'INSERT' THEN
    ids := ids || (to_jsonb(OLD) ->> TG_ARGV[0])::int;
  END IF;
  UPDATE usuarios SET permissions_version = permissions_version + 1 WHERE id_usuarios = ANY (ids);
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_usuario_roles_version ON usuario_roles;
CREATE TRIGGER trg_usuario_roles_version
  AFTER INSERT OR UPDATE OR DELETE ON usuario_roles
  FOR EACH ROW EXECUTE FUNCTION fn_incrementar_version_permisos('id_usuario');

DROP TRIGGER IF EXISTS trg_user_permissions_version ON user_permissions;
CREATE TRIGGER trg_user_permissions_version
  AFTER INSERT OR UPDATE OR DELETE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_incrementar_version_permisos('user_id');

DROP TRIGGER IF EXISTS trg_administradores_version ON administradores;
CREATE TRIGGER trg_administradores_version
  AFTER INSERT OR DELETE OR UPDATE OF es_super ON administradores
  FOR EACH ROW EXECUTE FUNCTION fn_incrementar_version_permisos('id_usuarios');

CREATE OR REPLACE FUNCTION fn_version_por_role_permissions() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE usuarios SET permissions_version = permissions_version + 1
    WHERE id_usuarios IN (SELECT ur.id_usuario FROM usuario_roles ur
                          WHERE ur.role_id IN (SELECT DISTINCT role_id FROM filas_nuevas));
  ELSE
    UPDATE usuarios SET permissions_version = permissions_version + 1
    WHERE id_usuarios IN (SELECT ur.id_usuario FROM usuario_roles ur
                          WHERE ur.role_id IN (SELECT DISTINCT role_id FROM filas_viejas));
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_role_permissions_version_insert ON role_permissions;
CREATE TRIGGER trg_role_permissions_version_insert
  AFTER INSERT ON role_permissions
  REFERENCING NEW TABLE AS filas_nuevas
  FOR EACH STATEMENT EXECUTE FUNCTION fn_version_por_role_permissions();

DROP TRIGGER IF EXISTS trg_role_permissions_version_delete ON role_permissions;
CREATE TRIGGER trg_role_permissions_version_delete
  AFTER DELETE ON role_permissions
  REFERENCING OLD TABLE AS filas_viejas
  FOR EACH STATEMENT EXECUTE FUNCTION fn_version_por_role_permissions();

CREATE OR REPLACE FUNCTION fn_version_por_estado_rol() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE usuarios SET permissions_version = permissions_version + 1
    WHERE id_usuarios IN (SELECT id_usuario FROM usuario_roles WHERE role_id = NEW.id);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_roles_version ON roles;
CREATE TRIGGER trg_roles_version
  AFTER UPDATE OF status ON roles
  FOR EACH ROW EXECUTE FUNCTION fn_version_por_estado_rol();

-- Regla de negocio: el super administrador no se puede bloquear y siempre queda al menos uno activo.
CREATE OR REPLACE FUNCTION fn_usuarios_proteger_super() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    IF NEW.estado <> 'Activo' AND EXISTS (
      SELECT 1 FROM administradores WHERE id_usuarios = NEW.id_usuarios AND es_super = true
    ) THEN
      RAISE EXCEPTION 'El super administrador no se puede bloquear' USING ERRCODE = 'BM001';
    END IF;
    NEW.permissions_version := OLD.permissions_version + 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_usuarios_proteger_super ON usuarios;
CREATE TRIGGER trg_usuarios_proteger_super
  BEFORE UPDATE OF estado ON usuarios
  FOR EACH ROW EXECUTE FUNCTION fn_usuarios_proteger_super();

CREATE OR REPLACE FUNCTION fn_administradores_proteger_super() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.es_super AND (TG_OP = 'DELETE' OR NOT NEW.es_super) AND NOT EXISTS (
    SELECT 1 FROM administradores a
    JOIN usuarios u ON u.id_usuarios = a.id_usuarios
    WHERE a.es_super = true AND a.id_usuarios <> OLD.id_usuarios AND u.estado = 'Activo'
  ) THEN
    RAISE EXCEPTION 'Debe quedar al menos un super administrador activo' USING ERRCODE = 'BM002';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_administradores_proteger_super ON administradores;
CREATE TRIGGER trg_administradores_proteger_super
  BEFORE DELETE OR UPDATE OF es_super ON administradores
  FOR EACH ROW EXECUTE FUNCTION fn_administradores_proteger_super();

CREATE TEMP TABLE IF NOT EXISTS _permisos_previos (code TEXT PRIMARY KEY) ON COMMIT DROP;
TRUNCATE _permisos_previos;

DO $$
DECLARE
  renombre RECORD;
BEGIN
  FOR renombre IN SELECT * FROM (VALUES
    ('students.read', 'menu.students.view'),
    ('teachers.read', 'menu.teachers.view'),
    ('guardians.read', 'menu.guardians.view'),
    ('courses.read', 'menu.courses.view'),
    ('enrollments.read', 'menu.enrollments.view'),
    ('payments.read', 'menu.payments.view'),
    ('receipts.read', 'menu.receipts.view'),
    ('preregistrations.read', 'menu.preregistrations.view'),
    ('admins.read', 'menu.admins.view'),
    ('settings.enrollment_deadline.read', 'menu.settings.view'),
    ('teaching.courses.read', 'menu.teaching.courses.view'),
    ('teaching.students.read', 'menu.teaching.students.view'),
    ('teaching.evaluations.read', 'menu.teaching.evaluations.view'),
    ('learning.courses.read', 'menu.learning.courses.view'),
    ('learning.available_courses.read', 'menu.learning.enroll.view')
  ) AS v(anterior, nuevo)
  LOOP
    IF EXISTS (SELECT 1 FROM permissions WHERE code = renombre.anterior) THEN
      IF EXISTS (SELECT 1 FROM permissions WHERE code = renombre.nuevo) THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT rp.role_id, (SELECT id FROM permissions WHERE code = renombre.nuevo)
        FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
        WHERE p.code = renombre.anterior
        ON CONFLICT DO NOTHING;
        DELETE FROM permissions WHERE code = renombre.anterior;
      ELSE
        UPDATE permissions SET code = renombre.nuevo WHERE code = renombre.anterior;
      END IF;
    END IF;
  END LOOP;
END $$;

INSERT INTO _permisos_previos SELECT code FROM permissions ON CONFLICT DO NOTHING;

INSERT INTO permissions (code, module, description, type, route, label, icon, section, sort_order) VALUES
  ('menu.dashboard.view', 'dashboard', 'Ver el panel principal', 'menu', '/dashboard', 'Dashboard', 'cilSpeedometer', 'General', 10),
  ('menu.access.view', 'access', 'Ver la gestión de accesos', 'menu', '/admin/accesos', 'Gestión de accesos', 'cilShieldAlt', 'Administración', 100),
  ('menu.admins.view', 'admins', 'Ver y listar administradores', 'menu', '/admin/administradores', 'Administradores', 'cilUserFollow', 'Administración', 110),
  ('menu.receipts.view', 'receipts', 'Ver el registro de pagos y recibos', 'menu', '/admin/recibos', 'Registro de pagos', 'cilNotes', 'Administración', 120),
  ('menu.guardians.view', 'guardians', 'Ver y listar padres y tutores', 'menu', '/admin/padres-tutores', 'Padres y tutores', 'cilGroup', 'Administración', 130),
  ('menu.students.view', 'students', 'Ver y listar estudiantes', 'menu', '/admin/estudiantes', 'Estudiantes', 'cilPeople', 'Administración', 140),
  ('menu.courses.view', 'courses', 'Ver y listar cursos', 'menu', '/admin/cursos', 'Cursos', 'cilBook', 'Administración', 150),
  ('menu.teachers.view', 'teachers', 'Ver y listar profesores', 'menu', '/admin/profesores', 'Profesores', 'cilEducation', 'Administración', 160),
  ('menu.enrollments.view', 'enrollments', 'Ver las consultas de inscripciones', 'menu', '/admin/inscripciones', 'Consultas de inscripciones', 'cilTask', 'Administración', 170),
  ('menu.preregistrations.view', 'preregistrations', 'Ver las preinscripciones', 'menu', '/admin/preinscripciones', 'Preinscripciones', 'cilSchool', 'Administración', 180),
  ('menu.payments.view', 'payments', 'Ver el control de pagos', 'menu', '/admin/control-pagos', 'Control de pagos', 'cilCash', 'Administración', 190),
  ('menu.settings.view', 'settings', 'Ver la configuración de la academia', 'menu', '/admin/configuracion', 'Configuración', 'cilSettings', 'Administración', 200),
  ('menu.teaching.courses.view', 'teaching.courses', 'Ver los cursos asignados', 'menu', '/docente/cursos', 'Mis cursos', 'cilBook', 'Gestión docente', 300),
  ('menu.teaching.students.view', 'teaching.students', 'Ver los estudiantes de sus cursos', 'menu', '/docente/estudiantes', 'Mis estudiantes', 'cilPeople', 'Gestión docente', 310),
  ('menu.teaching.evaluations.view', 'teaching.evaluations', 'Ver las evaluaciones de sus cursos', 'menu', '/docente/evaluaciones', 'Evaluaciones', 'cilTask', 'Gestión docente', 320),
  ('menu.learning.enroll.view', 'learning.enroll', 'Ver los cursos disponibles para inscribirse', 'menu', '/estudiante/preinscripciones', 'Inscribirme a cursos', 'cilSchool', 'Gestión estudiante', 400),
  ('menu.learning.courses.view', 'learning.courses', 'Ver sus cursos y resultados', 'menu', '/estudiante/cursos', 'Mis cursos y resultados', 'cilBook', 'Gestión estudiante', 410),
  ('students.create', 'students', 'Registrar estudiantes', 'action', NULL, NULL, NULL, NULL, NULL),
  ('students.update', 'students', 'Editar estudiantes', 'action', NULL, NULL, NULL, NULL, NULL),
  ('students.delete', 'students', 'Dar de baja estudiantes', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teachers.create', 'teachers', 'Registrar profesores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teachers.update', 'teachers', 'Editar profesores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teachers.delete', 'teachers', 'Dar de baja profesores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('guardians.create', 'guardians', 'Registrar padres y tutores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('guardians.update', 'guardians', 'Editar padres y tutores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('guardians.delete', 'guardians', 'Dar de baja padres y tutores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('courses.create', 'courses', 'Registrar cursos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('courses.update', 'courses', 'Editar cursos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('courses.delete', 'courses', 'Dar de baja o habilitar cursos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('courses.enrollment_deadline.update', 'courses', 'Cambiar el plazo de inscripción de un curso', 'action', NULL, NULL, NULL, NULL, NULL),
  ('enrollments.create', 'enrollments', 'Inscribir estudiantes a cursos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('enrollments.delete', 'enrollments', 'Eliminar inscripciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('payments.mark_paid', 'payments', 'Marcar inscripciones como pagadas', 'action', NULL, NULL, NULL, NULL, NULL),
  ('receipts.create', 'receipts', 'Registrar recibos de pago', 'action', NULL, NULL, NULL, NULL, NULL),
  ('preregistrations.approve', 'preregistrations', 'Aprobar preinscripciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('preregistrations.reject', 'preregistrations', 'Rechazar preinscripciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('users.enable', 'users', 'Habilitar usuarios dados de baja', 'action', NULL, NULL, NULL, NULL, NULL),
  ('admins.super_status.read', 'admins', 'Consultar si el usuario es super administrador', 'action', NULL, NULL, NULL, NULL, NULL),
  ('admins.create', 'admins', 'Registrar administradores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('admins.update', 'admins', 'Editar administradores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('admins.delete', 'admins', 'Dar de baja administradores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('admins.activate', 'admins', 'Reactivar administradores', 'action', NULL, NULL, NULL, NULL, NULL),
  ('settings.enrollment_deadline.update', 'settings', 'Cambiar el plazo global de inscripción', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.evaluations.create', 'teaching.evaluations', 'Crear evaluaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.evaluations.update', 'teaching.evaluations', 'Editar evaluaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.evaluations.delete', 'teaching.evaluations', 'Eliminar evaluaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.grades.read', 'teaching.evaluations', 'Ver calificaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.grades.create', 'teaching.evaluations', 'Calificar', 'action', NULL, NULL, NULL, NULL, NULL),
  ('teaching.grades.update', 'teaching.evaluations', 'Editar calificaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('learning.grades.read', 'learning.courses', 'Ver sus calificaciones', 'action', NULL, NULL, NULL, NULL, NULL),
  ('learning.enrollments.create', 'learning.enroll', 'Inscribirse a un curso', 'action', NULL, NULL, NULL, NULL, NULL),
  ('learning.debts.read', 'learning.enroll', 'Ver sus deudas pendientes', 'action', NULL, NULL, NULL, NULL, NULL),
  ('roles.read', 'access', 'Ver roles y su matriz de permisos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('roles.manage', 'access', 'Crear, editar, activar roles y cambiar sus permisos', 'action', NULL, NULL, NULL, NULL, NULL),
  ('users.access.manage', 'access', 'Asignar roles y personalizar permisos de usuarios', 'action', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  route = EXCLUDED.route,
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  section = EXCLUDED.section,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE permissions ADD CONSTRAINT permissions_menu_check CHECK (
  type <> 'menu' OR (route IS NOT NULL AND label IS NOT NULL AND section IS NOT NULL AND sort_order IS NOT NULL)
);

-- Asignaciones por defecto: solo para permisos que se crean en esta ejecución, para no
-- volver a agregar permisos que un administrador ya quitó de un rol.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES
  ('administrador', 'menu.dashboard.view'), ('administrador', 'menu.receipts.view'),
  ('administrador', 'menu.guardians.view'), ('administrador', 'menu.students.view'),
  ('administrador', 'menu.courses.view'), ('administrador', 'menu.teachers.view'),
  ('administrador', 'menu.enrollments.view'), ('administrador', 'menu.preregistrations.view'),
  ('administrador', 'menu.payments.view'), ('administrador', 'menu.settings.view'),
  ('administrador', 'students.create'), ('administrador', 'students.update'), ('administrador', 'students.delete'),
  ('administrador', 'teachers.create'), ('administrador', 'teachers.update'), ('administrador', 'teachers.delete'),
  ('administrador', 'guardians.create'), ('administrador', 'guardians.update'), ('administrador', 'guardians.delete'),
  ('administrador', 'courses.create'), ('administrador', 'courses.update'), ('administrador', 'courses.delete'),
  ('administrador', 'courses.enrollment_deadline.update'),
  ('administrador', 'enrollments.create'), ('administrador', 'enrollments.delete'),
  ('administrador', 'payments.mark_paid'), ('administrador', 'receipts.create'),
  ('administrador', 'preregistrations.approve'), ('administrador', 'preregistrations.reject'),
  ('administrador', 'users.enable'), ('administrador', 'admins.super_status.read'),
  ('super_administrador', 'menu.access.view'), ('super_administrador', 'menu.admins.view'),
  ('super_administrador', 'admins.create'), ('super_administrador', 'admins.update'),
  ('super_administrador', 'admins.delete'), ('super_administrador', 'admins.activate'),
  ('super_administrador', 'settings.enrollment_deadline.update'),
  ('super_administrador', 'roles.read'), ('super_administrador', 'roles.manage'),
  ('super_administrador', 'users.access.manage'),
  ('profesor', 'menu.dashboard.view'), ('profesor', 'menu.teaching.courses.view'),
  ('profesor', 'menu.teaching.students.view'), ('profesor', 'menu.teaching.evaluations.view'),
  ('profesor', 'teaching.evaluations.create'), ('profesor', 'teaching.evaluations.update'),
  ('profesor', 'teaching.evaluations.delete'), ('profesor', 'teaching.grades.read'),
  ('profesor', 'teaching.grades.create'), ('profesor', 'teaching.grades.update'),
  ('estudiante', 'menu.dashboard.view'), ('estudiante', 'menu.learning.enroll.view'),
  ('estudiante', 'menu.learning.courses.view'), ('estudiante', 'learning.grades.read'),
  ('estudiante', 'learning.enrollments.create'), ('estudiante', 'learning.debts.read')
) AS d(role_code, permission_code)
JOIN roles r ON r.code = d.role_code
JOIN permissions p ON p.code = d.permission_code
WHERE p.code NOT IN (SELECT code FROM _permisos_previos)
ON CONFLICT DO NOTHING;


COMMIT;

-- ============================================================================
-- Verificación (solo lectura, ejecutar por separado)
-- ============================================================================
-- Plazo: debe devolver los mismos cursos abiertos que hoy calcula el frontend:
--   SELECT cu.id_curso, cu.nombre,
--          cu.fecha_creacion::date AS fecha_inicio,
--          COALESCE(cu.dias_plazo_inscripcion, cfg.dias_plazo_inscripcion) AS dias,
--          LEAST(cu.fecha_creacion::date + COALESCE(cu.dias_plazo_inscripcion, cfg.dias_plazo_inscripcion),
--                (cu.fecha_creacion + cu.duracion)::date) AS fecha_limite,
--          (NOW() AT TIME ZONE 'America/La_Paz')::date
--            <= LEAST(cu.fecha_creacion::date + COALESCE(cu.dias_plazo_inscripcion, cfg.dias_plazo_inscripcion),
--                     (cu.fecha_creacion + cu.duracion)::date) AS abierta
--   FROM curso cu CROSS JOIN configuracion_sistema cfg
--   ORDER BY cu.fecha_creacion DESC;
-- Permisos por rol (por defecto: administrador 31, super_administrador 10, profesor 10, estudiante 6):
--   SELECT r.code, COUNT(rp.permission_id) FROM roles r
--   LEFT JOIN role_permissions rp ON rp.role_id = r.id GROUP BY r.code ORDER BY r.code;
-- Total de permisos (55: 17 de menú y 38 de acción):
--   SELECT type, COUNT(*) FROM permissions GROUP BY type;
-- Roles de usuario_roles sin rol en el catálogo (debe dar 0):
--   SELECT COUNT(*) FROM usuario_roles ur LEFT JOIN roles r ON r.id = ur.role_id WHERE r.id IS NULL;
-- Usuarios activos sin roles activos (revisar):
--   SELECT u.id_usuarios, u.email FROM usuarios u
--   WHERE u.estado = 'Activo' AND NOT EXISTS (
--     SELECT 1 FROM usuario_roles ur WHERE ur.id_usuario = u.id_usuarios AND ur.estado = 'Activo');
-- Ítems de menú que ningún rol tiene (revisar):
--   SELECT p.code FROM permissions p WHERE p.type = 'menu'
--   AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.permission_id = p.id);
-- Super administradores activos (debe ser al menos 1):
--   SELECT COUNT(*) FROM administradores a JOIN usuarios u ON u.id_usuarios = a.id_usuarios
--   WHERE a.es_super AND u.estado = 'Activo';

-- ============================================================================
-- Rollback (solo si hace falta deshacer; quitar los -- y ejecutar en este orden)
-- ============================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_usuario_roles_sincronizar_rol ON usuario_roles;
-- DROP TRIGGER IF EXISTS trg_usuario_roles_version ON usuario_roles;
-- DROP TRIGGER IF EXISTS trg_user_permissions_version ON user_permissions;
-- DROP TRIGGER IF EXISTS trg_administradores_version ON administradores;
-- DROP TRIGGER IF EXISTS trg_administradores_proteger_super ON administradores;
-- DROP TRIGGER IF EXISTS trg_usuarios_proteger_super ON usuarios;
-- DROP TRIGGER IF EXISTS trg_role_permissions_version_insert ON role_permissions;
-- DROP TRIGGER IF EXISTS trg_role_permissions_version_delete ON role_permissions;
-- DROP TRIGGER IF EXISTS trg_roles_version ON roles;
-- DROP FUNCTION IF EXISTS fn_usuario_roles_sincronizar_rol(), fn_incrementar_version_permisos(),
--   fn_version_por_role_permissions(), fn_version_por_estado_rol(), fn_usuarios_proteger_super(),
--   fn_administradores_proteger_super();
-- DROP TABLE IF EXISTS user_permissions;
-- ALTER TABLE usuario_roles DROP CONSTRAINT IF EXISTS usuario_roles_role_id_fkey;
-- DROP INDEX IF EXISTS ux_usuario_roles_usuario_role_id, idx_usuario_roles_role_id;
-- ALTER TABLE usuario_roles DROP COLUMN IF EXISTS role_id;
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS permissions_version;
-- DROP TABLE IF EXISTS role_permissions, permissions, roles;
-- DROP TABLE IF EXISTS historial_plazo_inscripcion;
-- ALTER TABLE curso
--   DROP COLUMN IF EXISTS plazo_actualizado_en,
--   DROP COLUMN IF EXISTS plazo_actualizado_por,
--   DROP COLUMN IF EXISTS dias_plazo_inscripcion;
-- DROP TABLE IF EXISTS configuracion_sistema;
-- COMMIT;
