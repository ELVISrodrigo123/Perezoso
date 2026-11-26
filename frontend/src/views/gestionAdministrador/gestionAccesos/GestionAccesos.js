import { useEffect, useRef, useState } from 'react'
import rolesAcceso from './rolesAcceso'
import CardRolAcceso from './components/CardRolAcceso'
import TableAccesoUsuario from './components/TableAccesoUsuario'
import { useGestionAcceso } from './hooks/useGestionAcceso'

import { useNavigate } from 'react-router-dom'
import { CButton } from '@coreui/react'

const GestionAccesos = () => {
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const gestion = useGestionAcceso(rolSeleccionado)
  const tablaRef = useRef(null)
  const navigate = useNavigate()
  const [mostrarRegistro, setMostrarRegistro] = useState(false)

  const opcionesRegistro = [
    {
      id: 'administrador',
      etiqueta: 'Administrador',
      ruta: '/admin/administradores',
      soloSuper: true,
    },
    { id: 'docente', etiqueta: 'Profesor', ruta: '/admin/profesores' },
    { id: 'estudiante', etiqueta: 'Estudiante', ruta: '/admin/estudiantes' },
    { id: 'padre-familia', etiqueta: 'Padre de familia / Tutor', ruta: '/admin/padres-tutores' },
  ].filter((opcion) => !opcion.soloSuper || gestion.esSuper)

  const irARegistro = (ruta) => navigate(ruta, { state: { abrirRegistro: true } })

  const gestionarRol = (idRol) => {
    const permitido =
      idRol === 'docente' ||
      idRol === 'estudiante' ||
      (idRol === 'administrador' && gestion.esSuper)

    if (permitido) {
      setRolSeleccionado(idRol)
      tablaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const conteosPorRol = {
    docente: gestion.conteos.docente,
    estudiante: gestion.conteos.estudiante,
    administrador: gestion.conteos.administrador,
  }

  useEffect(() => {
    if (rolSeleccionado && tablaRef.current) {
      tablaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [rolSeleccionado])

  return (
    <main className="accesos-page">
      <header className="accesos-page__header">
        <h1 className="accesos-page__title">Gestión de accesos</h1>
        <p className="accesos-page__subtitle">
          <div className="mt-3">
            <CButton color="primary" onClick={() => setMostrarRegistro((actual) => !actual)}>
              {mostrarRegistro ? 'Cerrar' : 'Registrar usuario'}
            </CButton>
            {mostrarRegistro && (
              <div
                className="d-flex flex-wrap align-items-center gap-2 mt-3"
                role="group"
                aria-label="Tipo de usuario a registrar"
              >
                <span className="fw-semibold">¿Qué tipo de usuario?</span>
                {opcionesRegistro.map((opcion) => (
                  <CButton
                    key={opcion.id}
                    color="primary"
                    variant="outline"
                    onClick={() => irARegistro(opcion.ruta)}
                  >
                    {opcion.etiqueta}
                  </CButton>
                ))}
              </div>
            )}
          </div>
          Consulta los roles y permisos establecidos en el sistema.
        </p>
      </header>

      <section className="accesos-page__cards" aria-label="Roles del sistema">
        {rolesAcceso.map((rol) => {
          // "Gestionar usuarios" del Administrador solo lo ve el super administrador
          const rolTarjeta =
            rol.id === 'administrador' ? { ...rol, gestionable: gestion.esSuper } : rol

          return (
            <CardRolAcceso
              key={rol.id}
              rol={rolTarjeta}
              conteo={conteosPorRol[rol.id]}
              seleccionado={rolSeleccionado === rol.id}
              onGestionar={gestionarRol}
            />
          )
        })}
      </section>

      {rolSeleccionado && (
        <section ref={tablaRef} className="accesos-page__table">
          <TableAccesoUsuario
            key={rolSeleccionado}
            rol={rolSeleccionado}
            usuarios={gestion.usuarios}
            conteo={conteosPorRol[rolSeleccionado]}
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
            onVolver={() => setRolSeleccionado(null)}
          />
        </section>
      )}
    </main>
  )
}

export default GestionAccesos
