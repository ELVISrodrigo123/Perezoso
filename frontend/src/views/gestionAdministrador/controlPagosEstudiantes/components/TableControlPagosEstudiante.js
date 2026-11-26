import {
  CAlert,
  CButton,
  CButtonGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilSearch } from '@coreui/icons'
import { useEffect, useState } from 'react'
import { SectionCard, StatusBadge } from '../../../../components'
import Paginacion from '../../../../components/Paginacion'

const TableControlPagosEstudiante = ({
  listaEstudiantesNoPagados,
  padresTutores,
  estudiantes,
  marcarInscripcionComoPagada,
  pagoEnProceso,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtrosColumna,
  setFiltrosColumna,
}) => {
  const pagosPendientes = listaEstudiantesNoPagados ?? []
  const [tutorSeleccionado, setTutorSeleccionado] = useState(null)
  const [filtroAbierto, setFiltroAbierto] = useState(null)
  const estadosPago = ['PENDIENTE']

  // true si hay algún filtro puesto aparte del estado por defecto
  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'PENDIENTE')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-pago__head">
      <div className="table-pago__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-pago__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-pago__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">Todos los estados</option>
              {estadosPago.map((estado) => (
                <option key={estado} value={estado}>
                  {String(estado).charAt(0).toLocaleUpperCase() + String(estado).slice(1)}
                </option>
              ))}
            </CFormSelect>
          ) : (
            <CFormInput
              type={tipo}
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              placeholder={`Filtrar ${titulo.toLocaleLowerCase()}`}
              size="sm"
              step={tipo === 'number' ? 'any' : undefined}
            />
          )}
        </div>
      )}
    </CTableHeaderCell>
  )

  const obtenerTutor = (estudiante) => {
    const tutorIncluido = estudiante.tutor || estudiante.padreTutor || estudiante.padre_tutor
    if (tutorIncluido) return tutorIncluido

    const estudianteRegistrado = estudiantes.find(
      (item) => String(item.id_estudiante) === String(estudiante.id_estudiante),
    )
    const idTutor =
      estudiante.idTutor ||
      estudiante.id_tutor ||
      estudianteRegistrado?.idTutor ||
      estudianteRegistrado?.id_tutor
    return padresTutores.find(
      (padreTutor) => String(padreTutor.id_tutor || padreTutor.idTutor) === String(idTutor),
    )
  }

  const abrirTutor = (estudiante) => {
    setTutorSeleccionado(obtenerTutor(estudiante) || { noAsignado: true })
  }

  return (
    <SectionCard
      title="Pagos pendientes"
      description={`${totalRegistros} inscripción${totalRegistros === 1 ? '' : 'es'} pendiente${totalRegistros === 1 ? '' : 's'}`}
      className="pagos-card__wrapper text-body"
    >
      {pagosPendientes.length === 0 && !hayFiltros ? (
        <div className="bm-table-empty pagos-table__empty">
          <strong>No hay pagos pendientes</strong>
          <span>Las inscripciones pendientes de pago aparecerán aquí.</span>
        </div>
      ) : (
        <div className="table-responsive table-pago__wrapper">
          <CTable align="middle" hover className="table-pago__table">
            <CTableHead color="dark">
              <CTableRow>
                {renderEncabezadoFiltrable('Inscripción', 'inscripcion', 'date')}
                {renderEncabezadoFiltrable('Estudiante', 'estudiante')}
                {renderEncabezadoFiltrable('CI', 'ci', 'number')}
                {renderEncabezadoFiltrable('Dirección', 'direccion')}
                {renderEncabezadoFiltrable('Teléfono', 'telefono', 'search')}
                {renderEncabezadoFiltrable('Curso', 'curso')}
                {renderEncabezadoFiltrable('Costo', 'costo', 'number')}
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="table-pago__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {pagosPendientes.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={9} className="table-pago__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                pagosPendientes.map((noPagado) => (
                  <CTableRow key={noPagado.id_inscripcion} className="table-pago__row">
                    <CTableDataCell className="table-pago__cell">
                      {new Date(noPagado.fecha_inscripcion).toLocaleDateString()}
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">
                      <strong>{noPagado.estudiante}</strong>
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">{noPagado.ci}</CTableDataCell>

                    <CTableDataCell className="table-pago__cell bm-table-description">
                      {noPagado.direccion}
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">
                      {noPagado.telefono}
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">
                      {noPagado.curso || noPagado.materia}
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">
                      Bs. {noPagado.costo}
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell">
                      <StatusBadge status={noPagado.estado_pago || 'pendiente'}>
                        {noPagado.estado_pago || 'Pendiente'}
                      </StatusBadge>
                    </CTableDataCell>

                    <CTableDataCell className="table-pago__cell text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="info"
                          variant="outline"
                          onClick={() => abrirTutor(noPagado)}
                          disabled={Boolean(pagoEnProceso)}
                          className="pago-table__action"
                        >
                          Ver tutor
                        </CButton>
                        <CButton
                          color="success"
                          disabled={Boolean(pagoEnProceso)}
                          onClick={() =>
                            marcarInscripcionComoPagada(noPagado, obtenerTutor(noPagado))
                          }
                          className="pago-table__action"
                        >
                          {pagoEnProceso === noPagado.id_inscripcion ? (
                            <>
                              <CSpinner size="sm" className="me-1" /> Procesando
                            </>
                          ) : (
                            'Pagar'
                          )}
                        </CButton>
                      </CButtonGroup>
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
            etiqueta="pagos pendientes"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}
      <CModal
        visible={Boolean(tutorSeleccionado)}
        onClose={() => setTutorSeleccionado(null)}
        alignment="center"
      >
        <CModalHeader closeButton>
          <CModalTitle>Datos del padre o tutor</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {tutorSeleccionado?.noAsignado ? (
            <CAlert color="warning" className="mb-0">
              Este estudiante no tiene un padre o tutor asignado.
            </CAlert>
          ) : (
            <dl className="row mb-0">
              <dt className="col-sm-4">Nombre completo</dt>
              <dd className="col-sm-8">
                {[
                  tutorSeleccionado?.nombre,
                  tutorSeleccionado?.apellidoPaterno || tutorSeleccionado?.a_paterno,
                  tutorSeleccionado?.apellidoMaterno || tutorSeleccionado?.a_materno,
                ]
                  .filter(Boolean)
                  .join(' ') || 'Sin información'}
              </dd>
              <dt className="col-sm-4">CI</dt>
              <dd className="col-sm-8">{tutorSeleccionado?.ci || 'Sin información'}</dd>
              <dt className="col-sm-4">Teléfono</dt>
              <dd className="col-sm-8">{tutorSeleccionado?.telefono || 'Sin información'}</dd>
              <dt className="col-sm-4">Dirección</dt>
              <dd className="col-sm-8">{tutorSeleccionado?.direccion || 'Sin información'}</dd>
            </dl>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setTutorSeleccionado(null)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>
    </SectionCard>
  )
}

export default TableControlPagosEstudiante
