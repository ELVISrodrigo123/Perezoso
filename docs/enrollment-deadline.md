# Plazo de inscripción

Cada curso acepta inscripciones durante una cantidad de días contados desde su fecha de inicio. Antes era una regla fija de 10 días repetida en el frontend; ahora es configurable y la calcula solo el backend.

## Regla

- **Días efectivos** = el plazo propio del curso (`curso.dias_plazo_inscripcion`) o, si es `NULL`, el plazo global (`configuracion_sistema.dias_plazo_inscripcion`, 10 por defecto).
- Rango permitido: **0 a 90 días enteros**, tanto en el global como en el curso.
- **Fecha de inicio** = `curso.fecha_creacion` (en la interfaz se muestra como "Fecha de inicio").
- **Fecha de fin** = fecha de inicio + `curso.duracion`.
- **Fecha límite** = `mínimo(fecha de inicio + días efectivos, fecha de fin)`. Ningún curso acepta inscripciones después de terminar.
- **"Hoy"** se toma en la zona `America/La_Paz`. La inscripción está abierta hasta el fin del día de la fecha límite, inclusive.
- Con **0 días**, solo se acepta inscripción el mismo día de inicio.
- La fecha límite **nunca se guarda**: se calcula en cada consulta con un único fragmento SQL que comparten los listados y la validación.

| Ejemplo | Inicio | Duración | Días | Fecha límite |
|---|---|---|---|---|
| Plazo global | 01/03 | 2 meses | 10 (global) | 11/03 |
| Plazo propio | 01/03 | 2 meses | 20 | 21/03 |
| Curso corto | 01/03 | 4 días | 20 | 05/03 (fecha de fin) |
| Cero días | 01/03 | 1 mes | 0 | 01/03 |

### Aumentar o reducir el plazo

- **Aumentar** puede **reabrir** un curso cuyo plazo ya había vencido.
- **Reducir** puede **cerrarlo de inmediato** si la nueva fecha límite ya pasó.
- En ningún caso se tocan las **inscripciones existentes**: solo cambia si se aceptan inscripciones nuevas.
- Poner `null` en un curso le quita el plazo propio y vuelve a usar el global.
- Cambiar el global afecta a todos los cursos sin plazo propio.

## Validación única de inscripción

Inscribirse como estudiante y que el administrador inscriba a un estudiante pasan por el mismo servicio (`backend/services/validarInscripcion.js`). Todo ocurre dentro de una transacción. La fila del curso se bloquea con `SELECT … FOR UPDATE`, así que dos inscripciones simultáneas no pueden ocupar el mismo último cupo.

Orden de las comprobaciones (la primera que falla define la respuesta):

| # | Condición | HTTP | `error` | Mensaje |
|---|---|---|---|---|
| 1 | El curso no existe | 404 | `curso_no_encontrado` | — |
| 2 | `curso.estado` distinto de `Activo` | 409 | `curso_inactivo` | `El curso "X" está inactivo y no acepta inscripciones.` |
| 3 | Hoy es posterior a la fecha de fin | 409 | `curso_terminado` | `El curso "X" terminó el dd/mm/aaaa.` |
| 4 | Hoy es posterior a la fecha límite | 409 | `plazo_inscripcion_vencido` | `El plazo de inscripción al curso "X" venció. Estuvo abierto hasta el dd/mm/aaaa.` |
| 5 | Sin cupos (`cupo_total` menos inscripciones) | 409 | `curso_sin_cupos` | `Curso sin cupos disponibles: "X".` |

Cuando el administrador actualiza las inscripciones de un estudiante:
- Solo se validan los **cursos nuevos**; los que ya tenía se conservan aunque estén cerrados.
- La operación es todo o nada: si un curso falla, no se aplica ningún alta ni baja.

El chatbot solo **informa** (`inscripcion_abierta` y `fecha_limite_inscripcion`); no inscribe.

## Campos en los listados

Los listados de cursos (administración, portal público, cursos disponibles del estudiante) incluyen:

| Campo | Descripción |
|---|---|
| `fecha_inicio_inscripcion`, `fecha_limite_inscripcion`, `fecha_fin_curso` | Fechas `AAAA-MM-DD` |
| `dias_plazo_efectivo` | Días que se aplican |
| `origen_plazo` | `global` o `curso` |
| `cupos_ocupados`, `cupos_disponibles` | Cupos |
| `estado_inscripcion` | `abierta`, `inactivo`, `terminado`, `plazo_vencido` o `sin_cupos` |
| `inscripcion_abierta` | Booleano |
| `curso_iniciado` | Si la fecha de inicio ya llegó |

## Endpoints

Todos requieren un access token de un usuario con rol activo `administrador`.

| Método y ruta | Permiso | Body |
|---|---|---|
| `GET /admin/configuracion/plazo-inscripcion` | `settings.enrollment_deadline.read` | — |
| `PUT /admin/configuracion/plazo-inscripcion` | `settings.enrollment_deadline.update` (solo super administrador) | `{ "dias": 0..90 }` |
| `GET /admin/cursos/:id/plazo-inscripcion` | `courses.read` | — |
| `PUT /admin/cursos/:id/plazo-inscripcion` | `courses.enrollment_deadline.update` | `{ "dias": 0..90 }` o `{ "dias": null }` |

Endpoints de inscripción que aplican la validación:

| Método y ruta | Permiso | Body |
|---|---|---|
| `POST /estudiante/curso/inscripcion-a-un-curso/:idCurso` | `learning.enrollments.create` | — |
| `POST /admin/inscripciones` | `enrollments.create` | `{ "idEstudiante": 1, "idCurso": [3, 5] }` |

### Respuestas de ejemplo

`200 GET /admin/configuracion/plazo-inscripcion`

```json
{
  "dias": 10,
  "actualizadoEn": "2026-11-26T15:14:48.716Z",
  "actualizadoPor": { "id": 1, "email": "<email>" },
  "cursosPorEstado": { "abierta": 7, "inactivo": 1, "plazo_vencido": 3, "sin_cupos": 1, "terminado": 1 },
  "historial": [
    { "id_historial": 1, "dias_anterior": 10, "dias_nuevo": 16, "modificado_por_email": "<email>", "modificado_en": "2026-11-26T15:10:02.120Z" }
  ]
}
```

`200 PUT /admin/cursos/4/plazo-inscripcion` con `{ "dias": 20 }`

```json
{
  "message": "Plazo de inscripción del curso actualizado",
  "idCurso": 4, "curso": "Matemática I", "estadoCurso": "Activo",
  "diasCurso": 20, "diasGlobal": 10, "diasEfectivos": 20, "origenPlazo": "curso",
  "fechaInicio": "2026-11-11", "fechaFin": "2027-01-11", "fechaLimite": "2026-12-01",
  "estadoInscripcion": "abierta", "inscripcionAbierta": true,
  "cupoTotal": 20, "cuposOcupados": 3, "cuposDisponibles": 17,
  "actualizadoEn": "2026-11-26T15:12:40.010Z", "actualizadoPor": { "id": 2, "email": "<email>" },
  "historial": [{ "id_historial": 2, "dias_anterior": null, "dias_nuevo": 20, "modificado_por_email": "<email>", "modificado_en": "..." }]
}
```

Con `{ "dias": null }`, la respuesta trae `diasCurso: null`, `origenPlazo: "global"` y el mensaje `"El curso vuelve a usar el plazo global"`.

`400`: el valor está fuera del rango o no es un entero.

```json
{ "errores": [{ "type": "field", "value": 91, "msg": "Los días deben ser un número entero entre 0 y 90", "path": "dias", "location": "body" }] }
```

`403`: falta el rol o el permiso, por ejemplo un administrador común que intenta cambiar el global.

```json
{ "message": "Acceso denegado" }
```

`404`: el curso no existe.

`409`: la inscripción fue rechazada.

```json
{
  "error": "plazo_inscripcion_vencido",
  "message": "El plazo de inscripción al curso \"Matemática I\" venció. Estuvo abierto hasta el 21/11/2026.",
  "idCurso": 3, "curso": "Matemática I", "estadoInscripcion": "plazo_vencido",
  "fechaLimite": "2026-11-21", "fechaFin": "2027-01-11", "cuposDisponibles": 19
}
```

## Historial de cambios

- Cada cambio de plazo, global o por curso, se registra en `historial_plazo_inscripcion`:
  - `ambito`: `global` o `curso`.
  - `id_curso`.
  - `dias_anterior` y `dias_nuevo`: `null` significa "usa el global".
  - `modificado_por`.
  - `modificado_en`.
- Además, `configuracion_sistema` y `curso` guardan el último cambio (`actualizado_por/en`, `plazo_actualizado_por/en`).
- Cada GET o PUT devuelve los últimos 20 cambios.

## Interfaz

- **Gestión de cursos**:
  - La columna "Inscripción" muestra el estado, la fecha límite y los días (con "(global)" si vienen del plazo global).
  - El botón **Plazo** aparece solo con `courses.enrollment_deadline.update` y abre un modal con:
    - el campo de días (0–90);
    - la opción "Usar el plazo global";
    - una vista previa en vivo de la fecha límite y de si el curso queda Abierto o Cerrado;
    - el último cambio y el historial.
- **Configuración** (`/admin/configuracion`):
  - Muestra el plazo global, la cantidad de cursos por estado y el historial.
  - Solo un super administrador puede editarlo; el resto lo ve en modo lectura.
- **Portal público y vista del estudiante:** el botón de cada curso usa el estado que calcula el backend. El tooltip muestra la fecha límite.
