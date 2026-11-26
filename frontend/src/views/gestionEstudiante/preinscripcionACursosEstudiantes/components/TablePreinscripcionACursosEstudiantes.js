import { mostrarDuracion } from '../../../utils/duracion'
import { cilClock, cilPeople, cilMoney, cilCalendar } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import respaldoCursos from '../../../../assets/images/respaldoCursosWeb.jpg'

const DIAS_PARA_INSCRIBIRSE = 10

const COLOR_VERDE = '#198754'
const COLOR_ROJO = '#dc3545'

// Convierte "2026-04-15T11:17:15.136Z" a fecha local sin problemas de zona horaria
const parsearFecha = (valor) => {
  if (!valor) return null
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

const formatearFecha = (valor) => {
  const fecha = parsearFecha(valor)
  return fecha ? fecha.toLocaleDateString('es-BO') : 'Sin definir'
}

const obtenerEstadoCurso = (curso) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const creacion = parsearFecha(curso.fecha_creacion)
  const fin = parsearFecha(curso.fecha_fin)

  // Ya terminó
  if (fin && hoy > fin) {
    return {
      texto: 'TERMINADO',
      color: COLOR_ROJO,
      puedeInscribirse: false,
      ayuda: 'El curso ya terminó',
    }
  }

  // Aún no inicia: botón normal
  if (!creacion || hoy < creacion) {
    return {
      texto: 'Inscribirse',
      color: null,
      puedeInscribirse: true,
      ayuda: '',
    }
  }

  // Ya inició: se cuentan los 10 días desde fecha_creacion
  const limite = new Date(creacion)
  limite.setDate(limite.getDate() + DIAS_PARA_INSCRIBIRSE)

  if (hoy <= limite) {
    return {
      texto: 'EN CURSO',
      color: COLOR_VERDE,
      puedeInscribirse: true,
      ayuda: 'Se puede inscribir',
    }
  }

  return {
    texto: 'EN CURSO',
    color: COLOR_ROJO,
    puedeInscribirse: false,
    ayuda: 'Ya no se puede inscribir',
  }
}

const TablePreinscripcionACursosEstudiantes = ({
  cursosNoInscritos,
  crearInscripcionAunCursoParaEstudiante,
  inscripcionBloqueada,
}) => {
  return (
    <>
      {cursosNoInscritos.length === 0 ? (
        <div className="preinscripcion-cursos__empty-state">
          <h1 className="preinscripcion-cursos__title">CURSOS DISPONIBLEES</h1>
          <h2 className="preinscripcion-cursos__subtitle">No hay cursos disponibles</h2>
        </div>
      ) : (
        <div className="preinscripcion-cursos__section">
          <div className="preinscripcion-cursos__header">
            <h1 className="preinscripcion-cursos__title">CURSOS DISPONIBLES</h1>
            <h2 className="preinscripcion-cursos__subtitle">
              Ecuentra y selecciona el curso que deseas realizar
            </h2>
          </div>

          <div className="table-responsive preinscripcion-cursos__table-wrapper">
            <div className="preinscripcion-cursos__grid">
              {cursosNoInscritos.map((curso) => {
                const estado = obtenerEstadoCurso(curso)

                return (
                  <article key={curso.id_curso} className="preinscripcion-cursos__card">
                    <img
                      src={curso.imagen || respaldoCursos}
                      alt={`Curso de ${curso.materia}`}
                      className="preinscripcion-cursos__image"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                      }}
                    />

                    <div className="preinscripcion-cursos__card-header">
                      <h3 className="preinscripcion-cursos__course-title">{curso.materia}</h3>
                    </div>

                    <p className="preinscripcion-cursos__description">{curso.descripcion}</p>

                    <div className="preinscripcion-cursos__meta">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div
                          className="preinscripcion-cursos__cell preinscripcion-cursos__meta-item"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <CIcon icon={cilClock} className="me-2" />
                          <span>{mostrarDuracion(curso.duracion)}</span>
                        </div>
                        <div
                          className="preinscripcion-cursos__cell preinscripcion-cursos__meta-item"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <CIcon icon={cilMoney} className="me-2" />
                          <span style={{ color: 'green' }}>Bs. {curso.costo}</span>{' '}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div
                          className="preinscripcion-cursos__cell preinscripcion-cursos__meta-item"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <CIcon icon={cilCalendar} className="me-2" />
                          <span>Inicio: {formatearFecha(curso.fecha_creacion)}</span>
                        </div>
                        <div
                          className="preinscripcion-cursos__cell preinscripcion-cursos__meta-item"
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <CIcon icon={cilCalendar} className="me-2" />
                          <span>Fin: {formatearFecha(curso.fecha_fin)}</span>
                        </div>
                      </div>
                      <div className="preinscripcion-cursos__cell preinscripcion-cursos__meta-item">
                        <CIcon icon={cilPeople} className="me-2" />
                        <span>{curso.cupo_total} cupos disponibles</span>
                      </div>
                    </div>

                    <p className="preinscripcion-cursos__modalidad">
                      <strong>Modalidad de clases: </strong>
                      <span> El horario será coordinado según la disponibilidad.</span>
                    </p>

                    <div className="preinscripcion-cursos__actions">
                      <button
                        className="btn btn-primary preinscripcion-cursos__button"
                        disabled={inscripcionBloqueada}
                        title={estado.ayuda}
                        aria-disabled={!estado.puedeInscribirse}
                        style={
                          estado.color
                            ? {
                                backgroundColor: estado.color,
                                borderColor: estado.color,
                                color: '#fff',
                                opacity: 1,
                                cursor: estado.puedeInscribirse ? 'pointer' : 'not-allowed',
                              }
                            : undefined
                        }
                        onClick={() => {
                          if (!estado.puedeInscribirse) return
                          crearInscripcionAunCursoParaEstudiante(curso.id_curso)
                        }}
                      >
                        {estado.texto}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
export default TablePreinscripcionACursosEstudiantes
