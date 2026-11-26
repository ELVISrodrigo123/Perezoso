import dataBase from '../db/dataBase.js'
import {
  bloquearPlazoCurso,
  bloquearPlazoGlobal,
  contarCursosPorEstadoInscripcion,
  guardarPlazoCurso,
  guardarPlazoGlobal,
  obtenerHistorialDePlazo,
  obtenerPlazoCurso,
  obtenerPlazoGlobal,
  registrarCambioDePlazo
} from '../models/modelsCursos/plazoInscripcion.js'

const armarPlazoGlobal = async (db) => {
  const plazo = await obtenerPlazoGlobal(db)
  return {
    dias: plazo.dias,
    actualizadoEn: plazo.actualizado_en,
    actualizadoPor: plazo.actualizado_por_id
      ? { id: plazo.actualizado_por_id, email: plazo.actualizado_por_email }
      : null,
    cursosPorEstado: await contarCursosPorEstadoInscripcion(db),
    historial: await obtenerHistorialDePlazo({ ambito: 'global' }, db)
  }
}

const armarPlazoCurso = async (idCurso, db) => {
  const curso = await obtenerPlazoCurso(idCurso, db)
  if (!curso) return null
  return {
    idCurso: curso.id_curso,
    curso: curso.nombre,
    estadoCurso: curso.estado,
    diasCurso: curso.dias_curso,
    diasGlobal: curso.dias_global,
    diasEfectivos: curso.dias_plazo_efectivo,
    origenPlazo: curso.origen_plazo,
    fechaInicio: curso.fecha_inicio_inscripcion,
    fechaFin: curso.fecha_fin_curso,
    fechaLimite: curso.fecha_limite_inscripcion,
    estadoInscripcion: curso.estado_inscripcion,
    inscripcionAbierta: curso.inscripcion_abierta,
    cupoTotal: curso.cupo_total,
    cuposOcupados: curso.cupos_ocupados,
    cuposDisponibles: curso.cupos_disponibles,
    actualizadoEn: curso.plazo_actualizado_en,
    actualizadoPor: curso.plazo_actualizado_por_id
      ? { id: curso.plazo_actualizado_por_id, email: curso.plazo_actualizado_por_email }
      : null,
    historial: await obtenerHistorialDePlazo({ ambito: 'curso', idCurso }, db)
  }
}

export const getPlazoGlobal = async (req, res) => {
  try {
    return res.status(200).json(await armarPlazoGlobal(dataBase))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const putPlazoGlobal = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { dias } = req.body
    await client.query('BEGIN')
    const actual = await bloquearPlazoGlobal(client)
    await guardarPlazoGlobal(dias, req.user.id, client)
    await registrarCambioDePlazo({ ambito: 'global', diasAnterior: actual.dias, diasNuevo: dias, idUsuario: req.user.id }, client)
    await client.query('COMMIT')
    return res.status(200).json({
      message: 'Plazo de inscripción global actualizado',
      ...(await armarPlazoGlobal(client))
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  } finally {
    client.release()
  }
}

export const getPlazoCurso = async (req, res) => {
  try {
    const plazo = await armarPlazoCurso(Number(req.params.id), dataBase)
    if (!plazo) {
      return res.status(404).json({ message: 'Curso no encontrado' })
    }
    return res.status(200).json(plazo)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const putPlazoCurso = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const idCurso = Number(req.params.id)
    const { dias } = req.body
    await client.query('BEGIN')
    const actual = await bloquearPlazoCurso(idCurso, client)
    if (!actual) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Curso no encontrado' })
    }
    await guardarPlazoCurso(idCurso, dias, req.user.id, client)
    await registrarCambioDePlazo({ ambito: 'curso', idCurso, diasAnterior: actual.dias, diasNuevo: dias, idUsuario: req.user.id }, client)
    await client.query('COMMIT')
    return res.status(200).json({
      message: dias === null
        ? 'El curso vuelve a usar el plazo global'
        : 'Plazo de inscripción del curso actualizado',
      ...(await armarPlazoCurso(idCurso, client))
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  } finally {
    client.release()
  }
}
