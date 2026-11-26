import { useEffect, useState } from 'react'
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { SectionCard } from '../../../components'
import Paginacion from '../../../components/Paginacion'

const obtenerDuracionTexto = (duracion) => {
  if (!duracion) return 'N/A'

  if (duracion.hours) return `${duracion.hours} horas`
  if (duracion.days) return `${duracion.days} días`
  if (duracion.weeks) return `${duracion.weeks} semanas`
  if (duracion.months) return `${duracion.months} meses`

  return 'N/A'
}

const TablaInscripciones = ({
  inscripciones,
  eliminarInscripcionId,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtrosColumna,
  setFiltrosColumna,
}) => {
  const filas = inscripciones || []
  const [filtroAbierto, setFiltroAbierto] = useState(null)
  const hayFiltros = Object.values(filtrosColumna).some(Boolean)
  const tieneDatosOriginales = filas.length > 0 || hayFiltros

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
            ) : tipo === 'number' ? (
              <input
                type="number"
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

  return (
    <div className="inscripcion-reporte__wrapper">
      <SectionCard
        title="Reporte de inscripciones"
        description={`Actualizado el ${new Date().toLocaleDateString()}`}
        className="inscripcion-table__card text-body"
      >
        {!tieneDatosOriginales ? (
          <div className="bm-table-empty inscripcion-table__empty">
            <strong>No hay inscripciones registradas</strong>
            <span>Las inscripciones aparecerán aquí cuando se registren.</span>
          </div>
        ) : (
          <div className="table-responsive inscripcion-table__wrapper">
            <CTable align="middle" hover className="table-inscripcion__table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col" className="no-print table-inscripcion__head-cell">
                    ID
                  </CTableHeaderCell>
                  {renderFilterHeader('inscripcion', 'Inscripción', 'date')}
                  {renderFilterHeader('estudiante', 'Estudiante')}
                  {renderFilterHeader('curso', 'Curso')}
                  {renderFilterHeader('profesor', 'Profesor')}
                  {renderFilterHeader('duracion', 'Duración')}
                  {renderFilterHeader('costo', 'Costo', 'number')}
                  <CTableHeaderCell
                    scope="col"
                    className="no-print text-end table-inscripcion__head-cell"
                  >
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filas.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="table-inscripcion__empty-results">
                      No se encontraron resultados
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filas.map((ins, index) => (
                    <CTableRow key={ins.id_inscripcion} className="table-inscripcion__row">
                      <CTableDataCell className="no-print text-body-secondary table-inscripcion__cell">
                        #{(paginaActual - 1) * registrosPorPagina + index + 1}
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        {new Date(ins.fecha_inscripcion).toLocaleDateString()}
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        <strong>{ins.estudiante}</strong>
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        {ins.curso}
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        {ins.profesor}
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        {obtenerDuracionTexto(ins.duracion)}
                      </CTableDataCell>
                      <CTableDataCell className="table-inscripcion__cell">
                        {ins.costo ? `Bs. ${ins.costo}` : 'Sin costo'}
                      </CTableDataCell>
                      <CTableDataCell className="no-print text-end table-inscripcion__cell">
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarInscripcionId(ins.id_inscripcion)}
                          className="inscripcion-action__button"
                        >
                          Eliminar
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
            <Paginacion
              page={paginaActual}
              limit={registrosPorPagina}
              total={totalRegistros}
              totalPaginas={totalPaginas}
              etiqueta="inscripciones"
              onCambiarPagina={setPaginaActual}
              onCambiarLimite={(cantidad) => {
                setRegistrosPorPagina(cantidad)
                setPaginaActual(1)
              }}
            />
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default TablaInscripciones
