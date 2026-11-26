import { useCallback, useEffect, useState } from 'react'
import {
  getControlDePagosPaginado,
  postRegistrarRecibos,
  putMarcarInscripcionPagada,
} from '../../../../services/controlPagosParaEstudiantes'
import { getMostrandoPadresTutores } from '../../../../services/padreTutorService'
import { getEstudiantes } from '../../../../services/estudiantesService'
import { generarReciboPdf } from '../../../utils/generarReciboPdf'

export const useControlPagosEstudiante = () => {
  const [feedback, setFeedback] = useState(null)
  const [pagoEnProceso, setPagoEnProceso] = useState(null)
  const mensajeSinTutor =
    'No se puede registrar el pago porque el estudiante no tiene un padre o tutor asignado. Debe asignar uno antes de continuar.'
  const mostrarFeedback = (message, color = 'success') => {
    setFeedback({ message, color })
    setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }
  const [listaEstudiantesNoPagados, setListaEstudiantesNoPagados] = useState([])
  const [padresTutores, setPadresTutores] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  // ---- paginación y filtros (se envían al backend) ----
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [filtrosColumna, setFiltrosColumna] = useState({
    inscripcion: '',
    estudiante: '',
    ci: '',
    direccion: '',
    telefono: '',
    curso: '',
    costo: '',
    estado: 'PENDIENTE',
  })

  // al cambiar un filtro siempre volvemos a la página 1
  const cambiarFiltrosColumna = (actualizar) => {
    setFiltrosColumna(actualizar)
    setPaginaActual(1)
  }

  const cargarEstudiantesNoPagados = useCallback(async () => {
    try {
      const params = { page: paginaActual, limit: registrosPorPagina }
      Object.entries(filtrosColumna).forEach(([clave, valor]) => {
        if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
      })
      params.estado = 'PENDIENTE'

      const informe = await getControlDePagosPaginado(params)
      const { datos, paginacion } = informe.data
      setListaEstudiantesNoPagados(datos)
      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)

      if (paginacion.totalPaginas > 0 && paginaActual > paginacion.totalPaginas) {
        setPaginaActual(paginacion.totalPaginas)
      }
    } catch (error) {
      console.error(error)
      const mensaje = error.response?.data?.message || 'Error interno del servidor'
      mostrarFeedback(mensaje, 'danger')
    }
  }, [paginaActual, registrosPorPagina, filtrosColumna])

  useEffect(() => {
    const temporizador = setTimeout(cargarEstudiantesNoPagados, 300)
    return () => clearTimeout(temporizador)
  }, [cargarEstudiantesNoPagados])

  useEffect(() => {
    let componenteActivo = true

    Promise.allSettled([getMostrandoPadresTutores(), getEstudiantes()]).then(
      ([resultadoPadresTutores, resultadoEstudiantes]) => {
        if (!componenteActivo) return
        if (resultadoPadresTutores.status === 'fulfilled') {
          setPadresTutores(resultadoPadresTutores.value.data || [])
        } else {
          console.error(resultadoPadresTutores.reason)
          mostrarFeedback('No se pudieron cargar los datos de tutores', 'warning')
        }
        if (resultadoEstudiantes.status === 'fulfilled') {
          setEstudiantes(resultadoEstudiantes.value.data || [])
        } else {
          console.error(resultadoEstudiantes.reason)
          mostrarFeedback('No se pudieron cargar los datos de estudiantes', 'warning')
        }
      },
    )

    return () => {
      componenteActivo = false
    }
  }, [])

  const marcarInscripcionComoPagada = async (inscripcion, tutor) => {
    if (pagoEnProceso) return false

    setPagoEnProceso(inscripcion.id_inscripcion)

    try {
      if (!tutor) {
        mostrarFeedback(
          'No se puede registrar el pago porque el estudiante no tiene un padre o tutor asignado. Debe asignar uno antes de continuar.',
          'warning',
        )
        return false
      }

      const reciboData = {
        idInscripcion: inscripcion.id_inscripcion,
        padreTutor: [
          tutor.nombre,
          tutor.apellidoPaterno || tutor.a_paterno,
          tutor.apellidoMaterno || tutor.a_materno,
        ]
          .filter(Boolean)
          .join(' '),
        padreCi: String(tutor.ci || ''),
        montoPagado: Number(inscripcion.costo || 0),
        idPadre: tutor.id_tutor || tutor.idTutor || null,
        idEstudiante: inscripcion.id_estudiante || null,
        estudiante:
          inscripcion.estudiante ||
          [inscripcion.nombre, inscripcion.a_paterno, inscripcion.a_materno]
            .filter(Boolean)
            .join(' ') ||
          null,
        idCurso: inscripcion.id_curso || inscripcion.idCurso || null,
        curso: inscripcion.materia || inscripcion.curso || 'Curso',
      }

      const respuestaRecibo = await postRegistrarRecibos(reciboData)
      const datosRecibo = respuestaRecibo.data?.datos

      if (!datosRecibo) {
        throw new Error('La API no devolvió los datos del recibo')
      }

      await generarReciboPdf({
        ...datosRecibo,
        estudiante_nombre: inscripcion.estudiante,
        estudiante_ci: String(inscripcion.ci || ''),
        conceptos: [
          {
            descripcion: inscripcion.materia || 'Curso',
            monto: Number(inscripcion.costo || 0),
          },
        ],
      })
      const informe = await putMarcarInscripcionPagada(inscripcion.id_inscripcion)
      const mensaje = informe.data?.message || 'Error al registrar'

      mostrarFeedback(mensaje, 'success')
      await cargarEstudiantesNoPagados()
      return true
    } catch (error) {
      console.error(error)
      const mensaje = error.response?.data?.message || error.message || 'Error interno del servidor'
      mostrarFeedback(mensaje, 'danger')
      return false
    } finally {
      setPagoEnProceso(null)
    }
  }
  return {
    listaEstudiantesNoPagados,
    padresTutores,
    estudiantes,
    marcarInscripcionComoPagada,
    feedback,
    pagoEnProceso,
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
