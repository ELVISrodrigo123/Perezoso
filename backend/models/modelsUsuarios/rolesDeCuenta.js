export const columnaRolesActivos = (columnaIdUsuario) => `
  COALESCE((
    SELECT array_agg(r.code ORDER BY r.is_system DESC, r.code)
    FROM usuario_roles urx
    JOIN roles r ON r.id = urx.role_id
    WHERE urx.id_usuario = ${columnaIdUsuario} AND urx.estado = 'Activo'
  ), '{}') AS roles`
