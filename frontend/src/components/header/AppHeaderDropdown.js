import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CBadge,
} from '@coreui/react'
import { cilLockLocked, cilSettings, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar0 from '../../assets/images/avatars/0.png'
import { clearAccessToken } from '../../services/authSession'
import { COLORES_ROL, etiquetaDeRol, obtenerUsuario } from '../../views/utils/usuario'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()

  const cerrarSesion = () => {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  const usuario = obtenerUsuario()
  const roles = usuario?.roles || []

  return (
    <CDropdown variant="nav-item" className="profile-dropdown">
      <CDropdownToggle
        placement="bottom-end"
        className="profile-dropdown__toggle py-0 pe-0"
        caret={false}
      >
        <CAvatar src={avatar0} size="md" className="profile-dropdown__avatar" />
      </CDropdownToggle>
      <CDropdownMenu className="profile-dropdown__menu pt-0 shadow-sm" placement="bottom-end">
        <CDropdownHeader className="profile-dropdown__header fw-semibold mb-2">
          Configuración
        </CDropdownHeader>
        {usuario?.email && (
          <div className="px-3 pb-2 small text-body-secondary text-truncate">{usuario.email}</div>
        )}
        {roles.length > 0 && (
          <div className="px-3 pb-2 d-flex flex-wrap gap-1">
            {roles.map((rol) => (
              <CBadge key={rol} color={COLORES_ROL[rol] || 'secondary'} shape="rounded-pill">
                {etiquetaDeRol(rol)}
              </CBadge>
            ))}
          </div>
        )}
        <CDropdownItem as="button" type="button" disabled className="profile-dropdown__item">
          <CIcon icon={cilUser} className="me-2 profile-dropdown__icon" />
          Perfil
        </CDropdownItem>
        <CDropdownItem as="button" type="button" disabled className="profile-dropdown__item">
          <CIcon icon={cilSettings} className="me-2 profile-dropdown__icon" />
          Ajustes
        </CDropdownItem>
        <CDropdownDivider className="profile-dropdown__divider" />
        <CDropdownItem
          as="button"
          type="button"
          onClick={cerrarSesion}
          className="profile-dropdown__item profile-dropdown__item--danger"
        >
          <CIcon
            icon={cilLockLocked}
            className="me-2 profile-dropdown__icon profile-dropdown__icon--danger"
          />
          Cerrar Sesión
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
