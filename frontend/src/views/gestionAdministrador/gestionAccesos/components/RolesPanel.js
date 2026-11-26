import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CFormTextarea,
  CListGroup,
  CListGroupItem,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { EmptyState, LoadingState, SectionCard, StatusBadge } from '../../../../components'
import {
  actualizarRol,
  cambiarEstadoRol,
  crearRol,
  getCatalogoPermisos,
  getRoles,
  guardarPermisosRol,
} from '../../../../services/gestionAdministrador/accesosService'
import { agruparCatalogo, errorDeApi, textoDePermiso } from '../utils/catalogoPermisos'

const formularioVacio = { id: null, name: '', description: '' }

const RolesPanel = ({ puedeGestionar }) => {
  const [roles, setRoles] = useState([])
  const [catalogo, setCatalogo] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [marcados, setMarcados] = useState(new Set())
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [formulario, setFormulario] = useState(null)
  const [errorFormulario, setErrorFormulario] = useState('')

  const cargar = useCallback(async (idSeleccionar) => {
    setCargando(true)
    try {
      const [listaRoles, permisos] = await Promise.all([getRoles(), getCatalogoPermisos()])
      setRoles(listaRoles)
      setCatalogo(permisos)
      const elegido =
        listaRoles.find((rol) => rol.id === idSeleccionar) ||
        listaRoles.find((rol) => rol.code !== 'super_administrador') ||
        listaRoles[0]
      setSeleccionado(elegido?.id ?? null)
      setMarcados(new Set(elegido?.permissions || []))
    } catch (error) {
      setMensaje({ color: 'danger', texto: errorDeApi(error, 'No se pudieron cargar los roles.') })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const grupos = useMemo(() => agruparCatalogo(catalogo), [catalogo])
  const rol = roles.find((item) => item.id === seleccionado)
  const esSuperRol = rol?.code === 'super_administrador'
  const soloLectura = !puedeGestionar || esSuperRol
  const sinCambios =
    rol &&
    rol.permissions.length === marcados.size &&
    rol.permissions.every((code) => marcados.has(code))

  const elegirRol = (item) => {
    setSeleccionado(item.id)
    setMarcados(new Set(item.permissions))
    setMensaje(null)
  }

  const alternar = (codigos, valor) =>
    setMarcados((actuales) => {
      const siguientes = new Set(actuales)
      codigos.forEach((code) => (valor ? siguientes.add(code) : siguientes.delete(code)))
      return siguientes
    })

  const tiene = (code) => esSuperRol || marcados.has(code)

  const guardarMatriz = async () => {
    setGuardando(true)
    setMensaje(null)
    try {
      const respuesta = await guardarPermisosRol(rol.id, [...marcados])
      setMensaje({ color: 'success', texto: respuesta.message })
      await cargar(rol.id)
    } catch (error) {
      setMensaje({
        color: 'danger',
        texto: errorDeApi(error, 'No se pudieron guardar los permisos.'),
      })
    } finally {
      setGuardando(false)
    }
  }

  const alternarEstado = async (item) => {
    setMensaje(null)
    try {
      const respuesta = await cambiarEstadoRol(
        item.id,
        item.status === 'activo' ? 'inactivo' : 'activo',
      )
      setMensaje({ color: 'success', texto: respuesta.message })
      await cargar(item.id)
    } catch (error) {
      setMensaje({ color: 'danger', texto: errorDeApi(error, 'No se pudo cambiar el estado.') })
    }
  }

  const guardarFormulario = async () => {
    setErrorFormulario('')
    try {
      const datos = { name: formulario.name, description: formulario.description }
      const respuesta = formulario.id
        ? await actualizarRol(formulario.id, datos)
        : await crearRol(datos)
      setFormulario(null)
      setMensaje({ color: 'success', texto: respuesta.message })
      await cargar(respuesta.rol?.id)
    } catch (error) {
      setErrorFormulario(errorDeApi(error, 'No se pudo guardar el rol.'))
    }
  }

  if (cargando && roles.length === 0) return <LoadingState label="Cargando roles..." />

  return (
    <>
      {mensaje && (
        <CAlert color={mensaje.color} dismissible onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </CAlert>
      )}
      <CRow className="g-3">
        <CCol xs={12} lg={4}>
          <SectionCard
            title="Roles"
            description="Un rol nuevo funciona solo con asignarle permisos."
            actions={
              puedeGestionar && (
                <CButton size="sm" color="primary" onClick={() => setFormulario(formularioVacio)}>
                  Nuevo rol
                </CButton>
              )
            }
          >
            {roles.length === 0 ? (
              <EmptyState title="Sin roles" />
            ) : (
              <CListGroup className="acceso-roles">
                {roles.map((item) => (
                  <CListGroupItem
                    key={item.id}
                    as="button"
                    type="button"
                    active={item.id === seleccionado}
                    onClick={() => elegirRol(item)}
                    className="acceso-roles__item"
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div className="text-start">
                        <div className="fw-semibold">{item.name}</div>
                        <small className="acceso-roles__meta">
                          {item.usuarios} usuario(s) ·{' '}
                          {item.code === 'super_administrador'
                            ? 'todos los permisos'
                            : `${item.permissions.length} permiso(s)`}
                        </small>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <StatusBadge status={item.status}>
                          {item.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </StatusBadge>
                        {item.is_system && (
                          <CBadge color="light" textColor="dark">
                            Sistema
                          </CBadge>
                        )}
                      </div>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            )}
          </SectionCard>
        </CCol>

        <CCol xs={12} lg={8}>
          {rol && (
            <SectionCard
              title={`Permisos: ${rol.name}`}
              description={
                esSuperRol
                  ? 'El super administrador siempre tiene todos los permisos.'
                  : rol.description || 'Cada ítem del menú agrupa sus acciones.'
              }
              actions={
                puedeGestionar &&
                !esSuperRol && (
                  <>
                    <CButton
                      size="sm"
                      color="secondary"
                      variant="outline"
                      onClick={() =>
                        setFormulario({
                          id: rol.id,
                          name: rol.name,
                          description: rol.description || '',
                        })
                      }
                    >
                      Editar
                    </CButton>
                    {!rol.is_system && (
                      <CButton
                        size="sm"
                        color={rol.status === 'activo' ? 'danger' : 'success'}
                        variant="outline"
                        onClick={() => alternarEstado(rol)}
                      >
                        {rol.status === 'activo' ? 'Desactivar' : 'Activar'}
                      </CButton>
                    )}
                  </>
                )
              }
            >
              {grupos.map(({ seccion, items }) => (
                <section key={seccion} className="acceso-seccion">
                  <h3 className="acceso-seccion__titulo">{seccion}</h3>
                  {items.map(({ menu, acciones }) => {
                    const codigos = [menu, ...acciones].filter(Boolean).map((p) => p.code)
                    return (
                      <div key={menu?.code || seccion} className="acceso-grupo">
                        {menu && (
                          <div className="acceso-permiso acceso-permiso--menu">
                            <CFormSwitch
                              id={`rol-${rol.id}-${menu.code}`}
                              label={<span className="fw-semibold">{textoDePermiso(menu)}</span>}
                              checked={tiene(menu.code)}
                              disabled={soloLectura}
                              onChange={(event) =>
                                alternar(
                                  event.target.checked ? [menu.code] : codigos,
                                  event.target.checked,
                                )
                              }
                            />
                            <small className="text-body-secondary">{menu.route}</small>
                          </div>
                        )}
                        {acciones.map((accion) => (
                          <div key={accion.code} className="acceso-permiso acceso-permiso--accion">
                            <CFormSwitch
                              id={`rol-${rol.id}-${accion.code}`}
                              label={textoDePermiso(accion)}
                              checked={tiene(accion.code)}
                              disabled={soloLectura}
                              onChange={(event) => {
                                const lista = [accion.code]
                                if (event.target.checked && menu) lista.push(menu.code)
                                alternar(lista, event.target.checked)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </section>
              ))}
              {!soloLectura && (
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <CButton
                    color="secondary"
                    variant="ghost"
                    disabled={sinCambios || guardando}
                    onClick={() => setMarcados(new Set(rol.permissions))}
                  >
                    Descartar
                  </CButton>
                  <CButton
                    color="primary"
                    disabled={sinCambios || guardando}
                    onClick={guardarMatriz}
                  >
                    {guardando && <CSpinner size="sm" className="me-2" />}
                    Guardar
                  </CButton>
                </div>
              )}
            </SectionCard>
          )}
        </CCol>
      </CRow>

      <CModal visible={formulario !== null} onClose={() => setFormulario(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>{formulario?.id ? 'Editar rol' : 'Nuevo rol'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {errorFormulario && <CAlert color="danger">{errorFormulario}</CAlert>}
          <CFormLabel htmlFor="rol-nombre">Nombre</CFormLabel>
          <CFormInput
            id="rol-nombre"
            className="mb-3"
            value={formulario?.name ?? ''}
            maxLength={60}
            onChange={(event) => setFormulario((f) => ({ ...f, name: event.target.value }))}
          />
          <CFormLabel htmlFor="rol-descripcion">Descripción</CFormLabel>
          <CFormTextarea
            id="rol-descripcion"
            rows={3}
            maxLength={250}
            value={formulario?.description ?? ''}
            onChange={(event) => setFormulario((f) => ({ ...f, description: event.target.value }))}
          />
          {!formulario?.id && (
            <small className="text-body-secondary d-block mt-2">
              El rol se crea sin permisos. Después márcale los permisos en la matriz y guarda.
            </small>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setFormulario(null)}>
            Cancelar
          </CButton>
          <CButton color="primary" disabled={!formulario?.name?.trim()} onClick={guardarFormulario}>
            Guardar
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

RolesPanel.propTypes = {
  puedeGestionar: PropTypes.bool.isRequired,
}

export default RolesPanel
