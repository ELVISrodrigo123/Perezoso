import dataBase from '../../db/dataBase.js'

export const loginUsuario = async (email) => {
  const result = await dataBase.query('SELECT * FROM usuarios WHERE email = $1', [email])
  return result
}

export const obtenerCuentaPorId = async (idUsuario) => {
  const result = await dataBase.query(
    'SELECT id_usuarios, email, estado FROM usuarios WHERE id_usuarios = $1',
    [idUsuario]
  )
  return result.rows[0] ?? null
}

export const obtenerRolesActivos = async (idUsuario) => {
  const result = await dataBase.query(
    `SELECT role FROM usuario_roles
     WHERE id_usuario = $1 AND estado = 'Activo'`,
    [idUsuario]
  )
  return result.rows.map((fila) => fila.role)
}

export const habilitarUsuario = async (idUsuario, role) => {
  await dataBase.query(
    'UPDATE usuarios SET estado = \'Activo\' WHERE id_usuarios = $1',
    [idUsuario]
  )
  return dataBase.query(
    `UPDATE usuario_roles SET estado = 'Activo'
     WHERE id_usuario = $1 AND role = $2`,
    [idUsuario, role]
  )
}

export const deshabilitarRol = async (idUsuario, role, connection = dataBase) => {
  return connection.query(
    `UPDATE usuario_roles SET estado = 'Inactivo'
     WHERE id_usuario = $1 AND role = $2`,
    [idUsuario, role]
  )
}
