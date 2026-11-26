import '../../../scss/contenedorStyles/contenedores.scss'
import '../../../scss/textoStyles/textos.scss'
import '../../../scss/formaStyles/selectStyle.scss'
import '../../../scss/formaStyles/buttonStyle.scss'
import Paginacion from '../../../components/Paginacion'
import {
  CButton,
  CButtonGroup,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
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
import { SectionCard, LoadingState, EmptyState } from '../../../components'

const PreinscripcionTable = ({
  preinscripciones,
  rechazarSolicitud,
  aceptarSolicitud,
  onVolver,
  solicitudEnProceso,
  cargando,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtrosColumna,
  setFiltrosColumna,
}) => {
  const [filtroAbierto, setFiltroAbierto] = useState(null)
  const normalizarTexto = (texto) =>
    String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const obtenerVarianteEstado = (estado) => {
    const estadoNormalizado = normalizarTexto(estado || 'pendiente')
    if (estadoNormalizado.includes('aprob')) return 'aprobada'
    if (estadoNormalizado.includes('rechaz')) return 'rechazada'
    if (estadoNormalizado.includes('pend')) return 'pendiente'
    return 'otro'
  }
  const estadosPreinscripcion = ['Pendiente', 'Rechazada']
  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Pendiente')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-preinscripcion__head-cell">
      <div className="table-preinscripcion__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-preinscripcion__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-preinscripcion__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">Todos los estados</option>
              {estadosPreinscripcion.map((estado) => (
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
            />
          )}
        </div>
      )}
    </CTableHeaderCell>
  )

  return (
    <SectionCard
      actions={
        <div className="preinscripcion-table__section-header">
          <h2 className="bm-section-card-title preinscripcion-table__section-title">
            Solicitudes recibidas
          </h2>
          <div className="preinscripcion-table__section-summary">
            <p className="bm-section-card-description mb-0">
              {totalRegistros} solicitud{totalRegistros === 1 ? '' : 'es'} encontrada
              {totalRegistros === 1 ? '' : 's'}
            </p>
            <CButton
              color="secondary"
              className="estudiante-toolbar__button estudiante-toolbar__button--secondary"
              onClick={onVolver}
            >
              ← Volver a Lista de Estudiantes
            </CButton>
          </div>
        </div>
      }
      className="preinscripcion-table__card text-body"
    >
      {cargando ? (
        <LoadingState label="Cargando preinscripciones..." />
      ) : preinscripciones.length === 0 && !hayFiltros ? (
        <EmptyState
          title="No hay preinscripciones pendientes"
          description="Las nuevas solicitudes aparecerán aquí."
        />
      ) : (
        <div className="table-responsive preinscripcion-table__wrapper">
          <CTable align="middle" hover className="table-preinscripcion__table">
            <CTableHead className="table-preinscripcion__head">
              <CTableRow>
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                {renderEncabezadoFiltrable('Solicitante', 'solicitante')}
                {renderEncabezadoFiltrable('CI', 'ci')}
                {renderEncabezadoFiltrable('Colegio', 'colegio')}
                {renderEncabezadoFiltrable('Dirección', 'direccion')}
                {renderEncabezadoFiltrable('Teléfono', 'telefono')}
                {renderEncabezadoFiltrable('Email', 'email', 'search')}
                {renderEncabezadoFiltrable('Solicitud', 'solicitud', 'date')}
                <CTableHeaderCell scope="col" className="table-preinscripcion__head-cell text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {preinscripciones.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={9} className="table-preinscripcion__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                preinscripciones.map((preIns) => (
                  <CTableRow key={preIns.id} className="table-preinscripcion__row">
                    <CTableDataCell className="table-preinscripcion__cell">
                      <span
                        className={`table-preinscripcion__status table-preinscripcion__status--${obtenerVarianteEstado(preIns.estado)}`}
                      >
                        {preIns.estado || 'Pendiente'}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell">
                      <strong>{preIns.nombre}</strong>
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell">
                      {preIns.ci}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell">
                      {preIns.colegio || 'Sin colegio'}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell bm-table-description">
                      {preIns.direccion}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell">
                      {preIns.telefono}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell bm-table-description">
                      {preIns.email}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell">
                      {new Date(preIns.fecha_solicitud).toLocaleDateString()}
                    </CTableDataCell>
                    <CTableDataCell className="table-preinscripcion__cell text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="success"
                          disabled={Boolean(solicitudEnProceso)}
                          onClick={() => aceptarSolicitud(preIns.id)}
                          className="preinscripcion-table__action"
                        >
                          {solicitudEnProceso?.id === preIns.id &&
                          solicitudEnProceso.tipo === 'aprobar' ? (
                            <>
                              <CSpinner size="sm" className="me-1" /> Procesando
                            </>
                          ) : (
                            'Aprobar'
                          )}
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          disabled={
                            Boolean(solicitudEnProceso) ||
                            obtenerVarianteEstado(preIns.estado) === 'rechazada'
                          }
                          onClick={() => rechazarSolicitud(preIns.id)}
                          className="preinscripcion-table__action"
                        >
                          {solicitudEnProceso?.id === preIns.id &&
                          solicitudEnProceso.tipo === 'rechazar' ? (
                            <>
                              <CSpinner size="sm" className="me-1" /> Procesando
                            </>
                          ) : obtenerVarianteEstado(preIns.estado) === 'rechazada' ? (
                            'Rechazada'
                          ) : (
                            'Rechazar'
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
            etiqueta="solicitudes"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}
    </SectionCard>
  )
}

export default PreinscripcionTable
