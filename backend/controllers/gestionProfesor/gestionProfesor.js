import { mostrarCursoProfesor } from '../../models/modelsGestionProfesor/mostrarCursosProfesor.js'
import {
  mostrarEstudiantesProfesor,
  mostrarCursosConEstudiantesProfesor,
  mostrarEstudiantesDeCursoProfesor
} from '../../models/modelsGestionProfesor/mostrarEstudiantesProfesor.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../../utils/paginacion.js'

export const getEstudiantesAsignados = async (req, res) => {
  try {
    const idUsuario = req.user.id
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { vista, idCurso, buscar } = req.query

    if (vista === 'cursos') {
      const cursos = await mostrarCursosConEstudiantesProfesor(idUsuario)
      return res.status(200).json({ datos: cursos })
    }

    if (idCurso) {
      if (!Number.isInteger(Number(idCurso))) {
        return res.status(400).json({ message: 'Curso inválido' })
      }
      const { filas, total } = await mostrarEstudiantesDeCursoProfesor(idUsuario, Number(idCurso), { limit, offset, buscar })
      return res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
    }

    const { filas, total } = await mostrarEstudiantesProfesor(idUsuario, { limit, offset })
    return res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}

export const getCursosAsignados = async (req, res) => {
  try {
    const idUsuario = req.user.id
    const data = await mostrarCursoProfesor(idUsuario)
    return res.status(200).json({ datos: data.rows })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}
