import dataBase from '../../db/dataBase.js'

export const mostrarRecibos = async ({ limit, offset }) => {
  const totalResult = await dataBase.query('SELECT COUNT(*) FROM historial_inscripciones')

  const dataResult = await dataBase.query(`
    SELECT * FROM historial_inscripciones
    ORDER BY fecha_pago DESC, id_recibo DESC
    LIMIT $1 OFFSET $2`, [limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const verificarRecibo = async (idRecibo) => {
  const informe = await dataBase.query(`
    SELECT
      id_recibo,
      id_inscripcion,
      padre_tutor,
      padre_ci,
      estudiante,
      curso,
      monto_pagado,
      fecha_pago
    FROM historial_inscripciones
    WHERE id_recibo = $1
    LIMIT 1
  `, [idRecibo])
  return informe
}

export const registrarRecibos = async (datos) => {
  const { idInscripcion, padreTutor, padreCi, montoPagado, idPadre, idEstudiante, estudiante, idCurso, curso } = datos
  const informe = await dataBase.query(`
    INSERT INTO historial_inscripciones ( id_inscripcion, padre_tutor, padre_ci, monto_pagado, id_padre, id_estudiante, estudiante, id_curso, curso)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_recibo, id_inscripcion, padre_tutor, padre_ci, monto_pagado, fecha_pago
  `, [idInscripcion, padreTutor, padreCi, montoPagado, idPadre, idEstudiante, estudiante, idCurso, curso])
  return informe
}

export const telefonoTutorActivo = async (idTutor) => {
  const { rows } = await dataBase.query(
    `SELECT telefono FROM padre_tutor
     WHERE id_tutor = $1 AND estado = 'Activo'`,
    [idTutor]
  )
  return rows[0]?.telefono ?? null
}

export const controlPagosDeEstudiantesACursos = async ({ limit, offset, filtros = {} } = {}) => {
  const { inscripcion, estudiante, ci, direccion, telefono, curso, costo, estado } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (inscripcion?.trim()) agregar('ins.fecha_inscripcion::date = ?::date', inscripcion.trim())
  if (estudiante?.trim()) agregar('(est.nombre || \' \' || est.a_paterno || \' \' || COALESCE(est.a_materno, \'\')) ILIKE ?', `%${estudiante.trim()}%`)
  if (ci?.trim()) agregar('est.ci::text ILIKE ?', `%${ci.trim()}%`)
  if (direccion?.trim()) agregar('est.direccion ILIKE ?', `%${direccion.trim()}%`)
  if (telefono?.trim()) agregar('est.telefono::text ILIKE ?', `%${telefono.trim()}%`)
  if (curso?.trim()) agregar('cur.nombre ILIKE ?', `%${curso.trim()}%`)
  if (costo?.trim()) agregar('cur.costo::text ILIKE ?', `%${costo.trim()}%`)
  if (estado?.trim()) agregar('UPPER(TRIM(ins.estado_pago)) = UPPER(?)', estado.trim())

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await dataBase.query(`
    SELECT COUNT(*)
    FROM inscripcion ins
    JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
    JOIN curso cur ON cur.id_curso = ins.id_curso
    ${where}`, valores)

  const dataResult = await dataBase.query(`
    SELECT
      ins.id_inscripcion,
      est.id_estudiante,
      cur.id_curso,
      ins.fecha_inscripcion,
      (est.nombre || ' ' || est.a_paterno || ' ' || est.a_materno) AS estudiante,
      est.ci,
      est.direccion,
      est.telefono,
      cur.nombre AS materia,
      cur.costo,
      ins.estado_pago
    FROM inscripcion ins
    JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
    JOIN curso cur ON cur.id_curso = ins.id_curso
    ${where}
    ORDER BY ins.fecha_inscripcion ASC, ins.id_inscripcion ASC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const marcarInscripcionComoPagada = async (idInscripcion) => {
  const informe = await dataBase.query(`
    UPDATE inscripcion
    SET estado_pago = 'PAGADO'
    WHERE id_inscripcion = $1
`, [idInscripcion])
  return informe
}

// ---------- RECIBOS AGRUPADOS POR PADRE / TUTOR ----------

// misma regla que usaba el frontend para agrupar: por id del padre y, si no hay, por su CI
const CLAVE_GRUPO = `
  CASE
    WHEN id_padre IS NOT NULL THEN 'id:' || id_padre::text
    WHEN padre_ci IS NOT NULL AND TRIM(padre_ci::text) <> '' THEN 'ci:' || padre_ci::text
    ELSE 'sin-identificador:' || id_recibo::text
  END`

// búsqueda global del cuadro de arriba (se aplica a cada recibo)
const CONDICION_BUSQUEDA = '(padre_tutor ILIKE ? OR padre_ci::text ILIKE ? OR monto_pagado::text ILIKE ? OR estudiante ILIKE ? OR curso ILIKE ?)'

// Resumen: una fila por padre/tutor, paginado
export const mostrarResumenRecibosPorPadre = async ({ limit, offset, filtros = {} } = {}) => {
  const { buscar, padre_tutor: padreTutor, padre_ci: padreCi, recibos, total: filtroTotal } = filtros
  const valores = []
  const condicionesBase = []
  const condicionesGrupo = []
  const agregar = (lista, sql, valor) => {
    valores.push(valor)
    lista.push(sql.replaceAll('?', `$${valores.length}`))
  }

  if (buscar?.trim()) agregar(condicionesBase, CONDICION_BUSQUEDA, `%${buscar.trim()}%`)
  if (padreTutor?.trim()) agregar(condicionesGrupo, 'padre_tutor ILIKE ?', `%${padreTutor.trim()}%`)
  if (padreCi?.trim()) agregar(condicionesGrupo, 'padre_ci ILIKE ?', `%${padreCi.trim()}%`)
  if (recibos?.trim()) agregar(condicionesGrupo, 'cantidad_recibos::text ILIKE ?', `%${recibos.trim()}%`)
  if (filtroTotal?.trim()) agregar(condicionesGrupo, 'total::text ILIKE ?', `%${filtroTotal.trim()}%`)

  const whereBase = condicionesBase.length ? `WHERE ${condicionesBase.join(' AND ')}` : ''
  const whereGrupo = condicionesGrupo.length ? `WHERE ${condicionesGrupo.join(' AND ')}` : ''

  const cte = `
    WITH base AS (
      SELECT *, ${CLAVE_GRUPO} AS clave_grupo
      FROM historial_inscripciones
      ${whereBase}
    ),
    resumen AS (
      SELECT
        clave_grupo AS identificador,
        COALESCE(NULLIF((ARRAY_AGG(padre_tutor ORDER BY id_recibo DESC))[1], ''), 'Sin nombre registrado') AS padre_tutor,
        COALESCE(NULLIF((ARRAY_AGG(padre_ci::text ORDER BY id_recibo DESC))[1], ''), 'Sin CI') AS padre_ci,
        COUNT(*)::int AS cantidad_recibos,
        COALESCE(SUM(monto_pagado), 0) AS total,
        MAX(fecha_pago) AS ultimo_pago
      FROM base
      GROUP BY clave_grupo
    )`

  const totalResult = await dataBase.query(
    `${cte} SELECT COUNT(*) FROM resumen ${whereGrupo}`,
    valores
  )

  const dataResult = await dataBase.query(
    `${cte}
     SELECT * FROM resumen ${whereGrupo}
     ORDER BY ultimo_pago DESC, identificador
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limit, offset]
  )

  // totales generales de la pantalla (sin filtros)
  const totalesResult = await dataBase.query(`
    SELECT COUNT(*)::int AS recibos, COALESCE(SUM(monto_pagado), 0) AS recaudado
    FROM historial_inscripciones`)

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10),
    totales: totalesResult.rows[0]
  }
}

// Detalle: recibos de un padre/tutor, paginado
export const mostrarRecibosDePadre = async ({ limit, offset, filtros = {} } = {}) => {
  const {
    grupo,
    buscar,
    id_recibo: idRecibo,
    estudiante,
    curso,
    monto_pagado: montoPagado,
    fecha_pago: fechaPago
  } = filtros
  const valores = []
  const condiciones = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replaceAll('?', `$${valores.length}`))
  }

  agregar(`${CLAVE_GRUPO} = ?`, grupo)
  if (buscar?.trim()) agregar(CONDICION_BUSQUEDA, `%${buscar.trim()}%`)
  if (idRecibo?.trim()) agregar('id_recibo::text ILIKE ?', `%${idRecibo.trim()}%`)
  if (estudiante?.trim()) agregar('estudiante ILIKE ?', `%${estudiante.trim()}%`)
  if (curso?.trim()) agregar('curso ILIKE ?', `%${curso.trim()}%`)
  if (montoPagado?.trim()) agregar('monto_pagado::text ILIKE ?', `%${montoPagado.trim()}%`)
  if (fechaPago?.trim()) agregar('fecha_pago::date = ?::date', fechaPago.trim())

  const where = `WHERE ${condiciones.join(' AND ')}`

  const resumenResult = await dataBase.query(`
    SELECT COUNT(*)::int AS total_recibos, COALESCE(SUM(monto_pagado), 0) AS total_pagado
    FROM historial_inscripciones
    ${where}`, valores)

  const dataResult = await dataBase.query(`
    SELECT * FROM historial_inscripciones
    ${where}
    ORDER BY fecha_pago DESC, id_recibo DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: resumenResult.rows[0].total_recibos,
    resumen: resumenResult.rows[0]
  }
}
