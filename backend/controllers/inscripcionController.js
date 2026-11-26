import { mostrarInscripcion } from '../models/modelsInscripcion/mostrarInscripcion.js'
import { mostrarInscripcionPorCurso } from '../models/modelsInscripcion/mostrarInscripcionPorCurso.js'
import { mostrarInscripcionesPorProfesor } from '../models/modelsInscripcion/mostrarInscripcionesPorProfesor.js'
import { crearInscripcion } from '../models/modelsInscripcion/crearInscripcion.js'
import { mostrarInscripcionesPorEstudiante } from '../models/modelsInscripcion/mostrarPorIdEstudiante.js'
import { eliminarInscripcionPorId, eliminarTodasInscripcionesDelCurso } from '../models/modelsInscripcion/eliminarInscripcionPorId.js'
import { eliminarInscripcionPorEstudiante } from '../models/modelsInscripcion/eliminarInscripcionPorEstudiante.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'
import dataBase from '../db/dataBase.js'
import { ErrorInscripcion, responderErrorInscripcion, validarInscripcionACurso } from '../services/validarInscripcion.js'

export const getInscripciones = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await mostrarInscripcion({ limit, offset, filtros: req.query })
    res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al cargar Inscripciones' })
  }
}

export const getInscripcionesPorCurso = async (req, res) => {
  try {
    const { id } = req.params
    const result = await mostrarInscripcionPorCurso(id)
    if (!result || result.rowCount === 0) {
      return res.status(200).json({ message: 'No existe inscripciones en este curso' })
    }
    res.status(200).json({ total_estudiantes: result.rowCount, data: result.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al cargar Inscripciones en curso' })
  }
}

export const getInscripcionesPorProfesor = async (req, res) => {
  try {
    const { id } = req.params
    const result = await mostrarInscripcionesPorProfesor(id)
    if (!result || result.rowCount === 0) {
      return res.status(200).json({ message: 'El profesor no tiene cursos asignados o no hay inscripciones registradas', total_estudiantes: 0, datos: [] })
    }
    res.status(200).json({ datos: result.rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al cargar inscripciones por profesor' })
  }
}

export const postInscripciones = async (req, res) => {
  const idEstudiante = Number(req.body.idEstudiante)
  const cursosSolicitados = [...new Set(req.body.idCurso.map(Number))]
  const client = await dataBase.connect()
  try {
    await client.query('BEGIN')

    const actuales = await client.query(
      'SELECT id_curso FROM inscripcion WHERE id_estudiante = $1',
      [idEstudiante]
    )
    const cursosActuales = actuales.rows.map(row => row.id_curso)

    const cursosAInsertar = cursosSolicitados.filter(id => !cursosActuales.includes(id)).sort((a, b) => a - b)
    const cursosAEliminar = cursosActuales.filter(id => !cursosSolicitados.includes(id))

    if (cursosAInsertar.length > 0) {
      const conflicto = await client.query(`
        SELECT cu.nombre
        FROM curso cu
        JOIN profesor pro ON pro.id_profesor = cu.id_profesor
        JOIN estudiante est ON est.id_usuario = pro.id_usuario
        WHERE est.id_estudiante = $1 AND cu.id_curso = ANY($2::INT[])
      `, [idEstudiante, cursosAInsertar])

      if (conflicto.rowCount > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'profesor_del_curso',
          message: `No se puede inscribir: esta persona es el profesor del curso "${conflicto.rows[0].nombre}".`
        })
      }
    }

    if (cursosAEliminar.length > 0) {
      await client.query('DELETE FROM inscripcion WHERE id_estudiante = $1 AND id_curso = ANY($2::INT[])', [idEstudiante, cursosAEliminar])
    }

    for (const id of cursosAInsertar) {
      await validarInscripcionACurso(id, client)
      await crearInscripcion(client, { idEstudiante, idCurso: id })
    }

    await client.query('COMMIT')

    return res.status(200).json({
      message: 'Inscripciones procesadas correctamente',
      insertados: cursosAInsertar.length,
      eliminados: cursosAEliminar.length,
      totalCursos: cursosSolicitados.length
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    if (error instanceof ErrorInscripcion) {
      return responderErrorInscripcion(res, error)
    }
    console.error(error)
    return res.status(500).json({
      error: 'Error interno',
      message: ' No se pudieron actualizar las inscripicones del estudiante'
    })
  } finally {
    client.release()
  }
}

/// hacer inscripcion duplicado
export const mostrarInscripcionPorEstudiante = async (req, res) => {
  try {
    const { id } = req.params
    const result = await mostrarInscripcionesPorEstudiante(id)
    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'No existe inscripciones para mostrar' })
    }

    const idsCursos = result.rows.map(inscripcion => inscripcion.id_curso)

    res.status(200).json({ message: `${result.rowCount} Inscripciones mostrando correctamente`, idsCursos })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al mostrar Inscripcion' })
  }
}

export const deleteInscripcionPorId = async (req, res) => {
  try {
    const { id } = req.params
    const result = await eliminarInscripcionPorId(id)
    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'No existe inscripción para eliminar' })
    }
    res.status(200).json({ message: 'Eliminado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar inscripcion' })
  }
}

export const deleteinscripcionPorEstudiante = async (req, res) => {
  try {
    const { id } = req.params
    const result = await eliminarInscripcionPorEstudiante(id)

    if (result === 0) {
      return res.status(200).json({ message: 'no hay inscripciones que eliminar' })
    }
    res.status(200).json({ message: `Se eliminaron ${result} inscripciones correctamente` })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error al eliminar inscripciones'
    })
  }
}

export const deleteEliminarTodasInscripcionesDelCurso = async (req, res) => {
  try {
    const { idCurso } = req.params
    const result = await eliminarTodasInscripcionesDelCurso(idCurso)
    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'No hay inscripciones que eliminar para este curso' })
    }
    return res.status(200).json({ message: `Se eliminaron ${result.rowCount} inscripciones del curso correctamente` })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al eliminar inscripciones del curso' })
  }
}
