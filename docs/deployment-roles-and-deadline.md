# Despliegue: roles, permisos y plazo de inscripción

Pasos para llevar a producción las migraciones `002_enrollment_deadline.sql` y `003_permissions.sql` junto con el código que las usa.

## 1. Revisión previa (solo lectura)

Hay que ejecutar esto en la base de producción **antes** de migrar y revisar los resultados. Ninguna consulta modifica datos.

```sql
-- Tipos de las columnas que usan las migraciones y el código
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE (table_name, column_name) IN (
  ('curso','id_curso'), ('curso','fecha_creacion'), ('curso','duracion'),
  ('curso','estado'), ('curso','cupo_total'),
  ('usuarios','id_usuarios'), ('usuario_roles','role'), ('usuario_roles','estado'),
  ('administradores','id_usuarios'), ('administradores','es_super'),
  ('inscripcion','id_curso'))
ORDER BY table_name, column_name;
-- Esperado: fecha_creacion timestamp o date, duracion interval,
--           cupo_total integer, es_super boolean.

-- Valores de estado y roles
SELECT estado, COUNT(*) FROM curso GROUP BY estado;          -- solo 'Activo' / 'Inactivo'
SELECT role, COUNT(*) FROM usuario_roles GROUP BY role;      -- administrador, profesor, estudiante
SELECT es_super, COUNT(*) FROM administradores GROUP BY es_super;

-- Cursos con datos incompletos (el estado quedaría "sin cupos" o sin fechas)
SELECT COUNT(*) FILTER (WHERE cupo_total IS NULL)     AS sin_cupo,
       COUNT(*) FILTER (WHERE fecha_creacion IS NULL) AS sin_inicio,
       COUNT(*) FILTER (WHERE duracion IS NULL)       AS sin_duracion
FROM curso;

-- Las tablas nuevas todavía no deben existir (todo NULL)
SELECT to_regclass('configuracion_sistema'), to_regclass('historial_plazo_inscripcion'),
       to_regclass('roles'), to_regclass('permissions'), to_regclass('role_permissions');

-- Cursos que hoy ya superan su cupo
SELECT i.id_curso, COUNT(*) AS inscritos, c.cupo_total
FROM inscripcion i JOIN curso c ON c.id_curso = i.id_curso
GROUP BY i.id_curso, c.cupo_total
HAVING COUNT(*) > c.cupo_total;
```

Cómo interpretar los resultados:
- Si `fecha_creacion`, `duracion` o `cupo_total` tienen valores `NULL`, hay que completarlos antes.
- Si `curso.estado` tiene valores distintos de `Activo` o `Inactivo`, hay que normalizarlos, porque cualquier otro valor se trata como inactivo.
- Los cursos que ya superan su cupo siguen funcionando, pero no aceptan altas nuevas.

## 2. Migraciones

1. Respaldar la base (`pg_dump -Fc`).
2. Ejecutar en este orden, cada una con `psql -v ON_ERROR_STOP=1 -f <archivo>`:

| Orden | Archivo | Qué crea |
|---|---|---|
| 1 | `db/migrations/002_enrollment_deadline.sql` | `configuracion_sistema` (una fila, 10 días), columnas `dias_plazo_inscripcion`, `plazo_actualizado_por`, `plazo_actualizado_en` en `curso`, tabla `historial_plazo_inscripcion` |
| 2 | `db/migrations/003_permissions.sql` | `roles`, `permissions` (50), `role_permissions`. Aborta si falta la 002 o `curso.estado` |

3. Ejecutar las consultas de verificación que trae cada archivo. Resultado esperado para la 003:
   - permisos por rol: `administrador` 30, `super_administrador` 6, `profesor` 9, `estudiante` 5;
   - 50 permisos en total;
   - 0 roles de `usuario_roles` fuera del catálogo.

La 002 no cambia el comportamiento por sí sola: el global queda en 10 días y los cursos existentes en `NULL`, o sea, usan el global.

### Rollback

Está comentado al final de cada archivo. Se aplica en orden inverso:

```sql
-- 1) deshacer 003
BEGIN;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
COMMIT;

-- 2) deshacer 002
BEGIN;
DROP TABLE IF EXISTS historial_plazo_inscripcion;
ALTER TABLE curso
  DROP COLUMN IF EXISTS plazo_actualizado_en,
  DROP COLUMN IF EXISTS plazo_actualizado_por,
  DROP COLUMN IF EXISTS dias_plazo_inscripcion;
DROP TABLE IF EXISTS configuracion_sistema;
COMMIT;
```

Si se deshacen las migraciones, también hay que volver a la versión anterior del código: el backend nuevo necesita estas tablas.

## 3. Variables de entorno

**No hay variables nuevas.** El backend y el frontend usan las mismas que antes. La zona horaria de la academia (`America/La_Paz`) está fija en el código.

## 4. Despliegue del código

Hay que desplegar el backend y el frontend **juntos**: el frontend nuevo lee los campos de estado de inscripción y los permisos del token.

## 5. Checklist después del deploy

- [ ] Login como administrador, super administrador, profesor y estudiante: el access token trae `permisos` y `type: "access"`.
- [ ] Los usuarios con sesión abierta pueden tener que volver a iniciar sesión una vez (ver el punto 6).
- [ ] `GET /admin/configuracion/plazo-inscripcion` responde 200 con `"dias": 10`.
- [ ] Un administrador común recibe 403 al cambiar el plazo global; un super administrador recibe 200.
- [ ] En Gestión de cursos, la columna "Inscripción" coincide con lo esperado en dos o tres cursos reales.
- [ ] Una inscripción a un curso abierto responde 201; una a un curso vencido, 409 con el mensaje correspondiente.
- [ ] `GET /estudiante/inscripciones` responde 404.
- [ ] El chatbot (`GET /api/chatbot/cursos`) devuelve `inscripcion_abierta` y `fecha_limite_inscripcion`.
- [ ] Si algo falla: rollback de la 003, después de la 002, y volver a la versión anterior del código.

## 6. Cambios de comportamiento respecto a antes

- **Sesión:**
  - Los access tokens ahora llevan `type`. Los emitidos antes del despliegue se rechazan con 401, y el frontend los renueva automáticamente.
  - Los refresh tokens anteriores también se rechazan, así que cada usuario inicia sesión una vez más.
  - El header `Authorization` debe usar el esquema `Bearer`.
- **Seguridad (corregido):**
  - El rol estudiante tenía acceso indebido a rutas de inscripciones de administración; ahora `/estudiante/inscripciones*` responde 404.
  - El refresh token ya no puede usarse como access token.
- **Permisos:** además del rol, varias rutas exigen un permiso. Un rol sin el permiso correspondiente recibe 403.
- **Plazo:**
  - Antes eran 10 días fijos, calculados en el navegador y sin tope.
  - Ahora el plazo es configurable (global y por curso, 0–90), lo calcula el backend en hora de La Paz y tiene como tope la fecha de fin.
- **Validación al inscribir:**
  - Inscribirse a un curso inactivo, terminado, con el plazo vencido o sin cupos responde 409, también cuando inscribe un administrador.
  - Antes no se validaba el cupo.
- **Inscripción por administrador:**
  - Ahora es una transacción real (todo o nada).
  - Solo se validan los cursos nuevos; los ya inscritos se conservan.
- **`GET /perfil`:** devuelve `{ message, usuario: { id, email, role, roles, permisos } }`.
- **Interfaz:**
  - La etiqueta "Fecha de creación" del formulario de curso ahora dice "Fecha de inicio"; la columna de la base no cambió.
  - Hay una página nueva de Configuración y un botón Plazo en Gestión de cursos.
