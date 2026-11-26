import { jwtDecode } from 'jwt-decode'
import { getAccessToken, clearAccessToken } from '../../services/authSession'

export const ETIQUETAS_ROL = {
  super_administrador: 'Super administrador',
  administrador: 'Administrador',
  profesor: 'Profesor',
  estudiante: 'Estudiante',
}

export const COLORES_ROL = {
  super_administrador: 'warning',
  administrador: 'primary',
  profesor: 'success',
  estudiante: 'info',
}

export const etiquetaDeRol = (codigo) =>
  ETIQUETAS_ROL[codigo] ||
  String(codigo)
    .replace(/_/g, ' ')
    .replace(/^\w/, (letra) => letra.toLocaleUpperCase())

export const obtenerUsuario = () => {
  const token = getAccessToken()
  if (!token) {
    return null
  }
  try {
    return jwtDecode(token)
  } catch {
    clearAccessToken()
    return null
  }
}

export const obtenerRoles = () => obtenerUsuario()?.roles || []

export const obtenerPermisos = () => obtenerUsuario()?.permissions || []

export const hasPermission = (permiso) => obtenerPermisos().includes(permiso)

export const hasAnyPermission = (...permisos) => {
  const propios = obtenerPermisos()
  return permisos.some((permiso) => propios.includes(permiso))
}
