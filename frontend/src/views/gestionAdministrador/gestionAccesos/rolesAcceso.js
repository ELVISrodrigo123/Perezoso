const rolesAcceso = [
  {
    id: 'super-administrador',
    nombre: 'Super administrador',
    insignia: { texto: 'Control total', tipo: 'warning' },
    descripcion:
      'Único rol que gestiona a los demás administradores, además de todo lo que hace un administrador.',
    puede: [
      'Gestión de administradores',
      'Dar de baja y activar administradores',
      'Todo lo que puede el administrador',
    ],
    noPuede: ['Ser dado de baja'],
    gestionable: false,
  },
  {
    id: 'administrador',
    nombre: 'Administrador',
    insignia: { texto: 'Acceso completo', tipo: 'primary' },
    descripcion:
      'Administración de estudiantes, docentes, cursos, inscripciones, pagos y demás módulos administrativos.',
    puede: [
      'Registro de pagos',
      'Padres y tutores',
      'Estudiantes',
      'Cursos',
      'Profesores',
      'Consultas de inscripciones',
      'Preinscripciones',
      'Control de pagos',
      'Gestión de accesos',
    ],
    noPuede: ['Gestión de administradores'],
    gestionable: false,
  },
  {
    id: 'docente',
    nombre: 'Docente',
    insignia: { texto: 'Acceso académico', tipo: 'success' },
    descripcion: 'Consulta de cursos asignados, estudiantes y gestión de calificaciones.',
    puede: ['Mis cursos', 'Mis estudiantes', 'Evaluaciones'],
    noPuede: [
      'Registro de pagos',
      'Gestión de estudiantes',
      'Gestión de cursos',
      'Gestión de inscripciones',
      'Gestión de accesos',
    ],
    gestionable: true,
  },
  {
    id: 'estudiante',
    nombre: 'Estudiante',
    insignia: { texto: 'Acceso de estudiante', tipo: 'success' },
    descripcion: 'Acceso a las funcionalidades estudiantiles que estén implementadas.',
    puede: ['Inscribirme a cursos', 'Mis cursos y resultados'],
    noPuede: [
      'Gestionar usuarios',
      'Gestionar cursos',
      'Gestionar calificaciones',
      'Consultar pagos administrativos',
      'Gestión de accesos',
    ],
    gestionable: true,
  },
  {
    id: 'padre-familia',
    nombre: 'Padre de familia',
    insignia: { texto: 'Sin acceso web', tipo: 'secondary' },
    descripcion: 'No inicia sesión en el sistema web. Se comunica con la academia por WhatsApp.',
    puede: [],
    noPuede: ['Iniciar sesión web', 'Acceder al panel'],
    gestionable: false,
  },
]

export default rolesAcceso
