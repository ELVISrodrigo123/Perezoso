# 02 · Corrección crítica y plazo de inscripción dinámico

- **Fecha:** 2026-11-26
- **Rama:** `feature/roles-and-authentication`
- **Decisión vigente:** opción C de [01](01-analisis-autenticacion.md) en dos pasos (primero A). Se mantiene el selector de rol.

---

## Etapa 1 — Corrección crítica (hecha, sin commit)

| Cambio | Archivo |
|---|---|
| Quitado `app.use('/estudiante', verificarToken, requireRole('estudiante'), inscripcionRoutes)` | `backend/server.js` (ex línea 58) |
| Quitados los 5 `console.log` y `req.user.role` → `req.user?.role` (si falta `req.user` devuelve 403 en vez de lanzar un error) | `backend/middlewares/requireRole.js` |

Verificación:

- `grep "estudiante/inscripciones"` en `frontend/` (incluye `tests/` de Playwright) y `chatbot/workflows/` → **0 coincidencias**. El frontend usa solo `/admin/inscripciones/*` (`services/inscripcionesService.js`, `services/controlPagosParaEstudiantes.js`).
- Al estudiante le quedan solo sus rutas propias: `/estudiante/cursos`, `/estudiante/curso/calificaciones/:idCurso`, `/estudiante/curso/no-inscritos`, `/estudiante/curso/inscripcion-a-un-curso/:idCurso` y `/estudiante/curso/deudas`, todas filtradas por `req.user.id`.
- `npx standard server.js middlewares/requireRole.js` sin errores y `node --check server.js` correcto.
- `inscripcionRoutes` sigue importado y montado en `/admin` (`server.js:52`).

---

## Etapa 2 — Análisis del plazo de inscripción

### 2.1 Dónde se calcula o valida hoy "fecha + 10 días"

**Backend: en ningún lado.** Ningún endpoint valida el plazo, la fecha de fin, los cupos ni el estado del curso al inscribir. La regla existe **solo en el frontend**, copiada 4 veces:

| # | Archivo:línea | Uso | Qué decide |
|---|---|---|---|
| F1 | `frontend/src/views/pages/home/components/CursosDisponibles.js:19, 32-75, 217-221` | Portal público | Habilita el botón "Preinscribirse" (que solo navega a `/register`) y ordena las tarjetas |
| F2 | `frontend/src/views/gestionEstudiante/preinscripcionACursosEstudiantes/components/TablePreinscripcionACursosEstudiantes.js:6, 23-69, 167-180` | Estudiante logueado | Habilita el botón que llama a `POST /estudiante/curso/inscripcion-a-un-curso/:idCurso` |
| F3 | `frontend/src/views/estudiantes/components/EstudianteTable.js:467-490, 721` | Admin, alta/edición de estudiante | Filtra qué cursos aparecen para inscribir (`cursos.filter(cursoPermiteInscripcion)`) → `POST /admin/inscripciones` |
| F4 | `frontend/src/views/inscripciones/Inscripciones.js:142-148` | Admin, consultas | **Código muerto**: `DIAS_PARA_INSCRIBIRSE` y `parsearFecha` están declarados y no se usan |

Endpoints que **deberían** validar y hoy no lo hacen:

| Archivo:línea | Endpoint | Situación |
|---|---|---|
| `backend/controllers/gestionEstudiante/cursosParaEstudiantes.js:51-68` → `models/modelsGestionEstudiante/cursosEstudiante/obtenerCursosEstudiante.js:71-77` | `POST /estudiante/curso/inscripcion-a-un-curso/:idCurso` | Inserta directo. Un estudiante puede inscribirse por API a un curso cerrado, terminado o inactivo |
| `backend/controllers/inscripcionController.js:50-102` → `models/modelsInscripcion/crearInscripcion.js:1-8` | `POST /admin/inscripciones` | Sincroniza la lista completa (inserta y borra). No valida plazo de los cursos nuevos |

Lugares que **muestran** fechas y tendrían que exponer el estado calculado por el backend:

| Archivo:línea | Endpoint |
|---|---|
| `backend/models/modelsPublicas/cursosDisponibles.js:5` | `GET /public/cursos-disponibles` (F1) |
| `backend/models/modelsGestionEstudiante/cursosEstudiante/obtenerCursosEstudiante.js:42-69` | `GET /estudiante/curso/no-inscritos` (F2) |
| `backend/models/modelsCursos/mostrarCurso.js:3-55` | `GET /admin/cursos` (F3 y gestión de cursos) |
| `backend/models/modelsChatbot/cursos.js:3-19` | `GET /api/chatbot/cursos`: ya calcula `estado_fecha` (Próximo / En curso / Finalizado) en `America/La_Paz`, pero no dice si la inscripción está abierta |

**Chatbot:** no inscribe (los workflows 01-99 están vacíos y `00-principal` solo usa `consultar_cursos`). Solo aplica para **informar**: conviene que `/api/chatbot/cursos` devuelva `inscripcion_abierta` y `fecha_limite_inscripcion`, para que el bot no diga "podés inscribirte" a un curso cerrado.

**Preinscripción pública:** `pre_inscripcion_estudiante` **no tiene `id_curso`** (`models/modelsPreInscripcion/preInscripcionEstudiante.js:6`). Es una solicitud de alta como estudiante, no una inscripción a un curso, así que el helper no tiene qué validar ahí. Solo cambia lo que se muestra en F1. Si en el futuro la preinscripción elige curso, se aplica el mismo helper.

### 2.2 Qué fecha se usa y si es correcta

- Se usa **`curso.fecha_creacion`**. Pese al nombre (la UI dice "Fecha de creación", `CursoFormulario.js:145`), en la práctica **es la fecha de inicio**: el formulario no permite fechas anteriores a hoy (`useCursos.js:272-278`), `fecha_fin = fecha_creacion + duracion` en todo el backend, las tarjetas la muestran como "Inicio"/"Ini" y el chatbot la usa para "Próximo / En curso".
- Por lo tanto, la regla "fecha de inicio + N días" **es correcta para el negocio**. El problema es solo el nombre. No propongo renombrar la columna ahora (la usan 9 consultas y 8 componentes); queda como pendiente cambiar la etiqueta a "Fecha de inicio".

Semántica actual (se conserva exactamente):

```
hoy > fecha_fin                       → cerrada (TERMINADO)
hoy < fecha_inicio                    → abierta (aún no inicia)
hoy <= fecha_inicio + N días          → abierta (EN CURSO, verde)
en otro caso                          → cerrada (EN CURSO, rojo)
```

El límite es **inclusivo** (`hoy <= límite`). Con N = 0, el último día para inscribirse es el día de inicio, y al día siguiente se cierra (lo que pediste para el valor 0).

Inconsistencia de zona horaria: el frontend usa la fecha local del navegador, el chatbot `America/La_Paz` y `mostrarCursosPorVencer` usa `CURRENT_DATE` (zona del servidor de PostgreSQL). El helper usará `America/La_Paz` siempre.

### 2.3 Tu diseño validado contra el código

| Punto de tu propuesta | Veredicto |
|---|---|
| Valor global en una tabla de configuración editable | ✅ Recomiendo una tabla `configuracion_sistema` **de una sola fila con columnas tipadas** en lugar de clave/valor: el `CHECK 0..90` lo garantiza la base y no hay que parsear texto. Para otro ajuste a futuro, se agrega una columna |
| Por curso: ¿días o fecha límite? | ✅ **Días.** Es lo que se calcula hoy, se recalcula solo si el admin mueve la fecha de inicio y cumple tu aclaración ("nunca guardar la fecha calculada"). Una fecha fija quedaría desfasada al editar el inicio |
| Vacío = usa el global | ✅ `curso.dias_plazo_inscripcion NULL`. Volver a NULL = "restablecer al global" |
| Extender o reabrir cambiando el valor | ✅ Sale solo del cálculo en vivo: subir los días reabre si `hoy <= nueva fecha límite`; bajarlos cierra al instante. Las inscripciones ya hechas no se tocan: solo se valida al **insertar** |
| Validación siempre en el backend, en un helper | ✅ Un solo módulo `backend/services/plazoInscripcion.js` con **una expresión SQL** reutilizada en listados y una función `validarPlazoInscripcion(idCurso, db)` para los inserts. Aplica a: inscripción del estudiante, inscripción del admin (solo cursos nuevos de la lista) y como dato informativo en listados y chatbot |
| Permiso propio | ✅ Encaja en la Etapa 3. Ver la nota de nombres en 2.6 |
| Error claro con la fecha | ✅ `409` con `{ error: 'plazo_inscripcion_vencido', message: 'La inscripción al curso "X" cerró el 25/11/2026.', fechaLimite: '2026-11-25' }` |
| Trazabilidad (quién y cuándo) | ✅ Columnas `*_actualizado_por` / `*_actualizado_en` para mostrar el último cambio, y además una tabla `historial_plazo_inscripcion` con el valor anterior y el nuevo. Solo con columnas se pierde el historial al segundo cambio |

Lo que agrego:

1. **Tope con la fecha de fin:** `fecha_limite = LEAST(inicio + días, fecha_fin)`. Con 90 días en un curso de 1 mes, la fecha mostrada sería falsa. Hoy el frontend ya cierra al pasar `fecha_fin`, así que no cambia el comportamiento; solo hace honesta la fecha que se muestra.
2. **Una sola condición:** con días ≥ 0, `hoy <= fecha_limite` ya cubre "aún no inicia" (abierta) y "terminado" (cerrada). Toda la regla es una comparación.
3. **Vista previa en vivo:** el formulario calcula la fecha y el estado con un util compartido de frontend (`views/utils/plazoInscripcion.js`), que reemplaza las 4 copias actuales. El backend sigue siendo la autoridad: al guardar devuelve la fecha y el estado oficiales.
4. **Validación con `express-validator`:** `body('dias').optional({ values: 'null' }).isInt({ min: 0, max: 90 }).toInt()` para el curso (acepta `null` = restablecer), y obligatorio para el global.

### 2.4 Diseño final de datos

SQL completo en [`sql/02-plazo-inscripcion.sql`](sql/02-plazo-inscripcion.sql) (con verificaciones previas, verificación posterior y rollback).

| Tabla | Columna | Tipo | Regla |
|---|---|---|---|
| `configuracion_sistema` (nueva, 1 fila) | `id` | `SMALLINT` PK | `CHECK (id = 1)` |
| | `dias_plazo_inscripcion` | `INT NOT NULL DEFAULT 10` | `CHECK 0..90` |
| | `actualizado_por` | `INT` FK `usuarios` | `ON DELETE SET NULL` |
| | `actualizado_en` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `curso` (alter) | `dias_plazo_inscripcion` | `INT NULL` | `CHECK 0..90`; NULL = global |
| | `plazo_actualizado_por` | `INT` FK `usuarios` | |
| | `plazo_actualizado_en` | `TIMESTAMPTZ NULL` | |
| `historial_plazo_inscripcion` (nueva) | `ambito`, `id_curso`, `dias_anterior`, `dias_nuevo`, `modificado_por`, `modificado_en` | | `ambito ∈ {global, curso}` |

Valores para lo existente: global = **10**; todos los cursos = **NULL**. Resultado: **cero cambios** hasta que el admin edite.

Cálculo (nunca se persiste):

```sql
fecha_inicio  = cu.fecha_creacion::date
dias_efectivos = COALESCE(cu.dias_plazo_inscripcion, cfg.dias_plazo_inscripcion)
fecha_limite  = LEAST(fecha_inicio + dias_efectivos, (cu.fecha_creacion + cu.duracion)::date)
abierta       = (NOW() AT TIME ZONE 'America/La_Paz')::date <= fecha_limite
```

### 2.5 Plan para la Etapa 4 (para tu OK)

**Backend**

| Pieza | Detalle |
|---|---|
| `services/plazoInscripcion.js` | `columnasPlazoSql` (fragmento SELECT con `fecha_limite_inscripcion`, `inscripcion_abierta`, `dias_plazo_efectivo`, `origen_plazo`), `validarPlazoInscripcion(idCurso, db)` y `validarPlazosInscripcion(idsCursos, db)` para la lista del admin |
| Inserts | `cursosParaEstudiantes.js:51` y `inscripcionController.js:50` (solo `cursosAInsertar`) → `409` si está vencido |
| Listados | `cursosDisponibles.js`, `obtenerCursosEstudiante.js:42`, `mostrarCurso.js`, `modelsChatbot/cursos.js` agregan las columnas calculadas |
| Endpoints | `GET/PUT /admin/configuracion/plazo-inscripcion` `{ dias }`; `GET/PUT /admin/cursos/:id/plazo-inscripcion` `{ dias \| null }`. El PUT guarda `actualizado_por = req.user.id`, registra en el historial y devuelve el estado recalculado |
| Permisos | `requirePermission(...)` de la Etapa 3 en los PUT; en los GET, el mismo permiso que ya da acceso a cursos |

**Frontend**

| Pieza | Detalle |
|---|---|
| `views/utils/plazoInscripcion.js` | Util único para la vista previa. Las 4 copias (F1-F4) pasan a usar `inscripcion_abierta` / `fecha_limite_inscripcion` del backend |
| Gestión de cursos (`CursoTable.js`) | Columna "Inscripción": badge Abierta/Cerrada + fecha límite + indicador "global" o "personalizado" |
| Modal de plazo por curso | Visible solo con el permiso. Input numérico 0-90, opción "Usar valor global", **vista previa en vivo** de la fecha límite y del estado ("quedaría Abierto/Cerrado") y el último cambio (quién y cuándo) |
| Configuración | Nueva ruta `/admin/configuracion` con el valor global, la misma vista previa (cuántos cursos quedarían abiertos) y menú en `_nav.js` con permiso |

### 2.6 Notas para la Etapa 3 (decisiones tuyas)

- **Nombres:** pediste tablas `permissions` / `role_permissions` y un permiso con estilo `courses.enrollment_deadline.update` (inglés, con puntos). El esquema actual está en español (`usuarios`, `usuario_roles`) y en el doc 01 propuse `modulo:accion`. Recomiendo **tu convención** (inglés con puntos) para códigos de permiso y nombres de tabla nuevos, y no renombrar las tablas existentes. Permisos de este tema: `courses.enrollment_deadline.update` y `settings.enrollment_deadline.update` (global). ¿Uno solo para ambos o separados?
- **¿El helper también cierra cursos `Inactivo`?** Hoy un curso inactivo aparece en `/estudiante/curso/no-inscritos` y se puede inscribir por API. Agregar `cu.estado = 'Activo'` al cálculo sería un cambio de comportamiento (correcto, pero cambio). Lo dejo para que decidas.

---

## Pendientes (no tocar hasta que se decida)

| # | Pendiente | Origen |
|---|---|---|
| P1 | Logout sin endpoint: la cookie de refresh sobrevive 7 días | 01 · S5 |
| P2 | Se pierde la sesión al recargar (no hay `/refresh` al arrancar) | 01 · §3 |
| P3 | `JWT_SECRET` real en `backend/.env.example:5` | 01 · S2 |
| P4 | Workflows del chatbot vacíos (`01`-`99`) y `pagos.js` con tablas inexistentes | 01 · §6 |
| P5 | Contraseña inicial = CI | 01 · S3 |
| P6 | Enumeración en login, validación de body, `trust proxy`, rate limit en `/refresh` | 01 · S6-S8 |
| P7 | Código muerto: `models/User.js`, `archivoTemporal.js`, `testUnsplash.js`, deps `sequelize`/`pg-hstore`, `Inscripciones.js:142-148` | 01 · §7.2, 02 · F4 |
| P8 | **Nuevo:** `postInscripciones` hace `BEGIN`/`COMMIT` sobre el pool (`inscripcionController.js:77, 86, 95`), no sobre un cliente: la transacción no es real y un fallo a mitad deja borrados sin insertar | 02 |
| P9 | **Nuevo:** el backend no valida cupos (`cupo_total`) ni fecha de fin al inscribir | 02 |
| P10 | **Nuevo:** etiqueta "Fecha de creación" en `CursoFormulario.js:145`; en realidad es la fecha de inicio | 02 |
| P11 | Zonas horarias distintas en frontend, chatbot y `mostrarCursosPorVencer` | 02 |
| P12 | Logs de datos en `calificarEvaluacion.js:5`, `crearCursos.js:11`, `estudiantesController.js:93` | 01 · S10 |
