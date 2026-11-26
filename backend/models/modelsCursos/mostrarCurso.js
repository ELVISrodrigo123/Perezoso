import dataBase from '../../db/dataBase.js'

export const mostrarCursos = async ({ limit, offset, filtros = {} } = {}) => {
  const { curso, profesor, descripcion, duracion, precio, cupos, inicio, fin, estado } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (curso?.trim()) agregar('cu.nombre ILIKE ?', `%${curso.trim()}%`)
  if (profesor?.trim()) agregar('(pro.nombre || \' \' || pro.a_paterno) = ?', profesor.trim())
  if (descripcion?.trim()) agregar('cu.descripcion ILIKE ?', `%${descripcion.trim()}%`)
  if (duracion?.trim()) {
    const texto = duracion
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/dias?/g, 'day')
      .replace(/mes(es)?/g, 'mon')
    agregar('cu.duracion::text ILIKE ?', `%${texto}%`)
  }
  if (precio?.trim()) agregar('cu.costo::text ILIKE ?', `%${precio.trim()}%`)
  if (cupos?.trim()) agregar('cu.cupo_total::text ILIKE ?', `%${cupos.trim()}%`)
  if (inicio?.trim()) agregar('cu.fecha_creacion::date = ?::date', inicio.trim())
  if (fin?.trim()) agregar('(cu.fecha_creacion + cu.duracion)::date = ?::date', fin.trim())
  if (estado?.trim()) agregar('cu.estado = ?', estado.trim())

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await dataBase.query(`
    SELECT COUNT(*)
    FROM curso cu
    JOIN profesor pro ON pro.id_profesor = cu.id_profesor
    ${where}`, valores)

  const dataResult = await dataBase.query(`
    SELECT cu.*,
    (pro.nombre || ' ' || pro.a_paterno) AS profesor_nombre,
    (cu.fecha_creacion + cu.duracion) AS fecha_fin
    FROM curso cu
    JOIN profesor pro ON pro.id_profesor = cu.id_profesor
    ${where}
    ORDER BY cu.fecha_creacion DESC, cu.id_curso DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const mostrarCursosPorVencer = async () => {
  const informe = await dataBase.query(`
        SELECT 
          id_curso,
          nombre,
          fecha_creacion,
          duracion AS duracion_registrada,
          (fecha_creacion + duracion::INTERVAL)::DATE AS fecha_fin,
          ((fecha_creacion + duracion::INTERVAL)::DATE - CURRENT_DATE) AS dias_restantes
        FROM curso
        WHERE 
            ((fecha_creacion + duracion::INTERVAL)::DATE - CURRENT_DATE) BETWEEN 0 AND 7; 
    `)
  return informe.rows
}
