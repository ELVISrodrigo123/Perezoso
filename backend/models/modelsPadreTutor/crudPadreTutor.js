import dataBase from '../../db/dataBase.js'

export const obtenerPadresTutors = async ({ limit, offset, filtros = {} } = {}) => {
  const { id, nombre, ci, telefono, direccion, estado } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (id?.trim()) agregar('id_tutor::text ILIKE ?', `%${id.trim()}%`)
  if (nombre?.trim()) agregar('(nombre || \' \' || a_paterno || \' \' || COALESCE(a_materno, \'\')) ILIKE ?', `%${nombre.trim()}%`)
  if (ci?.trim()) agregar('ci::text ILIKE ?', `%${ci.trim()}%`)
  if (telefono?.trim()) agregar('telefono::text ILIKE ?', `%${telefono.trim()}%`)
  if (direccion?.trim()) agregar('direccion ILIKE ?', `%${direccion.trim()}%`)
  if (estado?.trim()) agregar('estado = ?', estado.trim())

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await dataBase.query(`SELECT COUNT(*) FROM padre_tutor ${where}`, valores)

  const dataResult = await dataBase.query(`
    SELECT * FROM padre_tutor
    ${where}
    ORDER BY id_tutor DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const registrarPadreTutor = async (data) => {
  const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, direccion } = data
  const resultado = await dataBase.query(`
    INSERT INTO padre_tutor (nombre, a_paterno, a_materno, ci, telefono, direccion) 
    VALUES ($1, $2, $3, $4, $5, $6)`
  , [nombre, apellidoPaterno, apellidoMaterno, ci, telefono, direccion])
  return resultado
}

export const actualizarPadreTutor = async (id, data) => {
  const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, direccion } = data
  const resultado = await dataBase.query(`
    UPDATE padre_tutor 
    SET 
    nombre = $1, 
    a_paterno = $2, 
    a_materno = $3, 
    ci = $4, 
    telefono = $5, 
    direccion = $6
    WHERE id_tutor = $7`
  , [nombre, apellidoPaterno, apellidoMaterno, ci, telefono, direccion, id])
  return resultado
}

export const cambiarEstadoPadreTutor = async (id, estado) => {
  const resultado = await dataBase.query(`
    UPDATE padre_tutor
    SET estado = $1
    WHERE id_tutor = $2`, [estado, id])
  return resultado
}

export const obtenerTipoEstadoPadreTutor = async (id) => {
  const resultado = await dataBase.query(`
    SELECT estado FROM padre_tutor
    WHERE id_tutor = $1`, [id])
  return resultado
}
