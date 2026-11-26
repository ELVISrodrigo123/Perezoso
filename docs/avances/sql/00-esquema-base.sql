-- SOLO PARA LA BASE DE PRUEBAS brilliand_minds_test. NO EJECUTAR EN PRODUCCIÓN.

BEGIN;

CREATE TABLE usuarios (
  id_usuarios    SERIAL PRIMARY KEY,
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_usuarios_email_lower ON usuarios (LOWER(email));

CREATE TABLE usuario_roles (
  id_usuario INT NOT NULL REFERENCES usuarios(id_usuarios) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  estado     TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
  PRIMARY KEY (id_usuario, role)
);

CREATE TABLE administradores (
  id_administrador SERIAL PRIMARY KEY,
  id_usuarios      INT NOT NULL UNIQUE REFERENCES usuarios(id_usuarios),
  nombre           TEXT NOT NULL,
  a_paterno        TEXT NOT NULL,
  a_materno        TEXT,
  ci               TEXT NOT NULL UNIQUE,
  telefono         TEXT,
  email            TEXT UNIQUE,
  fecha_registro   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  es_super         BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE profesor (
  id_profesor    SERIAL PRIMARY KEY,
  id_usuario     INT NOT NULL UNIQUE REFERENCES usuarios(id_usuarios),
  nombre         TEXT NOT NULL,
  a_paterno      TEXT NOT NULL,
  a_materno      TEXT,
  ci             TEXT NOT NULL UNIQUE,
  telefono       TEXT,
  email          TEXT,
  especialidad   TEXT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE padre_tutor (
  id_tutor  SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  a_paterno TEXT NOT NULL,
  a_materno TEXT,
  ci        TEXT,
  telefono  TEXT,
  direccion TEXT,
  estado    TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE TABLE estudiante (
  id_estudiante  SERIAL PRIMARY KEY,
  id_usuario     INT NOT NULL UNIQUE REFERENCES usuarios(id_usuarios),
  id_tutor       INT REFERENCES padre_tutor(id_tutor) ON DELETE SET NULL,
  nombre         TEXT NOT NULL,
  a_paterno      TEXT NOT NULL,
  a_materno      TEXT,
  ci             TEXT NOT NULL UNIQUE,
  direccion      TEXT,
  telefono       TEXT,
  email          TEXT,
  colegio        TEXT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curso (
  id_curso       SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  duracion       INTERVAL NOT NULL,
  costo          NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (costo >= 0),
  cupo_total     INT NOT NULL CHECK (cupo_total >= 0),
  fecha_creacion TIMESTAMP NOT NULL,
  id_profesor    INT NOT NULL REFERENCES profesor(id_profesor),
  estado         TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE TABLE inscripcion (
  id_inscripcion    SERIAL PRIMARY KEY,
  id_estudiante     INT NOT NULL REFERENCES estudiante(id_estudiante),
  id_curso          INT NOT NULL REFERENCES curso(id_curso),
  fecha_inscripcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_pago       TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO')),
  UNIQUE (id_estudiante, id_curso)
);

CREATE TABLE evaluacion (
  id_evaluacion     SERIAL PRIMARY KEY,
  id_curso          INT NOT NULL REFERENCES curso(id_curso),
  nombre_evaluacion TEXT NOT NULL,
  descripcion       TEXT,
  fecha_evaluacion  DATE,
  porcentaje        NUMERIC(5, 2) NOT NULL CHECK (porcentaje BETWEEN 0 AND 100)
);

CREATE TABLE calificacion (
  id_calificacion SERIAL PRIMARY KEY,
  id_evaluacion   INT NOT NULL REFERENCES evaluacion(id_evaluacion) ON DELETE CASCADE,
  id_inscripcion  INT NOT NULL REFERENCES inscripcion(id_inscripcion) ON DELETE CASCADE,
  id_estudiante   INT NOT NULL REFERENCES estudiante(id_estudiante),
  nota            NUMERIC(5, 2),
  observacion     TEXT
);

CREATE TABLE historial_inscripciones (
  id_recibo      SERIAL PRIMARY KEY,
  id_inscripcion INT REFERENCES inscripcion(id_inscripcion) ON DELETE SET NULL,
  padre_tutor    TEXT,
  padre_ci       TEXT,
  monto_pagado   NUMERIC(10, 2) NOT NULL CHECK (monto_pagado >= 0),
  id_padre       INT REFERENCES padre_tutor(id_tutor) ON DELETE SET NULL,
  id_estudiante  INT,
  estudiante     TEXT,
  id_curso       INT,
  curso          TEXT,
  fecha_pago     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pre_inscripcion_estudiante (
  id_solicitud    SERIAL PRIMARY KEY,
  nombre          TEXT NOT NULL,
  a_paterno       TEXT NOT NULL,
  a_materno       TEXT,
  ci              TEXT NOT NULL,
  direccion       TEXT,
  telefono        TEXT,
  email           TEXT,
  colegio         TEXT,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado          TEXT DEFAULT 'Pendiente',
  observacion     TEXT
);

COMMIT;

-- SUPOSICIONES
-- | Tabla | Columna | Qué se asumió | Deducido de (archivo:línea) |
-- |---|---|---|---|
-- | usuarios | email | TEXT con índice único sobre LOWER(email); guarda email o teléfono | models/modelsUsuarios/crearUsuario.js:44, controllers/estudiantesController.js:58 |
-- | usuarios | estado | 'Activo'/'Inactivo', default 'Activo' | controllers/authController.js:79, models/modelsUsuarios/loginUsuario.js:27 |
-- | usuarios | fecha_registro | No se usa en consultas; agregada solo para auditoría | (ninguna) |
-- | usuario_roles | (id_usuario, role) | PK compuesta, requerida por ON CONFLICT | models/modelsUsuarios/crearUsuario.js:8 |
-- | usuario_roles | estado | 'Activo'/'Inactivo', default 'Activo' (el INSERT no lo envía) | models/modelsUsuarios/crearUsuario.js:6, loginUsuario.js:19 |
-- | administradores | id_usuarios | FK única a usuarios (un perfil por cuenta) | models/modelsGestionAdministradores/crudAdministradores.js:46, 165 |
-- | administradores | es_super | BOOLEAN NOT NULL DEFAULT false | crudAdministradores.js:139, 165 |
-- | administradores | fecha_registro | TIMESTAMPTZ DEFAULT NOW() (no se envía en el INSERT) | crudAdministradores.js:17, 33, 46 |
-- | administradores/profesor/estudiante | ci | TEXT único por tabla (se compara con ci::text y String(ci).trim()) | crearUsuario.js:52, 67; estudiantesController.js:67 |
-- | administradores | email | TEXT único (validación de duplicados) | crudAdministradores.js:114-121 |
-- | profesor/estudiante | id_usuario | FK única a usuarios | controllers/profesorController.js:104, estudiantesController.js:96 |
-- | profesor/estudiante | fecha_registro | TIMESTAMPTZ DEFAULT NOW() | profesorController.js:21, 40; estudiantesController.js:22, 40 |
-- | estudiante | id_tutor | FK opcional a padre_tutor | estudiantesController.js:96, models/modelsChatbot/identificar.js:7 |
-- | todas | telefono | TEXT (se compara con texto del chatbot y con telefono::text) | identificar.js:8-9, crudPadreTutor.js:16 |
-- | padre_tutor | estado | 'Activo'/'Inactivo', default 'Activo' | crudPadreTutor.js:18, 62-67; padreTutorController.js:85 |
-- | curso | fecha_creacion | TIMESTAMP sin zona; en la práctica es la fecha de inicio | models/modelsCursos/crearCursos.js:7, mostrarCurso.js:28-29, frontend TablePreinscripcionACursosEstudiantes.js:11 |
-- | curso | duracion | INTERVAL ("30 days", "2 mons") | crearCursos.js:5, 8; models/modelsInscripcion/mostrarInscripcion.js:18-26 |
-- | curso | costo | NUMERIC(10,2) | inscripcionesDelEstudiante.js:12, controlPagosDeEstudianteACursos.js:69 |
-- | curso | cupo_total | INT >= 0 (todavía ninguna consulta lo valida) | crearCursos.js:7, mostrarCurso.js:27 |
-- | curso | estado | 'Activo'/'Inactivo', default 'Activo' (el INSERT no lo envía) | cursosController.js:91-104, models/modelsChatbot/cursos.js:15 |
-- | inscripcion | (id_estudiante, id_curso) | UNIQUE (el código captura el error 23505 "Ya estás inscrito") | controllers/gestionEstudiante/cursosParaEstudiantes.js:63 |
-- | inscripcion | fecha_inscripcion | TIMESTAMPTZ DEFAULT NOW() (no se envía en el INSERT) | models/modelsInscripcion/crearInscripcion.js:4, mostrarInscripcion.js:13 |
-- | inscripcion | estado_pago | 'PENDIENTE'/'PAGADO', default 'PENDIENTE' | controlPagosDeEstudianteACursos.js:111, inscripcionesDelEstudiante.js:11 |
-- | evaluacion | porcentaje | NUMERIC(5,2) entre 0 y 100 | calificacionesModel.js:54, 69-71 |
-- | evaluacion | fecha_evaluacion | DATE | obtenerEvaluacionCurso.js:28 |
-- | calificacion | id_evaluacion | FK ON DELETE CASCADE (eliminarEvaluacion borra la evaluación sin borrar notas antes) | obtenerEvaluacionCurso.js:65-70 |
-- | calificacion | id_inscripcion | FK ON DELETE CASCADE (se borran inscripciones con notas) | eliminarInscripcionPorId.js:4, 10 |
-- | calificacion | nota | NUMERIC(5,2), escala 0-100, nullable | calificarExamen.js:51-52, calificacionesModel.js:4, 55 |
-- | calificacion | (id_evaluacion, id_estudiante) | Sin UNIQUE: el código no lo garantiza y agregarlo podría romper datos reales | calificarExamen.js:6 |
-- | historial_inscripciones | id_inscripcion | Nullable, FK ON DELETE SET NULL (los recibos sobreviven) | inscripcionesDelEstudiante.js:23 |
-- | historial_inscripciones | id_padre | FK opcional a padre_tutor | controlPagosDeEstudianteACursos.js:38, 122 |
-- | historial_inscripciones | fecha_pago | TIMESTAMPTZ DEFAULT NOW() (no se envía en el INSERT) | controlPagosDeEstudianteACursos.js:38-39 |
-- | pre_inscripcion_estudiante | estado | Nullable, default 'Pendiente'; valores 'Aprobada'/'Rechazada' | mostrandoPreinscripcion.js:13-15, preinscripcionAceptada.js:6 |
-- | pre_inscripcion_estudiante | fecha_solicitud, observacion | TIMESTAMPTZ DEFAULT NOW() / TEXT | mostrandoPreinscripcion.js:22, 35 |
-- | estudiantes, pagos | (todas) | NO se crean: solo las usa models/modelsChatbot/pagos.js y no coinciden con el resto del esquema (pendiente P4) | models/modelsChatbot/pagos.js:5, 14 |
