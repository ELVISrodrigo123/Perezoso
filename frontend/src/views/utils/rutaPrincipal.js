import routes from '../../routes'
import { hasPermission, obtenerUsuario } from './usuario'

export const obtenerRutaPrincipal = () => {
  if (!obtenerUsuario()) return null
  const ruta = routes.find((item) => item.element && item.permiso && hasPermission(item.permiso))
  return ruta?.path ?? null
}
