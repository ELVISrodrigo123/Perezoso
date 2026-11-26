import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilX } from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CListGroup,
  CListGroupItem,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CSpinner,
} from '@coreui/react'
import { LoadingState, StatusBadge } from '../../../../components'
import {
  cambiarSuperAdministrador,
  getAccesoUsuario,
  getCatalogoPermisos,
  getRoles,
  guardarPersonalizaciones,
  guardarRolesUsuario,
  restablecerPersonalizaciones,
} from '../../../../services/gestionAdministrador/accesosService'
import { COLORES_ROL, etiquetaDeRol, obtenerUsuario } from '../../../utils/usuario'
import { agruparMenuPorSeccion, iconoDeMenu } from '../../../utils/iconosMenu'
import { agruparCatalogo, errorDeApi, textoDePermiso } from '../utils/catalogoPermisos'

const ROLES_CON_FICHA = ['profesor', 'estudiante']
const ETIQUETA_FICHA = { profesor: 'Ficha de profesor', estudiante: 'Ficha de estudiante' }
const ESTADOS = [
  { valor: 'inherit', texto: 'Heredado del rol', color: 'secondary' },
  { valor: 'allow', texto: 'Permitir', color: 'success' },
  { valor: 'deny', texto: 'Denegar', color: 'danger' },
]

const fichaVacia = (rol, sugerencia) => ({
  nombre: sugerencia?.nombre || '',
  apellidoPaterno: sugerencia?.apellidoPaterno || '',
  apellidoMaterno: sugerencia?.apellidoMaterno || '',
  ci: sugerencia?.ci || '',
  telefono: sugerencia?.telefono || '',
  ...(rol === 'profesor' ? { especialidad: '' } : { colegio: '' }),
})

const sugerenciaDesdeDetalle = (detalle) => {
  const base = ['administrador', 'profesor', 'estudiante']
    .map((tipo) => detalle?.fichas?.[tipo])
    .find(Boolean)
  return base
    ? {
        nombre: base.nombre,
        apellidoPaterno: base.a_paterno,
        apellidoMaterno: base.a_materno,
        ci: base.ci,
        telefono: base.telefono,
      }
    : null
}

const nombreDelDetalle = (detalle) => {
  const base = ['administrador', 'profesor', 'estudiante']
    .map((tipo) => detalle?.fichas?.[tipo])
    .find(Boolean)
  return base ? [base.nombre, base.a_paterno, base.a_materno].filter(Boolean).join(' ') : ''
}

const AccesoUsuarioModal = ({ idUsuario, visible, onClose, onGuardado }) => {
  const [detalle, setDetalle] = useState(null)
  const [catalogo, setCatalogo] = useState([])
  const [roles, setRoles] = useState([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [pestana, setPestana] = useState('roles')
  const [rolesElegidos, setRolesElegidos] = useState([])
  const [fichas, setFichas] = useState({})
  const [personalizaciones, setPersonalizaciones] = useState({})
  const esUnoMismo = Number(obtenerUsuario()?.id) === Number(idUsuario)

  const aplicarDetalle = useCallback((datos) => {
    setDetalle(datos)
    setRolesElegidos(datos.roles.filter((rol) => rol !== 'super_administrador'))
    setPersonalizaciones(
      Object.fromEntries(datos.personalizaciones.map((item) => [item.code, item.effect])),
    )
    setFichas({})
  }, [])

  useEffect(() => {
    if (!visible || !idUsuario) return undefined
    let activo = true
    setCargando(true)
    setMensaje(null)
    setPestana('roles')
    Promise.all([getAccesoUsuario(idUsuario), getCatalogoPermisos(), getRoles()])
      .then(([datos, permisos, listaRoles]) => {
        if (!activo) return
        aplicarDetalle(datos)
        setCatalogo(permisos)
        setRoles(listaRoles)
      })
      .catch((error) => {
        if (activo) {
          setMensaje({ color: 'danger', texto: errorDeApi(error, 'No se pudo cargar el usuario.') })
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [visible, idUsuario, aplicarDetalle])

  const grupos = useMemo(() => agruparCatalogo(catalogo), [catalogo])
  const heredados = useMemo(() => new Set(detalle?.permisosHeredados || []), [detalle])
  const rolesAsignables = roles.filter(
    (rol) =>
      rol.code !== 'super_administrador' &&
      !rolesElegidos.includes(rol.code) &&
      rol.status === 'activo',
  )

  const fichasFaltantes = rolesElegidos.filter(
    (rol) => ROLES_CON_FICHA.includes(rol) && detalle && !detalle.fichas[rol],
  )

  const efectivosPrevistos = useMemo(() => {
    if (!detalle) return []
    if (detalle.esSuper) return catalogo.map((permiso) => permiso.code)
    return catalogo
      .map((permiso) => permiso.code)
      .filter((code) => {
        const efecto = personalizaciones[code]
        if (efecto === 'deny') return false
        if (efecto === 'allow') return true
        return heredados.has(code)
      })
  }, [detalle, catalogo, personalizaciones, heredados])

  const menuPrevisto = useMemo(() => {
    const efectivos = new Set(efectivosPrevistos)
    return agruparMenuPorSeccion(
      catalogo.filter((permiso) => permiso.type === 'menu' && efectivos.has(permiso.code)),
    )
  }, [catalogo, efectivosPrevistos])

  const quitarRol = (codigo) => setRolesElegidos((actuales) => actuales.filter((r) => r !== codigo))

  const agregarRol = (codigo) => {
    setRolesElegidos((actuales) => [...actuales, codigo])
    if (ROLES_CON_FICHA.includes(codigo) && !detalle.fichas[codigo]) {
      setFichas((actuales) => ({
        ...actuales,
        [codigo]: actuales[codigo] || fichaVacia(codigo, sugerenciaDesdeDetalle(detalle)),
      }))
    }
  }

  const cambiarFicha = (rol, campo, valor) =>
    setFichas((actuales) => ({ ...actuales, [rol]: { ...actuales[rol], [campo]: valor } }))

  const ejecutar = async (clave, accion, exito) => {
    setGuardando(clave)
    setMensaje(null)
    try {
      const respuesta = await accion()
      if (respuesta?.idUsuario) aplicarDetalle(respuesta)
      setMensaje({ color: 'success', texto: respuesta?.message || exito })
      onGuardado?.()
    } catch (error) {
      const datos = error?.response?.data
      if (datos?.error === 'ficha_requerida') {
        setFichas((actuales) => {
          const siguientes = { ...actuales }
          datos.faltantes.forEach((rol) => {
            siguientes[rol] = siguientes[rol] || fichaVacia(rol, datos.sugerencia)
          })
          return siguientes
        })
      }
      setMensaje({ color: 'danger', texto: errorDeApi(error, 'No se pudo guardar.') })
    } finally {
      setGuardando(null)
    }
  }

  const guardarRoles = () =>
    ejecutar(
      'roles',
      () =>
        guardarRolesUsuario(
          idUsuario,
          rolesElegidos,
          Object.fromEntries(fichasFaltantes.map((rol) => [rol, fichas[rol]])),
        ),
      'Roles actualizados',
    )

  const guardarPermisos = () =>
    ejecutar(
      'permisos',
      () =>
        guardarPersonalizaciones(
          idUsuario,
          Object.entries(personalizaciones).map(([code, effect]) => ({ code, effect })),
        ),
      'Permisos guardados',
    )

  const restablecer = () =>
    ejecutar('restablecer', () => restablecerPersonalizaciones(idUsuario), 'Permisos restablecidos')

  const alternarSuper = (valor) =>
    ejecutar('super', () => cambiarSuperAdministrador(idUsuario, valor), 'Actualizado')

  const cambiarEstado = (code, valor) =>
    setPersonalizaciones((actuales) => {
      const siguientes = { ...actuales }
      if (valor === 'inherit') delete siguientes[code]
      else siguientes[code] = valor
      return siguientes
    })

  const filaPermiso = (permiso, esMenu) => {
    const estado = personalizaciones[permiso.code] || 'inherit'
    const efectivo = efectivosPrevistos.includes(permiso.code)
    return (
      <div
        key={permiso.code}
        className={`acceso-permiso ${esMenu ? 'acceso-permiso--menu' : 'acceso-permiso--accion'}`}
      >
        <div className="acceso-permiso__texto">
          <span className={esMenu ? 'fw-semibold' : ''}>{textoDePermiso(permiso)}</span>
          <small className="text-body-secondary d-block">
            {heredados.has(permiso.code) ? 'El rol lo concede' : 'Ningún rol lo concede'} ·{' '}
            {efectivo ? 'Tendrá acceso' : 'Sin acceso'}
          </small>
        </div>
        <CButtonGroup size="sm" role="group" aria-label={`Estado de ${textoDePermiso(permiso)}`}>
          {ESTADOS.map((opcion) => (
            <CButton
              key={opcion.valor}
              color={opcion.color}
              variant={estado === opcion.valor ? undefined : 'outline'}
              disabled={detalle?.esSuper}
              onClick={() => cambiarEstado(permiso.code, opcion.valor)}
            >
              {opcion.texto}
            </CButton>
          ))}
        </CButtonGroup>
      </div>
    )
  }

  const nombre = nombreDelDetalle(detalle)

  return (
    <CModal visible={visible} onClose={onClose} size="xl" scrollable alignment="center">
      <CModalHeader>
        <CModalTitle>Accesos {nombre ? `de ${nombre}` : 'del usuario'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {cargando && <LoadingState label="Cargando accesos..." />}
        {!cargando && detalle && (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="text-body-secondary small">{detalle.email}</span>
              <StatusBadge status={detalle.estado} />
              {detalle.esSuper && <CBadge color="warning">Super administrador</CBadge>}
            </div>
            {mensaje && (
              <CAlert color={mensaje.color} dismissible onClose={() => setMensaje(null)}>
                {mensaje.texto}
              </CAlert>
            )}
            <CNav variant="underline-border" className="mb-3">
              {[
                ['roles', 'Roles'],
                ['permisos', 'Permisos'],
                ['menu', 'Vista previa del menú'],
              ].map(([clave, texto]) => (
                <CNavItem key={clave}>
                  <CNavLink
                    as="button"
                    type="button"
                    active={pestana === clave}
                    onClick={() => setPestana(clave)}
                  >
                    {texto}
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>

            {pestana === 'roles' && (
              <>
                <CFormLabel className="fw-semibold">Roles asignados</CFormLabel>
                <div className="bm-roles-chips mb-3">
                  {rolesElegidos.length === 0 && (
                    <span className="text-body-secondary small">Sin roles asignados.</span>
                  )}
                  {rolesElegidos.map((rol) => {
                    const bloqueado = rol === 'administrador' && detalle.esSuper
                    return (
                      <CBadge
                        key={rol}
                        color={COLORES_ROL[rol] || 'secondary'}
                        shape="rounded-pill"
                        className="acceso-chip"
                      >
                        {etiquetaDeRol(rol)}
                        {!bloqueado && (
                          <button
                            type="button"
                            className="acceso-chip__quitar"
                            aria-label={`Quitar ${etiquetaDeRol(rol)}`}
                            onClick={() => quitarRol(rol)}
                          >
                            <CIcon icon={cilX} size="sm" />
                          </button>
                        )}
                      </CBadge>
                    )
                  })}
                </div>
                {rolesAsignables.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <span className="small text-body-secondary">Agregar:</span>
                    {rolesAsignables.map((rol) => (
                      <CButton
                        key={rol.code}
                        size="sm"
                        color="primary"
                        variant="outline"
                        onClick={() => agregarRol(rol.code)}
                      >
                        <CIcon icon={cilPlus} size="sm" className="me-1" />
                        {rol.name}
                      </CButton>
                    ))}
                  </div>
                )}

                {fichasFaltantes.map((rol) => (
                  <div key={rol} className="acceso-ficha mb-3">
                    <CAlert color="warning" className="mb-3">
                      Este usuario no tiene {ETIQUETA_FICHA[rol].toLowerCase()}. Completa los datos
                      mínimos para asignarle el rol.
                    </CAlert>
                    <h3 className="h6">{ETIQUETA_FICHA[rol]}</h3>
                    <CRow className="g-2">
                      {[
                        ['nombre', 'Nombre *'],
                        ['apellidoPaterno', 'Apellido paterno *'],
                        ['apellidoMaterno', 'Apellido materno'],
                        ['ci', 'CI *'],
                        ['telefono', 'Teléfono'],
                        rol === 'profesor'
                          ? ['especialidad', 'Especialidad']
                          : ['colegio', 'Colegio'],
                      ].map(([campo, etiqueta]) => (
                        <CCol key={campo} xs={12} md={6} lg={4}>
                          <CFormLabel className="small mb-1">{etiqueta}</CFormLabel>
                          <CFormInput
                            size="sm"
                            value={fichas[rol]?.[campo] ?? ''}
                            onChange={(event) => cambiarFicha(rol, campo, event.target.value)}
                          />
                        </CCol>
                      ))}
                    </CRow>
                  </div>
                ))}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  {detalle.fichas.administrador ? (
                    <CFormSwitch
                      id={`super-${idUsuario}`}
                      label="Super administrador"
                      checked={detalle.esSuper}
                      disabled={guardando !== null || (detalle.esSuper && esUnoMismo)}
                      onChange={(event) => alternarSuper(event.target.checked)}
                    />
                  ) : (
                    <span />
                  )}
                  <CButton color="primary" disabled={guardando !== null} onClick={guardarRoles}>
                    {guardando === 'roles' && <CSpinner size="sm" className="me-2" />}
                    Guardar roles
                  </CButton>
                </div>
              </>
            )}

            {pestana === 'permisos' && (
              <>
                {detalle.esSuper && (
                  <CAlert color="info">
                    El super administrador siempre tiene todos los permisos y no se puede bloquear.
                  </CAlert>
                )}
                {grupos.map(({ seccion, items }) => (
                  <section key={seccion} className="acceso-seccion">
                    <h3 className="acceso-seccion__titulo">{seccion}</h3>
                    {items.map(({ menu, acciones }) => (
                      <div key={menu?.code || seccion} className="acceso-grupo">
                        {menu && filaPermiso(menu, true)}
                        {acciones.map((accion) => filaPermiso(accion, false))}
                      </div>
                    ))}
                  </section>
                ))}
              </>
            )}

            {pestana === 'menu' && (
              <div className="acceso-preview">
                {menuPrevisto.length === 0 && (
                  <p className="text-body-secondary mb-0">
                    Con esta configuración el usuario no verá ninguna sección.
                  </p>
                )}
                {menuPrevisto.map(({ seccion, items }) => (
                  <div key={seccion} className="mb-2">
                    <div className="acceso-preview__seccion">{seccion}</div>
                    <CListGroup flush>
                      {items.map((item) => (
                        <CListGroupItem key={item.code} className="acceso-preview__item">
                          <CIcon icon={iconoDeMenu(item.icon)} className="me-2" />
                          {item.label}
                        </CListGroupItem>
                      ))}
                    </CListGroup>
                  </div>
                ))}
                {Object.keys(personalizaciones).length > 0 && (
                  <p className="small text-body-secondary mt-3 mb-0">
                    Vista calculada con {Object.keys(personalizaciones).length} permiso(s)
                    personalizado(s).
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CModalBody>
      <CModalFooter className="justify-content-between">
        <div>
          {pestana !== 'roles' && detalle && !detalle.esSuper && (
            <CButton
              color="secondary"
              variant="outline"
              disabled={guardando !== null || detalle.personalizaciones.length === 0}
              onClick={restablecer}
            >
              {guardando === 'restablecer' && <CSpinner size="sm" className="me-2" />}
              Restablecer a los roles
            </CButton>
          )}
        </div>
        <div className="d-flex gap-2">
          <CButton color="secondary" variant="ghost" onClick={onClose}>
            Cerrar
          </CButton>
          {pestana !== 'roles' && detalle && !detalle.esSuper && (
            <CButton color="primary" disabled={guardando !== null} onClick={guardarPermisos}>
              {guardando === 'permisos' && <CSpinner size="sm" className="me-2" />}
              Guardar permisos
            </CButton>
          )}
        </div>
      </CModalFooter>
    </CModal>
  )
}

AccesoUsuarioModal.propTypes = {
  idUsuario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGuardado: PropTypes.func,
}

export default AccesoUsuarioModal
