const permisosDe = (req) => req.user?.permissions ?? []

const denegar = (res) => res.status(403).json({ message: 'Acceso denegado' })

export const requirePermission = (...permisosRequeridos) => {
  return (req, res, next) => {
    const permisos = permisosDe(req)
    if (!permisosRequeridos.every((permiso) => permisos.includes(permiso))) return denegar(res)
    next()
  }
}

export const requireAnyPermission = (...permisosAlternativos) => {
  return (req, res, next) => {
    const permisos = permisosDe(req)
    if (!permisosAlternativos.some((permiso) => permisos.includes(permiso))) return denegar(res)
    next()
  }
}
