import { useState } from 'react'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import useCursos from './hooks/useCursos'
import CursoFormulario from './components/CursoFormulario'
import CursoTable from './components/CursoTable'
import { FeedbackAlert } from '../../components'
import { useHabilitarUsuario } from '../../hooks/useHabilitarUsuario'

const Cursos = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const {
    profesor,
    editando,
    actualizarCurso,
    crearCurso,
    formulario,
    handleChange,
    errores,
    descartar,
    cursos,
    seleccionarCurso,
    eliminarCurso,
    cursoParaEliminar,
    cancelarEliminacion,
    confirmarEliminacion,
    feedback,
    limpiarFeedback,
    accionEnProceso,
    cargarCursos,
    cargando,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna,
  } = useCursos()

  const registrarCurso = async (event) => {
    const registrado = await crearCurso(event)
    if (registrado) {
      setModalVisible(false)
    }
  }

  const actualizarCursoDesdeModal = async (event) => {
    const actualizado = await actualizarCurso(event)
    if (actualizado) {
      setModalVisible(false)
    }
  }

  const seleccionarCursoDesdeTabla = (curso) => {
    seleccionarCurso(curso)
    setModalVisible(true)
  }

  const cancelarFormulario = () => {
    if (editando) {
      descartar()
    }
    setModalVisible(false)
  }

  return (
    <div className="cursos-page__container">
      <FeedbackAlert feedback={feedback} onClose={limpiarFeedback} />
      <CursoTable
        cursos={cursos}
        onRegistrarCurso={() => setModalVisible(true)}
        seleccionarCurso={seleccionarCursoDesdeTabla}
        eliminarCurso={eliminarCurso}
        cursoParaEliminar={cursoParaEliminar}
        cancelarEliminacion={cancelarEliminacion}
        confirmarEliminacion={confirmarEliminacion}
        accionEnProceso={accionEnProceso}
        cargarCursos={cargarCursos}
        profesores={profesor}
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
        className="curso-modal__wrapper bm-modal-registro"
      >
        <CModalHeader>
          <CModalTitle>{editando ? 'Editar Curso' : 'Registrar Curso'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CursoFormulario
            profesor={profesor}
            editando={editando}
            actualizarCurso={actualizarCursoDesdeModal}
            crearCurso={registrarCurso}
            formulario={formulario}
            handleChange={handleChange}
            errores={errores}
            descartar={cancelarFormulario}
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

export default Cursos
