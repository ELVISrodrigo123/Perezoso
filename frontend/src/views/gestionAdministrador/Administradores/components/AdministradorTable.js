import {
  CBadge,
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
import { useState } from 'react'
import { SectionCard, StatusBadge, LoadingState, EmptyState } from '../../../../components'
import Paginacion from '../../../../components/Paginacion'

const AdministradorTable = ({
  administradores,
  onRegistrarAdministrador,
  seleccionarAdministrador,
  solicitarBaja,
  administradorParaBaja,
  cancelarBaja,
  confirmarBaja,
  activarAdministradorPorId,
  accionEnProceso,
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

  const obtenerNombreCompleto = (admin) =>
    [admin.nombre, admin.a_paterno, admin.a_materno].filter(Boolean).join(' ')

  const estadosAdministrador = ['Activo', 'Inactivo']

  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Activo')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-administrador__head">
      <div className="table-administrador__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-administrador__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-administrador__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">Todos los estados</option>
              {estadosAdministrador.map((estado) => (
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
        <div className="administrador-table__section-header">
          <h2 className="bm-section-card-title administrador-table__section-title">
            Administradores registrados
          </h2>
          <div className="administrador-table__section-summary">
            <p className="bm-section-card-description mb-0">
              {totalRegistros} administrador{totalRegistros === 1 ? '' : 'es'} encontrado
              {totalRegistros === 1 ? '' : 's'}
            </p>
            <CButton
              color="primary"
              onClick={onRegistrarAdministrador}
              className="administradores-page__cta"
            >
              Registrar Administrador
            </CButton>
          </div>
        </div>
      }
    >
      {cargando ? (
        <LoadingState label="Cargando administradores..." />
      ) : administradores.length === 0 && !hayFiltros ? (
        <EmptyState
          title="No hay administradores registrados"
          description="Los administradores que agregues aparecerán aquí."
        />
      ) : (
        <div className="table-responsive table-administrador__wrapper">
          <CTable align="middle" hover className="table-administrador__table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" className="table-administrador__head">
                  Nro
                </CTableHeaderCell>
                {renderEncabezadoFiltrable('Administrador', 'administrador')}
                {renderEncabezadoFiltrable('CI', 'ci')}
                {renderEncabezadoFiltrable('Teléfono', 'telefono')}
                {renderEncabezadoFiltrable('Email', 'email', 'search')}
                {renderEncabezadoFiltrable('Registro', 'registro', 'date')}
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="table-administrador__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {administradores.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="table-administrador__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                administradores.map((admin, index) => (
                  <CTableRow key={admin.id_administrador} className="table-administrador__row">
                    <CTableDataCell className="table-administrador__cell text-body-secondary">
                      #{(paginaActual - 1) * registrosPorPagina + index + 1}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      <strong>{obtenerNombreCompleto(admin)}</strong>
                      {admin.es_super && (
                        <CBadge color="warning" className="ms-2">
                          Super
                        </CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      {admin.ci}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      {admin.telefono || 'Sin teléfono'}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      {admin.email || 'Sin email'}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      {admin.fecha_registro
                        ? new Date(admin.fecha_registro).toLocaleDateString()
                        : '---'}
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell">
                      <StatusBadge status={admin.estado || 'inactivo'}>
                        {admin.estado || 'Sin estado'}
                      </StatusBadge>
                    </CTableDataCell>
                    <CTableDataCell className="table-administrador__cell text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="primary"
                          variant="outline"
                          onClick={() => seleccionarAdministrador(admin)}
                          disabled={Boolean(accionEnProceso)}
                          className="administrador-table__action"
                        >
                          Editar
                        </CButton>
                        {/* El super administrador no se puede dar de baja */}
                        {!admin.es_super &&
                          (admin.estado === 'Activo' ? (
                            <CButton
                              color="danger"
                              variant="outline"
                              onClick={() => solicitarBaja(admin.id_administrador)}
                              disabled={Boolean(accionEnProceso)}
                              className="administrador-table__action"
                            >
                              Dar de baja
                            </CButton>
                          ) : (
                            <CButton
                              color="success"
                              variant="outline"
                              onClick={() => activarAdministradorPorId(admin.id_administrador)}
                              disabled={Boolean(accionEnProceso)}
                              className="administrador-table__action"
                            >
                              Activar
                            </CButton>
                          ))}
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
            etiqueta="administradores"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}
      <CModal visible={Boolean(administradorParaBaja)} onClose={cancelarBaja} alignment="center">
        <CModalHeader>
          <CModalTitle>Dar de baja administrador</CModalTitle>
        </CModalHeader>
        <CModalBody>
          El administrador quedará inactivo y no podrá ingresar al sistema. Podrás activarlo de
          nuevo cuando quieras. ¿Deseas continuar?
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={cancelarBaja}
            disabled={Boolean(accionEnProceso)}
          >
            Cancelar
          </CButton>
          <CButton color="danger" onClick={confirmarBaja} disabled={Boolean(accionEnProceso)}>
            {accionEnProceso === 'baja' ? (
              <>
                <CSpinner size="sm" className="me-1" /> Procesando
              </>
            ) : (
              'Sí, dar de baja'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </SectionCard>
  )
}

export default AdministradorTable
