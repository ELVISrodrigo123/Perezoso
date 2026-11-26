import db from '../../db/dataBase.js'

export const mostrarPreinscripcionEstudiante = async ({ limit, offset, filtros = {} } = {}) => {
  const { estado, solicitante, ci, colegio, direccion, telefono, email, solicitud, sinAprobadas } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (sinAprobadas === 'true') condiciones.push('COALESCE(estado, \'\') NOT ILIKE \'%aprob%\'')

  if (estado?.trim()) agregar('LOWER(COALESCE(estado, \'pendiente\')) = LOWER(?)', estado.trim())
  if (solicitante?.trim()) agregar('(nombre || \' \' || a_paterno || \' \' || COALESCE(a_materno, \'\')) ILIKE ?', `%${solicitante.trim()}%`)
  if (ci?.trim()) agregar('ci::text ILIKE ?', `%${ci.trim()}%`)
  if (colegio?.trim()) agregar('colegio ILIKE ?', `%${colegio.trim()}%`)
  if (direccion?.trim()) agregar('direccion ILIKE ?', `%${direccion.trim()}%`)
  if (telefono?.trim()) agregar('telefono::text ILIKE ?', `%${telefono.trim()}%`)
  if (email?.trim()) agregar('email ILIKE ?', `%${email.trim()}%`)
  if (solicitud?.trim()) agregar('fecha_solicitud::date = ?::date', solicitud.trim())

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await db.query(
    `SELECT COUNT(*) FROM pre_inscripcion_estudiante ${where}`,
    valores
  )

  const dataResult = await db.query(`
    SELECT id_solicitud AS id,
    ( nombre||' ' ||a_paterno||' '||a_materno) AS nombre,
    colegio,
    ci, direccion, telefono, email, fecha_solicitud, estado, observacion
    FROM pre_inscripcion_estudiante
    ${where}
    ORDER BY fecha_solicitud DESC, id_solicitud DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}
