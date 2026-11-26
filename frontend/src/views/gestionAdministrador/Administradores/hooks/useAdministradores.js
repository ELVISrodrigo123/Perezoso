import { useCallback, useEffect, useRef, useState } from 'react'
import {
  obtenerAdministradoresPaginado,
  registrarAdministrador,
  actualizarAdministrador,
  darBajaAdministrador,
  activarAdministrador,
} from '../../../../services/gestionAdministrador/superAdministrador'
import { capitalizarTexto } from '../../../utils/capitalizarTexto'

// ---------- Reglas de seguridad por campo ----------
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/
const REGEX_CI = /^\d{5,10}(-[0-9A-Za-z]{1,2})?$/
const REGEX_TELEFONO = /^\d{8}$/
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Limpieza mientras el usuario escribe: lo que no corresponde al campo ni entra
const limpiarCampo = {
  nombre: (v) => v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ -]/g, '').slice(0, 50),
  apellidoPaterno: (v) => v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ -]/g, '').slice(0, 50),
  apellidoMaterno: (v) => v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ -]/g, '').slice(0, 50),
  ci: (v) =>
    v
      .replace(/[^0-9A-Za-z-]/g, '')
      .toUpperCase()
      .slice(0, 15),
  telefono: (v) => v.replace(/\D/g, '').slice(0, 8),
  email: (v) => v.replace(/\s/g, '').toLowerCase().slice(0, 100),
}

const camposCapitalizados = ['nombre', 'apellidoPaterno', 'apellidoMaterno']

const valoresIniciales = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  ci: '',
  telefono: '',
  email: '',
}

export const useAdministradores = () => {
  const [feedback, setFeedback] = useState(null)
  const [accionEnProceso, setAccionEnProceso] = useState(null)
  const [administradorParaBaja, setAdministradorParaBaja] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [administradores, setAdministradores] = useState([])
  const [formulario, setFormulario] = useState(valoresIniciales)
  const [errores, setErrores] = useState({})
  const [editando, setEditando] = useState(false)
  const [idEditar, setIdEditar] = useState(null)
  const temporizadorFeedback = useRef(null)

  const limpiarFeedback = () => {
    clearTimeout(temporizadorFeedback.current)
    setFeedback(null)
  }

  const mostrarFeedback = (message, color = 'success') => {
    clearTimeout(temporizadorFeedback.current)
    setFeedback({ message, color })
    temporizadorFeedback.current = setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }

  useEffect(() => () => clearTimeout(temporizadorFeedback.current), [])

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtrosColumna, setFiltrosColumna] = useState({
    administrador: '',
    ci: '',
    telefono: '',
    email: '',
    registro: '',
    estado: 'Activo',
  })

  const cambiarFiltrosColumna = (actualizar) => {
    setFiltrosColumna(actualizar)
    setPaginaActual(1)
  }

  const cargarAdministradores = useCallback(async () => {
    try {
      const params = { page: paginaActual, limit: registrosPorPagina }
      Object.entries(filtrosColumna).forEach(([clave, valor]) => {
        if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
      })

      const { datos, paginacion } = await obtenerAdministradoresPaginado(params)
      setAdministradores(datos)
      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)

      if (paginacion.totalPaginas > 0 && paginaActual > paginacion.totalPaginas) {
        setPaginaActual(paginacion.totalPaginas)
      }
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al obtener datos', 'danger')
    } finally {
      setCargando(false)
    }
  }, [paginaActual, registrosPorPagina, filtrosColumna])

  useEffect(() => {
    const temporizador = setTimeout(cargarAdministradores, 300)
    return () => clearTimeout(temporizador)
  }, [cargarAdministradores])

  const mensajeDeError = (error, porDefecto) => {
    if (error.response?.data?.message) {
      return `Atención: ${error.response.data.message}`
    }
    if (error.response) return porDefecto
    return 'Hubo un problema de conexión con el servidor. Inténtalo más tarde.'
  }

  // Datos listos para enviar al backend (sin espacios sobrantes)
  const armarDatos = () => ({
    nombre: formulario.nombre.trim(),
    apellidoPaterno: formulario.apellidoPaterno.trim(),
    apellidoMaterno: (formulario.apellidoMaterno ?? '').trim(),
    ci: formulario.ci.trim(),
    telefono: (formulario.telefono ?? '').trim(),
    email: formulario.email.trim().toLowerCase(),
  })

  /// SEGURIDAD
  const validarFormulario = () => {
    const nuevosErrores = {}
    const nombre = formulario.nombre?.trim() ?? ''
    const paterno = formulario.apellidoPaterno?.trim() ?? ''
    const materno = formulario.apellidoMaterno?.trim() ?? ''
    const ci = formulario.ci?.trim() ?? ''
    const telefono = formulario.telefono?.trim() ?? ''
    const email = formulario.email?.trim() ?? ''

    if (!nombre) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    } else if (nombre.length < 2 || !REGEX_NOMBRE.test(nombre)) {
      nuevosErrores.nombre = 'El nombre solo puede contener letras'
    }

    if (!paterno) {
      nuevosErrores.apellidoPaterno = 'Apellido paterno es obligatorio'
    } else if (paterno.length < 2 || !REGEX_NOMBRE.test(paterno)) {
      nuevosErrores.apellidoPaterno = 'El apellido solo puede contener letras'
    }

    if (materno && (materno.length < 2 || !REGEX_NOMBRE.test(materno))) {
      nuevosErrores.apellidoMaterno = 'El apellido solo puede contener letras'
    }

    if (!ci) {
      nuevosErrores.ci = 'CI es obligatorio'
    } else if (!REGEX_CI.test(ci)) {
      nuevosErrores.ci = 'CI inválido (5 a 10 dígitos, complemento opcional)'
    }

    if (telefono && !REGEX_TELEFONO.test(telefono)) {
      nuevosErrores.telefono = 'Inválido (8 dígitos)'
    }

    if (!email) {
      nuevosErrores.email = 'El correo es obligatorio'
    } else if (!REGEX_EMAIL.test(email)) {
      nuevosErrores.email = 'Email inválido'
    }

    setErrores(nuevosErrores)

    const llavesConErrores = Object.keys(nuevosErrores)
    if (llavesConErrores.length > 0) {
      const primerError = llavesConErrores[0]
      setTimeout(() => {
        const elementoInvalido =
          document.getElementsByName(primerError)[0] || document.getElementById(primerError)
        if (elementoInvalido) {
          elementoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' })
          elementoInvalido.focus()
        }
      }, 50)
    }

    return llavesConErrores.length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const limpiar = limpiarCampo[name]
    let valor = limpiar ? limpiar(value) : value
    if (camposCapitalizados.includes(name)) {
      valor = capitalizarTexto(valor)
    }

    setFormulario((actual) => ({ ...actual, [name]: valor }))
    setErrores((actuales) => ({ ...actuales, [name]: '' }))
  }

  ///CREAR ADMINISTRADOR
  const crearAdministrador = async (e) => {
    e.preventDefault()
    if (accionEnProceso) return
    if (!validarFormulario()) return
    setAccionEnProceso('guardar')
    try {
      const respuesta = await registrarAdministrador(armarDatos())
      setFormulario(valoresIniciales)
      mostrarFeedback(
        respuesta.reutilizado
          ? `${respuesta.message}\n\nUsuario: ${respuesta.Usuario}\nMantiene su misma contraseña de siempre.`
          : `${respuesta.message}\n\nUsuario: ${respuesta.Usuario}\nContraseña: ${respuesta.Contraceña}`,
        'success',
      )
      await cargarAdministradores()
      return true
    } catch (error) {
      console.error(error)
      mostrarFeedback(mensajeDeError(error, 'Error al registrar administrador'), 'danger')
      return false
    } finally {
      setAccionEnProceso(null)
    }
  }

  /// ACTUALIZAR ADMINISTRADOR
  const seleccionarAdministrador = (admin) => {
    setFormulario({
      nombre: admin.nombre ?? '',
      apellidoPaterno: admin.a_paterno ?? '',
      apellidoMaterno: admin.a_materno ?? '',
      ci: admin.ci ?? '',
      telefono: admin.telefono ?? '',
      email: admin.email ?? '',
    })
    setErrores({})
    setIdEditar(admin.id_administrador)
    setEditando(true)
  }

  const actualizarAdministradorActual = async (e) => {
    e.preventDefault()
    if (accionEnProceso) return
    if (!validarFormulario()) return
    setAccionEnProceso('actualizar')
    try {
      await actualizarAdministrador(idEditar, armarDatos())
      mostrarFeedback('Administrador actualizado correctamente', 'success')
      await cargarAdministradores()
      return true
    } catch (error) {
      console.error(error)
      mostrarFeedback(mensajeDeError(error, 'Error al actualizar administrador'), 'danger')
      return false
    } finally {
      setAccionEnProceso(null)
    }
  }

  const descartar = () => {
    setErrores({})
    setEditando(false)
    setIdEditar(null)
    setFormulario({ ...valoresIniciales })
    mostrarFeedback('La edición fue cancelada', 'info')
  }

  const limpiarEdicion = () => {
    setErrores({})
    setEditando(false)
    setIdEditar(null)
    setFormulario({ ...valoresIniciales })
  }

  /// DAR DE BAJA (baja lógica)
  const solicitarBaja = (id) => {
    setAdministradorParaBaja(id)
  }

  const cancelarBaja = () => {
    setAdministradorParaBaja(null)
  }

  const confirmarBaja = async () => {
    if (!administradorParaBaja) return
    if (accionEnProceso) return
    setAccionEnProceso('baja')
    try {
      await darBajaAdministrador(administradorParaBaja)
      mostrarFeedback('Administrador dado de baja correctamente', 'success')
      await cargarAdministradores()
      cancelarBaja()
    } catch (error) {
      console.error(error)
      mostrarFeedback(mensajeDeError(error, 'Error al dar de baja al administrador'), 'danger')
    } finally {
      setAccionEnProceso(null)
    }
  }

  /// ACTIVAR
  const activarAdministradorPorId = async (id) => {
    if (accionEnProceso) return
    setAccionEnProceso('activar')
    try {
      await activarAdministrador(id)
      mostrarFeedback('Administrador activado correctamente', 'success')
      await cargarAdministradores()
    } catch (error) {
      console.error(error)
      mostrarFeedback(mensajeDeError(error, 'Error al activar al administrador'), 'danger')
    } finally {
      setAccionEnProceso(null)
    }
  }

  return {
    cargarAdministradores,
    handleChange,
    descartar,
    editando,
    actualizarAdministradorActual,
    crearAdministrador,
    formulario,
    errores,
    administradores,
    seleccionarAdministrador,
    solicitarBaja,
    administradorParaBaja,
    cancelarBaja,
    confirmarBaja,
    activarAdministradorPorId,
    feedback,
    limpiarFeedback,
    accionEnProceso,
    cargando,
    limpiarEdicion,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna: cambiarFiltrosColumna,
  }
}
