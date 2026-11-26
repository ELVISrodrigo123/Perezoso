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
import { SectionCard, StatusBadge, LoadingState, EmptyState } from '../../../components'
import Paginacion from '../../../components/Paginacion'

const ProfesorTable = ({
  profesor,
  onRegistrarProfesor,
  seleccionarProfesor,
  eliminarProfesor,
  profesorParaEliminar,
  cancelarEliminacion,
  confirmarEliminacion,
  accionEnProceso,
  cargando,
  ejecutarHabilitarUsuario,
  cargarProfesor,
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
  const estadosProfesor = ['Activo', 'Inactivo']

  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Activo')

  const actualizarFiltroColumna = (columna, valor) => {
    setFiltrosColumna((filtrosActuales) => ({ ...filtrosActuales, [columna]: valor }))
  }

  const renderEncabezadoFiltrable = (titulo, columna, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="table-profesor__head">
      <div className="table-profesor__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`table-profesor__filter-toggle${filtrosColumna[columna] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === columna ? null : columna)}
          aria-label={`${filtroAbierto === columna ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === columna}
          title={`Filtrar ${titulo}`}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === columna && (
        <div className="table-profesor__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              value={filtrosColumna[columna] || ''}
              onChange={(event) => actualizarFiltroColumna(columna, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              size="sm"
            >
              <option value="">Todos los estados</option>
              {estadosProfesor.map((estado) => (
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
        <div className="profesor-table__section-header">
          <h2 className="bm-section-card-title profesor-table__section-title">
            Profesores registrados
          </h2>
          <div className="profesor-table__section-summary">
            <p className="bm-section-card-description mb-0">
              {totalRegistros} profesor{totalRegistros === 1 ? '' : 'es'} encontrado
              {totalRegistros === 1 ? '' : 's'}
            </p>
            <CButton color="primary" onClick={onRegistrarProfesor} className="profesores-page__cta">
              Registrar Profesor
            </CButton>
          </div>
        </div>
      }
    >
      {cargando ? (
        <LoadingState label="Cargando profesores..." />
      ) : profesor.length === 0 && !hayFiltros ? (
        <EmptyState
          title="No hay profesores registrados"
          description="Los profesores que agregues aparecerán aquí."
        />
      ) : (
        <div className="table-responsive table-profesor__wrapper">
          <CTable align="middle" hover className="table-profesor__table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" className="table-profesor__head">
                  Nro
                </CTableHeaderCell>
                {renderEncabezadoFiltrable('Profesor', 'profesor')}
                {renderEncabezadoFiltrable('CI', 'ci')}
                {renderEncabezadoFiltrable('Teléfono', 'telefono')}
                {renderEncabezadoFiltrable('Email', 'email', 'search')}
                {renderEncabezadoFiltrable('Especialidad', 'especialidad')}
                {renderEncabezadoFiltrable('Registro', 'registro', 'date')}
                {renderEncabezadoFiltrable('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="table-profesor__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {profesor.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={9} className="table-profesor__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                profesor.map((profe, index) => (
                  <CTableRow key={profe.id_profesor} className="table-profesor__row">
                    <CTableDataCell className="table-profesor__cell text-body-secondary">
                      #{(paginaActual - 1) * registrosPorPagina + index + 1}
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      <strong>
                        {profe.nombre} {profe.a_paterno} {profe.a_materno}
                      </strong>
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">{profe.ci}</CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      {profe.telefono}
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      {profe.email || 'Sin email'}
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      {profe.especialidad || 'Sin especialidad'}
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      {profe.fecha_registro
                        ? new Date(profe.fecha_registro).toLocaleDateString()
                        : '---'}
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell">
                      <StatusBadge status={profe.estado || 'inactivo'}>
                        {profe.estado || 'Sin estado'}
                      </StatusBadge>
                    </CTableDataCell>
                    <CTableDataCell className="table-profesor__cell text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="primary"
                          variant="outline"
                          onClick={() => seleccionarProfesor(profe)}
                          className="profesor-table__action"
                        >
                          Editar
                        </CButton>
                        {profe.estado === 'Activo' ? (
                          <CButton
                            color="danger"
                            variant="outline"
                            onClick={() => eliminarProfesor(profe.id_profesor)}
                            className="profesor-table__action"
                          >
                            Eliminar
                          </CButton>
                        ) : (
                          <CButton
                            color="danger"
                            variant="outline"
                            onClick={async () => {
                              ejecutarHabilitarUsuario(profe.id_cuenta, 'profesor')
                              await cargarProfesor()
                            }}
                            className="profesor-table__action"
                          >
                            Habilitar
                          </CButton>
                        )}
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
            etiqueta="profesores"
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}
      <CModal
        visible={Boolean(profesorParaEliminar)}
        onClose={cancelarEliminacion}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Eliminar profesor</CModalTitle>
        </CModalHeader>
        <CModalBody>Esta acción eliminará el registro del profesor. ¿Deseas continuar?</CModalBody>
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
              'Sí, eliminar'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </SectionCard>
  )
}

export default ProfesorTable
