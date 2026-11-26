import { useState } from 'react'
import { CBadge, CButton } from '@coreui/react'

const CardRolAcceso = ({ rol, conteo, seleccionado, onGestionar }) => {
  const [mostrarPermisos, setMostrarPermisos] = useState(false)
  const puedeConteo = rol.gestionable && conteo
  const controlesId = `permisos-${rol.id}`

  return (
    <article className={`accesos-card${seleccionado ? ' accesos-card--seleccionada' : ''}`}>
      <div className="accesos-card__header">
        <h2 className="accesos-card__title">{rol.nombre}</h2>
        <CBadge className={`accesos-card__badge accesos-card__badge--${rol.insignia.tipo}`}>
          {rol.insignia.texto}
        </CBadge>
      </div>

      <p className="accesos-card__description">{rol.descripcion}</p>

      {puedeConteo && (
        <p className="accesos-card__conteo">
          {conteo.activos} activos · {conteo.inactivos} inactivos
        </p>
      )}

      <div className="accesos-card__actions">
        <CButton
          type="button"
          color="primary"
          variant="outline"
          aria-expanded={mostrarPermisos}
          aria-controls={controlesId}
          onClick={() => setMostrarPermisos((actual) => !actual)}
        >
          Ver permisos
        </CButton>
        {rol.gestionable && (
          <CButton
            type="button"
            color={seleccionado ? 'success' : 'primary'}
            variant={seleccionado ? undefined : 'outline'}
            onClick={() => onGestionar(rol.id)}
          >
            Gestionar usuarios
          </CButton>
        )}
      </div>

      {mostrarPermisos && (
        <div id={controlesId} className="accesos-card__permisos">
          {rol.puede.length > 0 && (
            <div>
              <h3>Puede</h3>
              <ul>
                {rol.puede.map((permiso) => (
                  <li key={permiso} className="accesos-card__permiso--puede">
                    <span aria-hidden="true">✔</span> {permiso}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rol.noPuede.length > 0 && (
            <div>
              <h3>No puede</h3>
              <ul>
                {rol.noPuede.map((permiso) => (
                  <li key={permiso} className="accesos-card__permiso--no-puede">
                    <span aria-hidden="true">✘</span> {permiso}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default CardRolAcceso
