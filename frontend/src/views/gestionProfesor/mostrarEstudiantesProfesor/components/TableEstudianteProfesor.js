import { useState } from 'react'
import EstudiantesDeCurso from './EstudiantesDeCurso'
import { LoadingState } from '../../../../components'

import '../../../../scss/contenedorStyles/contenedores.scss'
import '../../../../scss/textoStyles/textos.scss'
import '../../../../scss/formaStyles/selectStyle.scss'
import '../../../../scss/formaStyles/buttonStyle.scss'

const TableEstudianteProfesor = ({ cursos, totalEstudiantes, cargando, error }) => {
  const [cursosAbiertos, setCursosAbiertos] = useState({})

  const [cursosPrevios, setCursosPrevios] = useState(cursos)
  if (cursos !== cursosPrevios) {
    setCursosPrevios(cursos)
    if (cursos.length > 0) {
      setCursosAbiertos((abiertosActuales) =>
        Object.keys(abiertosActuales).length > 0
          ? abiertosActuales
          : { [cursos[0].id_curso]: true },
      )
    }
  }

  const alternarCurso = (idCurso) => {
    setCursosAbiertos((abiertosActuales) => ({
      ...abiertosActuales,
      [idCurso]: !abiertosActuales[idCurso],
    }))
  }

  if (cargando) {
    return <LoadingState label="Cargando mis estudiantes..." />
  }

  if (error) {
    return (
      <div className="estudiantes-profesor__report">
        <p className="estudiantes-profesor__empty">No se pudieron cargar tus estudiantes</p>
      </div>
    )
  }

  return (
    <div className="estudiantes-profesor__report">
      <div className="estudiantes-profesor__stats">
        <div className="estudiantes-profesor__stat">
          <span className="estudiantes-profesor__label">Cursos</span>
          {cursos.length > 0 ? (
            <ul className="estudiantes-profesor__list">
              {cursos.map((curso) => (
                <li key={curso.id_curso}>{curso.curso}</li>
              ))}
            </ul>
          ) : (
            <p className="estudiantes-profesor__empty">No hay cursos asignados</p>
          )}
        </div>

        <div className="estudiantes-profesor__stat estudiantes-profesor__stat--total">
          <span className="estudiantes-profesor__label">Total de estudiantes</span>
          <strong>{totalEstudiantes}</strong>
        </div>
      </div>

      {cursos.length > 0 ? (
        <div className="estudiantes-profesor__acordeon">
          {cursos.map((curso) => {
            const estaAbierto = Boolean(cursosAbiertos[curso.id_curso])
            const panelId = `estudiantes-profesor-curso-${curso.id_curso}`
            const cantidad = Number(curso.total_estudiantes || 0)

            return (
              <section className="estudiantes-profesor__curso" key={curso.id_curso}>
                <button
                  type="button"
                  className="estudiantes-profesor__curso-toggle"
                  aria-expanded={estaAbierto}
                  aria-controls={panelId}
                  onClick={() => alternarCurso(curso.id_curso)}
                >
                  <span className="estudiantes-profesor__curso-nombre">{curso.curso}</span>
                  <span className="estudiantes-profesor__curso-cantidad">
                    {cantidad} {cantidad === 1 ? 'estudiante' : 'estudiantes'}
                  </span>
                  <span
                    className={`estudiantes-profesor__curso-flecha${estaAbierto ? ' is-open' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={panelId}
                  className={`estudiantes-profesor__curso-panel${estaAbierto ? ' is-open' : ''}`}
                >
                  <EstudiantesDeCurso
                    idCurso={curso.id_curso}
                    nombreCurso={curso.curso}
                    totalCurso={cantidad}
                    abierto={estaAbierto}
                  />
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <p className="estudiantes-profesor__empty">No hay estudiantes asignados</p>
      )}
    </div>
  )
}

export default TableEstudianteProfesor
