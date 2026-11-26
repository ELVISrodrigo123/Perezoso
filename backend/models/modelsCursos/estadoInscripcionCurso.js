import dataBase from '../../db/dataBase.js'

export const ZONA_HORARIA_ACADEMIA = 'America/La_Paz'

export const unirEstadoInscripcion = (alias) => `
  CROSS JOIN LATERAL (
    SELECT
      limites.*,
      CASE
        WHEN limites.estado_curso IS DISTINCT FROM 'Activo' THEN 'inactivo'
        WHEN limites.hoy > limites.fecha_fin THEN 'terminado'
        WHEN limites.hoy > limites.fecha_limite THEN 'plazo_vencido'
        WHEN limites.cupos_disponibles <= 0 THEN 'sin_cupos'
        ELSE 'abierta'
      END AS estado
    FROM (
      SELECT
        datos.*,
        LEAST(datos.fecha_inicio + datos.dias_plazo_efectivo, datos.fecha_fin) AS fecha_limite,
        GREATEST(datos.cupo_total - datos.cupos_ocupados, 0) AS cupos_disponibles
      FROM (
        SELECT
          ${alias}.estado AS estado_curso,
          ${alias}.cupo_total,
          ${alias}.fecha_creacion::date AS fecha_inicio,
          (${alias}.fecha_creacion + ${alias}.duracion)::date AS fecha_fin,
          COALESCE(${alias}.dias_plazo_inscripcion, cfg.dias_plazo_inscripcion) AS dias_plazo_efectivo,
          CASE WHEN ${alias}.dias_plazo_inscripcion IS NULL THEN 'global' ELSE 'curso' END AS origen_plazo,
          (SELECT COUNT(*)::int FROM inscripcion ocupadas WHERE ocupadas.id_curso = ${alias}.id_curso) AS cupos_ocupados,
          (NOW() AT TIME ZONE '${ZONA_HORARIA_ACADEMIA}')::date AS hoy
        FROM configuracion_sistema cfg
        WHERE cfg.id = 1
      ) datos
    ) limites
  ) plazo`

export const COLUMNAS_ESTADO_INSCRIPCION = `
  to_char(plazo.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio_inscripcion,
  to_char(plazo.fecha_limite, 'YYYY-MM-DD') AS fecha_limite_inscripcion,
  to_char(plazo.fecha_fin, 'YYYY-MM-DD') AS fecha_fin_curso,
  plazo.dias_plazo_efectivo,
  plazo.origen_plazo,
  plazo.cupos_ocupados,
  plazo.cupos_disponibles,
  plazo.estado AS estado_inscripcion,
  (plazo.estado = 'abierta') AS inscripcion_abierta,
  (plazo.hoy >= plazo.fecha_inicio) AS curso_iniciado`

export const obtenerEstadoInscripcionCurso = async (idCurso, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT cu.id_curso, cu.nombre, ${COLUMNAS_ESTADO_INSCRIPCION}
    FROM curso cu
    ${unirEstadoInscripcion('cu')}
    WHERE cu.id_curso = $1`, [idCurso])
  return rows[0] ?? null
}

export const bloquearCurso = async (idCurso, db) => {
  const { rowCount } = await db.query('SELECT 1 FROM curso WHERE id_curso = $1 FOR UPDATE', [idCurso])
  return rowCount > 0
}
