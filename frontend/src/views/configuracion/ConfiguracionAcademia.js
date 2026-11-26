import { useCallback, useEffect, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CFormText,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { SectionCard, LoadingState, PageHeader } from '../../components'
import { getPlazoGlobal, putPlazoGlobal } from '../../services/plazoInscripcionService'
import { hasPermission } from '../utils/usuario'
import {
  DIAS_PLAZO_MAXIMO,
  DIAS_PLAZO_MINIMO,
  ESTADOS_INSCRIPCION,
  esDiaDePlazoValido,
} from '../utils/plazoInscripcion'

const formatearFechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-BO') : '')

const ConfiguracionAcademia = () => {
  const puedeEditar = hasPermission('settings.enrollment_deadline.update')
  const [plazo, setPlazo] = useState(null)
  const [diasTexto, setDiasTexto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const aplicarPlazo = (datos) => {
    setPlazo(datos)
    setDiasTexto(String(datos.dias))
  }

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await getPlazoGlobal()
      aplicarPlazo(data)
    } catch (error) {
      setFeedback({
        color: 'danger',
        message: error.response?.data?.message || 'No se pudo cargar la configuración',
      })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const diasIngresados = diasTexto.trim() === '' ? NaN : Number(diasTexto)
  const diasValidos = esDiaDePlazoValido(diasIngresados)
  const sinCambios = plazo && diasIngresados === plazo.dias

  const guardar = async (event) => {
    event.preventDefault()
    if (!diasValidos || sinCambios) return
    setGuardando(true)
    setFeedback(null)
    try {
      const { data } = await putPlazoGlobal(diasIngresados)
      aplicarPlazo(data)
      setFeedback({ color: 'success', message: data.message || 'Plazo global actualizado' })
    } catch (error) {
      setFeedback({
        color: 'danger',
        message:
          error.response?.data?.errores?.[0]?.msg ||
          error.response?.data?.message ||
          'No se pudo guardar el plazo global',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Configuración de la academia"
        description="Plazo de inscripción y estado de los cursos."
      />
      <SectionCard>
        {feedback && (
          <CAlert color={feedback.color} dismissible onClose={() => setFeedback(null)}>
            {feedback.message}
          </CAlert>
        )}
        {cargando ? (
          <LoadingState label="Cargando configuración..." />
        ) : (
          plazo && (
            <CRow className="g-4">
              <CCol md={6}>
                <h3 className="h5">Plazo de inscripción global</h3>
                <p className="text-body-secondary small">
                  Días desde el inicio del curso en los que se acepta inscripciones. Se aplica a los
                  cursos que no tienen un plazo propio. Las inscripciones ya hechas no cambian.
                </p>
                <form onSubmit={guardar}>
                  <CFormLabel htmlFor="plazo-global-dias">Días</CFormLabel>
                  <div className="d-flex gap-2">
                    <CFormInput
                      id="plazo-global-dias"
                      type="number"
                      min={DIAS_PLAZO_MINIMO}
                      max={DIAS_PLAZO_MAXIMO}
                      step={1}
                      value={diasTexto}
                      onChange={(event) => setDiasTexto(event.target.value)}
                      disabled={!puedeEditar || guardando}
                      invalid={puedeEditar && !diasValidos}
                      style={{ maxWidth: 140 }}
                    />
                    {puedeEditar && (
                      <CButton
                        type="submit"
                        color="primary"
                        disabled={!diasValidos || sinCambios || guardando}
                      >
                        {guardando ? <CSpinner size="sm" /> : 'Guardar'}
                      </CButton>
                    )}
                  </div>
                  <CFormText>
                    {puedeEditar
                      ? `Entre ${DIAS_PLAZO_MINIMO} y ${DIAS_PLAZO_MAXIMO}. Con 0 se puede inscribir solo el día de inicio.`
                      : 'Solo un super administrador puede cambiar este valor.'}
                  </CFormText>
                </form>
                {plazo.actualizadoPor && (
                  <p className="small text-body-secondary mt-3 mb-0">
                    Último cambio: {plazo.actualizadoPor.email} el{' '}
                    {formatearFechaHora(plazo.actualizadoEn)}
                  </p>
                )}
              </CCol>
              <CCol md={6}>
                <h3 className="h5">Cursos por estado de inscripción</h3>
                <div className="d-flex flex-wrap gap-2">
                  {Object.entries(ESTADOS_INSCRIPCION).map(([estado, { texto, color }]) => (
                    <CBadge key={estado} color={color} className="p-2">
                      {texto}: {plazo.cursosPorEstado?.[estado] ?? 0}
                    </CBadge>
                  ))}
                </div>
              </CCol>
              <CCol xs={12}>
                <h3 className="h5">Historial de cambios</h3>
                {plazo.historial?.length ? (
                  <CTable small hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Fecha</CTableHeaderCell>
                        <CTableHeaderCell>Usuario</CTableHeaderCell>
                        <CTableHeaderCell>Antes</CTableHeaderCell>
                        <CTableHeaderCell>Después</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {plazo.historial.map((cambio) => (
                        <CTableRow key={cambio.id_historial}>
                          <CTableDataCell>
                            {formatearFechaHora(cambio.modificado_en)}
                          </CTableDataCell>
                          <CTableDataCell>{cambio.modificado_por_email}</CTableDataCell>
                          <CTableDataCell>{cambio.dias_anterior} días</CTableDataCell>
                          <CTableDataCell>{cambio.dias_nuevo} días</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                ) : (
                  <p className="text-body-secondary small">Todavía no hay cambios registrados.</p>
                )}
              </CCol>
            </CRow>
          )
        )}
      </SectionCard>
    </>
  )
}

export default ConfiguracionAcademia
