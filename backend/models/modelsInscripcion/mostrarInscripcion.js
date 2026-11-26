import dataBase from '../../db/dataBase.js'

export const mostrarInscripcion = async ({ limit, offset, filtros = {} } = {}) => {
  const { inscripcion, estudiante, curso, profesor, duracion, costo } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (inscripcion?.trim()) agregar('ins.fecha_inscripcion::date = ?::date', inscripcion.trim())
  if (estudiante?.trim()) agregar('(es.nombre || \' \' || es.a_paterno || \' \' || COALESCE(es.a_materno, \'\')) ILIKE ?', `%${estudiante.trim()}%`)
  if (curso?.trim()) agregar('cu.nombre ILIKE ?', `%${curso.trim()}%`)
  if (profesor?.trim()) agregar('(pro.nombre || \' \' || pro.a_paterno || \' \' || COALESCE(pro.a_materno, \'\')) ILIKE ?', `%${profesor.trim()}%`)
  if (duracion?.trim()) {
    // el usuario escribe "30 días" o "2 meses"; en la base se guarda como "30 days" / "2 mons"
    const texto = duracion
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/dias?/g, 'day')
      .replace(/mes(es)?/g, 'mon')
    agregar('cu.duracion::text ILIKE ?', `%${texto}%`)
  }
  if (costo?.trim()) agregar('cu.costo::text ILIKE ?', `%${costo.trim()}%`)

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await dataBase.query(`
    SELECT COUNT(*)
    FROM inscripcion ins
    JOIN curso cu ON cu.id_curso = ins.id_curso
    JOIN estudiante es ON es.id_estudiante = ins.id_estudiante
    JOIN profesor pro ON pro.id_profesor = cu.id_profesor
    ${where}`, valores)

  const dataResult = await dataBase.query(`
    SELECT ins.id_inscripcion, ins.fecha_inscripcion,
    (es.nombre ||' '||es.a_paterno||' '||es.a_materno) AS estudiante,
    cu.nombre AS curso,
    (pro.nombre||' '||pro.a_paterno||' '||pro.a_materno) AS profesor,
    cu.duracion, cu.costo
    FROM inscripcion ins
    JOIN curso cu ON cu.id_curso = ins.id_curso
    JOIN estudiante es ON es.id_estudiante = ins.id_estudiante
    JOIN profesor pro ON pro.id_profesor = cu.id_profesor
    ${where}
    ORDER BY ins.fecha_inscripcion DESC, ins.id_inscripcion DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}
