import { useCallback, useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import {
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { EmptyState, LoadingState, SectionCard, StatusBadge } from '../../../../components'
import Paginacion from '../../../../components/Paginacion'
import {
  buscarUsuariosAcceso,
  getRoles,
} from '../../../../services/gestionAdministrador/accesosService'
import { errorDeApi } from '../utils/catalogoPermisos'
import AccesoUsuarioModal from './AccesoUsuarioModal'
import RolesChips from './RolesChips'

const UsuariosAccesoPanel = () => {
  const [buscar, setBuscar] = useState('')
  const [buscarAplicado, setBuscarAplicado] = useState('')
  const [rol, setRol] = useState('')
  const [roles, setRoles] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [paginacion, setPaginacion] = useState({ page: 1, limit: 10, total: 0, totalPaginas: 1 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [usuarioAbierto, setUsuarioAbierto] = useState(null)

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscarAplicado(buscar.trim())
      setPaginacion((actual) => ({ ...actual, page: 1 }))
    }, 350)
    return () => clearTimeout(temporizador)
  }, [buscar])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const respuesta = await buscarUsuariosAcceso({
        buscar: buscarAplicado,
        rol,
        page: paginacion.page,
        limit: paginacion.limit,
      })
      setUsuarios(respuesta.datos)
      setPaginacion((actual) => ({
        ...actual,
        total: respuesta.paginacion.total,
        totalPaginas: respuesta.paginacion.totalPaginas,
      }))
    } catch (err) {
      setError(errorDeApi(err, 'No se pudieron cargar los usuarios.'))
    } finally {
      setCargando(false)
    }
  }, [buscarAplicado, rol, paginacion.page, paginacion.limit])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <SectionCard
      title="Usuarios"
      description="Asigna roles y personaliza qué puede ver y hacer cada usuario."
    >
      <CRow className="g-2 mb-3">
        <CCol xs={12} md={8}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Buscar por nombre, CI, email o rol"
              value={buscar}
              onChange={(event) => setBuscar(event.target.value)}
              aria-label="Buscar usuarios"
            />
          </CInputGroup>
        </CCol>
        <CCol xs={12} md={4}>
          <CFormSelect
            value={rol}
            aria-label="Filtrar por rol"
            onChange={(event) => {
              setRol(event.target.value)
              setPaginacion((actual) => ({ ...actual, page: 1 }))
            }}
          >
            <option value="">Todos los roles</option>
            {roles.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </CFormSelect>
        </CCol>
      </CRow>

      {error && <CAlert color="danger">{error}</CAlert>}

      {cargando && usuarios.length === 0 ? (
        <LoadingState label="Buscando usuarios..." />
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="No hay usuarios para mostrar"
          description="Prueba con otro texto o quita el filtro de rol."
        />
      ) : (
        <div className="table-responsive">
          <CTable hover align="middle" className="mb-0">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">Nombre</CTableHeaderCell>
                <CTableHeaderCell scope="col" className="d-none d-md-table-cell">
                  CI
                </CTableHeaderCell>
                <CTableHeaderCell scope="col" className="d-none d-lg-table-cell">
                  Email
                </CTableHeaderCell>
                <CTableHeaderCell scope="col">Roles</CTableHeaderCell>
                <CTableHeaderCell scope="col">Estado</CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-end">
                  Acciones
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {usuarios.map((usuario) => (
                <CTableRow key={usuario.id_usuarios}>
                  <CTableDataCell>
                    <div className="fw-semibold">{usuario.nombre || 'Sin ficha'}</div>
                    <small className="text-body-secondary d-lg-none">{usuario.email}</small>
                  </CTableDataCell>
                  <CTableDataCell className="d-none d-md-table-cell">
                    {usuario.ci || '—'}
                  </CTableDataCell>
                  <CTableDataCell className="d-none d-lg-table-cell">
                    {usuario.email}
                  </CTableDataCell>
                  <CTableDataCell>
                    <RolesChips roles={usuario.roles} esSuper={usuario.es_super} />
                  </CTableDataCell>
                  <CTableDataCell>
                    <StatusBadge status={usuario.estado} />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CButton
                      size="sm"
                      color="primary"
                      variant="outline"
                      onClick={() => setUsuarioAbierto(usuario.id_usuarios)}
                    >
                      Accesos
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </div>
      )}

      <Paginacion
        page={paginacion.page}
        limit={paginacion.limit}
        total={paginacion.total}
        totalPaginas={paginacion.totalPaginas}
        etiqueta="usuarios"
        onCambiarPagina={(page) => setPaginacion((actual) => ({ ...actual, page }))}
        onCambiarLimite={(limit) => setPaginacion((actual) => ({ ...actual, limit, page: 1 }))}
      />

      <AccesoUsuarioModal
        idUsuario={usuarioAbierto}
        visible={usuarioAbierto !== null}
        onClose={() => setUsuarioAbierto(null)}
        onGuardado={cargar}
      />
    </SectionCard>
  )
}

export default UsuariosAccesoPanel
