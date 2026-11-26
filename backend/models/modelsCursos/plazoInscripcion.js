import { COLUMNAS_ESTADO_INSCRIPCION, unirEstadoInscripcion } from './estadoInscripcionCurso.js'

const LIMITE_HISTORIAL = 20

export const obtenerPlazoGlobal = async (db) => {
  const { rows } = await db.query(`
    SELECT cfg.dias_plazo_inscripcion AS dias, cfg.actualizado_en,
           usu.id_usuarios AS actualizado_por_id, usu.email AS actualizado_por_email
    FROM configuracion_sistema cfg
    LEFT JOIN usuarios usu ON usu.id_usuarios = cfg.actualizado_por
    WHERE cfg.id = 1`)
  return rows[0] ?? null
}

export const bloquearPlazoGlobal = async (db) => {
  const { rows } = await db.query(
    'SELECT dias_plazo_inscripcion AS dias FROM configuracion_sistema WHERE id = 1 FOR UPDATE'
  )
  return rows[0] ?? null
}

export const guardarPlazoGlobal = async (dias, idUsuario, db) => {
  await db.query(`
    UPDATE configuracion_sistema
    SET dias_plazo_inscripcion = $1, actualizado_por = $2, actualizado_en = NOW()
    WHERE id = 1`, [dias, idUsuario])
}

export const obtenerPlazoCurso = async (idCurso, db) => {
  const { rows } = await db.query(`
    SELECT cu.id_curso, cu.nombre, cu.estado, cu.cupo_total,
           cu.dias_plazo_inscripcion AS dias_curso,
           cfg.dias_plazo_inscripcion AS dias_global,
           cu.plazo_actualizado_en,
           usu.id_usuarios AS plazo_actualizado_por_id,
           usu.email AS plazo_actualizado_por_email,
           ${COLUMNAS_ESTADO_INSCRIPCION}
    FROM curso cu
    CROSS JOIN configuracion_sistema cfg
    LEFT JOIN usuarios usu ON usu.id_usuarios = cu.plazo_actualizado_por
    ${unirEstadoInscripcion('cu')}
    WHERE cu.id_curso = $1 AND cfg.id = 1`, [idCurso])
  return rows[0] ?? null
}

export const bloquearPlazoCurso = async (idCurso, db) => {
  const { rows } = await db.query(
    'SELECT dias_plazo_inscripcion AS dias FROM curso WHERE id_curso = $1 FOR UPDATE',
    [idCurso]
  )
  return rows[0] ?? null
}

export const guardarPlazoCurso = async (idCurso, dias, idUsuario, db) => {
  await db.query(`
    UPDATE curso
    SET dias_plazo_inscripcion = $1, plazo_actualizado_por = $2, plazo_actualizado_en = NOW()
    WHERE id_curso = $3`, [dias, idUsuario, idCurso])
}

export const registrarCambioDePlazo = async ({ ambito, idCurso = null, diasAnterior, diasNuevo, idUsuario }, db) => {
  await db.query(`
    INSERT INTO historial_plazo_inscripcion (ambito, id_curso, dias_anterior, dias_nuevo, modificado_por)
    VALUES ($1, $2, $3, $4, $5)`, [ambito, idCurso, diasAnterior, diasNuevo, idUsuario])
}

export const obtenerHistorialDePlazo = async ({ ambito, idCurso = null }, db) => {
  const { rows } = await db.query(`
    SELECT his.id_historial, his.dias_anterior, his.dias_nuevo, his.modificado_en,
           usu.id_usuarios AS modificado_por_id, usu.email AS modificado_por_email
    FROM historial_plazo_inscripcion his
    LEFT JOIN usuarios usu ON usu.id_usuarios = his.modificado_por
    WHERE his.ambito = $1 AND his.id_curso IS NOT DISTINCT FROM $2
    ORDER BY his.modificado_en DESC, his.id_historial DESC
    LIMIT $3`, [ambito, idCurso, LIMITE_HISTORIAL])
  return rows
}

export const contarCursosPorEstadoInscripcion = async (db) => {
  const { rows } = await db.query(`
    SELECT plazo.estado AS estado_inscripcion, COUNT(*)::int AS cantidad
    FROM curso cu
    ${unirEstadoInscripcion('cu')}
    GROUP BY plazo.estado`)
  return Object.fromEntries(rows.map((fila) => [fila.estado_inscripcion, fila.cantidad]))
}
