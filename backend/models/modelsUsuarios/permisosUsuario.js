import dataBase from '../../db/dataBase.js'

export const obtenerPermisosDelRol = async (idUsuario, role, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT DISTINCT rp.permission_code
    FROM role_permissions rp
    WHERE rp.role_code = $2
       OR (
         rp.role_code = 'super_administrador'
         AND $2 = 'administrador'
         AND EXISTS (
           SELECT 1 FROM administradores adm
           WHERE adm.id_usuarios = $1 AND adm.es_super = true
         )
       )
    ORDER BY rp.permission_code`, [idUsuario, role])
  return rows.map((fila) => fila.permission_code)
}
