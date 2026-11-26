/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * Each route object contains:
 * - path: URL path for the route
 * - name: Human-readable name for breadcrumbs
 * - element: Lazy-loaded React component
 * - exact: (optional) Requires exact path match
 *
 * @module routes
 */

import React from 'react'

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// Academic modules
const PadresTutores = React.lazy(() => import('./views/padreTutor/PadreTutor'))
const Estudiantes = React.lazy(() => import('./views/estudiantes/Estudiantes'))
const Cursos = React.lazy(() => import('./views/cursos/Cursos'))
const ConfiguracionAcademia = React.lazy(
  () => import('./views/configuracion/ConfiguracionAcademia'),
)
const Profesores = React.lazy(() => import('./views/profesores/Profesores'))
const Inscripciones = React.lazy(() => import('./views/inscripciones/Inscripciones'))
const PreinscripcionEstudiante = React.lazy(
  () => import('./views/preinscripciones/PreinscripcionEstudiante'),
)
const ControlPagosEstudiante = React.lazy(
  () => import('./views/gestionAdministrador/controlPagosEstudiantes/ControlPagosEstudiante'),
)
const Recibos = React.lazy(() => import('./views/gestionAdministrador/recibos/Recibos'))

const MostrarCursosProfesor = React.lazy(
  () => import('./views/gestionProfesor/mostrarCursosProfesor/mostrarCursosProfesor'),
)
const MostrarEstudiantesProfesor = React.lazy(
  () => import('./views/gestionProfesor/mostrarEstudiantesProfesor/mostrarEstudianteProfesor'),
)
const CursosEvaluacionProfesor = React.lazy(
  () => import('./views/gestionProfesor/obtenerCursosEvaluacion/obtenerCursosEvaluacionProfesor'),
)
const PreinscripcionCursosEstudiante = React.lazy(
  () =>
    import('./views/gestionEstudiante/preinscripcionACursosEstudiantes/preinscripcionACursosEstudiantes'),
)
const CursosResultadosEstudiante = React.lazy(
  () =>
    import('./views/gestionEstudiante/mostrarCursosEstudiante/mostrarCursosResultadosExamenEstudiante'),
)

const GestionAccesos = React.lazy(
  () => import('./views/gestionAdministrador/gestionAccesos/GestionAccesos'),
)

const Administradores = React.lazy(
  () => import('./views/gestionAdministrador/Administradores/Administradores'),
)

/**
 * Array of route configuration objects
 *
 * @type {Array<Object>}
 * @property {string} path - URL path pattern
 * @property {string} name - Display name for breadcrumbs and navigation
 * @property {React.LazyExoticComponent} element - Lazy-loaded component
 * @property {boolean} [exact] - Whether to match path exactly
 *
 * @example
 * // Route renders when URL matches '/dashboard'
 * { path: '/dashboard', name: 'Dashboard', element: Dashboard }
 *
 * @example
 * // Route with exact match required
 * { path: '/base', name: 'Base', element: Cards, exact: true }
 */
const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard, permiso: 'menu.dashboard.view' },
  {
    path: '/admin/accesos',
    name: 'Gestion de accesos',
    element: GestionAccesos,
    permiso: 'menu.access.view',
  },
  {
    path: '/admin/administradores',
    name: 'Administradores',
    element: Administradores,
    permiso: 'menu.admins.view',
  },
  {
    path: '/admin/recibos',
    name: 'Registro de Recibos',
    element: Recibos,
    permiso: 'menu.receipts.view',
  },
  {
    path: '/admin/padres-tutores',
    name: 'Padres y Tutores',
    element: PadresTutores,
    permiso: 'menu.guardians.view',
  },
  {
    path: '/admin/estudiantes',
    name: 'Estudiantes',
    element: Estudiantes,
    permiso: 'menu.students.view',
  },
  { path: '/admin/cursos', name: 'Cursos', element: Cursos, permiso: 'menu.courses.view' },
  {
    path: '/admin/profesores',
    name: 'Profesores',
    element: Profesores,
    permiso: 'menu.teachers.view',
  },
  {
    path: '/admin/inscripciones',
    name: 'Inscripciones',
    element: Inscripciones,
    permiso: 'menu.enrollments.view',
  },
  {
    path: '/admin/preinscripciones',
    name: 'Preinscripciones',
    element: PreinscripcionEstudiante,
    permiso: 'menu.preregistrations.view',
  },
  {
    path: '/admin/control-pagos',
    name: 'Control de pagos',
    element: ControlPagosEstudiante,
    permiso: 'menu.payments.view',
  },
  {
    path: '/admin/configuracion',
    name: 'Configuración',
    element: ConfiguracionAcademia,
    permiso: 'menu.settings.view',
  },
  {
    path: '/docente/cursos',
    name: 'Mis cursos',
    element: MostrarCursosProfesor,
    permiso: 'menu.teaching.courses.view',
  },
  {
    path: '/docente/estudiantes',
    name: 'Mis estudiantes',
    element: MostrarEstudiantesProfesor,
    permiso: 'menu.teaching.students.view',
  },
  {
    path: '/docente/evaluaciones',
    name: 'Evaluaciones',
    element: CursosEvaluacionProfesor,
    permiso: 'menu.teaching.evaluations.view',
  },
  {
    path: '/estudiante/preinscripciones',
    name: 'Inscribirme a cursos',
    element: PreinscripcionCursosEstudiante,
    permiso: 'menu.learning.enroll.view',
  },
  {
    path: '/estudiante/cursos',
    name: 'Mis cursos y resultados',
    element: CursosResultadosEstudiante,
    permiso: 'menu.learning.courses.view',
  },
]

export default routes
