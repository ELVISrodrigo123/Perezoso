import { cilPeople, cilCalendar } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardImage,
  CCardText,
  CCardTitle,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import { useNavigate } from 'react-router-dom'
import respaldoCursos from '../../../../assets/images/respaldoCursosWeb.jpg'

const DIAS_PARA_INSCRIBIRSE = 10

const parsearFecha = (valor) => {
  if (!valor) return null
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

const formatearFecha = (valor) => {
  const fecha = parsearFecha(valor)
  return fecha ? fecha.toLocaleDateString('es-BO') : 'Por confirmar'
}

const obtenerEstadoCurso = (curso) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const creacion = parsearFecha(curso.fecha_creacion)
  const fin = parsearFecha(curso.fecha_fin)

  if (fin && hoy > fin) {
    return {
      texto: 'TERMINADO',
      color: 'danger',
      puedeInscribirse: false,
      ayuda: 'El curso ya terminó',
    }
  }

  if (!creacion || hoy < creacion) {
    return {
      texto: 'Preinscribirse',
      color: 'primary',
      puedeInscribirse: true,
      ayuda: '',
    }
  }

  const limite = new Date(creacion)
  limite.setDate(limite.getDate() + DIAS_PARA_INSCRIBIRSE)

  if (hoy <= limite) {
    return {
      texto: 'EN CURSO',
      color: 'success',
      puedeInscribirse: true,
      ayuda: 'Se puede inscribir',
    }
  }

  return {
    texto: 'EN CURSO',
    color: 'danger',
    puedeInscribirse: false,
    ayuda: 'Ya no se puede inscribir',
  }
}

const prioridadEstado = (curso) => {
  const estado = obtenerEstadoCurso(curso)
  if (estado.texto === 'Preinscribirse') return 1
  if (estado.texto === 'EN CURSO' && estado.puedeInscribirse) return 2
  if (estado.texto === 'EN CURSO') return 3
  return 4
}

const ordenarCursos = (cursos) =>
  [...cursos].sort((a, b) => {
    const diferencia = prioridadEstado(a) - prioridadEstado(b)
    if (diferencia !== 0) return diferencia

    const fechaA = parsearFecha(a.fecha_creacion)?.getTime() ?? 0
    const fechaB = parsearFecha(b.fecha_creacion)?.getTime() ?? 0
    return fechaA - fechaB
  })

const estiloBadge = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 6px',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
}

const CursosDisponibles = ({ cursos, loading, error }) => {
  const navigate = useNavigate()

  if (error) return <CAlert color="danger">{error}</CAlert>
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }
  if (cursos.length === 0) {
    return <CAlert color="info">No hay cursos disponibles en este momento.</CAlert>
  }

  return (
    <CRow className="g-4">
      {ordenarCursos(cursos).map((curso) => {
        const unidad =
          curso.duracion && typeof curso.duracion === 'object'
            ? Object.keys(curso.duracion)[0]
            : null
        const valor = unidad ? curso.duracion[unidad] : null
        const unidades = {
          days: 'días',
          hours: 'horas',
          months: 'meses',
          weeks: 'semanas',
        }
        const estado = obtenerEstadoCurso(curso)

        return (
          <CCol key={curso.id_curso} sm={6} lg={3}>
            <CCard className="h-100 shadow-sm border-0">
              <div className="position-relative">
                <CCardImage
                  component="img"
                  orientation="top"
                  src={curso.imagen || respaldoCursos}
                  alt={`Curso de ${curso.materia}`}
                  className="object-fit-cover"
                  height={180}
                />
                {curso.autorImagen && (
                  <div
                    className="position-absolute bottom-0 start-0 px-2 py-1 small"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      color: 'white',
                    }}
                  >
                    Foto de{' '}
                    <a
                      href={curso.autorImagenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-decoration-underline"
                    >
                      {curso.autorImagen}
                    </a>{' '}
                    en{' '}
                    <a
                      href={curso.unsplashUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-decoration-underline"
                    >
                      Unsplash
                    </a>
                  </div>
                )}
              </div>
              <CCardBody className="d-flex flex-column">
                <CCardTitle>{curso.materia}</CCardTitle>
                <CCardText className="text-body-secondary flex-grow-1">
                  {curso.descripcion || 'Curso specialized para impulsar tus habilidades.'}
                </CCardText>

                <div className="d-flex gap-2 mb-2">
                  <CBadge color="primary" style={estiloBadge}>
                    {unidad && valor
                      ? `${valor} ${unidades[unidad] || unidad}`
                      : 'Duración por confirmar'}
                  </CBadge>
                  <CBadge color="success" style={estiloBadge}>
                    Bs. {curso.costo ?? 'Por confirmar'}
                  </CBadge>
                </div>

                <div className="d-flex gap-2 mb-3">
                  <CBadge color="info" style={estiloBadge}>
                    <CIcon icon={cilCalendar} className="me-1" />
                    Ini: {formatearFecha(curso.fecha_creacion)}
                  </CBadge>
                  <CBadge color="dark" style={estiloBadge}>
                    <CIcon icon={cilCalendar} className="me-1" />
                    Fin: {formatearFecha(curso.fecha_fin)}
                  </CBadge>
                </div>

                <div className="d-flex gap-2 mb-2">
                  <CBadge color="warning" style={estiloBadge}>
                    <CIcon icon={cilPeople} className="me-1" />
                    {curso.cupo_total ?? '---'} cupos
                  </CBadge>
                </div>

                <CButton
                  color={estado.color}
                  className="mt-auto"
                  title={estado.ayuda}
                  aria-disabled={!estado.puedeInscribirse}
                  style={{ cursor: estado.puedeInscribirse ? 'pointer' : 'not-allowed' }}
                  onClick={() => {
                    if (!estado.puedeInscribirse) return
                    navigate('/register')
                  }}
                >
                  {estado.texto}
                </CButton>
              </CCardBody>
            </CCard>
          </CCol>
        )
      })}
    </CRow>
  )
}

export default CursosDisponibles
