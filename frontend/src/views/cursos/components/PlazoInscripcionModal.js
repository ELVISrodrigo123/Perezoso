import { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import { getPlazoCurso, putPlazoCurso } from '../../../services/plazoInscripcionService'
import {
  DIAS_PLAZO_MAXIMO,
  DIAS_PLAZO_MINIMO,
  ESTADOS_INSCRIPCION,
  calcularVistaPreviaPlazo,
  esDiaDePlazoValido,
  formatearFechaIso,
} from '../../utils/plazoInscripcion'

const formatearFechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-BO') : '')

const PlazoInscripcionModal = ({ idCurso, onCerrar, onGuardado }) => {
  const [plazo, setPlazo] = useState(null)
  const [usarGlobal, setUsarGlobal] = useState(true)
  const [diasTexto, setDiasTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!idCurso) return undefined
    let activo = true
    setCargando(true)
    setError('')
    getPlazoCurso(idCurso)
      .then(({ data }) => {
        if (!activo) return
        setPlazo(data)
        setUsarGlobal(data.diasCurso === null)
        setDiasTexto(String(data.diasCurso ?? data.diasGlobal))
      })
      .catch((errorCarga) => {
        if (activo) setError(errorCarga.response?.data?.message || 'No se pudo cargar el plazo')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [idCurso])

  const diasIngresados = diasTexto.trim() === '' ? NaN : Number(diasTexto)
  const diasParaVistaPrevia = usarGlobal ? plazo?.diasGlobal : diasIngresados
  const diasValidos = usarGlobal || esDiaDePlazoValido(diasIngresados)

  const vistaPrevia = useMemo(() => {
    if (!plazo) return null
    return calcularVistaPreviaPlazo({
      fechaInicio: plazo.fechaInicio,
      fechaFin: plazo.fechaFin,
      dias: diasParaVistaPrevia,
      estadoCurso: plazo.estadoCurso,
      cuposDisponibles: plazo.cuposDisponibles,
    })
  }, [plazo, diasParaVistaPrevia])

  const guardar = async () => {
    if (!diasValidos) return
    setGuardando(true)
    setError('')
    try {
      const { data } = await putPlazoCurso(idCurso, usarGlobal ? null : diasIngresados)
      onGuardado(data)
    } catch (errorGuardado) {
      const errores = errorGuardado.response?.data?.errores
      setError(
        errores?.[0]?.msg || errorGuardado.response?.data?.message || 'No se pudo guardar el plazo',
      )
    } finally {
      setGuardando(false)
    }
  }

  const estadoPrevio = vistaPrevia ? ESTADOS_INSCRIPCION[vistaPrevia.estado] : null

  return (
    <CModal visible={Boolean(idCurso)} onClose={onCerrar} alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle>Plazo de inscripción</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {cargando || !plazo ? (
          error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : (
            <div className="text-center py-3">
              <CSpinner color="primary" />
            </div>
          )
        ) : (
          <>
            <p className="mb-1">
              <strong>{plazo.curso}</strong>
            </p>
            <p className="text-body-secondary small mb-3">
              Inicio {formatearFechaIso(plazo.fechaInicio)} · Fin{' '}
              {formatearFechaIso(plazo.fechaFin)} · Cupos {plazo.cuposOcupados}/{plazo.cupoTotal}
            </p>

            <CFormCheck
              id="plazo-usar-global"
              label={`Usar el plazo global (${plazo.diasGlobal} días)`}
              checked={usarGlobal}
              onChange={(event) => setUsarGlobal(event.target.checked)}
              className="mb-3"
            />

            <CFormLabel htmlFor="plazo-dias">Días para inscribirse desde el inicio</CFormLabel>
            <CFormInput
              id="plazo-dias"
              type="number"
              min={DIAS_PLAZO_MINIMO}
              max={DIAS_PLAZO_MAXIMO}
              step={1}
              value={usarGlobal ? String(plazo.diasGlobal) : diasTexto}
              onChange={(event) => setDiasTexto(event.target.value)}
              disabled={usarGlobal}
              invalid={!diasValidos}
            />
            <CFormText>
              Entre {DIAS_PLAZO_MINIMO} y {DIAS_PLAZO_MAXIMO}. Con 0 se puede inscribir solo el día
              de inicio. Las inscripciones ya hechas no cambian.
            </CFormText>

            <div className="border rounded p-3 mt-3" aria-live="polite">
              <div className="small text-body-secondary mb-1">Vista previa</div>
              {vistaPrevia ? (
                <>
                  <div>
                    Fecha límite: <strong>{formatearFechaIso(vistaPrevia.fechaLimite)}</strong>
                    {vistaPrevia.limitadaPorFechaFin && (
                      <span className="text-body-secondary small"> (fecha de fin del curso)</span>
                    )}
                  </div>
                  <div className="mt-1">
                    El curso quedaría:{' '}
                    <CBadge color={vistaPrevia.abierta ? 'success' : 'danger'}>
                      {vistaPrevia.abierta ? 'Abierto' : 'Cerrado'}
                    </CBadge>{' '}
                    {!vistaPrevia.abierta && (
                      <span className="small text-body-secondary">{estadoPrevio?.texto}</span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-danger">
                  Ingresa un número entero entre {DIAS_PLAZO_MINIMO} y {DIAS_PLAZO_MAXIMO}.
                </span>
              )}
            </div>

            {plazo.actualizadoPor && (
              <p className="small text-body-secondary mt-3 mb-0">
                Último cambio: {plazo.actualizadoPor.email} el{' '}
                {formatearFechaHora(plazo.actualizadoEn)}
              </p>
            )}
            {plazo.historial?.length > 0 && (
              <details className="small mt-2">
                <summary>Historial ({plazo.historial.length})</summary>
                <ul className="mb-0 mt-2 ps-3">
                  {plazo.historial.map((cambio) => (
                    <li key={cambio.id_historial}>
                      {formatearFechaHora(cambio.modificado_en)} · {cambio.modificado_por_email}:{' '}
                      {cambio.dias_anterior ?? 'global'} → {cambio.dias_nuevo ?? 'global'}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {error && (
              <CAlert color="danger" className="mt-3 mb-0">
                {error}
              </CAlert>
            )}
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCerrar} disabled={guardando}>
          Cancelar
        </CButton>
        <CButton color="primary" onClick={guardar} disabled={!plazo || !diasValidos || guardando}>
          {guardando ? <CSpinner size="sm" /> : 'Guardar plazo'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default PlazoInscripcionModal
