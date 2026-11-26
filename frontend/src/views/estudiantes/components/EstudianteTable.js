import { useCallback, useEffect, useRef, useState } from 'react'
import Paginacion from '../../../components/Paginacion'
import {
  CAlert,
  CBadge,
  CButton,
  CButtonGroup,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CPagination,
  CPaginationItem,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { SectionCard, StatusBadge, LoadingState, EmptyState } from '../../../components'

import {
  getControlDePagosParaLosEstudiante,
  postRegistrarRecibos,
  putMarcarInscripcionPagada,
} from '../../../services/controlPagosParaEstudiantes'
import { getMostrandoPadresTutores } from '../../../services/padreTutorService'
import { generarReciboPdf } from '../../utils/generarReciboPdf'
import RolesChips from '../../gestionAdministrador/gestionAccesos/components/RolesChips'
import AccesoUsuarioModal from '../../gestionAdministrador/gestionAccesos/components/AccesoUsuarioModal'
import { hasPermission } from '../../utils/usuario'

const EstudianteTable = ({
  cargando,
  estudiantes,
  cargarEstudiantes,
  cantidadPreinscripciones,
  onRegistrarEstudiante,
  onVerPreinscripciones,
  seleccionarEstudiante,
  eliminarEstudiante,
  estudianteParaEliminar,
  cancelarEliminacion,
  confirmarEliminacion,
  accionEnProceso,
  modalInscripcion,
  abrirModalInscripcion,
  cerrarModalInscripcion,
  estudianteSeleccionado,
  cursosSeleccionados,
  handleCursos,
  cursos,
  crearInscripcion,
  mostrarCursosPorEstudiante,
  seleccionados,
  ejecutarHabilitarUsuario,
  paginaActual,
  setPaginaActual,
  registrosPorPagina,
  setRegistrosPorPagina,
  totalRegistros,
  totalPaginas,
  filtrosColumna,
  setFiltrosColumna,
}) => {
  const [cuentaAccesos, setCuentaAccesos] = useState(null)
  const puedeGestionarAccesos = hasPermission('users.access.manage')
  const [filtroAbierto, setFiltroAbierto] = useState(null)

  const obtenerNombreCompleto = (estudiante) =>
    [estudiante.nombre, estudiante.a_paterno, estudiante.a_materno].filter(Boolean).join(' ')

  const estadosDisponibles = ['Activo', 'Inactivo']

  const hayFiltros = Object.values(filtrosColumna).some((valor) => valor && valor !== 'Activo')

  const renderFilterHeader = (campo, etiqueta, tipo = 'text', opciones = []) => {
    const isOpen = filtroAbierto === campo
    const valorActual = filtrosColumna[campo] || ''

    return (
      <CTableHeaderCell scope="col" className="table-estudiante__head-cell">
        <div className="table-estudiante__header">
          <span>{etiqueta}</span>
          <button
            type="button"
            className={`table-estudiante__filter-toggle ${isOpen ? 'is-open' : ''}`}
            onClick={() => setFiltroAbierto(isOpen ? null : campo)}
            aria-label={`Filtrar por ${etiqueta}`}
          >
            {tipo === 'select' ? '🔽' : '🔍'}
          </button>
        </div>
        {isOpen && (
          <div className="table-estudiante__filter-panel">
            {tipo === 'date' ? (
              <input
                type="date"
                className="table-estudiante__filter-input"
                value={valorActual}
                onChange={(event) =>
                  setFiltrosColumna((prev) => ({ ...prev, [campo]: event.target.value }))
                }
              />
            ) : tipo === 'select' ? (
              <select
                className="table-estudiante__filter-input"
                value={valorActual}
                onChange={(event) =>
                  setFiltrosColumna((prev) => ({ ...prev, [campo]: event.target.value }))
                }
              >
                <option value="">Todos</option>
                {opciones.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="table-estudiante__filter-input"
                value={valorActual}
                placeholder="Buscar"
                onChange={(event) =>
                  setFiltrosColumna((prev) => ({ ...prev, [campo]: event.target.value }))
                }
              />
            )}
          </div>
        )}
      </CTableHeaderCell>
    )
  }

  const [deudaEncontrada, setDeudaEncontrada] = useState(null)
  const [deudasPendientesEstudiante, setDeudasPendientesEstudiante] = useState([])
  const [cobrandoDeuda, setCobrandoDeuda] = useState(false)
  const [mostrarConfirmacionPago, setMostrarConfirmacionPago] = useState(false)
  const [procesandoPagoInscripcion, setProcesandoPagoInscripcion] = useState(false)
  const [errorPagoInscripcion, setErrorPagoInscripcion] = useState('')
  const [mostrarResumenDeuda, setMostrarResumenDeuda] = useState(true)
  const padresTutores = useRef([])
  const mensajeSinTutor =
    'No se puede registrar el pago porque el estudiante no tiene un padre o tutor asignado. Debe asignar uno antes de continuar.'
  const tieneDeuda = Boolean(deudaEncontrada)
  const cursosSeleccionadosSet = new Set(cursosSeleccionados.map(Number))
  const totalSeleccionado = cursos
    .filter((curso) => cursosSeleccionadosSet.has(Number(curso.id_curso)))
    .reduce((total, curso) => total + Number(curso.costo || 0), 0)
  const totalDeudaEstudiante = deudasPendientesEstudiante.reduce(
    (total, deuda) => total + Number(deuda.costo || 0),
    0,
  )

  const obtenerTutorParaEstudiante = useCallback(async () => {
    if (!estudianteSeleccionado) return null

    const idTutor =
      estudianteSeleccionado.idTutor ||
      estudianteSeleccionado.id_tutor ||
      estudianteSeleccionado.idTutorEstudiante ||
      estudianteSeleccionado.id_tutor_estudiante

    if (!idTutor) return null

    if (padresTutores.current.length === 0) {
      const respuesta = await getMostrandoPadresTutores()
      const lista = respuesta.data || []
      padresTutores.current = lista
      return lista.find(
        (padreTutor) => String(padreTutor.id_tutor || padreTutor.idTutor) === String(idTutor),
      )
    }

    return padresTutores.current.find(
      (padreTutor) => String(padreTutor.id_tutor || padreTutor.idTutor) === String(idTutor),
    )
  }, [estudianteSeleccionado])

  useEffect(() => {
    const cargarPadresTutores = async () => {
      try {
        const respuesta = await getMostrandoPadresTutores()
        padresTutores.current = respuesta.data || []
      } catch (error) {
        console.error('No se pudieron cargar los padres y tutores', error)
      }
    }

    cargarPadresTutores()
  }, [])

  useEffect(() => {
    if (!errorPagoInscripcion) return undefined

    const temporizador = setTimeout(() => {
      setErrorPagoInscripcion('')
    }, 5000)

    return () => clearTimeout(temporizador)
  }, [errorPagoInscripcion])

  useEffect(() => {
    if (!tieneDeuda) {
      setMostrarResumenDeuda(true)
      setErrorPagoInscripcion('')
    }
  }, [tieneDeuda])

  const verificarDeudasEstudiante = useCallback(async () => {
    if (!estudianteSeleccionado) {
      setDeudaEncontrada(null)
      setDeudasPendientesEstudiante([])
      return
    }

    try {
      const respuesta = await getControlDePagosParaLosEstudiante()
      const deudas = respuesta.data?.datos || []
      const deudasPendientes = deudas.filter(
        (deuda) =>
          Number(deuda.id_estudiante) === Number(estudianteSeleccionado.id_estudiante) &&
          deuda.estado_pago === 'PENDIENTE',
      )
      const deuda = deudasPendientes[0] || null

      setDeudaEncontrada(deuda)
      setDeudasPendientesEstudiante(deudasPendientes)
    } catch (error) {
      console.error('Error al verificar el estado financiero del estudiante', error)
      setDeudaEncontrada(null)
      setDeudasPendientesEstudiante([])
    }
  }, [estudianteSeleccionado])

  useEffect(() => {
    verificarDeudasEstudiante()
  }, [verificarDeudasEstudiante])

  const registrarReciboYGenerarPdf = async (
    inscripcion,
    tutor,
    montoPagado = Number(inscripcion.costo || 0),
    conceptos = [],
  ) => {
    if (!tutor) {
      throw new Error('La inscripción no tiene un padre o tutor asignado')
    }

    const reciboData = {
      idInscripcion: inscripcion.id_inscripcion,
      padreTutor: [
        tutor.nombre,
        tutor.apellidoPaterno || tutor.a_paterno,
        tutor.apellidoMaterno || tutor.a_materno,
      ]
        .filter(Boolean)
        .join(' '),
      padreCi: String(tutor.ci || ''),
      montoPagado: Number(montoPagado || inscripcion.costo || 0),
      idPadre: tutor.id_tutor || tutor.idTutor || null,
      idEstudiante: inscripcion.id_estudiante || estudianteSeleccionado?.id_estudiante || null,
      estudiante:
        [
          estudianteSeleccionado?.nombre,
          estudianteSeleccionado?.a_paterno,
          estudianteSeleccionado?.a_materno,
        ]
          .filter(Boolean)
          .join(' ') ||
        inscripcion.estudiante ||
        null,
      idCurso: inscripcion.id_curso || inscripcion.idCurso || null,
      curso: inscripcion.materia || inscripcion.curso || 'Curso',
    }

    const respuestaRecibo = await postRegistrarRecibos(reciboData)
    const datosRecibo = respuestaRecibo.data?.datos

    if (!datosRecibo) {
      throw new Error('La API no devolvió los datos del recibo')
    }

    return {
      recibo: datosRecibo,
      concepto:
        conceptos.length > 0
          ? conceptos
          : [
              {
                descripcion: inscripcion.materia || 'Curso',
                monto: Number(montoPagado || inscripcion.costo || 0),
              },
            ],
    }
  }

  const handleCobrarDeudaVentanilla = async () => {
    if (!deudasPendientesEstudiante.length || cobrandoDeuda) return

    setCobrandoDeuda(true)
    try {
      const tutor = await obtenerTutorParaEstudiante()
      if (!tutor) {
        setMostrarResumenDeuda(false)
        setErrorPagoInscripcion(mensajeSinTutor)
        return
      }

      const recibosRegistrados = await Promise.all(
        deudasPendientesEstudiante.map(async (deuda) => {
          const resultado = await registrarReciboYGenerarPdf(
            deuda,
            tutor,
            Number(deuda.costo || 0),
            [{ descripcion: deuda.materia || 'Curso', monto: Number(deuda.costo || 0) }],
          )
          await putMarcarInscripcionPagada(deuda.id_inscripcion)
          return resultado.recibo
        }),
      )

      const reciboPrincipal = recibosRegistrados[0] || {}
      const resumenConceptos = deudasPendientesEstudiante.map((deuda) => ({
        descripcion: deuda.materia || 'Curso',
        monto: Number(deuda.costo || 0),
      }))

      await generarReciboPdf({
        ...reciboPrincipal,
        id_recibo: reciboPrincipal.id_recibo || 0,
        id_inscripcion: deudaEncontrada?.id_inscripcion || reciboPrincipal.id_inscripcion,
        estudiante_nombre: obtenerNombreCompleto(estudianteSeleccionado),
        estudiante_ci: String(estudianteSeleccionado.ci || ''),
        padre_tutor: [
          tutor.nombre,
          tutor.apellidoPaterno || tutor.a_paterno,
          tutor.apellidoMaterno || tutor.a_materno,
        ]
          .filter(Boolean)
          .join(' '),
        padre_ci: String(tutor.ci || ''),
        monto_pagado: totalDeudaEstudiante,
        fecha_pago: reciboPrincipal.fecha_pago || new Date().toISOString(),
        conceptos: resumenConceptos,
      })

      await verificarDeudasEstudiante()
      setErrorPagoInscripcion('')
      setMostrarResumenDeuda(true)
    } catch (error) {
      console.error('Error al registrar el pago de la deuda', error)
      setErrorPagoInscripcion(
        error.response?.data?.message ||
          error.message ||
          'No se pudo registrar el pago. Verifique la operación e inténtelo nuevamente.',
      )
      setMostrarResumenDeuda(false)
    } finally {
      setCobrandoDeuda(false)
    }
  }

  const cerrarModalCompleto = () => {
    setMostrarConfirmacionPago(false)
    setErrorPagoInscripcion('')
    cerrarModalInscripcion()
  }

  const procesarInscripcion = async (event) => {
    const inscrito = await crearInscripcion(event)
    if (inscrito) {
      setErrorPagoInscripcion('')
      if (inscrito.huboCambios && cursosSeleccionados.length > 0) {
        setMostrarConfirmacionPago(true)
      } else {
        await recargarYCerrarInscripcion()
      }
    } else {
      setMostrarConfirmacionPago(false)
      setErrorPagoInscripcion('')
    }
  }

  const recargarYCerrarInscripcion = async () => {
    await cargarEstudiantes()
    cerrarModalCompleto()
  }

  const registrarPagoInscripcion = async () => {
    if (!estudianteSeleccionado || procesandoPagoInscripcion) return

    setProcesandoPagoInscripcion(true)
    setErrorPagoInscripcion('')

    try {
      const respuesta = await getControlDePagosParaLosEstudiante()
      const deudasNuevas = (respuesta.data?.datos || []).filter(
        (deuda) =>
          Number(deuda.id_estudiante) === Number(estudianteSeleccionado.id_estudiante) &&
          deuda.estado_pago === 'PENDIENTE',
      )

      if (deudasNuevas.length === 0) {
        throw new Error('No se encontraron inscripciones pendientes para registrar el pago.')
      }

      const tutor = await obtenerTutorParaEstudiante()

      if (!tutor) {
        throw new Error(mensajeSinTutor)
      }

      const recibosRegistrados = await Promise.all(
        deudasNuevas.map(async (deuda) => {
          const resultado = await registrarReciboYGenerarPdf(
            deuda,
            tutor,
            Number(deuda.costo || 0),
            [{ descripcion: deuda.materia || 'Curso', monto: Number(deuda.costo || 0) }],
          )
          await putMarcarInscripcionPagada(deuda.id_inscripcion)
          return resultado.recibo
        }),
      )

      const reciboPrincipal = recibosRegistrados[0] || {}
      const resumenConceptos = deudasNuevas.map((deuda) => ({
        descripcion: deuda.materia || 'Curso',
        monto: Number(deuda.costo || 0),
      }))

      await generarReciboPdf({
        ...reciboPrincipal,
        id_recibo: reciboPrincipal.id_recibo || 0,
        id_inscripcion: deudasNuevas[0]?.id_inscripcion || reciboPrincipal.id_inscripcion,
        estudiante_nombre: obtenerNombreCompleto(estudianteSeleccionado),
        estudiante_ci: String(estudianteSeleccionado.ci || ''),
        padre_tutor: [
          tutor.nombre,
          tutor.apellidoPaterno || tutor.a_paterno,
          tutor.apellidoMaterno || tutor.a_materno,
        ]
          .filter(Boolean)
          .join(' '),
        padre_ci: String(tutor.ci || ''),
        monto_pagado: deudasNuevas.reduce((total, deuda) => total + Number(deuda.costo || 0), 0),
        fecha_pago: reciboPrincipal.fecha_pago || new Date().toISOString(),
        conceptos: resumenConceptos,
      })

      await recargarYCerrarInscripcion()
    } catch (error) {
      console.error('Error al registrar el pago de la inscripción', error)
      setErrorPagoInscripcion(
        error.response?.data?.message ||
          error.message ||
          'No se pudo registrar el pago. Verifique la operación e inténtelo nuevamente.',
      )
    } finally {
      setProcesandoPagoInscripcion(false)
    }
  }

  const cursoSeleccionable = (curso) =>
    curso.inscripcion_abierta || cursosSeleccionadosSet.has(Number(curso.id_curso))

  return (
    <>
      <SectionCard
        actions={
          <div className="estudiante-table__section-header">
            <h2 className="bm-section-card-title estudiante-table__section-title">
              Estudiantes registrados
            </h2>
            <div className="estudiante-table__section-summary">
              <p className="bm-section-card-description mb-0">
                {cargando
                  ? 'Consultando lista de estudiantes...'
                  : `${totalRegistros} estudiante${totalRegistros === 1 ? '' : 's'} encontrado${totalRegistros === 1 ? '' : 's'}`}
              </p>
              <div className="estudiante-toolbar__actions">
                <CButton
                  color="primary"
                  className="estudiante-toolbar__button estudiante-toolbar__button--primary"
                  onClick={onRegistrarEstudiante}
                >
                  Registrar Estudiante
                </CButton>
                <CButton
                  color="secondary"
                  className="estudiante-toolbar__button estudiante-toolbar__button--secondary"
                  onClick={onVerPreinscripciones}
                >
                  Ver Preinscripciones
                  <CBadge color="danger" shape="rounded-pill" className="ms-2">
                    {cantidadPreinscripciones}
                  </CBadge>
                </CButton>
              </div>
            </div>
          </div>
        }
        className="estudiante-table__card text-body"
      >
        {cargando ? (
          <LoadingState label="Cargando estudiantes..." />
        ) : estudiantes.length === 0 && !hayFiltros ? (
          <EmptyState
            title="No hay estudiantes registrados"
            description="Los estudiantes que agregues aparecerán aquí."
          />
        ) : (
          <div className="table-responsive estudiantes-table__wrapper">
            <CTable align="middle" hover className="table-estudiante__table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell scope="col" className="table-estudiante__head-cell">
                    Nro
                  </CTableHeaderCell>
                  {renderFilterHeader('estudiante', 'Estudiante')}
                  {renderFilterHeader('ci', 'CI')}
                  {renderFilterHeader('colegio', 'Colegio')}
                  {renderFilterHeader('telefono', 'Teléfono')}
                  {renderFilterHeader('email', 'Email')}
                  {renderFilterHeader('registro', 'Registro', 'date')}
                  <CTableHeaderCell scope="col" className="table-estudiante__head-cell">
                    Roles
                  </CTableHeaderCell>
                  {renderFilterHeader('estado', 'Estado', 'select', estadosDisponibles)}
                  <CTableHeaderCell scope="col" className="text-end table-estudiante__head-cell">
                    Acciones
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {estudiantes.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="table-estudiante__empty-results">
                      No se encontraron coincidencias
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  estudiantes.map((est, index) => (
                    <CTableRow key={est.id_estudiante} className="table-estudiante__row">
                      <CTableDataCell className="text-body-secondary table-estudiante__cell">
                        #{(paginaActual - 1) * registrosPorPagina + index + 1}
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        <strong>
                          {est.nombre} {est.a_paterno} {est.a_materno}
                        </strong>
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">{est.ci}</CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        {est.colegio || 'Sin colegio'}
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        {est.telefono}
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        {est.email}
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        {new Date(est.fecha_registro).toLocaleDateString()}
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        <RolesChips roles={est.roles} esSuper={false} />
                      </CTableDataCell>
                      <CTableDataCell className="table-estudiante__cell">
                        <StatusBadge status={est.estado || 'inactivo'}>
                          {est.estado || 'Sin estado'}
                        </StatusBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-end table-estudiante__cell">
                        <CButtonGroup size="sm">
                          {est.estado !== 'Activo' ? (
                            <CButton
                              color="secondary"
                              variant="outline"
                              disabled
                              className="estudiante-table__action"
                            >
                              Bloqueado
                            </CButton>
                          ) : (
                            <CButton
                              color="info"
                              variant="outline"
                              onClick={() => abrirModalInscripcion(est)}
                              className="estudiante-table__action"
                            >
                              Inscribir
                            </CButton>
                          )}

                          <CButton
                            color="primary"
                            variant="outline"
                            onClick={() => seleccionarEstudiante(est)}
                            className="estudiante-table__action"
                          >
                            Editar
                          </CButton>
                          {est.estado !== 'Activo' ? (
                            <CButton
                              color="success"
                              variant="outline"
                              onClick={async () => {
                                await ejecutarHabilitarUsuario(est.id_cuenta, 'estudiante')
                                await cargarEstudiantes()
                              }}
                              className="estudiante-table__action"
                            >
                              Activar
                            </CButton>
                          ) : (
                            <CButton
                              color="danger"
                              variant="outline"
                              onClick={() => eliminarEstudiante(est.id_estudiante)}
                              className="estudiante-table__action"
                            >
                              Dar de baja
                            </CButton>
                          )}
                          {puedeGestionarAccesos && est.id_cuenta && (
                            <CButton
                              color="secondary"
                              variant="outline"
                              onClick={() => setCuentaAccesos(est.id_cuenta)}
                              className="estudiante-table__action"
                            >
                              Accesos
                            </CButton>
                          )}
                        </CButtonGroup>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
            <AccesoUsuarioModal
              idUsuario={cuentaAccesos}
              visible={cuentaAccesos !== null}
              onClose={() => setCuentaAccesos(null)}
            />
            <Paginacion
              page={paginaActual}
              limit={registrosPorPagina}
              total={totalRegistros}
              totalPaginas={totalPaginas}
              etiqueta="estudiantes"
              onCambiarPagina={setPaginaActual}
              onCambiarLimite={(cantidad) => {
                setRegistrosPorPagina(cantidad)
                setPaginaActual(1)
              }}
            />
          </div>
        )}
      </SectionCard>
      <CModal
        visible={modalInscripcion}
        onClose={cerrarModalCompleto}
        portal={false}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Inscribir a{' '}
            {estudianteSeleccionado &&
              `${estudianteSeleccionado.nombre} ${estudianteSeleccionado.a_paterno || ''} ${estudianteSeleccionado.a_materno || ''}`}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {tieneDeuda && mostrarResumenDeuda && (
            <CAlert color="danger">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div>
                  <div className="fw-semibold mb-2">Resumen de deuda pendiente:</div>
                  <ul className="mb-2 ps-3">
                    {deudasPendientesEstudiante.map((deuda) => (
                      <li key={deuda.id_inscripcion}>
                        {deuda.materia || 'Curso'} - Bs. {Number(deuda.costo || 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                  <div className="fw-bold">
                    Total a pagar: Bs. {totalDeudaEstudiante.toFixed(2)}
                  </div>
                </div>
                <CButton
                  color="success"
                  size="sm"
                  className="ms-3"
                  onClick={handleCobrarDeudaVentanilla}
                  disabled={cobrandoDeuda}
                >
                  {cobrandoDeuda ? 'Procesando...' : 'Cobrar Deuda Aquí'}
                </CButton>
              </div>
            </CAlert>
          )}
          {errorPagoInscripcion && (
            <CAlert color="warning" className="mt-3 mb-3">
              {errorPagoInscripcion}
            </CAlert>
          )}
          <CFormLabel htmlFor="estudiante-cursos">Selecciona uno o más cursos</CFormLabel>
          <CFormSelect
            id="estudiante-cursos"
            multiple
            value={cursosSeleccionados}
            onChange={handleCursos}
            className="estudiante-form__input estudiante-form__select bm-multi-select"
            aria-describedby="estudiante-cursos-ayuda"
          >
            {cursos.filter(cursoSeleccionable).map((curs) => (
              <option key={curs.id_curso} value={curs.id_curso}>
                {curs.nombre}
              </option>
            ))}
          </CFormSelect>
          <div id="estudiante-cursos-ayuda" className="form-text">
            Puedes seleccionar varios cursos manteniendo presionada la tecla Ctrl o Cmd.
          </div>
          <div className="mt-3 fw-semibold text-end">
            Total a pagar: Bs. {totalSeleccionado.toFixed(2)}
          </div>
          {mostrarConfirmacionPago && (
            <CAlert color="info" className="mt-3">
              <p className="mb-3">
                ¡Inscripción registrada! Total a recaudar: Bs. {totalSeleccionado.toFixed(2)}.
                ¿Desea registrar el pago completo en efectivo en ventanilla en este momento?
              </p>
              <div className="mb-3 small text-primary-emphasis">
                Se generará un único recibo consolidado con el total general y el resumen de cursos.
              </div>
              {errorPagoInscripcion && <CAlert color="danger">{errorPagoInscripcion}</CAlert>}
              <div className="d-flex gap-2 justify-content-end">
                <CButton
                  color="success"
                  onClick={registrarPagoInscripcion}
                  disabled={procesandoPagoInscripcion}
                >
                  {procesandoPagoInscripcion ? 'Registrando...' : 'Sí, Registrar Pago'}
                </CButton>
                <CButton
                  color="secondary"
                  onClick={recargarYCerrarInscripcion}
                  disabled={procesandoPagoInscripcion}
                >
                  No, Dejar Pendiente
                </CButton>
              </div>
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={cerrarModalCompleto}>
            Cerrar
          </CButton>
          <CButton
            color="primary"
            onClick={procesarInscripcion}
            disabled={Boolean(accionEnProceso) || tieneDeuda || mostrarConfirmacionPago}
          >
            {accionEnProceso === 'inscribir' ? (
              <>
                <CSpinner size="sm" className="me-1" /> Procesando
              </>
            ) : (
              'Inscribir estudiante'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={Boolean(estudianteParaEliminar)}
        onClose={cancelarEliminacion}
        portal={false}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Eliminar estudiante</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Esta acción actualizará el registro del estudiante. ¿Deseas continuar?
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={cancelarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            Cancelar
          </CButton>
          <CButton
            color="danger"
            onClick={confirmarEliminacion}
            disabled={Boolean(accionEnProceso)}
          >
            {accionEnProceso === 'eliminar' ? (
              <>
                <CSpinner size="sm" className="me-1" /> Procesando
              </>
            ) : (
              'Sí, eliminar'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default EstudianteTable
