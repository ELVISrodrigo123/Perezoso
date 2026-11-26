import { bloquearCurso, obtenerEstadoInscripcionCurso } from '../models/modelsCursos/estadoInscripcionCurso.js'

export class ErrorInscripcion extends Error {
  constructor (status, codigo, message, detalle = {}) {
    super(message)
    this.status = status
    this.codigo = codigo
    this.detalle = detalle
  }
}

export const formatearFechaCorta = (fechaIso) => {
  const [anio, mes, dia] = String(fechaIso).split('-')
  return `${dia}/${mes}/${anio}`
}

const MOTIVOS_DE_CIERRE = {
  inactivo: (curso) => ({
    codigo: 'curso_inactivo',
    message: `El curso "${curso.nombre}" está inactivo y no acepta inscripciones.`
  }),
  terminado: (curso) => ({
    codigo: 'curso_terminado',
    message: `El curso "${curso.nombre}" terminó el ${formatearFechaCorta(curso.fecha_fin_curso)}.`
  }),
  plazo_vencido: (curso) => ({
    codigo: 'plazo_inscripcion_vencido',
    message: `El plazo de inscripción al curso "${curso.nombre}" venció. Estuvo abierto hasta el ${formatearFechaCorta(curso.fecha_limite_inscripcion)}.`
  }),
  sin_cupos: (curso) => ({
    codigo: 'curso_sin_cupos',
    message: `Curso sin cupos disponibles: "${curso.nombre}".`
  })
}

export const validarInscripcionACurso = async (idCurso, db) => {
  const existe = await bloquearCurso(idCurso, db)
  if (!existe) {
    throw new ErrorInscripcion(404, 'curso_no_encontrado', 'El curso no existe.')
  }

  const curso = await obtenerEstadoInscripcionCurso(idCurso, db)
  const motivo = MOTIVOS_DE_CIERRE[curso.estado_inscripcion]

  if (motivo) {
    const { codigo, message } = motivo(curso)
    throw new ErrorInscripcion(409, codigo, message, {
      idCurso: curso.id_curso,
      curso: curso.nombre,
      estadoInscripcion: curso.estado_inscripcion,
      fechaLimite: curso.fecha_limite_inscripcion,
      fechaFin: curso.fecha_fin_curso,
      cuposDisponibles: curso.cupos_disponibles
    })
  }

  return curso
}

export const responderErrorInscripcion = (res, error) => {
  return res.status(error.status).json({
    error: error.codigo,
    message: error.message,
    ...error.detalle
  })
}
