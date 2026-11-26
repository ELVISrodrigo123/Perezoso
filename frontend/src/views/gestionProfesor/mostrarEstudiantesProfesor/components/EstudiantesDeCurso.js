import { useEffect, useState } from 'react'
import { CFormInput } from '@coreui/react'
import { getEstudiantesDeCursoProfesor } from '../../../../services/gestionProfesor/gestionprofesCursos'

const POR_PAGINA = 10

const obtenerPaginasVisibles = (totalPaginas, paginaActual) => {
  if (totalPaginas <= 5) {
    return Array.from({ length: totalPaginas }, (_, index) => index + 1)
  }

  const paginas = [1]
  const inicio = Math.max(2, paginaActual - 1)
  const fin = Math.min(totalPaginas - 1, paginaActual + 1)

  if (inicio > 2) paginas.push('...')
  for (let pagina = inicio; pagina <= fin; pagina += 1) {
    paginas.push(pagina)
  }
  if (fin < totalPaginas - 1) paginas.push('...')

  if (!paginas.includes(totalPaginas)) paginas.push(totalPaginas)
  return paginas
}

const EstudiantesDeCurso = ({ idCurso, nombreCurso, totalCurso, abierto }) => {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(false)
  const [yaCargado, setYaCargado] = useState(false)

  // solo pide datos cuando el curso está abierto; al cambiar página o búsqueda vuelve a pedir
  useEffect(() => {
    if (!abierto) return undefined

    let activo = true
    const espera = busqueda.trim() ? 300 : 0

    const temporizador = setTimeout(async () => {
      setCargando(true)
      try {
        const params = { idCurso, page: pagina, limit: POR_PAGINA }
        if (busqueda.trim()) params.buscar = busqueda.trim()

        const respuesta = await getEstudiantesDeCursoProfesor(params)
        if (!activo) return

        const { datos, paginacion } = respuesta.data
        setEstudiantes(datos)
        setTotal(paginacion.total)
        setTotalPaginas(paginacion.totalPaginas)
        setError(false)
        setYaCargado(true)

        if (paginacion.totalPaginas > 0 && pagina > paginacion.totalPaginas) {
          setPagina(paginacion.totalPaginas)
        }
      } catch (errorCarga) {
        console.error(errorCarga)
        if (activo) setError(true)
      } finally {
        if (activo) setCargando(false)
      }
    }, espera)

    return () => {
      activo = false
      clearTimeout(temporizador)
    }
  }, [abierto, idCurso, pagina, busqueda])

  const indiceInicial = (pagina - 1) * POR_PAGINA

  // el curso no tiene a nadie inscrito
  if (Number(totalCurso) === 0) {
    return <p className="estudiantes-profesor__empty">Este curso aún no tiene estudiantes</p>
  }

  return (
    <>
      <div className="estudiantes-profesor__busqueda">
        <CFormInput
          type="search"
          size="sm"
          value={busqueda}
          onChange={(event) => {
            setBusqueda(event.target.value)
            setPagina(1)
          }}
          placeholder="Buscar por nombre o teléfono"
          aria-label={`Buscar estudiantes de ${nombreCurso}`}
        />
      </div>

      {error ? (
        <p className="estudiantes-profesor__empty">No se pudieron cargar los estudiantes</p>
      ) : !yaCargado ? (
        <p className="estudiantes-profesor__empty">Cargando estudiantes...</p>
      ) : estudiantes.length === 0 ? (
        <p className="estudiantes-profesor__empty">No se encontraron coincidencias</p>
      ) : (
        <>
          <div
            className={`table-responsive table-estudiantes-profesor__wrapper${
              cargando ? ' is-cargando' : ''
            }`}
            aria-busy={cargando}
          >
            <table className="table table-estudiantes-profesor__table">
              <thead>
                <tr>
                  <th className="table-estudiantes-profesor__head">Nro</th>
                  <th className="table-estudiantes-profesor__head">Estudiante</th>
                  <th className="table-estudiantes-profesor__head">Teléfono</th>
                  <th className="table-estudiantes-profesor__head">Dirección</th>
                  <th className="table-estudiantes-profesor__head">Fecha de inscripción</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((dat, index) => (
                  <tr
                    className="table-estudiantes-profesor__row"
                    key={dat.id_inscripcion || `${idCurso}-${indiceInicial + index}`}
                  >
                    <td className="table-estudiantes-profesor__cell">
                      #{indiceInicial + index + 1}
                    </td>
                    <td className="table-estudiantes-profesor__cell">{dat.estudiante}</td>
                    <td className="table-estudiantes-profesor__cell">
                      {dat.telefono_estudiante || '---'}
                    </td>
                    <td className="table-estudiantes-profesor__cell">{dat.direccion || '---'}</td>
                    <td className="table-estudiantes-profesor__cell">
                      {dat.fecha_inscripcion
                        ? new Date(dat.fecha_inscripcion).toLocaleDateString()
                        : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > POR_PAGINA && (
            <nav
              className="estudiantes-profesor__paginacion"
              aria-label={`Paginación de estudiantes de ${nombreCurso}`}
            >
              <div className="estudiantes-profesor__paginacion-info">
                Mostrando {indiceInicial + 1}–{Math.min(indiceInicial + POR_PAGINA, total)} de{' '}
                {total} estudiantes
              </div>
              <div className="estudiantes-profesor__paginacion-lista">
                <button
                  type="button"
                  className="estudiantes-profesor__paginacion-boton"
                  aria-label={`Página anterior de ${nombreCurso}`}
                  disabled={pagina === 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </button>
                {obtenerPaginasVisibles(totalPaginas, pagina).map((numero, index) =>
                  numero === '...' ? (
                    <span
                      className="estudiantes-profesor__paginacion-ellipsis"
                      key={`ellipsis-${index}`}
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`estudiantes-profesor__paginacion-boton${
                        numero === pagina ? ' estudiantes-profesor__paginacion-boton--activo' : ''
                      }`}
                      key={numero}
                      aria-current={numero === pagina ? 'page' : undefined}
                      onClick={() => setPagina(numero)}
                    >
                      {numero}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="estudiantes-profesor__paginacion-boton"
                  aria-label={`Página siguiente de ${nombreCurso}`}
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </>
  )
}

export default EstudiantesDeCurso
