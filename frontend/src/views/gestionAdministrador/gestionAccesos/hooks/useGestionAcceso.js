import { useCallback, useEffect, useState } from 'react'
import { deleteProfesor, getProfesorPaginado } from '../../../../services/profesorService'
import { deleteEstudiantes, getEstudiantesPaginado } from '../../../../services/estudiantesService'
import { useHabilitarUsuario } from '../../../../hooks/useHabilitarUsuario'
import {
  activarAdministrador,
  darBajaAdministrador,
  obtenerAdministradoresPaginado,
} from '../../../../services/gestionAdministrador/superAdministrador'
import { hasPermission } from '../../../utils/usuario'

const filtrosIniciales = {
  nombre: '',
  ci: '',
  telefono: '',
  email: '',
  especialidadColegio: '',
  registro: '',
  estado: 'Todos',
}

const conteoVacio = { activos: 0, inactivos: 0 }

const consultarPorRol = async (rol, params) => {
  if (rol === 'docente') {
    const respuesta = await getProfesorPaginado(params)
    return respuesta.data
  }
  if (rol === 'administrador') {
    return await obtenerAdministradoresPaginado(params)
  }
  const respuesta = await getEstudiantesPaginado(params)
  return respuesta.data
}

const construirParametros = (rol, filtros, base) => {
  const params = { ...base }
  const agregar = (clave, valor) => {
    if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
  }

  const claveNombre = {
    docente: 'profesor',
    estudiante: 'estudiante',
    administrador: 'administrador',
  }
  agregar(claveNombre[rol], filtros.nombre)
  agregar('ci', filtros.ci)
  agregar('telefono', filtros.telefono)
  agregar('email', filtros.email)
  agregar('registro', filtros.registro)
  if (rol === 'docente') agregar('especialidad', filtros.especialidadColegio)
  if (rol === 'estudiante') agregar('colegio', filtros.especialidadColegio)
  if (filtros.estado !== 'Todos') agregar('estado', filtros.estado)

  return params
}

export const useGestionAcceso = (rol) => {
  const [cargando, setCargando] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [conteos, setConteos] = useState({
    docente: conteoVacio,
    estudiante: conteoVacio,
    administrador: conteoVacio,
  })
  const [usuarioParaBaja, setUsuarioParaBaja] = useState(null)
  const [accionEnProceso, setAccionEnProceso] = useState(null)
  const { ejecutarHabilitarUsuario } = useHabilitarUsuario()

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtros, setFiltros] = useState(filtrosIniciales)

  const cambiarFiltros = (actualizar) => {
    setFiltros(actualizar)
    setPaginaActual(1)
  }

  useEffect(() => {
    setUsuarios([])
    setFiltros(filtrosIniciales)
    setPaginaActual(1)
    setTotalRegistros(0)
    setTotalPaginas(1)
    setCargando(Boolean(rol))
  }, [rol])

  const cargarUsuarios = useCallback(async () => {
    if (!rol) return
    try {
      const params = construirParametros(rol, filtros, {
        page: paginaActual,
        limit: registrosPorPagina,
      })
      const { datos, paginacion } = await consultarPorRol(rol, params)
      setUsuarios(datos)
      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)

      // si damos de baja al último de la última página, retrocedemos
      if (paginacion.totalPaginas > 0 && paginaActual > paginacion.totalPaginas) {
        setPaginaActual(paginacion.totalPaginas)
      }
    } catch (error) {
      console.error('Error al cargar usuarios con acceso', error)
    } finally {
      setCargando(false)
    }
  }, [rol, filtros, paginaActual, registrosPorPagina])

  useEffect(() => {
    const temporizador = setTimeout(cargarUsuarios, 300)
    return () => clearTimeout(temporizador)
  }, [cargarUsuarios])

  const cargarConteos = useCallback(async () => {
    const contar = async (rolConsultado, estado) => {
      const { paginacion } = await consultarPorRol(rolConsultado, { page: 1, limit: 1, estado })
      return paginacion.total
    }
    const contarRol = async (rolConsultado) => {
      const [activos, inactivos] = await Promise.all([
        contar(rolConsultado, 'Activo'),
        contar(rolConsultado, 'Inactivo'),
      ])
      return { activos, inactivos }
    }

    const contarSiPuede = (rolConsultado, permiso) =>
      hasPermission(permiso) ? contarRol(rolConsultado) : Promise.resolve(conteoVacio)
    const [docente, estudiante, administrador] = await Promise.all([
      contarSiPuede('docente', 'menu.teachers.view'),
      contarSiPuede('estudiante', 'menu.students.view'),
      contarSiPuede('administrador', 'menu.admins.view'),
    ])
    setConteos({ docente, estudiante, administrador })
  }, [])

  useEffect(() => {
    let componenteActivo = true

    const cargarInicial = async () => {
      try {
        if (!componenteActivo) return
        await cargarConteos()
      } catch (error) {
        if (componenteActivo) console.error('Error al cargar los conteos de accesos', error)
      }
    }

    cargarInicial()
    return () => {
      componenteActivo = false
    }
  }, [cargarConteos])

  const recargar = useCallback(async () => {
    await Promise.all([cargarUsuarios(), cargarConteos()])
  }, [cargarUsuarios, cargarConteos])

  const solicitarBaja = (usuario, rolUsuario) => {
    setUsuarioParaBaja({ usuario, rol: rolUsuario })
  }

  const cancelarBaja = () => setUsuarioParaBaja(null)

  const confirmarBaja = async () => {
    if (!usuarioParaBaja || accionEnProceso) return
    setAccionEnProceso('baja')
    try {
      if (usuarioParaBaja.rol === 'docente') {
        await deleteProfesor(usuarioParaBaja.usuario.id_profesor)
      } else if (usuarioParaBaja.rol === 'administrador') {
        await darBajaAdministrador(usuarioParaBaja.usuario.id_administrador)
      } else {
        await deleteEstudiantes(usuarioParaBaja.usuario.id_estudiante)
      }
      setUsuarioParaBaja(null)
      await recargar()
    } catch (error) {
      console.error('Error al dar de baja al usuario', error)
    } finally {
      setAccionEnProceso(null)
    }
  }

  const habilitarUsuario = async (id, rolUsuario) => {
    if (!id || accionEnProceso) return
    setAccionEnProceso('habilitar')
    try {
      if (rolUsuario === 'administrador') {
        await activarAdministrador(id)
      } else {
        await ejecutarHabilitarUsuario(id, rolUsuario === 'docente' ? 'profesor' : rolUsuario)
      }
      await recargar()
    } catch (error) {
      console.error('Error al habilitar al usuario', error)
    } finally {
      setAccionEnProceso(null)
    }
  }

  return {
    cargando,
    usuarios,
    conteos,
    usuarioParaBaja,
    solicitarBaja,
    cancelarBaja,
    confirmarBaja,
    habilitarUsuario,
    accionEnProceso,
    recargar,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtros,
    setFiltros: cambiarFiltros,
  }
}
