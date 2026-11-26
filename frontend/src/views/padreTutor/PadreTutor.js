import { useEffect, useState } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import { FeedbackAlert } from '../../components'
import PadreTutorFormulario from './components/PadreTutorFormulario'
import PadreTutorTable from './components/PadreTutorTable'
import { usePadreTutor } from './hooks/usePadreTutor'
import { useLocation, useNavigate } from 'react-router-dom'

const PadreTutor = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const {
    padresTutores,
    cargando,
    formulario,
    errores,
    editando,
    accionEnProceso,
    padreTutorParaEliminar,
    handleChange,
    crearPadreTutor,
    actualizarPadreTutor,
    seleccionarPadreTutor,
    eliminarPadreTutor,
    cancelarEliminacion,
    confirmarEliminacion,
    descartar,
    feedback,
    limpiarFeedback,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna,
  } = usePadreTutor({ paginado: true })

  const abrirRegistro = () => {
    descartar()
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

  const guardarPadreTutor = async (event) => {
    const guardado = await crearPadreTutor(event)
    if (guardado) setModalVisible(false)
  }

  const actualizarPadreTutorDesdeModal = async (event) => {
    const actualizado = await actualizarPadreTutor(event)
    if (actualizado) setModalVisible(false)
  }

  const seleccionarPadreTutorDesdeTabla = (padreTutor) => {
    seleccionarPadreTutor(padreTutor)
    setModalVisible(true)
  }

  const cancelarFormulario = () => {
    if (accionEnProceso) return
    descartar()
    setModalVisible(false)
  }

  return (
    <div className="tutor-page__container">
      <FeedbackAlert feedback={feedback} onClose={limpiarFeedback} />

      <PadreTutorTable
        padresTutores={padresTutores}
        cargando={cargando}
        onRegistrarPadreTutor={abrirRegistro}
        seleccionarPadreTutor={seleccionarPadreTutorDesdeTabla}
        eliminarPadreTutor={eliminarPadreTutor}
        padreTutorParaEliminar={padreTutorParaEliminar}
        cancelarEliminacion={cancelarEliminacion}
        confirmarEliminacion={confirmarEliminacion}
        accionEnProceso={accionEnProceso}
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
        size="xl"
        alignment="center"
        scrollable
        backdrop="static"
        className="tutor-modal__wrapper bm-modal-registro"
      >
        <CModalHeader>
          <CModalTitle>{editando ? 'Editar padre o tutor' : 'Registrar padre o tutor'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <PadreTutorFormulario
            handleChange={handleChange}
            descartar={cancelarFormulario}
            editando={editando}
            actualizarPadreTutor={actualizarPadreTutorDesdeModal}
            crearPadreTutor={guardarPadreTutor}
            formulario={formulario}
            errores={errores}
            accionEnProceso={accionEnProceso}
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

export default PadreTutor
