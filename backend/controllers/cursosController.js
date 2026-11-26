import dataBase from '../db/dataBase.js'
import { mostrarCursos, mostrarCursosPorVencer } from '../models/modelsCursos/mostrarCurso.js'
import { crearCursos } from '../models/modelsCursos/crearCursos.js'
import { actualizarCurso } from '../models/modelsCursos/actualizarCursos.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'

export const getMostrarCursosPorVencer = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
    const cursosPorVencer = await mostrarCursosPorVencer()
    return res.status(200).json({ cursosPorVencer })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Error interno servidor' })
  }
}

export const getCursos = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await mostrarCursos({ limit, offset, filtros: req.query })
    res.json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error, 'error al obtener cursos')
    res.status(500).json({ error: 'Error del servidor POSTGRES' })
  }
}

export const postCursos = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
    const resultado = await crearCursos(req.body)
    res.status(201).json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear curso' })
  }
}

export const putCursos = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
    const { id } = req.params
    const { idProfesor } = req.body
    if (idProfesor) {
      const conflicto = await dataBase.query(`
        SELECT est.nombre, est.a_paterno
        FROM inscripcion ins
        JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
        JOIN profesor pro ON pro.id_usuario = est.id_usuario
        WHERE ins.id_curso = $1 AND pro.id_profesor = $2
        LIMIT 1
      `, [id, idProfesor])

      if (conflicto.rowCount > 0) {
        return res.status(400).json({
          error: 'estudiante_del_curso',
          message: `No se puede asignar: ${conflicto.rows[0].nombre} ${conflicto.rows[0].a_paterno} está inscrito como estudiante en este curso.`
        })
      }
    }
    const actualizar = await actualizarCurso(id, req.body)

    if (!actualizar) {
      return res.status(404).json({ message: 'El curso no existe' })
    }
    console.log(actualizar, ' se deberia actulizar cursos')
    res.json(actualizar)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor cursos' })
  }
}

export const deleteCurso = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
    const { id } = req.params
    const result = await dataBase.query(`
      SELECT estado 
      FROM curso 
      WHERE id_curso = $1
      `, [id])
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' })
    }

    const estadoActual = result.rows[0].estado
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo'
    await dataBase.query(`
      UPDATE curso 
      SET estado = $1 
      WHERE id_curso = $2
      `,
    [nuevoEstado, id]
    )
    return res.status(200).json({ message: `Curso actualizado a ${nuevoEstado}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar curso' })
  }
}
