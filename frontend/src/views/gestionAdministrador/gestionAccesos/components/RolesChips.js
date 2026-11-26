import PropTypes from 'prop-types'
import { CBadge } from '@coreui/react'
import { COLORES_ROL, etiquetaDeRol } from '../../../utils/usuario'

const RolesChips = ({ roles = [], esSuper = false }) => (
  <div className="bm-roles-chips">
    {esSuper && (
      <CBadge color={COLORES_ROL.super_administrador} shape="rounded-pill">
        {etiquetaDeRol('super_administrador')}
      </CBadge>
    )}
    {roles
      .filter((rol) => rol !== 'super_administrador')
      .map((rol) => (
        <CBadge key={rol} color={COLORES_ROL[rol] || 'secondary'} shape="rounded-pill">
          {etiquetaDeRol(rol)}
        </CBadge>
      ))}
    {!esSuper && roles.length === 0 && <span className="text-body-secondary small">Sin roles</span>}
  </div>
)

RolesChips.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
  esSuper: PropTypes.bool,
}

export default RolesChips
