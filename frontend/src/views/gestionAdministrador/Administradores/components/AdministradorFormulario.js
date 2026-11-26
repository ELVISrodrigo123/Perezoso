import { useEffect, useRef } from 'react'
import {
  CAlert,
  CButton,
  CButtonGroup,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'
import { SectionCard } from '../../../../components'

const AdministradorFormulario = ({
  handleChange,
  descartar,
  editando,
  actualizarAdministrador,
  crearAdministrador,
  formulario,
  errores,
  accionEnProceso,
  feedback,
}) => {
  const feedbackRef = useRef(null)

  useEffect(() => {
    if (!feedback) return
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [feedback])

  return (
    <SectionCard
      title={editando ? 'Editar administrador' : 'Registrar administrador'}
      description={
        editando
          ? 'Si cambias el CI, también cambia la contraseña del administrador.'
          : 'Completa los datos del administrador. Su contraseña inicial será su CI.'
      }
      className="administrador-form__card bm-form-card text-body"
    >
      {feedback && (
        <div ref={feedbackRef}>
          <CAlert color={feedback.color} className="mb-3" style={{ whiteSpace: 'pre-line' }}>
            {feedback.message}
          </CAlert>
        </div>
      )}
      <CForm
        onSubmit={editando ? actualizarAdministrador : crearAdministrador}
        className="administrador-form__form bm-admin-form"
        noValidate
      >
        <CRow className="g-3 administrador-form__grid">
          <CCol md={10} className="administrador-form__field">
            <CFormLabel htmlFor="administrador-nombre">Nombre</CFormLabel>
            <CFormInput
              id="administrador-nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              invalid={Boolean(errores.nombre)}
              maxLength={50}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.nombre && <CFormFeedback invalid>{errores.nombre}</CFormFeedback>}
          </CCol>
          <CCol md={10} className="administrador-form__field">
            <CFormLabel htmlFor="administrador-apellido-paterno">Apellido paterno</CFormLabel>
            <CFormInput
              id="administrador-apellido-paterno"
              name="apellidoPaterno"
              value={formulario.apellidoPaterno}
              onChange={handleChange}
              invalid={Boolean(errores.apellidoPaterno)}
              maxLength={50}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.apellidoPaterno && (
              <CFormFeedback invalid>{errores.apellidoPaterno}</CFormFeedback>
            )}
          </CCol>
          <CCol md={10} className="administrador-form__field">
            <CFormLabel htmlFor="administrador-apellido-materno">Apellido materno</CFormLabel>
            <CFormInput
              id="administrador-apellido-materno"
              name="apellidoMaterno"
              value={formulario.apellidoMaterno ?? ''}
              onChange={handleChange}
              invalid={Boolean(errores.apellidoMaterno)}
              maxLength={50}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.apellidoMaterno && (
              <CFormFeedback invalid>{errores.apellidoMaterno}</CFormFeedback>
            )}
          </CCol>
          <CCol md={6} className="administrador-form__field">
            <CFormLabel htmlFor="administrador-ci">Documento CI</CFormLabel>
            <CFormInput
              id="administrador-ci"
              name="ci"
              value={formulario.ci}
              onChange={handleChange}
              invalid={Boolean(errores.ci)}
              maxLength={15}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.ci && <CFormFeedback invalid>{errores.ci}</CFormFeedback>}
          </CCol>
          <CCol md={6} className="administrador-form__field">
            <CFormLabel htmlFor="administrador-telefono">Teléfono (opcional)</CFormLabel>
            <CFormInput
              id="administrador-telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              value={formulario.telefono ?? ''}
              onChange={handleChange}
              invalid={Boolean(errores.telefono)}
              maxLength={8}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.telefono && <CFormFeedback invalid>{errores.telefono}</CFormFeedback>}
          </CCol>
          <CCol md={10} className="administrador-form__field administrador-form__field--wide">
            <CFormLabel htmlFor="administrador-email">Correo electrónico</CFormLabel>
            <CFormInput
              id="administrador-email"
              name="email"
              type="email"
              value={formulario.email ?? ''}
              onChange={handleChange}
              invalid={Boolean(errores.email)}
              maxLength={100}
              autoComplete="off"
              className="administrador-form__input"
            />
            {errores.email && <CFormFeedback invalid>{errores.email}</CFormFeedback>}
          </CCol>
        </CRow>
        <div className="administrador-form__actions bm-form-actions">
          <CButtonGroup>
            <CButton color="primary" type="submit" disabled={Boolean(accionEnProceso)}>
              {accionEnProceso === (editando ? 'actualizar' : 'guardar') ? (
                <>
                  <CSpinner size="sm" className="me-1" /> Procesando
                </>
              ) : editando ? (
                'Actualizar administrador'
              ) : (
                'Guardar administrador'
              )}
            </CButton>
            {editando && (
              <CButton
                color="secondary"
                variant="outline"
                type="button"
                onClick={descartar}
                disabled={Boolean(accionEnProceso)}
              >
                Descartar
              </CButton>
            )}
          </CButtonGroup>
        </div>
      </CForm>
    </SectionCard>
  )
}

export default AdministradorFormulario
