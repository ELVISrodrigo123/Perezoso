import { useCallback, useState } from 'react'
import {
  deleteInscripcionPorId,
  getInscripcionesPaginado,
  getInscripcionesPorCurso,
  getInscripcionesPorProfesor,
  deleteEliminarTodasInscripcionesDelCurso,
} from '../../../services/inscripcionesService.js'
import { getCursos } from '../../../services/cursosService.js'
import { getProfesor } from '../../../services/profesorService.js'

export const useInscripciones = () => {
  const [cargando, setCargando] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [inscripcionParaEliminar, setInscripcionParaEliminar] = useState(null)
  const [eliminacionEnProceso, setEliminacionEnProceso] = useState(false)
  const mostrarFeedback = (message, color = 'success') => {
    setFeedback({ message, color })
    setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }
  const [inscripciones, setInscripciones] = useState([])

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtrosColumna, setFiltrosColumna] = useState({
    inscripcion: '',
    estudiante: '',
    curso: '',
    profesor: '',
    duracion: '',
    costo: '',
  })

  const cambiarFiltrosColumna = (actualizar) => {
    setFiltrosColumna(actualizar)
    setPaginaActual(1)
  }

  const cargarInscripcion = useCallback(async () => {
    setCargando(true)
    try {
      const params = { page: paginaActual, limit: registrosPorPagina }
      Object.entries(filtrosColumna).forEach(([clave, valor]) => {
        if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
      })

      const respuesta = await getInscripcionesPaginado(params)
      const { datos, paginacion } = respuesta.data
      setInscripciones(datos)
      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)

      if (paginacion.totalPaginas > 0 && paginaActual > paginacion.totalPaginas) {
        setPaginaActual(paginacion.totalPaginas)
      }
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al cargar inscripciones', 'danger')
    } finally {
      setCargando(false)
    }
  }, [paginaActual, registrosPorPagina, filtrosColumna])

  /// CARGAR PROFESORES PARA SELECCIONAR PROFESOR
  const [profes, setProfes] = useState([])
  const cargarProfesores = useCallback(async () => {
    try {
      const profesores = await getProfesor()
      console.log('mostrando profesores: ', profesores.data)
      setProfes(profesores.data)
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al mostrar profesores', 'danger')
    }
  }, [])
  /// cargar inscripciones por id profesor
  const [inscripcionesPorProfesor, setInscripcionesPorprofesor] = useState([])

  const cargarInscripcionesPorProfesor = useCallback(async (id) => {
    setCargando(true)
    try {
      const respuesta = await getInscripcionesPorProfesor(id)
      console.log('caargando inscripciones por profesor', respuesta.data)
      setInscripcionesPorprofesor(respuesta.data)
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al mostrar inscripciones por profesor', 'danger')
    } finally {
      setCargando(false)
    }
  }, [])

  /// CARGAR CURSOS PARA SELECCIONAR CURSO Y VER LOS INSCRITOS
  const [cursos, setCursos] = useState([])

  const cargarCursos = useCallback(async () => {
    try {
      const respuesta = await getCursos()
      console.log('mostrando cursos', respuesta.data)
      setCursos(respuesta.data)
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al mostrar cursos', 'danger')
    }
  }, [])

  /// MOSTRAR INSCRIPCIONES POR CURSO
  const [inscripcionesPorCurso, setInscripcionesPorCurso] = useState([])

  const cargarInscripcionesPorCurso = useCallback(async (id) => {
    setCargando(true)
    try {
      const respuesta = await getInscripcionesPorCurso(id)
      console.log('mostrando inscripciones por curso', respuesta.data)
      setInscripcionesPorCurso(respuesta.data)
    } catch (error) {
      console.error(error)
      mostrarFeedback('Error al mostrar inscripciones por curso', 'danger')
    } finally {
      setCargando(false)
    }
  }, [])

  ///ELIMINAR INSCRIPCION POR ID
  const eliminarInscripcionId = useCallback((id, idProfesor) => {
    setInscripcionParaEliminar({ id, idProfesor })
  }, [])

  const cancelarEliminacion = () => setInscripcionParaEliminar(null)

  const confirmarEliminacion = async () => {
    if (!inscripcionParaEliminar || eliminacionEnProceso) return
    setEliminacionEnProceso(true)
    try {
      const informe = await deleteInscripcionPorId(inscripcionParaEliminar.id)
      mostrarFeedback(informe.data.message, 'success')
      if (inscripcionParaEliminar.idProfesor) {
        await cargarInscripcionesPorProfesor(inscripcionParaEliminar.idProfesor)
      } else {
        await cargarInscripcion()
      }
      cancelarEliminacion()
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al eliminar la inscripción'
      mostrarFeedback(mensaje, 'danger')
    } finally {
      setEliminacionEnProceso(false)
    }
  }

  const [cursoParaEliminar, setCursoParaEliminar] = useState(null)

  const eliminarInscripcionPorCurso = useCallback((idCurso, nombreCurso, idProfesor) => {
    setCursoParaEliminar({ idCurso, nombreCurso, idProfesor })
  }, [])

  const cancelarEliminacionCurso = () => {
    setCursoParaEliminar(null)
  }

  const confirmarEliminacionPorCurso = async () => {
    if (!cursoParaEliminar || eliminacionEnProceso) return

    setEliminacionEnProceso(true)

    try {
      const informe = await deleteEliminarTodasInscripcionesDelCurso(cursoParaEliminar.idCurso)

      if (cursoParaEliminar.idProfesor) {
        await cargarInscripcionesPorProfesor(cursoParaEliminar.idProfesor)
      }

      mostrarFeedback(
        informe.data.message || 'Todas las inscripciones del curso han sido eliminadas',
        'success',
      )

      setCursoParaEliminar(null)
    } catch (error) {
      const mensaje =
        error.response?.data?.message || 'Error al eliminar las inscripciones del curso'

      mostrarFeedback(mensaje, 'danger')
    } finally {
      setEliminacionEnProceso(false)
    }
  }

  return {
    eliminarInscripcionPorCurso,
    cursoParaEliminar,
    cancelarEliminacionCurso,
    confirmarEliminacionCurso: confirmarEliminacionPorCurso,

    cursos,
    cargarCursos,
    inscripcionesPorCurso,
    cargarInscripcionesPorCurso,

    profes,
    cargarProfesores,

    inscripcionesPorProfesor,
    cargarInscripcionesPorProfesor,
    mostrarFeedback,
    inscripciones,
    cargarInscripcion,
    eliminarInscripcionId,
    inscripcionParaEliminar,
    cancelarEliminacion,
    confirmarEliminacion,
    eliminacionEnProceso,
    cargando,
    feedback,
    limpiarFeedback: () => setFeedback(null),
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
