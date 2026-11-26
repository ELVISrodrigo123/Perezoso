import { useEffect, useState } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import ProfesorFormulario from './componets/ProfesorFormulario'
import ProfesorTable from './componets/ProfesorTable'
import { useProfesores } from './hooks/useProfesores'
import { useHabilitarUsuario } from '../../hooks/useHabilitarUsuario'
import { FeedbackAlert } from '../../components'
import { useLocation, useNavigate } from 'react-router-dom'

const Profesores = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.state?.abrirRegistro) {
      setModalVisible(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])
  const {
    cargando,
    cargarProfesor,
    handleChange,
    descartar,
    editando,
    actualizarProfesor,
    crearProfesor,
    formulario,
    errores,
    profesor,
    seleccionarProfesor,
    eliminarProfesor,
    profesorParaEliminar,
    cancelarEliminacion,
    confirmarEliminacion,
    feedback,
    limpiarFeedback,
    accionEnProceso,
    limpiarEdicion,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna,
  } = useProfesores()

  const { feedback1, ejecutarHabilitarUsuario } = useHabilitarUsuario()

  const guardarProfesor = async (event) => {
    const guardado = await crearProfesor(event)
    if (guardado) {
      setModalVisible(false)
    }
  }

  const actualizarProfesorDesdeModal = async (event) => {
    const actualizado = await actualizarProfesor(event)
    if (actualizado) {
      limpiarEdicion()
      setModalVisible(false)
    }
  }

  const seleccionarProfesorDesdeTabla = (profe) => {
    seleccionarProfesor(profe)
    setModalVisible(true)
  }

  const cancelarFormulario = () => {
    if (editando) {
      descartar()
    }
    setModalVisible(false)
  }

  return (
    <div className="profesores-page__container">
      {!modalVisible && (
        <FeedbackAlert feedback={feedback || feedback1} onClose={limpiarFeedback} />
      )}
      <ProfesorTable
        profesor={profesor}
        onRegistrarProfesor={() => setModalVisible(true)}
        seleccionarProfesor={seleccionarProfesorDesdeTabla}
        eliminarProfesor={eliminarProfesor}
        profesorParaEliminar={profesorParaEliminar}
        cancelarEliminacion={cancelarEliminacion}
        confirmarEliminacion={confirmarEliminacion}
        accionEnProceso={accionEnProceso}
        feedback1={feedback1}
        ejecutarHabilitarUsuario={ejecutarHabilitarUsuario}
        cargarProfesor={cargarProfesor}
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
        className="profesor-modal__wrapper bm-modal-registro"
      >
        <CModalHeader>
          <CModalTitle>{editando ? 'Editar profesor' : 'Registrar profesor'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <ProfesorFormulario
            handleChange={handleChange}
            descartar={cancelarFormulario}
            editando={editando}
            actualizarProfesor={actualizarProfesorDesdeModal}
            crearProfesor={guardarProfesor}
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

export default Profesores
