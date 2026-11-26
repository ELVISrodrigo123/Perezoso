import { Fragment, useState } from 'react'
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { SectionCard, LoadingState, EmptyState } from '../../../components'

const normalizarTexto = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const TablaProfesores = ({
  inscripcionesPorProfesor,
  eliminarInscripcionId,
  idProfesorSeleccionado,
  cargando,
  eliminarInscripcionPorCurso,
  cursoParaEliminar,
  cancelarEliminacionCurso,
  confirmarEliminacionCurso,
}) => {
  const datos = inscripcionesPorProfesor?.datos || []
  const cursosUnicos = [...new Set(datos.map((dat) => dat.curso || 'Sin curso'))]
  const totalEstudiantes = datos.filter((dat) => dat.estudiante !== null).length
  const tieneDatosOriginales = datos.length > 0
  const [filtroAbierto, setFiltroAbierto] = useState(null)
  const [filtrosColumna, setFiltrosColumna] = useState({
    curso: '',
    fecha_inscripcion: '',
    estudiante: '',
    telefono: '',
  })
  const [cursosAbiertos, setCursosAbiertos] = useState({})

  const alternarCurso = (idCurso) => {
    setCursosAbiertos((prev) => ({ ...prev, [idCurso]: !prev[idCurso] }))
  }

  const renderFilterHeader = (campo, etiqueta, tipo = 'text') => {
    const isOpen = filtroAbierto === campo
    const valorActual = filtrosColumna[campo] || ''

    return (
      <CTableHeaderCell scope="col" className="table-inscripcion__head-cell">
        <div className="table-inscripcion__header">
          <span>{etiqueta}</span>
          <button
            type="button"
            className={`table-inscripcion__filter-toggle ${isOpen ? 'is-open' : ''}`}
            onClick={() => setFiltroAbierto(isOpen ? null : campo)}
            aria-label={`Filtrar por ${etiqueta}`}
          >
            {tipo === 'date' ? '🔽' : '🔍'}
          </button>
        </div>
        {isOpen && (
          <div className="table-inscripcion__filter-panel">
            {tipo === 'date' ? (
              <input
                type="date"
                className="table-inscripcion__filter-input"
                value={valorActual}
                onChange={(event) =>
                  setFiltrosColumna((prev) => ({ ...prev, [campo]: event.target.value }))
                }
              />
            ) : (
              <input
                type="text"
                className="table-inscripcion__filter-input"
                value={valorActual}
                placeholder="Buscar"
                onChange={(event) =>
                  setFiltrosColumna((prev) => ({ ...prev, [campo]: event.target.value }))
                }
              />
            )}
          </div>
        )}
      </CTableHeaderCell>
    )
  }

  const datosFiltrados = datos.filter((dat) => {
    const cumpleCurso =
      !filtrosColumna.curso ||
      normalizarTexto(dat.curso || 'Sin curso').includes(normalizarTexto(filtrosColumna.curso))

    const cumpleFecha =
      !filtrosColumna.fecha_inscripcion ||
      (dat.fecha_inscripcion &&
        new Date(dat.fecha_inscripcion).toISOString().slice(0, 10) ===
          filtrosColumna.fecha_inscripcion)

    const cumpleEstudiante =
      !filtrosColumna.estudiante ||
      normalizarTexto(dat.estudiante || '').includes(normalizarTexto(filtrosColumna.estudiante))

    const cumpleTelefono =
      !filtrosColumna.telefono ||
      normalizarTexto(dat.telefono_estudiante || '').includes(
        normalizarTexto(filtrosColumna.telefono),
      )

    return cumpleCurso && cumpleFecha && cumpleEstudiante && cumpleTelefono
  })

  return (
    <div className="inscripcion-reporte__wrapper">
      {cursoParaEliminar && (
        <CModal
          visible={Boolean(cursoParaEliminar)}
          onClose={cancelarEliminacionCurso}
          alignment="center"
        >
          <CModalHeader>
            <CModalTitle>Finalizar curso</CModalTitle>
          </CModalHeader>
          <CModalBody>
            ¿Deseas finalizar el curso <strong>{cursoParaEliminar.nombreCurso}</strong> para este
            profesor? Esta acción eliminará todas las inscripciones de ese curso.
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              variant="outline"
              onClick={cancelarEliminacionCurso}
              disabled={cargando}
            >
              Cancelar
            </CButton>
            <CButton color="danger" onClick={confirmarEliminacionCurso} disabled={cargando}>
              {cargando ? 'Procesando...' : 'Sí, finalizar curso'}
            </CButton>
          </CModalFooter>
        </CModal>
      )}

      <SectionCard className="inscripcion-table__card text-body">
        <div className="text-center mb-3" style={{ color: 'var(--cui-body-color)' }}>
          <h2
            className="mb-2 fw-bold"
            style={{ color: 'var(--cui-body-color)', fontSize: '1.5rem' }}
          >
            Profesor:{' '}
            {datos.length > 0
              ? datos[0].profesor
              : inscripcionesPorProfesor?.message || 'Sin datos'}
          </h2>
          <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2">
            <span>
              <strong>Teléfono:</strong>{' '}
              {datos.length > 0 ? datos[0].telefono_profesor : 'Sin datos'}
            </span>
            <span
              className="d-none d-sm-inline"
              aria-hidden="true"
              style={{ color: 'var(--cui-secondary-color)' }}
            >
              |
            </span>
            <span>
              <strong>Total de estudiantes:</strong> {totalEstudiantes}
            </span>
          </div>
        </div>
        {cargando ? (
          <LoadingState label="Cargando inscripciones…" />
        ) : !tieneDatosOriginales ? (
          <EmptyState
            title="No hay inscripciones para este profesor"
            description="Selecciona otro profesor o revisa sus cursos asignados."
          />
        ) : (
          <>
            <div className="table-responsive inscripcion-table__wrapper">
              <CTable align="middle" hover className="table-inscripcion__table">
                <CTableHead>
                  <CTableRow>
                    {renderFilterHeader('curso', 'Curso')}
                    <CTableHeaderCell scope="col" className="no-print table-inscripcion__head-cell">
                      Nro
                    </CTableHeaderCell>
                    {renderFilterHeader('fecha_inscripcion', 'Fecha de Inscripcion', 'date')}
                    {renderFilterHeader('estudiante', 'Estudiante')}
                    {renderFilterHeader('telefono', 'Teléfono')}
                    <CTableHeaderCell
                      scope="col"
                      className="no-print text-end table-inscripcion__head-cell"
                    >
                      Acciones
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {datosFiltrados.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="table-inscripcion__empty-results">
                        No se encontraron resultados
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    datosFiltrados.map((dat, index) => {
                      const esPrimeroDelCurso =
                        index === 0 || dat.curso !== datosFiltrados[index - 1].curso
                      const idCurso = dat.id_curso || dat.curso || 'Sin curso'
                      const cursoAbierto =
                        Boolean(filtrosColumna.estudiante || filtrosColumna.telefono) ||
                        Boolean(cursosAbiertos[idCurso])
                      const cantidadEstudiantesCurso = datos.filter(
                        (inscripcion) =>
                          (inscripcion.id_curso || inscripcion.curso || 'Sin curso') === idCurso &&
                          inscripcion.estudiante !== null,
                      ).length

                      return (
                        <Fragment
                          key={
                            dat.id_inscripcion ||
                            `${dat.id_curso}-${dat.id_estudiante}-${dat.fecha_inscripcion}`
                          }
                        >
                          {esPrimeroDelCurso && (
                            <>
                              <CTableRow
                                className="table-inscripcion__group-row"
                                role="button"
                                tabIndex={0}
                                aria-expanded={cursoAbierto}
                                onClick={() => alternarCurso(idCurso)}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === 'Enter' &&
                                    event.target === event.currentTarget
                                  ) {
                                    event.preventDefault()
                                    alternarCurso(idCurso)
                                  }
                                }}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease',
                                }}
                              >
                                <CTableDataCell
                                  colSpan={5}
                                  className="table-inscripcion__group-cell"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="me-2"
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '1.1rem',
                                      transform: cursoAbierto ? 'rotate(90deg)' : 'rotate(0deg)',
                                      transition: 'transform 0.2s ease',
                                    }}
                                  >
                                    ›
                                  </span>
                                  {dat.curso || 'Sin curso'}
                                  <span
                                    className="badge rounded-pill ms-2"
                                    style={{
                                      backgroundColor: 'var(--cui-tertiary-bg)',
                                      color: 'var(--cui-secondary-color)',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {cantidadEstudiantesCurso}{' '}
                                    {cantidadEstudiantesCurso === 1 ? 'estudiante' : 'estudiantes'}
                                  </span>
                                </CTableDataCell>
                                <CTableDataCell className="text-end table-inscripcion__group-cell">
                                  <CButton
                                    color="danger"
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      eliminarInscripcionPorCurso(
                                        dat.id_curso,
                                        dat.curso,
                                        idProfesorSeleccionado,
                                      )
                                    }}
                                    className="inscripcion-action__button"
                                  >
                                    Finalizar curso
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            </>
                          )}
                          {cursoAbierto && dat.estudiante ? (
                            <CTableRow className="table-inscripcion__row">
                              <CTableDataCell className="no-print table-inscripcion__cell"></CTableDataCell>
                              <CTableDataCell className="no-print text-body-secondary table-inscripcion__cell">
                                #{index + 1}
                              </CTableDataCell>
                              <CTableDataCell className="table-inscripcion__cell">
                                {dat.fecha_inscripcion
                                  ? new Date(dat.fecha_inscripcion).toLocaleDateString()
                                  : '---'}
                              </CTableDataCell>
                              <CTableDataCell className="table-inscripcion__cell">
                                <strong>{dat.estudiante}</strong>
                              </CTableDataCell>
                              <CTableDataCell className="table-inscripcion__cell">
                                {dat.telefono_estudiante}
                              </CTableDataCell>
                              <CTableDataCell className="no-print text-end table-inscripcion__cell">
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    eliminarInscripcionId(
                                      dat.id_inscripcion,
                                      idProfesorSeleccionado,
                                    )
                                  }
                                  className="inscripcion-action__button"
                                >
                                  Eliminar
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          ) : cursoAbierto ? (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={6}
                                className="bm-report-group-empty table-inscripcion__cell"
                              >
                                Sin inscripciones en este curso
                              </CTableDataCell>
                            </CTableRow>
                          ) : null}
                        </Fragment>
                      )
                    })
                  )}
                </CTableBody>
              </CTable>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  )
}

export default TablaProfesores
