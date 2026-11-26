import dataBase from '../../db/dataBase.js'

export const ROL_SUPER_ADMINISTRADOR = 'super_administrador'

export const obtenerAccesoEfectivo = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(`
    WITH cuenta AS (
      SELECT u.id_usuarios, u.email, u.estado, u.permissions_version,
             EXISTS (
               SELECT 1 FROM administradores a
               WHERE a.id_usuarios = u.id_usuarios AND a.es_super = true
             ) AS es_super
      FROM usuarios u
      WHERE u.id_usuarios = $1
    ),
    roles_activos AS (
      SELECT r.id, r.code
      FROM usuario_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.id_usuario = $1 AND ur.estado = 'Activo' AND r.status = 'activo'
    ),
    efectivos AS (
      SELECT p.code
      FROM permissions p
      CROSS JOIN cuenta c
      WHERE c.es_super
         OR (
           (
             EXISTS (
               SELECT 1 FROM role_permissions rp
               WHERE rp.permission_id = p.id AND rp.role_id IN (SELECT id FROM roles_activos)
             )
             OR EXISTS (
               SELECT 1 FROM user_permissions up
               WHERE up.user_id = $1 AND up.permission_id = p.id AND up.effect = 'allow'
             )
           )
           AND NOT EXISTS (
             SELECT 1 FROM user_permissions up
             WHERE up.user_id = $1 AND up.permission_id = p.id AND up.effect = 'deny'
           )
         )
    )
    SELECT c.id_usuarios, c.email, c.estado, c.permissions_version, c.es_super,
           COALESCE((SELECT array_agg(code ORDER BY code) FROM roles_activos), '{}') AS roles,
           COALESCE((SELECT array_agg(code ORDER BY code) FROM efectivos), '{}') AS permissions
    FROM cuenta c`, [idUsuario])

  const fila = rows[0]
  if (!fila) return null

  const roles = fila.es_super && !fila.roles.includes(ROL_SUPER_ADMINISTRADOR)
    ? [...fila.roles, ROL_SUPER_ADMINISTRADOR]
    : fila.roles

  return {
    id: fila.id_usuarios,
    email: fila.email,
    estado: fila.estado,
    version: fila.permissions_version,
    esSuper: fila.es_super,
    roles,
    permissions: fila.permissions
  }
}

export const obtenerVersionDePermisos = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(
    'SELECT estado, permissions_version FROM usuarios WHERE id_usuarios = $1',
    [idUsuario]
  )
  return rows[0] ? { estado: rows[0].estado, version: rows[0].permissions_version } : null
}

export const obtenerMenuPorPermisos = async (permisos, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT code, route, label, icon, section, sort_order
    FROM permissions
    WHERE type = 'menu' AND code = ANY ($1::text[])
    ORDER BY sort_order, label`, [permisos])
  return rows
}
