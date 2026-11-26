import { Navigate } from 'react-router-dom'
import { hasPermission, obtenerUsuario } from '../views/utils/usuario'
import { obtenerRutaPrincipal } from '../views/utils/rutaPrincipal'

const ProteccionPermiso = ({ children, permiso }) => {
  if (!obtenerUsuario()) {
    return <Navigate to="/login" replace />
  }

  if (permiso && !hasPermission(permiso)) {
    return <Navigate to={obtenerRutaPrincipal() || '/login'} replace />
  }

  return children
}

export default ProteccionPermiso
