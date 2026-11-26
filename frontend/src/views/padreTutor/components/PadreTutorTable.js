import {
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
import { EmptyState, LoadingState, SectionCard, StatusBadge } from '../../../components'
import Paginacion from '../../../components/Paginacion'

const PadreTutorTable = ({
  padresTutores,
  onRegistrarPadreTutor,
  seleccionarPadreTutor,
  eliminarPadreTutor,
  padreTutorParaEliminar,
  cancelarEliminacion,
  confirmarEliminacion,
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

  const obtenerNombreCompleto = (padreTutor) =>
    [
      padreTutor.nombre,
      padreTutor.apellidoPaterno ?? padreTutor.a_paterno,
      padreTutor.apellidoMaterno ?? padreTutor.a_materno,
    ]
      .filter(Boolean)
      .join(' ')

  const estadosDisponibles = ['Activo', 'Inactivo']

  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Activo')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-tutor__head">
      <div className="table-tutor__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-tutor__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-tutor__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map((estado) => (
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
        <div className="tutor-table__section-header">
          <h2 className="bm-section-card-title tutor-table__section-title">
            Familiares registrados
          </h2>
          <div className="tutor-table__section-summary">
            <p className="bm-section-card-description mb-0">
              {totalRegistros} padre{totalRegistros === 1 ? '' : 's'} o tutor
              {totalRegistros === 1 ? '' : 'es'} encontrado{totalRegistros === 1 ? '' : 's'}
            </p>
            <CButton color="primary" onClick={onRegistrarPadreTutor} className="tutor-page__cta">
              Registrar Padre o Tutor
            </CButton>
          </div>
        </div>
      }
    >
      {cargando ? (
        <LoadingState label="Cargando padres y tutores..." />
      ) : padresTutores.length === 0 && !hayFiltros ? (
        <EmptyState
          title="No hay padres o tutores registrados"
          description="Los registros que agregues aparecerán aquí."
        />
      ) : (
        <div className="table-responsive table-tutor__wrapper">
          <CTable align="middle" hover className="table-tutor__table">
            <CTableHead>
              <CTableRow>
                {renderEncabezadoFiltrable('ID', 'id', 'number')}
                {renderEncabezadoFiltrable('Nombre completo', 'nombre')}
                {renderEncabezadoFiltrable('CI', 'ci')}
                {renderEncabezadoFiltrable('Teléfono', 'telefono')}
                {renderEncabezadoFiltrable('Dirección', 'direccion')}
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="table-tutor__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {padresTutores.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="table-tutor__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                padresTutores.map((padreTutor) => (
                  <CTableRow key={padreTutor.id_tutor} className="table-tutor__row">
                    <CTableDataCell className="table-tutor__cell text-body-secondary">
                      #{padreTutor.id_tutor}
                    </CTableDataCell>
                    <CTableDataCell className="table-tutor__cell">
                      <strong>{obtenerNombreCompleto(padreTutor)}</strong>
                    </CTableDataCell>
                    <CTableDataCell className="table-tutor__cell">{padreTutor.ci}</CTableDataCell>
                    <CTableDataCell className="table-tutor__cell">
                      {padreTutor.telefono}
                    </CTableDataCell>
                    <CTableDataCell className="table-tutor__cell">
                      {padreTutor.direccion || 'Sin dirección'}
                    </CTableDataCell>
                    <CTableDataCell className="table-tutor__cell">
                      <StatusBadge status={padreTutor.estado || 'inactivo'}>
                        {padreTutor.estado || 'Sin estado'}
                      </StatusBadge>
                    </CTableDataCell>
                    <CTableDataCell className="table-tutor__cell text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="primary"
                          variant="outline"
                          onClick={() => seleccionarPadreTutor(padreTutor)}
                          className="tutor-table__action"
                        >
                          Editar
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => eliminarPadreTutor(padreTutor.id_tutor)}
                          className="tutor-table__action"
                        >
                          {padreTutor.estado === 'Activo' ? 'Eliminar' : 'Habilitar'}
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
            etiqueta="padres o tutores"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}

      <CModal
        visible={Boolean(padreTutorParaEliminar)}
        onClose={cancelarEliminacion}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Eliminar padre o tutor</CModalTitle>
        </CModalHeader>
        <CModalBody>Esta acción cambiará el estado del padre/tutor. ¿Deseas continuar?</CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={cancelarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            Cancelar
          </CButton>
          <CButton
            color="danger"
            onClick={confirmarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            {accionEnProceso === 'eliminar' ? (
              <>
                <CSpinner size="sm" className="me-1" /> Procesando
              </>
            ) : (
              'Sí, actualizar'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </SectionCard>
  )
}

export default PadreTutorTable
