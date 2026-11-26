import { CCard, CCardBody, CCol, CFormInput, CRow } from '@coreui/react'
import RecibosTable from './componets/RecibosTable'
import { useRecibos } from './hooks/useRecibos.js'

const Recibos = () => {
  const {
    cargando,
    searchTerm,
    cambiarBusqueda,
    padreSeleccionado,
    seleccionarPadre,
    volverAlResumen,
    grupos,
    recibosPadre,
    totales,
    resumenDetalle,
    filtrosResumen,
    cambiarFiltrosResumen,
    filtrosDetalle,
    cambiarFiltrosDetalle,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
  } = useRecibos()

  return (
    <div className="recibos-page__container">
      <CCard className="recibos-page__card mb-4">
        <CCardBody className="recibos-page__body">
          <CRow className="align-items-center mb-3 recibos-page__header">
            <CCol xs={12}>
              <h4 className="recibos-page__title text-center">Historial de Recibos de Caja</h4>
            </CCol>
            <CCol md={6}>
              <div className="recibos-page__totals">
                <span className="recibos-badge">total de recibos: {totales.recibos}</span>
                <span className="recibos-badge recibos-badge--accent">
                  Dinero recaudado: ${Number(totales.recaudado || 0).toFixed(2)}
                </span>
              </div>
            </CCol>
            <CCol md={6} className="align-self-end recibos-search__col">
              <CFormInput
                className="recibos-search__input text-body"
                type="text"
                placeholder="Buscar por CI del padre o tutor"
                value={searchTerm}
                onChange={(e) => cambiarBusqueda(e.target.value)}
              />
            </CCol>
          </CRow>
          <RecibosTable
            cargando={cargando}
            searchTerm={searchTerm}
            padreSeleccionado={padreSeleccionado}
            onSeleccionarPadre={seleccionarPadre}
            onVolver={volverAlResumen}
            grupos={grupos}
            recibosPadre={recibosPadre}
            resumenDetalle={resumenDetalle}
            filtrosResumen={filtrosResumen}
            setFiltrosResumen={cambiarFiltrosResumen}
            filtrosDetalle={filtrosDetalle}
            setFiltrosDetalle={cambiarFiltrosDetalle}
            paginaActual={paginaActual}
            setPaginaActual={setPaginaActual}
            registrosPorPagina={registrosPorPagina}
            setRegistrosPorPagina={setRegistrosPorPagina}
            totalRegistros={totalRegistros}
            totalPaginas={totalPaginas}
          />
        </CCardBody>
      </CCard>
    </div>
  )
}

export default Recibos
