import { useState } from 'react'
import {
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { EmptyState, LoadingState, SectionCard } from '../../../../components'
import Paginacion from '../../../../components/Paginacion'
import { generarReciboPdf } from '../../../utils/generarReciboPdf'

const formatearMonto = (monto) => `$${Number(monto || 0).toFixed(2)}`

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha'

  const fechaFormateada = new Date(fecha).toLocaleDateString()
  return fechaFormateada === 'Invalid Date' ? 'Sin fecha' : fechaFormateada
}

const RecibosTable = ({
  cargando,
  searchTerm = '',
  padreSeleccionado,
  onSeleccionarPadre,
  onVolver,
  grupos,
  recibosPadre,
  resumenDetalle,
  filtrosResumen,
  setFiltrosResumen,
  filtrosDetalle,
  setFiltrosDetalle,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
}) => {
  const [reciboProcesandoId, setReciboProcesandoId] = useState(null)
  const [filtroAbierto, setFiltroAbierto] = useState(null)

  const actualizarFiltroResumen = (campo, valor) => {
    setFiltrosResumen((prev) => ({ ...prev, [campo]: valor }))
  }

  const actualizarFiltroDetalle = (campo, valor) => {
    setFiltrosDetalle((prev) => ({ ...prev, [campo]: valor }))
  }

  const renderFilterControl = (scope, key, label, type = 'text') => {
    const filterKey = `${scope}:${key}`
    const isOpen = filtroAbierto === filterKey
    const currentValue = scope === 'summary' ? filtrosResumen[key] : filtrosDetalle[key]
    const cambiar = (valor) =>
      scope === 'summary'
        ? actualizarFiltroResumen(key, valor)
        : actualizarFiltroDetalle(key, valor)

    return (
      <CTableHeaderCell className="table-recibos__head">
        <div className="table-recibos__header">
          <span>{label}</span>
          <button
            type="button"
            className={`table-recibos__filter-toggle ${isOpen ? 'is-open' : ''}`}
            onClick={() => setFiltroAbierto(isOpen ? null : filterKey)}
            aria-label={`Filtrar por ${label}`}
          >
            {type === 'date' ? '🔽' : '🔍'}
          </button>
        </div>
        {isOpen && (
          <div className="table-recibos__filter-panel">
            <input
              type={type}
              className="table-recibos__filter-input"
              value={currentValue}
              placeholder={type === 'text' ? 'Buscar' : undefined}
              onChange={(event) => cambiar(event.target.value)}
            />
          </div>
        )}
      </CTableHeaderCell>
    )
  }

  const hayFiltrosResumen = searchTerm.trim() !== '' || Object.values(filtrosResumen).some(Boolean)
  const indiceInicial = (paginaActual - 1) * registrosPorPagina

  const paginacion = (
    <Paginacion
      page={paginaActual}
      limit={registrosPorPagina}
      total={totalRegistros}
      totalPaginas={totalPaginas}
      etiqueta="registros"
      onCambiarPagina={setPaginaActual}
      onCambiarLimite={(cantidad) => {
        setRegistrosPorPagina(cantidad)
        setPaginaActual(1)
      }}
    />
  )

  if (cargando) {
    return <LoadingState label="Cargando recibos..." />
  }

  // ---------- DETALLE DE UN PADRE / TUTOR ----------
  if (padreSeleccionado) {
    return (
      <SectionCard description="Detalle de los recibos registrados para el padre o tutor seleccionado.">
        <div className="recibos-detail__summary">
          <div>
            <div className="recibos-detail__label">Padre/Tutor</div>
            <h5 className="recibos-detail__name">{padreSeleccionado.padre_tutor}</h5>
            <div className="recibos-detail__meta">CI: {padreSeleccionado.padre_ci}</div>
          </div>
          <div className="recibos-detail__meta">
            <div>Total de recibos: {resumenDetalle.total_recibos}</div>
            <div>Total pagado: {formatearMonto(resumenDetalle.total_pagado)}</div>
          </div>
        </div>

        <CButton
          color="secondary"
          variant="outline"
          className="recibos-detail__back mb-3"
          onClick={onVolver}
        >
          Volver al resumen
        </CButton>

        <div className="table-responsive table-recibos__wrapper">
          <CTable align="middle" hover className="table-recibos__table">
            <CTableHead>
              <CTableRow>
                {renderFilterControl('detail', 'id_recibo', 'Recibo', 'number')}
                {renderFilterControl('detail', 'estudiante', 'Estudiante')}
                {renderFilterControl('detail', 'curso', 'Curso')}
                {renderFilterControl('detail', 'monto_pagado', 'Monto', 'number')}
                {renderFilterControl('detail', 'fecha_pago', 'Fecha', 'date')}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {recibosPadre.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="table-recibos__empty-results">
                    No se encontraron resultados
                  </CTableDataCell>
                </CTableRow>
              ) : (
                recibosPadre.map((recibo, index) => (
                  <CTableRow
                    key={
                      recibo.id_recibo ||
                      `${padreSeleccionado.identificador}-${recibo.fecha_pago}-${recibo.monto_pagado}-${recibo.curso || recibo.estudiante}`
                    }
                    className="table-recibos__row"
                  >
                    <CTableDataCell className="table-recibos__cell">
                      {recibo.id_recibo || indiceInicial + index + 1}
                    </CTableDataCell>
                    <CTableDataCell className="table-recibos__cell">
                      {recibo.estudiante || 'Sin estudiante'}
                    </CTableDataCell>
                    <CTableDataCell className="table-recibos__cell">
                      {recibo.curso || 'Sin curso'}
                    </CTableDataCell>
                    <CTableDataCell className="table-recibos__cell">
                      {formatearMonto(recibo.monto_pagado)}
                    </CTableDataCell>
                    <CTableDataCell className="table-recibos__cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {formatearFecha(recibo.fecha_pago)}
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              setReciboProcesandoId(recibo.id_recibo)
                              const tokenVerificacion = recibo.token_verificacion || ''
                              await new Promise((resolve) => setTimeout(resolve, 50))
                              await generarReciboPdf({
                                ...recibo,
                                token_verificacion: tokenVerificacion,
                                estudiante_nombre: recibo.estudiante || 'Sin información',
                                estudiante_ci:
                                  recibo.estudiante_ci || recibo.ci || 'Sin información',
                                padre_tutor: recibo.padre_tutor || 'Sin información',
                                padre_ci: recibo.padre_ci || 'Sin información',
                                monto_pagado: Number(recibo.monto_pagado || 0),
                                fecha_pago: recibo.fecha_pago || new Date().toISOString(),
                                conceptos: [
                                  {
                                    descripcion: recibo.curso || 'Curso',
                                    monto: Number(recibo.monto_pagado || 0),
                                  },
                                ],
                              })
                            } finally {
                              setReciboProcesandoId(null)
                            }
                          }}
                        >
                          {reciboProcesandoId === recibo.id_recibo
                            ? `Generando recibo...`
                            : `Imprimir`}
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
          {paginacion}
        </div>
      </SectionCard>
    )
  }

  // ---------- RESUMEN POR PADRE / TUTOR ----------
  if (grupos.length === 0 && !hayFiltrosResumen) {
    return (
      <EmptyState
        title="No se encontraron recibos"
        description="Prueba con otro CI del padre o tutor."
      />
    )
  }

  return (
    <SectionCard description="Resumen por padre de familia.">
      <div className="table-responsive table-recibos__wrapper">
        <CTable align="middle" hover className="table-recibos__table">
          <CTableHead>
            <CTableRow>
              {renderFilterControl('summary', 'padre_tutor', 'Padre / Tutor')}
              {renderFilterControl('summary', 'padre_ci', 'CI')}
              {renderFilterControl('summary', 'recibos', 'Recibos', 'number')}
              {renderFilterControl('summary', 'total', 'Total', 'number')}
              <CTableHeaderCell className="table-recibos__head text-end">Acciones</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {grupos.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={5} className="table-recibos__empty-results">
                  No se encontraron resultados
                </CTableDataCell>
              </CTableRow>
            ) : (
              grupos.map((grupo) => (
                <CTableRow key={grupo.identificador} className="table-recibos__row">
                  <CTableDataCell className="table-recibos__cell">
                    {grupo.padre_tutor}
                  </CTableDataCell>
                  <CTableDataCell className="table-recibos__cell">{grupo.padre_ci}</CTableDataCell>
                  <CTableDataCell className="table-recibos__cell">
                    <span className="recibos-badge">{grupo.cantidad_recibos}</span>
                  </CTableDataCell>
                  <CTableDataCell className="table-recibos__cell">
                    {formatearMonto(grupo.total)}
                  </CTableDataCell>
                  <CTableDataCell className="table-recibos__cell text-end">
                    <CButton
                      color="primary"
                      variant="outline"
                      className="recibos-action__button"
                      onClick={() => onSeleccionarPadre(grupo)}
                    >
                      Ver pagos
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
        {paginacion}
      </div>
    </SectionCard>
  )
}

export default RecibosTable
