import { useEffect, useState } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import AdministradorFormulario from './components/AdministradorFormulario'
import AdministradorTable from './components/AdministradorTable'
import { useAdministradores } from './hooks/useAdministradores'
import { FeedbackAlert } from '../../../components'
import { useLocation, useNavigate } from 'react-router-dom'

const Administradores = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const {
    handleChange,
    descartar,
    editando,
    actualizarAdministradorActual,
    crearAdministrador,
    formulario,
    errores,
    administradores,
    seleccionarAdministrador,
    solicitarBaja,
    administradorParaBaja,
    cancelarBaja,
    confirmarBaja,
    activarAdministradorPorId,
    feedback,
    limpiarFeedback,
    accionEnProceso,
    cargando,
    limpiarEdicion,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna,
  } = useAdministradores()

  const guardarAdministrador = async (event) => {
    const guardado = await crearAdministrador(event)
    if (guardado) {
      setModalVisible(false)
    }
  }

  const actualizarAdministradorDesdeModal = async (event) => {
    const actualizado = await actualizarAdministradorActual(event)
    if (actualizado) {
      limpiarEdicion()
      setModalVisible(false)
    }
  }

  const seleccionarAdministradorDesdeTabla = (admin) => {
    seleccionarAdministrador(admin)
    setModalVisible(true)
  }

  const abrirRegistro = () => {
    limpiarEdicion()
    setModalVisible(true)
  }

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.abrirRegistro) {
      abrirRegistro()
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const cancelarFormulario = () => {
    if (editando) {
      descartar()
    }
    setModalVisible(false)
  }

  return (
    <div className="administradores-page__container">
      {!modalVisible && <FeedbackAlert feedback={feedback} onClose={limpiarFeedback} />}
      <AdministradorTable
        administradores={administradores}
        onRegistrarAdministrador={abrirRegistro}
        seleccionarAdministrador={seleccionarAdministradorDesdeTabla}
        solicitarBaja={solicitarBaja}
        administradorParaBaja={administradorParaBaja}
        cancelarBaja={cancelarBaja}
        confirmarBaja={confirmarBaja}
        activarAdministradorPorId={activarAdministradorPorId}
        accionEnProceso={accionEnProceso}
        cargando={cargando}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={registrosPorPagina}
        setRegistrosPorPagina={setRegistrosPorPagina}
        totalRegistros={totalRegistros}
        totalPaginas={totalPaginas}
        filtrosColumna={filtrosColumna}
        setFiltrosColumna={setFiltrosColumna}
      />
      <CModal
        visible={modalVisible}
        onClose={cancelarFormulario}
        portal={false}
        size="xl"
        alignment="center"
        scrollable
        backdrop="static"
        className="administrador-modal__wrapper bm-modal-registro"
      >
        <CModalHeader>
          <CModalTitle>{editando ? 'Editar administrador' : 'Registrar administrador'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <AdministradorFormulario
            handleChange={handleChange}
            descartar={cancelarFormulario}
            editando={editando}
            actualizarAdministrador={actualizarAdministradorDesdeModal}
            crearAdministrador={guardarAdministrador}
            formulario={formulario}
            errores={errores}
            accionEnProceso={accionEnProceso}
            feedback={feedback}
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={cancelarFormulario}
            disabled={Boolean(accionEnProceso)}
          >
            Cancelar
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Administradores
