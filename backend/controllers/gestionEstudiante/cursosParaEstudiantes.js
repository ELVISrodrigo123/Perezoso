import { obtenerDeudasEstudiante, crearInscripcionAunCurso, obtenerCalificacionesDelEstudiante, obtenerCursosNoInscritosDelEstudiante, obtenerCursosParaEstudiante, obtenerEstudiante } from '../../models/modelsGestionEstudiante/cursosEstudiante/obtenerCursosEstudiante.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../../utils/paginacion.js'
import dataBase from '../../db/dataBase.js'
import { ErrorInscripcion, responderErrorInscripcion, validarInscripcionACurso } from '../../services/validarInscripcion.js'

export const getMostrarDeudasEstudiante = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'estudiante') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los estudiantes pueden acceder a esta información.' })
    }
    const informe = await obtenerDeudasEstudiante(req.user.id)
    return res.status(200).json({ datos: informe.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const getMostrarcursosParaEstudiantes = async (req, res) => {
  try {
    const idUsuario = req.user.id
    const informe = await obtenerCursosParaEstudiante(idUsuario)
    return res.status(200).json({ datos: informe.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const getMostrarCalificaionesDelEstudiante = async (req, res) => {
  try {
    const { idCurso } = req.params
    const informe = await obtenerCalificacionesDelEstudiante(idCurso, req.user.id)
    return res.status(200).json({ datos: informe.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const getMostrarCursosNoInscritosDelEstudiante = async (req, res) => {
  try {
    const idUsuario = req.user.id
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await obtenerCursosNoInscritosDelEstudiante(idUsuario, { limit, offset })
    return res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const postCrearInscripcionAunCursoestudiante = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const idCurso = Number(req.params.idCurso)
    const idEstudiante = await obtenerEstudiante(req.user.id)
    if (!idEstudiante) {
      return res.status(404).json({ message: 'No se encontró el perfil de estudiante' })
    }

    await client.query('BEGIN')
    await validarInscripcionACurso(idCurso, client)
    const informe = await crearInscripcionAunCurso(idEstudiante, idCurso, client)
    if (informe.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ message: 'No se pudo realizar la inscripción' })
    }
    await client.query('COMMIT')
    return res.status(201).json({ message: 'Inscripción realizada correctamente' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    if (error instanceof ErrorInscripcion) {
      return responderErrorInscripcion(res, error)
    }
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Ya estás inscrito en este curso' })
    }
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  } finally {
    client.release()
  }
}
