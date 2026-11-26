import PropTypes from 'prop-types'
import { CFormSelect, CPagination, CPaginationItem } from '@coreui/react'

const Paginacion = ({
  page,
  limit,
  total,
  totalPaginas,
  etiqueta = 'registros',
  opciones = [10, 15, 25],
  onCambiarPagina,
  onCambiarLimite,
}) => {
  if (!total) return null

  const inicio = (page - 1) * limit + 1
  const fin = Math.min(page * limit, total)
  const paginaInicial = Math.max(1, page - 2)
  const paginaFinal = Math.min(totalPaginas, page + 2)
  const paginas = Array.from(
    { length: Math.max(0, paginaFinal - paginaInicial + 1) },
    (_, i) => paginaInicial + i,
  )

  return (
    <div className="d-flex flex-column align-items-center gap-2 mt-3">
      <CPagination
        aria-label={`Paginación de ${etiqueta}`}
        size="sm"
        className="mb-0 flex-wrap justify-content-center"
      >
        <CPaginationItem disabled={page === 1} onClick={() => onCambiarPagina(page - 1)}>
          Anterior
        </CPaginationItem>
        {paginas.map((numero) => (
          <CPaginationItem
            key={numero}
            active={numero === page}
            onClick={() => onCambiarPagina(numero)}
          >
            {numero}
          </CPaginationItem>
        ))}
        <CPaginationItem disabled={page >= totalPaginas} onClick={() => onCambiarPagina(page + 1)}>
          Siguiente
        </CPaginationItem>
      </CPagination>
      <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 text-body-secondary">
        <span>
          Mostrando {inicio}-{fin} de {total} {etiqueta}
        </span>
        <CFormSelect
          size="sm"
          className="w-auto text-body"
          aria-label="Registros por página"
          value={limit}
          onChange={(e) => onCambiarLimite(Number(e.target.value))}
        >
          {opciones.map((n) => (
            <option key={n} value={n}>
              {n} por página
            </option>
          ))}
        </CFormSelect>
      </div>
    </div>
  )
}

Paginacion.propTypes = {
  page: PropTypes.number.isRequired,
  limit: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  totalPaginas: PropTypes.number.isRequired,
  etiqueta: PropTypes.string,
  opciones: PropTypes.arrayOf(PropTypes.number),
  onCambiarPagina: PropTypes.func.isRequired,
  onCambiarLimite: PropTypes.func.isRequired,
}

export default Paginacion
