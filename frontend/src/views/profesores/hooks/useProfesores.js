import { useCallback, useEffect, useState } from 'react'
import {
  deleteProfesor,
  getProfesorPaginado,
  postProfesor,
  putProfesor,
} from '../../../services/profesorService'
import { capitalizarTexto } from '../../utils/capitalizarTexto'

export const useProfesores = () => {
  const [feedback, setFeedback] = useState(null)
  const [accionEnProceso, setAccionEnProceso] = useState(null)
  const mostrarFeedback = (message, color = 'success') => {
    setFeedback({ message, color })
    setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }

  const [profesorParaEliminar, setProfesorParaEliminar] = useState(null)
  const [cargando, setCargando] = useState(true)

  const [profesor, setProfesor] = useState([])

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtrosColumna, setFiltrosColumna] = useState({
    profesor: '',
    ci: '',
    telefono: '',
    email: '',
    especialidad: '',
    registro: '',
    estado: 'Activo',
  })

  const cambiarFiltrosColumna = (actualizar) => {
    setFiltrosColumna(actualizar)
    setPaginaActual(1)
  }

  const cargarProfesor = useCallback(async () => {
    try {
      const params = { page: paginaActual, limit: registrosPorPagina }
      Object.entries(filtrosColumna).forEach(([clave, valor]) => {
        if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
      })

      const res = await getProfesorPaginado(params)
      const { datos, paginacion } = res.data
      setProfesor(datos)
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
    const temporizador = setTimeout(cargarProfesor, 300)
    return () => clearTimeout(temporizador)
  }, [cargarProfesor])

  const valoresIniciales = {
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    ci: '',
    telefono: '',
    email: '',
    especialidad: '',
  }

  ///CREAR PROFESOR

  const [formulario, setFormulario] = useState(valoresIniciales)

  const crearProfesor = async (e) => {
    e.preventDefault()
    if (accionEnProceso) return
    if (!validarFormulario()) return
    setAccionEnProceso('guardar')
    try {
      const data = {
        nombre: formulario.nombre,
        apellidoPaterno: formulario.apellidoPaterno,
        apellidoMaterno: formulario.apellidoMaterno,
        ci: formulario.ci,
        telefono: formulario.telefono,
        email: formulario.email,
        especialidad: formulario.especialidad,
      }
      const respuesta = await postProfesor(data)
      setFormulario(valoresIniciales)
      const d = respuesta.data
      mostrarFeedback(
        d.reutilizado
          ? `${d.message}\n\nUsuario: ${d.Usuario}\nMantiene su misma contraseña de siempre.`
          : `${d.message}\n\nUsuario: ${d.Usuario}\nContraseña: ${d.Contraceña}`,
        'success',
      )
      await cargarProfesor()
      return true
    } catch (error) {
      console.error(error)
      if (error.response?.data?.message) {
        mostrarFeedback(`Atención: ${error.response.data.message}`, 'danger')
      } else {
        mostrarFeedback(
          'Hubo un problema de conexión con el servidor. Inténtalo más tarde.',
          'danger',
        )
      }
      return false
    } finally {
      setAccionEnProceso(null)
    }
  }

  const handleChange = (e) => {
    const camposCapitalizados = ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'especialidad']
    const valor = camposCapitalizados.includes(e.target.name)
      ? capitalizarTexto(e.target.value)
      : e.target.value

    setFormulario({
      ...formulario,
      [e.target.name]: valor,
    })

    setErrores({
      ...errores,
      [e.target.name]: '',
    })
  }

  /// ACTUALIZAR PROFESOR
  const [editando, setEditando] = useState(false)
  const [idEditar, setIdEditar] = useState(null)

  const seleccionarProfesor = (profe) => {
    setFormulario({
      nombre: profe.nombre,
      apellidoPaterno: profe.a_paterno,
      apellidoMaterno: profe.a_materno,
      ci: profe.ci,
      telefono: profe.telefono,
      email: profe.email,
      especialidad: profe.especialidad,
    })
    setErrores({})
    setIdEditar(profe.id_profesor)
    setEditando(true)
  }

  const actualizarProfesor = async (e) => {
    e.preventDefault()
    if (accionEnProceso) return
    if (!validarFormulario()) return
    setAccionEnProceso('actualizar')
    try {
      const data = {
        nombre: formulario.nombre,
        apellidoPaterno: formulario.apellidoPaterno,
        apellidoMaterno: formulario.apellidoMaterno,
        ci: formulario.ci,
        telefono: formulario.telefono,
        email: formulario.email,
        especialidad: formulario.especialidad,
      }
      console.log('ID EDITAR:', idEditar)
      await putProfesor(idEditar, data)
      mostrarFeedback('Profesor actualizado correctamente', 'success')
      await cargarProfesor()
      return true
    } catch (error) {
      console.error(error)
      mostrarFeedback(error.response?.data?.message || 'Error al actualizar profesor', 'danger')
      return false
    } finally {
      setAccionEnProceso(null)
    }
  }

  const descartar = () => {
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

  ///ELIMINAR PROFESOR
  const eliminarProfesor = (id) => {
    setProfesorParaEliminar(id)
  }

  const cancelarEliminacion = () => {
    setProfesorParaEliminar(null)
  }

  const confirmarEliminacion = async () => {
    if (!profesorParaEliminar) return
    if (accionEnProceso) return
    setAccionEnProceso('eliminar')

    try {
      await deleteProfesor(profesorParaEliminar)
      mostrarFeedback('Profesor eliminado correctamente', 'success')
      cargarProfesor()
      cancelarEliminacion()
    } catch (error) {
      console.error(error)
      mostrarFeedback(error.response?.data?.message || 'Error al eliminar profesor', 'danger')
    } finally {
      setAccionEnProceso(null)
    }
  }

  /// SEGURIDAD
  const [errores, setErrores] = useState({})
  const validarFormulario = () => {
    const nuevosErrores = {}
    if (!formulario.nombre?.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    }
    if (!formulario.apellidoPaterno?.trim()) {
      nuevosErrores.apellidoPaterno = 'Apellido paterno es obligatorio'
    }
    if (formulario.apellidoMaterno && !formulario.apellidoMaterno.trim()) {
      nuevosErrores.apellidoMaterno = 'Apellido materno inválido'
    }
    if (!formulario.ci?.trim()) {
      nuevosErrores.ci = 'CI es obligatorio'
    }
    if (!formulario.telefono?.trim() || !/^\d{8}$/.test(formulario.telefono?.trim())) {
      nuevosErrores.telefono = 'Inválido (8 dígitos)'
    }
    if (!(formulario.email ?? '').trim()) {
      nuevosErrores.email = 'El correo electrónico es obligatorio'
    } else if (!/\S+@\S+\.\S+/.test(formulario.email)) {
      nuevosErrores.email = 'Email inválido'
    }

    if (!formulario.especialidad?.trim()) {
      nuevosErrores.especialidad = 'Especialidad es obligatoria'
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
  return {
    cargarProfesor,
    handleChange,
    descartar,
    editando,
    actualizarProfesor,
    crearProfesor,
    formulario,
    errores,
    profesor,
    seleccionarProfesor,
    eliminarProfesor,
    profesorParaEliminar,
    cancelarEliminacion,
    confirmarEliminacion,
    feedback,
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
