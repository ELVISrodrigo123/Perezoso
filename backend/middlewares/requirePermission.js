export const requirePermission = (...permisosRequeridos) => {
  return (req, res, next) => {
    const permisosDelUsuario = req.user?.permisos ?? []
    const tieneTodos = permisosRequeridos.every((permiso) => permisosDelUsuario.includes(permiso))
    if (!tieneTodos) {
      return res.status(403).json({ message: 'Acceso denegado' })
    }
    next()
  }
}
