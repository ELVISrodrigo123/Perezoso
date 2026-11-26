import { useEffect, useState, useCallback } from 'react'
import {
  getPreinscripcionPaginado,
  postPreinscripcionAceptada,
  postPreinscripcionRechazado,
} from '../../../services/preInscripcionEstudianteRoutes'
import { postEstudiantes } from '../../../services/estudiantesService'

export const usePreinscripciones = () => {
  const [feedback, setFeedback] = useState(null)
  const [solicitudEnProceso, setSolicitudEnProceso] = useState(null)
  const mostrarFeedback = (message, color = 'success') => {
    setFeedback({ message, color })
    setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }
  const [cargando, setCargando] = useState(true)
  const [preinscripciones, setPreinscripciones] = useState([])

  // ---- paginación y filtros (se envían al backend) ----
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtrosColumna, setFiltrosColumna] = useState({
    estado: 'Pendiente',
    solicitante: '',
    ci: '',
    colegio: '',
    direccion: '',
    telefono: '',
    email: '',
    solicitud: '',
  })

  // al cambiar un filtro siempre volvemos a la página 1
  const cambiarFiltrosColumna = (actualizar) => {
    setFiltrosColumna(actualizar)
    setPaginaActual(1)
  }

  const cargarPreinscripciones = useCallback(async () => {
    try {
      // sinAprobadas: la pantalla nunca muestra las solicitudes ya aprobadas
      const params = { page: paginaActual, limit: registrosPorPagina, sinAprobadas: true }
      Object.entries(filtrosColumna).forEach(([clave, valor]) => {
        if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
      })

      const respuesta = await getPreinscripcionPaginado(params)
      const { datos, paginacion } = respuesta.data
      setPreinscripciones(datos)
      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)

      // si aprobamos/rechazamos la última de la última página, retrocedemos
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

  // vuelve a pedir datos cuando cambia la página, el tamaño o un filtro
  useEffect(() => {
    const temporizador = setTimeout(cargarPreinscripciones, 300)
    return () => clearTimeout(temporizador)
  }, [cargarPreinscripciones])

  const aceptarSolicitud = async (idSolicitud, idTutor) => {
    if (solicitudEnProceso) return
    setSolicitudEnProceso({ id: idSolicitud, tipo: 'aprobar' })
    try {
      const datosSolicitudEstudiante = preinscripciones.find((item) => item.id === idSolicitud)
      if (!datosSolicitudEstudiante || !idTutor) {
        mostrarFeedback('Debe seleccionar un padre o tutor', 'warning')
        return false
      }

      const nombreSeparado = datosSolicitudEstudiante.nombre.trim().split(/\s+/)
      if (nombreSeparado.length > 3 && nombreSeparado.length < 5) {
        nombreSeparado[0] = nombreSeparado[0] + ' ' + nombreSeparado[1]
        nombreSeparado.splice(1, 1)
      }
      const data = {
        nombre: nombreSeparado[0],
        apellidoPaterno: nombreSeparado[1],
        apellidoMaterno: nombreSeparado[2],
        ci: datosSolicitudEstudiante.ci,
        direccion: datosSolicitudEstudiante.direccion,
        colegio: datosSolicitudEstudiante.colegio,
        telefono: datosSolicitudEstudiante.telefono,
        email: datosSolicitudEstudiante.email,
        idTutor,
      }
      await postEstudiantes(data)
      await postPreinscripcionAceptada(idSolicitud)
      await cargarPreinscripciones()
      return true
    } catch (error) {
      console.error(error)
      const mensaje = error.response?.data?.message || 'Error interno'
      mostrarFeedback(mensaje, 'danger')
      return false
    } finally {
      setSolicitudEnProceso(null)
    }
  }

  // Rechazado
  const rechazarSolicitud = async (idSolicitud) => {
    if (solicitudEnProceso) return
    setSolicitudEnProceso({ id: idSolicitud, tipo: 'rechazar' })
    try {
      await postPreinscripcionRechazado(idSolicitud)
      await cargarPreinscripciones()
    } catch (error) {
      console.error(error)
      const mensaje = error.response?.data?.message || 'Error interno'
      mostrarFeedback(mensaje, 'danger')
    } finally {
      setSolicitudEnProceso(null)
    }
  }

  return {
    aceptarSolicitud,
    rechazarSolicitud,
    cargarPreinscripciones,
    preinscripciones,
    feedback,
    solicitudEnProceso,
    cargando,
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
