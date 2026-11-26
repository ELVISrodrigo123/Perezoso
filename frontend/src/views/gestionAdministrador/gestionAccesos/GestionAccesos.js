import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CButton, CButtonGroup, CNav, CNavItem, CNavLink } from '@coreui/react'
import { EmptyState, PageHeader } from '../../../components'
import { hasAnyPermission, hasPermission } from '../../utils/usuario'
import RolesPanel from './components/RolesPanel'
import UsuariosAccesoPanel from './components/UsuariosAccesoPanel'
import TableAccesoUsuario from './components/TableAccesoUsuario'
import { useGestionAcceso } from './hooks/useGestionAcceso'

const TIPOS_USUARIO = [
  { id: 'docente', etiqueta: 'Profesores', permiso: 'menu.teachers.view' },
  { id: 'estudiante', etiqueta: 'Estudiantes', permiso: 'menu.students.view' },
  { id: 'administrador', etiqueta: 'Administradores', permiso: 'menu.admins.view' },
]

const OPCIONES_REGISTRO = [
  { etiqueta: 'Administrador', ruta: '/admin/administradores', permiso: 'admins.create' },
  { etiqueta: 'Profesor', ruta: '/admin/profesores', permiso: 'teachers.create' },
  { etiqueta: 'Estudiante', ruta: '/admin/estudiantes', permiso: 'students.create' },
  { etiqueta: 'Padre o tutor', ruta: '/admin/padres-tutores', permiso: 'guardians.create' },
]

const AltasYBajas = () => {
  const tipos = TIPOS_USUARIO.filter((tipo) => hasPermission(tipo.permiso))
  const [rol, setRol] = useState(tipos[0]?.id ?? null)
  const gestion = useGestionAcceso(rol)

  if (!rol) {
    return <EmptyState title="No tienes acceso a ningún listado de usuarios" />
  }

  return (
    <>
      <CButtonGroup className="mb-3 flex-wrap" role="group" aria-label="Tipo de usuario">
        {tipos.map((tipo) => (
          <CButton
            key={tipo.id}
            color="primary"
            variant={rol === tipo.id ? undefined : 'outline'}
            onClick={() => setRol(tipo.id)}
          >
            {tipo.etiqueta}
          </CButton>
        ))}
      </CButtonGroup>
      <TableAccesoUsuario
        key={rol}
        rol={rol}
        usuarios={gestion.usuarios}
        conteo={gestion.conteos[rol]}
        paginaActual={gestion.paginaActual}
        setPaginaActual={gestion.setPaginaActual}
        registrosPorPagina={gestion.registrosPorPagina}
        setRegistrosPorPagina={gestion.setRegistrosPorPagina}
        totalRegistros={gestion.totalRegistros}
        totalPaginas={gestion.totalPaginas}
        filtros={gestion.filtros}
        setFiltros={gestion.setFiltros}
        cargando={gestion.cargando}
        onDarBaja={gestion.solicitarBaja}
        onHabilitar={gestion.habilitarUsuario}
        usuarioParaBaja={gestion.usuarioParaBaja}
        cancelarBaja={gestion.cancelarBaja}
        confirmarBaja={gestion.confirmarBaja}
        accionEnProceso={gestion.accionEnProceso}
      />
    </>
  )
}

const GestionAccesos = () => {
  const navigate = useNavigate()
  const pestanas = [
    { id: 'roles', texto: 'Roles', visible: hasPermission('roles.read') },
    { id: 'usuarios', texto: 'Usuarios', visible: hasPermission('users.access.manage') },
    {
      id: 'altas',
      texto: 'Altas y bajas',
      visible: hasAnyPermission(...TIPOS_USUARIO.map((tipo) => tipo.permiso)),
    },
  ].filter((pestana) => pestana.visible)
  const [pestana, setPestana] = useState(pestanas[0]?.id ?? null)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const opcionesRegistro = OPCIONES_REGISTRO.filter((opcion) => hasPermission(opcion.permiso))

  return (
    <main className="accesos-page">
      <PageHeader
        title="Gestión de accesos"
        description="Roles, permisos y menú de cada usuario."
        actions={
          opcionesRegistro.length > 0 && (
            <CButton color="primary" onClick={() => setMostrarRegistro((actual) => !actual)}>
              {mostrarRegistro ? 'Cerrar' : 'Registrar usuario'}
            </CButton>
          )
        }
      />
      {mostrarRegistro && (
        <div
          className="d-flex flex-wrap align-items-center gap-2"
          role="group"
          aria-label="Tipo de usuario a registrar"
        >
          <span className="fw-semibold">¿Qué tipo de usuario?</span>
          {opcionesRegistro.map((opcion) => (
            <CButton
              key={opcion.ruta}
              color="primary"
              variant="outline"
              onClick={() => navigate(opcion.ruta, { state: { abrirRegistro: true } })}
            >
              {opcion.etiqueta}
            </CButton>
          ))}
        </div>
      )}

      {pestanas.length === 0 ? (
        <EmptyState title="No tienes permisos para administrar accesos" />
      ) : (
        <>
          <CNav variant="underline-border" role="tablist">
            {pestanas.map((item) => (
              <CNavItem key={item.id}>
                <CNavLink
                  as="button"
                  type="button"
                  role="tab"
                  active={pestana === item.id}
                  onClick={() => setPestana(item.id)}
                >
                  {item.texto}
                </CNavLink>
              </CNavItem>
            ))}
          </CNav>
          {pestana === 'roles' && <RolesPanel puedeGestionar={hasPermission('roles.manage')} />}
          {pestana === 'usuarios' && <UsuariosAccesoPanel />}
          {pestana === 'altas' && <AltasYBajas />}
        </>
      )}
    </main>
  )
}

export default GestionAccesos
