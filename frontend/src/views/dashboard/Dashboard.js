import { useEffect, useState } from 'react'
import { CAlert, CCol, CRow, CSpinner, CWidgetStatsA } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBook, cilCash, cilPeople, cilTask } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import { getCursosPorVencer } from '../../services/cursosService'
import { getEstudiantes } from '../../services/estudiantesService'
import { getPreinscripcionEstudiante } from '../../services/preInscripcionEstudianteRoutes'
import { getControlDePagosParaLosEstudiante } from '../../services/controlPagosParaEstudiantes'
import {
  getCursosEvaluacionProfesor,
  getCursosProfesor,
  getEstudiantesProfesor,
} from '../../services/gestionProfesor/gestionprofesCursos'
import { getMostrarCursosEstudiante } from '../../services/gestionEstudiante/cursosEstudiante'
import { obtenerPermisos } from '../utils/usuario'

const mockMetricas = {
  administrador: {
    ingresos: 'Bs. 12.450',
  },
  profesor: {
    asistencia: '92%',
  },
  estudiante: {
    promedio: '85/100',
    examenes: '2 próximos',
    cuenta: 'Al día',
  },
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [metricas, setMetricas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cursosPorVencer, setCursosPorVencer] = useState([])
  const permisos = obtenerPermisos()
  const clavePermisos = permisos.join(',')
  const puede = (permiso) => permisos.includes(permiso)

  useEffect(() => {
    let componenteActivo = true
    const tiene = (permiso) => clavePermisos.split(',').includes(permiso)

    const bloques = []
    if (tiene('menu.students.view')) {
      bloques.push(async () => {
        const estudiantes = await getEstudiantes()
        return [
          {
            color: 'primary',
            title: 'Total Estudiantes',
            value: estudiantes.data.length,
            ruta: '/admin/estudiantes',
          },
        ]
      })
    }
    if (tiene('menu.receipts.view')) {
      bloques.push(async () => [
        {
          color: 'info',
          title: 'Ingresos del Mes',
          value: mockMetricas.administrador.ingresos,
          ruta: '/admin/recibos',
        },
      ])
    }
    if (tiene('menu.preregistrations.view')) {
      bloques.push(async () => {
        const preinscripciones = await getPreinscripcionEstudiante()
        return [
          {
            color: 'warning',
            title: 'Preinscripciones Pendientes',
            value: preinscripciones.data.length,
            ruta: '/admin/preinscripciones',
          },
        ]
      })
    }
    if (tiene('menu.payments.view')) {
      bloques.push(async () => {
        const pagos = await getControlDePagosParaLosEstudiante()
        return [
          {
            color: 'danger',
            title: 'Pagos Vencidos',
            value: pagos.data.length,
            ruta: '/admin/control-pagos',
          },
        ]
      })
    }
    if (tiene('menu.teaching.courses.view')) {
      bloques.push(async () => {
        const cursos = await getCursosProfesor()
        return [
          {
            color: 'primary',
            title: 'Mis Cursos Asignados',
            value: cursos.data.length,
            ruta: '/docente/cursos',
          },
        ]
      })
    }
    if (tiene('menu.teaching.students.view')) {
      bloques.push(async () => {
        const estudiantes = await getEstudiantesProfesor()
        return [
          {
            color: 'info',
            title: 'Total Alumnos a Cargo',
            value: estudiantes.data.length,
            ruta: '/docente/estudiantes',
          },
        ]
      })
    }
    if (tiene('menu.teaching.evaluations.view')) {
      bloques.push(async () => {
        const evaluaciones = await getCursosEvaluacionProfesor()
        return [
          {
            color: 'warning',
            title: 'Evaluaciones Pendientes de Calificar',
            value: evaluaciones.data.length,
            ruta: '/docente/evaluaciones',
          },
        ]
      })
    }
    if (tiene('menu.learning.courses.view')) {
      bloques.push(async () => {
        const cursos = await getMostrarCursosEstudiante()
        return [
          {
            color: 'primary',
            title: 'Mis Cursos',
            value: cursos.data.length,
            ruta: '/estudiante/cursos',
          },
          {
            color: 'info',
            title: 'Mi Promedio General',
            value: mockMetricas.estudiante.promedio,
            ruta: '/estudiante/cursos',
          },
          {
            color: 'warning',
            title: 'Próximos Exámenes',
            value: mockMetricas.estudiante.examenes,
            ruta: '/estudiante/cursos',
          },
          {
            color: 'danger',
            title: 'Estado de Cuenta',
            value: mockMetricas.estudiante.cuenta,
            ruta: '/estudiante/cursos',
          },
        ]
      })
    }

    const cargarMetricas = async () => {
      setCargando(true)
      const resultados = await Promise.allSettled(bloques.map((bloque) => bloque()))
      if (componenteActivo) {
        setMetricas(resultados.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value))
        setCargando(false)
      }
    }

    cargarMetricas()

    return () => {
      componenteActivo = false
    }
  }, [clavePermisos])

  useEffect(() => {
    if (!clavePermisos.split(',').includes('menu.courses.view')) return

    let componenteActivo = true

    const cargarCursosPorVencer = async () => {
      try {
        const respuesta = await getCursosPorVencer()
        const cursos = respuesta?.data?.cursosPorVencer ?? []

        if (componenteActivo) {
          setCursosPorVencer(cursos)
        }
      } catch (error) {
        console.error('Error al cargar cursos por vencer', error)
        if (componenteActivo) {
          setCursosPorVencer([])
        }
      }
    }

    cargarCursosPorVencer()

    return () => {
      componenteActivo = false
    }
  }, [clavePermisos])

  if (cargando) {
    return <CSpinner color="primary" />
  }

  return (
    <>
      {puede('menu.courses.view') && cursosPorVencer.length > 0 && (
        <div className="dashboard-alerts__section">
          <div className="dashboard-alerts__header">
            <h6 className="dashboard-alerts__title">Cursos próximos a vencer</h6>
          </div>

          <div className="dashboard-alerts__list">
            {cursosPorVencer.map((curso) => (
              <CAlert key={curso.id_curso} color="warning" className="dashboard-alert__item">
                <div className="dashboard-alert__content">
                  <strong className="text-body">{curso.nombre}</strong>
                  <span>Vence en {curso.dias_restantes ?? 0} día(s)</span>
                </div>
                <small>{new Date(curso.fecha_fin).toLocaleDateString()}</small>
              </CAlert>
            ))}
          </div>
        </div>
      )}
      <br />
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        {metricas.map((metrica, index) => {
          const ruta = metrica.ruta

          return (
            <CCol key={metrica.title} sm={6} xl={4} xxl={3}>
              <CWidgetStatsA
                color={metrica.color}
                value={
                  <>
                    {metrica.value}{' '}
                    <CIcon icon={[cilPeople, cilCash, cilTask, cilBook][index % 4]} />
                  </>
                }
                title={metrica.title}
                onClick={() => {
                  if (ruta) navigate(ruta)
                }}
                className={ruta ? 'dashboard-metric__card--clickable' : ''}
              />
            </CCol>
          )
        })}
      </CRow>
    </>
  )
}

export default Dashboard
