import dataBase from '../../db/dataBase.js'

export const obtenerAdministradores = async ({ limit, offset, filtros = {} } = {}, db = dataBase) => {
  const { administrador, ci, telefono, email, registro, estado } = filtros

  const condiciones = []
  const valores = []
  const agregar = (sql, valor) => {
    valores.push(valor)
    condiciones.push(sql.replace('?', `$${valores.length}`))
  }

  if (administrador?.trim()) agregar('(adm.nombre || \' \' || adm.a_paterno || \' \' || COALESCE(adm.a_materno, \'\')) ILIKE ?', `%${administrador.trim()}%`)
  if (ci?.trim()) agregar('adm.ci::text ILIKE ?', `%${ci.trim()}%`)
  if (telefono?.trim()) agregar('adm.telefono::text ILIKE ?', `%${telefono.trim()}%`)
  if (email?.trim()) agregar('adm.email ILIKE ?', `%${email.trim()}%`)
  if (registro?.trim()) agregar('adm.fecha_registro::date = ?::date', registro.trim())
  if (estado?.trim()) agregar('ur.estado = ?', estado.trim())

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

  const totalResult = await db.query(`
    SELECT COUNT(*)
    FROM administradores adm
    JOIN usuario_roles ur ON ur.id_usuario = adm.id_usuarios AND ur.role = 'administrador'
    ${where}`, valores)

  const dataResult = await db.query(`
    SELECT adm.*, ur.estado, adm.id_usuarios AS id_cuenta
    FROM administradores adm
    JOIN usuario_roles ur ON ur.id_usuario = adm.id_usuarios AND ur.role = 'administrador'
    ${where}
    ORDER BY adm.fecha_registro DESC, adm.id_administrador DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const registrarAdministrador = async (data, db = dataBase) => {
  const { idUsuarios, nombre, apellidoPaterno, apellidoMaterno, telefono, ci, email } = data
  const resultado = await db.query(`
    INSERT INTO administradores (id_usuarios, nombre, a_paterno, a_materno, ci, telefono, email)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`
  , [idUsuarios, nombre, apellidoPaterno, apellidoMaterno || null, ci, telefono || null, email])
  return resultado
}

export const actualizarAdministrador = async (id, data, db = dataBase) => {
  const { nombre, apellidoPaterno, apellidoMaterno, telefono, ci, email } = data
  const resultado = await db.query(`
    UPDATE administradores
    SET
    nombre = $1,
    a_paterno = $2,
    a_materno = $3,
    ci = $4,
    telefono = $5,
    email = $6
    WHERE id_administrador = $7 RETURNING *`
  , [nombre, apellidoPaterno, apellidoMaterno || null, ci, telefono || null, email, id])
  return resultado
}

export const cambiarEstadoAdministrador = async (id, estado, db = dataBase) => {
  const resultado = await db.query(`
    UPDATE usuario_roles
    SET estado = $1
    WHERE role = 'administrador'
      AND id_usuario = (
        SELECT id_usuarios FROM administradores
        WHERE id_administrador = $2
      )
    RETURNING id_usuario AS id_usuarios, estado`, [estado, id])
  return resultado
}

export const obtenerTipoEstadoAdministrador = async (id, db = dataBase) => {
  const resultado = await db.query(`
    SELECT ur.estado
    FROM usuario_roles ur
    JOIN administradores a ON a.id_usuarios = ur.id_usuario
    WHERE ur.role = 'administrador' AND a.id_administrador = $1`, [id])
  return resultado
}

// ---------- Validaciones de duplicados ----------

// excluirIdUsuario es opcional: se usa al editar para ignorar al propio usuario
export const existeUsuarioPorEmail = async (email, excluirIdUsuario = null, db = dataBase) => {
  const resultado = excluirIdUsuario === null
    ? await db.query('SELECT 1 FROM usuarios WHERE email = $1 LIMIT 1', [email])
    : await db.query(
      'SELECT 1 FROM usuarios WHERE email = $1 AND id_usuarios <> $2 LIMIT 1',
      [email, excluirIdUsuario]
    )
  return resultado.rowCount > 0
}

// excluirIdAdministrador es opcional: se usa al editar para ignorar al propio administrador
export const existeAdminPorCi = async (ci, excluirIdAdministrador = null, db = dataBase) => {
  const resultado = excluirIdAdministrador === null
    ? await db.query('SELECT 1 FROM administradores WHERE ci = $1 LIMIT 1', [ci])
    : await db.query(
      'SELECT 1 FROM administradores WHERE ci = $1 AND id_administrador <> $2 LIMIT 1',
      [ci, excluirIdAdministrador]
    )
  return resultado.rowCount > 0
}

export const existeAdminPorEmail = async (email, excluirIdAdministrador = null, db = dataBase) => {
  const resultado = excluirIdAdministrador === null
    ? await db.query('SELECT 1 FROM administradores WHERE email = $1 LIMIT 1', [email])
    : await db.query(
      'SELECT 1 FROM administradores WHERE email = $1 AND id_administrador <> $2 LIMIT 1',
      [email, excluirIdAdministrador]
    )
  return resultado.rowCount > 0
}

// ---------- Consultas auxiliares para editar / dar de baja ----------

export const obtenerAdministradorParaEditar = async (id, db = dataBase) => {
  const resultado = await db.query(
    `SELECT adm.ci, adm.id_usuarios, usu.email AS usuario_actual
     FROM administradores adm
     LEFT JOIN usuarios usu ON usu.id_usuarios = adm.id_usuarios
     WHERE adm.id_administrador = $1`,
    [id]
  )
  return resultado
}

export const obtenerAdministradorParaBaja = async (id, db = dataBase) => {
  const resultado = await db.query(
    'SELECT id_usuarios, es_super FROM administradores WHERE id_administrador = $1',
    [id]
  )
  return resultado
}

export const actualizarEmailUsuario = async (idUsuario, email, db = dataBase) => {
  const resultado = await db.query(
    'UPDATE usuarios SET email = $1 WHERE id_usuarios = $2',
    [email, idUsuario]
  )
  return resultado
}

export const actualizarPasswordUsuario = async (idUsuario, passwordHash, db = dataBase) => {
  const resultado = await db.query(
    'UPDATE usuarios SET password_hash = $1 WHERE id_usuarios = $2',
    [passwordHash, idUsuario]
  )
  return resultado
}

// ---------- Verificación de super administrador ----------

export const esSuperAdministrador = async (idUsuario, db = dataBase) => {
  const resultado = await db.query(
    'SELECT 1 FROM administradores WHERE id_usuarios = $1 AND es_super = true LIMIT 1',
    [idUsuario]
  )
  return resultado.rowCount > 0
}
