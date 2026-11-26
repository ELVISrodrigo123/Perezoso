import dataBase from '../../db/dataBase.js'

export const obtenerCatalogoDePermisos = async (db = dataBase) => {
  const { rows } = await db.query(`
    SELECT id, code, module, description, type, route, label, icon, section, sort_order
    FROM permissions
    ORDER BY (type = 'action'), sort_order NULLS LAST, module, code`)
  return rows
}

export const obtenerRoles = async (db = dataBase) => {
  const { rows } = await db.query(`
    SELECT r.id, r.code, r.name, r.description, r.status, r.is_system,
           (SELECT COUNT(*)::int FROM usuario_roles ur
            WHERE ur.role_id = r.id AND ur.estado = 'Activo') AS usuarios,
           COALESCE((SELECT array_agg(p.code ORDER BY p.code)
                     FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
                     WHERE rp.role_id = r.id), '{}') AS permissions
    FROM roles r
    ORDER BY r.is_system DESC, r.id`)
  return rows
}

export const obtenerRolPorId = async (idRol, db = dataBase) => {
  const { rows } = await db.query('SELECT * FROM roles WHERE id = $1', [idRol])
  return rows[0] ?? null
}

export const crearRol = async ({ code, name, description }, db = dataBase) => {
  const { rows } = await db.query(`
    INSERT INTO roles (code, name, description, status, is_system)
    VALUES ($1, $2, $3, 'activo', false)
    RETURNING *`, [code, name, description || null])
  return rows[0]
}

export const actualizarRol = async (idRol, { name, description }, db = dataBase) => {
  const { rows } = await db.query(`
    UPDATE roles SET name = $2, description = $3
    WHERE id = $1
    RETURNING *`, [idRol, name, description || null])
  return rows[0] ?? null
}

export const cambiarEstadoRol = async (idRol, status, db = dataBase) => {
  const { rows } = await db.query(
    'UPDATE roles SET status = $2 WHERE id = $1 RETURNING *',
    [idRol, status]
  )
  return rows[0] ?? null
}

export const buscarPermisosPorCodigo = async (codigos, db = dataBase) => {
  const { rows } = await db.query(
    'SELECT id, code FROM permissions WHERE code = ANY ($1::text[])',
    [codigos]
  )
  return rows
}

export const reemplazarPermisosDelRol = async (idRol, idsPermisos, db = dataBase) => {
  await db.query(`
    DELETE FROM role_permissions
    WHERE role_id = $1 AND NOT (permission_id = ANY ($2::int[]))`, [idRol, idsPermisos])
  await db.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT $1, unnest($2::int[])
    ON CONFLICT DO NOTHING`, [idRol, idsPermisos])
}

const FILTRO_TEXTO = `
  concat_ws(' ', u.email,
    adm.nombre, adm.a_paterno, adm.a_materno, adm.ci,
    pro.nombre, pro.a_paterno, pro.a_materno, pro.ci,
    est.nombre, est.a_paterno, est.a_materno, est.ci) ILIKE '%' || $1 || '%'
  OR EXISTS (
    SELECT 1 FROM usuario_roles urb JOIN roles rb ON rb.id = urb.role_id
    WHERE urb.id_usuario = u.id_usuarios AND urb.estado = 'Activo'
      AND (rb.name ILIKE '%' || $1 || '%' OR rb.code ILIKE '%' || $1 || '%')
  )`

export const buscarUsuarios = async ({ buscar = '', rol = '', limit, offset }, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT u.id_usuarios, u.email, u.estado,
           COALESCE(
             adm.nombre || ' ' || adm.a_paterno,
             pro.nombre || ' ' || pro.a_paterno,
             est.nombre || ' ' || est.a_paterno
           ) AS nombre,
           COALESCE(adm.ci::text, pro.ci::text, est.ci::text) AS ci,
           COALESCE(adm.es_super, false) AS es_super,
           COALESCE((SELECT array_agg(r.code ORDER BY r.code)
                     FROM usuario_roles ur JOIN roles r ON r.id = ur.role_id
                     WHERE ur.id_usuario = u.id_usuarios AND ur.estado = 'Activo'), '{}') AS roles,
           COUNT(*) OVER () AS total
    FROM usuarios u
    LEFT JOIN administradores adm ON adm.id_usuarios = u.id_usuarios
    LEFT JOIN profesor pro ON pro.id_usuario = u.id_usuarios
    LEFT JOIN estudiante est ON est.id_usuario = u.id_usuarios
    WHERE ($1 = '' OR (${FILTRO_TEXTO}))
      AND (
        $2 = ''
        OR ($2 = 'super_administrador' AND COALESCE(adm.es_super, false))
        OR EXISTS (
          SELECT 1 FROM usuario_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.id_usuario = u.id_usuarios AND ur.estado = 'Activo' AND r.code = $2
        )
      )
    ORDER BY nombre NULLS LAST, u.email
    LIMIT $3 OFFSET $4`, [buscar.trim(), rol.trim(), limit, offset])

  return {
    filas: rows.map(({ total, ...fila }) => fila),
    total: rows.length ? Number(rows[0].total) : 0
  }
}

export const obtenerFichasDelUsuario = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT u.id_usuarios, u.email, u.estado,
      (SELECT to_jsonb(a) - 'id_usuarios' FROM (
         SELECT id_administrador, nombre, a_paterno, a_materno, ci, telefono, es_super
         FROM administradores WHERE id_usuarios = u.id_usuarios) a) AS administrador,
      (SELECT to_jsonb(p) FROM (
         SELECT id_profesor, nombre, a_paterno, a_materno, ci, telefono, especialidad
         FROM profesor WHERE id_usuario = u.id_usuarios) p) AS profesor,
      (SELECT to_jsonb(e) FROM (
         SELECT id_estudiante, nombre, a_paterno, a_materno, ci, telefono, colegio
         FROM estudiante WHERE id_usuario = u.id_usuarios) e) AS estudiante
    FROM usuarios u
    WHERE u.id_usuarios = $1`, [idUsuario])
  return rows[0] ?? null
}

export const obtenerRolesDelUsuario = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT r.code, r.status, ur.estado
    FROM usuario_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.id_usuario = $1`, [idUsuario])
  return rows
}

export const obtenerPermisosHeredados = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT DISTINCT p.code
    FROM usuario_roles ur
    JOIN roles r ON r.id = ur.role_id AND r.status = 'activo'
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.id_usuario = $1 AND ur.estado = 'Activo'
    ORDER BY p.code`, [idUsuario])
  return rows.map((fila) => fila.code)
}

export const obtenerPersonalizaciones = async (idUsuario, db = dataBase) => {
  const { rows } = await db.query(`
    SELECT p.code, up.effect
    FROM user_permissions up JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = $1
    ORDER BY p.code`, [idUsuario])
  return rows
}

export const activarRolDelUsuario = async (idUsuario, codigoRol, db = dataBase) => {
  await db.query(`
    INSERT INTO usuario_roles (id_usuario, role, estado)
    VALUES ($1, $2, 'Activo')
    ON CONFLICT (id_usuario, role) DO UPDATE SET estado = 'Activo'
    WHERE usuario_roles.estado IS DISTINCT FROM 'Activo'`, [idUsuario, codigoRol])
}

export const desactivarRolesExcepto = async (idUsuario, codigosRoles, db = dataBase) => {
  await db.query(`
    UPDATE usuario_roles SET estado = 'Inactivo'
    WHERE id_usuario = $1 AND estado = 'Activo' AND NOT (role = ANY ($2::text[]))`, [idUsuario, codigosRoles])
}

export const reemplazarPersonalizaciones = async (idUsuario, personalizaciones, idAutor, db = dataBase) => {
  await db.query('DELETE FROM user_permissions WHERE user_id = $1', [idUsuario])
  if (!personalizaciones.length) return
  await db.query(`
    INSERT INTO user_permissions (user_id, permission_id, effect, created_by)
    SELECT $1, d.permission_id, d.effect, $4
    FROM unnest($2::int[], $3::text[]) AS d(permission_id, effect)`,
  [idUsuario, personalizaciones.map((p) => p.id), personalizaciones.map((p) => p.effect), idAutor])
}

export const borrarPersonalizaciones = async (idUsuario, db = dataBase) => {
  const { rowCount } = await db.query('DELETE FROM user_permissions WHERE user_id = $1', [idUsuario])
  return rowCount
}

export const cambiarSuperAdministrador = async (idUsuario, esSuper, db = dataBase) => {
  const { rowCount } = await db.query(
    'UPDATE administradores SET es_super = $2 WHERE id_usuarios = $1',
    [idUsuario, esSuper]
  )
  return rowCount
}

export const crearFichaProfesor = async (idUsuario, ficha, email, db = dataBase) => {
  await db.query(`
    INSERT INTO profesor (nombre, a_paterno, a_materno, ci, telefono, email, especialidad, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [ficha.nombre, ficha.apellidoPaterno, ficha.apellidoMaterno || null, ficha.ci,
    ficha.telefono || null, email, ficha.especialidad || null, idUsuario])
}

export const crearFichaEstudiante = async (idUsuario, ficha, email, db = dataBase) => {
  await db.query(`
    INSERT INTO estudiante (nombre, a_paterno, a_materno, ci, telefono, email, colegio, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
  [ficha.nombre, ficha.apellidoPaterno, ficha.apellidoMaterno || null, ficha.ci,
    ficha.telefono || null, email, ficha.colegio || null, idUsuario])
}

export const existeCiEnTabla = async (tabla, ci, db = dataBase) => {
  const tablas = { profesor: 'profesor', estudiante: 'estudiante' }
  const { rowCount } = await db.query(
    `SELECT 1 FROM ${tablas[tabla]} WHERE ci::text = $1 LIMIT 1`,
    [String(ci).trim()]
  )
  return rowCount > 0
}
