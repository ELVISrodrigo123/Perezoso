-- 02 · Plazo de inscripción dinámico
-- PROPUESTA: la ejecuta el usuario, no el agente.
-- Efecto esperado: ningún cambio de comportamiento hasta que el admin edite un valor
-- (global = 10 días, cursos existentes = NULL → usan el global).

-- 0) Verificaciones previas (solo lectura) ---------------------------------------
-- Tipo real de fecha_creacion y existencia de curso.estado:
--   SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'curso' AND column_name IN ('fecha_creacion', 'duracion', 'estado');
-- Tipo de la PK de usuarios (para las FK de auditoría):
--   SELECT data_type FROM information_schema.columns
--   WHERE table_name = 'usuarios' AND column_name = 'id_usuarios';

BEGIN;

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

COMMIT;

-- 4) Verificación posterior (solo lectura) -----------------------------------------
-- Debe devolver los mismos cursos abiertos que hoy calcula el frontend:
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

-- 5) Rollback (solo si hace falta deshacer) ----------------------------------------
-- BEGIN;
-- DROP TABLE IF EXISTS historial_plazo_inscripcion;
-- ALTER TABLE curso
--   DROP COLUMN IF EXISTS plazo_actualizado_en,
--   DROP COLUMN IF EXISTS plazo_actualizado_por,
--   DROP COLUMN IF EXISTS dias_plazo_inscripcion;
-- DROP TABLE IF EXISTS configuracion_sistema;
-- COMMIT;
