import { Navigate } from 'react-router-dom'
import { hasPermission, obtenerRutaPrincipal, obtenerUsuario } from '../views/utils/usuario'

const ProteccionRol = ({ children, rolesPermitidos, permiso }) => {
  const usuario = obtenerUsuario()
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!rolesPermitidos.includes(usuario.role) || (permiso && !hasPermission(permiso))) {
    return <Navigate to={obtenerRutaPrincipal() || '/login'} replace />
  }

  return children
}

export default ProteccionRol
