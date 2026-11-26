import TableControlPagosEstudiante from './components/TableControlPagosEstudiante'
import { useControlPagosEstudiante } from './hooks/useControlPagosEstudiante'
import { FeedbackAlert } from '../../../components'

const ControlPagosEstudiante = () => {
  const {
    listaEstudiantesNoPagados,
    padresTutores,
    estudiantes,
    marcarInscripcionComoPagada,
    feedback,
    limpiarFeedback,
    pagoEnProceso,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
    filtrosColumna,
    setFiltrosColumna,
  } = useControlPagosEstudiante()
  return (
    <div className="pagos-page__container">
      <FeedbackAlert feedback={feedback} onClose={limpiarFeedback} />
      <TableControlPagosEstudiante
        listaEstudiantesNoPagados={listaEstudiantesNoPagados}
        padresTutores={padresTutores}
        estudiantes={estudiantes}
        marcarInscripcionComoPagada={marcarInscripcionComoPagada}
        pagoEnProceso={pagoEnProceso}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={registrosPorPagina}
        setRegistrosPorPagina={setRegistrosPorPagina}
        totalRegistros={totalRegistros}
        totalPaginas={totalPaginas}
        filtrosColumna={filtrosColumna}
        setFiltrosColumna={setFiltrosColumna}
      />
    </div>
  )
}

export default ControlPagosEstudiante
