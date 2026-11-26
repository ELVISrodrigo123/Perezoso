import { useState } from 'react'
import CIcon from '@coreui/icons-react'
import { cilFilter, cilSearch } from '@coreui/icons'
import Paginacion from '../../../../components/Paginacion'
import {
  CBadge,
  CButton,
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
import { SectionCard, StatusBadge, LoadingState, EmptyState } from '../../../../components'
const normalizarTexto = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const TableAccesoUsuario = ({
  rol,
  usuarios,
  cargando,
  onDarBaja,
  onHabilitar,
  usuarioParaBaja,
  cancelarBaja,
  confirmarBaja,
  accionEnProceso,
  onVolver,
  conteo,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtros,
  setFiltros,
}) => {
  const esDocente = rol === 'docente'
  const esAdministrador = rol === 'administrador'
  const [filtroAbierto, setFiltroAbierto] = useState(null)

  const obtenerNombreCompleto = (usuario) =>
    [usuario.nombre, usuario.a_paterno, usuario.a_materno].filter(Boolean).join(' ')

  const obtenerIdFila = (usuario) => {
    if (esDocente) return usuario.id_profesor
    if (esAdministrador) return usuario.id_administrador
    return usuario.id_estudiante
  }

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }))
    setPaginaActual(1)
  }

  const estadosDisponibles = ['Activo', 'Inactivo']
  const activos = conteo?.activos ?? 0
  const inactivos = conteo?.inactivos ?? 0
  const indiceInicial = (paginaActual - 1) * registrosPorPagina

  const hayFiltros = Object.entries(filtros).some(
    ([campo, valor]) => valor && !(campo === 'estado' && valor === 'Todos'),
  )

  let tipoUsuario = 'estudiantes'
  let tituloTabla = 'Estudiantes con acceso'
  if (esDocente) {
    tipoUsuario = 'docentes'
    tituloTabla = 'Docentes con acceso'
  } else if (esAdministrador) {
    tipoUsuario = 'administradores'
    tituloTabla = 'Administradores con acceso'
  }
  const totalColumnas = esAdministrador ? 8 : 9

  const renderEncabezado = (titulo, campo, tipo = 'text') => (
    <CTableHeaderCell scope="col" className="accesos-table__head">
      <div className="accesos-table__heading">
        <span>{titulo}</span>
        <button
          type="button"
          className={`accesos-table__filter-toggle${filtros[campo] ? ' is-active' : ''}`}
          onClick={() => setFiltroAbierto(filtroAbierto === campo ? null : campo)}
          aria-label={`${filtroAbierto === campo ? 'Cerrar' : 'Abrir'} filtro de ${titulo}`}
          aria-expanded={filtroAbierto === campo}
        >
          <CIcon icon={tipo === 'select' ? cilFilter : cilSearch} />
        </button>
      </div>
      {filtroAbierto === campo && (
        <div className="accesos-table__filter-control">
          {tipo === 'select' ? (
            <CFormSelect
              size="sm"
              value={filtros[campo]}
              onChange={(event) => actualizarFiltro(campo, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
            >
              <option value="Todos">Todos</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </CFormSelect>
          ) : (
            <CFormInput
              type={tipo}
              size="sm"
              value={filtros[campo]}
              onChange={(event) => actualizarFiltro(campo, event.target.value)}
              aria-label={`Filtrar por ${titulo}`}
              placeholder={`Filtrar ${titulo.toLocaleLowerCase()}`}
            />
          )}
        </div>
      )}
    </CTableHeaderCell>
  )

  return (
    <SectionCard
      actions={
        <div className="accesos-table__section-header">
          <h2 className="bm-section-card-title accesos-table__section-title">{tituloTabla}</h2>
          <div className="accesos-table__section-summary">
            <p className="bm-section-card-description mb-0">
              {activos + inactivos} {tipoUsuario} · {activos} activos · {inactivos} inactivos
            </p>
            <CButton type="button" color="secondary" variant="outline" onClick={onVolver}>
              Volver
            </CButton>
          </div>
        </div>
      }
    >
      {cargando ? (
        <LoadingState label={`Cargando ${tipoUsuario}...`} />
      ) : usuarios.length === 0 && !hayFiltros ? (
        <EmptyState
          title={`No hay ${tipoUsuario} registrados`}
          description="Los usuarios aparecerán aquí cuando estén registrados."
        />
      ) : (
        <div className="table-responsive accesos-table__wrapper">
          <CTable align="middle" hover className="accesos-table__table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" className="accesos-table__head">
                  Nro
                </CTableHeaderCell>
                {renderEncabezado('Nombre completo', 'nombre')}
                {renderEncabezado('CI', 'ci')}
                {renderEncabezado('Teléfono', 'telefono')}
                {renderEncabezado('Email', 'email')}
                {!esAdministrador &&
                  renderEncabezado(esDocente ? 'Especialidad' : 'Colegio', 'especialidadColegio')}
                {renderEncabezado('Registro', 'registro', 'date')}
                {renderEncabezado('Estado', 'estado', 'select')}
                <CTableHeaderCell scope="col" className="accesos-table__head text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {usuarios.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={totalColumnas} className="accesos-table__empty-results">
                    No se encontraron coincidencias
                  </CTableDataCell>
                </CTableRow>
              ) : (
                usuarios.map((usuario, index) => (
                  <CTableRow key={obtenerIdFila(usuario)} className="accesos-table__row">
                    <CTableDataCell className="accesos-table__cell text-body-secondary">
                      #{indiceInicial + index + 1}
                    </CTableDataCell>
                    <CTableDataCell className="accesos-table__cell">
                      <strong>{obtenerNombreCompleto(usuario)}</strong>
                      {esAdministrador && usuario.es_super && (
                        <CBadge color="warning" className="ms-2">
                          Super
                        </CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="accesos-table__cell">{usuario.ci}</CTableDataCell>
                    <CTableDataCell className="accesos-table__cell">
                      {usuario.telefono || 'Sin teléfono'}
                    </CTableDataCell>
                    <CTableDataCell className="accesos-table__cell">
                      {usuario.email || 'Sin email'}
                    </CTableDataCell>
                    {!esAdministrador && (
                      <CTableDataCell className="accesos-table__cell">
                        {(esDocente ? usuario.especialidad : usuario.colegio) || 'Sin dato'}
                      </CTableDataCell>
                    )}
                    <CTableDataCell className="accesos-table__cell">
                      {usuario.fecha_registro
                        ? new Date(usuario.fecha_registro).toLocaleDateString()
                        : '---'}
                    </CTableDataCell>
                    <CTableDataCell className="accesos-table__cell">
                      <StatusBadge status={usuario.estado || 'inactivo'}>
                        {usuario.estado || 'Sin estado'}
                      </StatusBadge>
                    </CTableDataCell>
                    <CTableDataCell className="accesos-table__cell text-end">
                      {esAdministrador && usuario.es_super ? (
                        // El super administrador no se puede dar de baja
                        <span className="text-body-secondary">—</span>
                      ) : normalizarTexto(usuario.estado) === 'activo' ? (
                        <CButton
                          type="button"
                          color="danger"
                          variant="outline"
                          onClick={() => onDarBaja(usuario, rol)}
                          className="accesos-table__action"
                          disabled={Boolean(accionEnProceso)}
                        >
                          Retirar
                        </CButton>
                      ) : (
                        <CButton
                          type="button"
                          color="success"
                          variant="outline"
                          onClick={() =>
                            onHabilitar(
                              esAdministrador ? usuario.id_administrador : usuario.id_cuenta,
                              rol,
                            )
                          }
                          className="accesos-table__action"
                          disabled={Boolean(accionEnProceso)}
                        >
                          {accionEnProceso === 'habilitar' ? (
                            <>
                              <CSpinner size="sm" className="me-1" /> Habilitando
                            </>
                          ) : (
                            'Habilitar'
                          )}
                        </CButton>
                      )}
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
            etiqueta={tipoUsuario}
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(cantidad) => {
              setRegistrosPorPagina(cantidad)
              setPaginaActual(1)
            }}
          />
        </div>
      )}

      <CModal
        visible={Boolean(usuarioParaBaja)}
        onClose={cancelarBaja}
        alignment="center"
        backdrop="static"
        aria-labelledby="accesos-baja-title"
      >
        <CModalHeader>
          <CModalTitle id="accesos-baja-title">Dar de baja</CModalTitle>
        </CModalHeader>
        <CModalBody>
          El usuario quedará inactivo y podrás habilitarlo de nuevo cuando quieras. ¿Deseas
          continuar?
        </CModalBody>
        <CModalFooter>
          <CButton type="button" color="secondary" variant="outline" onClick={cancelarBaja}>
            Cancelar
          </CButton>
          <CButton
            type="button"
            color="danger"
            onClick={confirmarBaja}
            disabled={accionEnProceso === 'baja'}
          >
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

export default TableAccesoUsuario
