export const DIAS_PLAZO_MINIMO = 0
export const DIAS_PLAZO_MAXIMO = 90

const ZONA_HORARIA_ACADEMIA = 'America/La_Paz'

export const ESTADOS_INSCRIPCION = {
  abierta: { texto: 'Abierta', color: 'success' },
  plazo_vencido: { texto: 'Cerrada: plazo vencido', color: 'danger' },
  terminado: { texto: 'Cerrada: curso terminado', color: 'dark' },
  inactivo: { texto: 'Cerrada: curso inactivo', color: 'secondary' },
  sin_cupos: { texto: 'Cerrada: sin cupos', color: 'warning' },
}

export const fechaHoyAcademia = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA_ACADEMIA }).format(new Date())

const sumarDias = (fechaIso, dias) => {
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

export const formatearFechaIso = (fechaIso, textoVacio = 'Sin definir') => {
  if (!fechaIso) return textoVacio
  const [anio, mes, dia] = String(fechaIso).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

export const esDiaDePlazoValido = (dias) =>
  Number.isInteger(dias) && dias >= DIAS_PLAZO_MINIMO && dias <= DIAS_PLAZO_MAXIMO

export const calcularVistaPreviaPlazo = ({
  fechaInicio,
  fechaFin,
  dias,
  estadoCurso,
  cuposDisponibles,
}) => {
  if (!fechaInicio || !fechaFin || !esDiaDePlazoValido(dias)) return null

  const limiteSegunDias = sumarDias(fechaInicio, dias)
  const fechaLimite = limiteSegunDias < fechaFin ? limiteSegunDias : fechaFin
  const hoy = fechaHoyAcademia()

  let estado = 'abierta'
  if (estadoCurso !== 'Activo') estado = 'inactivo'
  else if (hoy > fechaFin) estado = 'terminado'
  else if (hoy > fechaLimite) estado = 'plazo_vencido'
  else if (cuposDisponibles <= 0) estado = 'sin_cupos'

  return {
    fechaLimite,
    estado,
    abierta: estado === 'abierta',
    limitadaPorFechaFin: limiteSegunDias > fechaFin,
  }
}

export const estadoVisualDelCurso = (curso, textoAntesDelInicio) => {
  const fechaLimite = formatearFechaIso(curso.fecha_limite_inscripcion)

  if (curso.estado_inscripcion === 'terminado') {
    return {
      texto: 'TERMINADO',
      tono: 'danger',
      puedeInscribirse: false,
      ayuda: 'El curso ya terminó',
    }
  }
  if (curso.estado_inscripcion === 'inactivo') {
    return {
      texto: 'NO DISPONIBLE',
      tono: 'danger',
      puedeInscribirse: false,
      ayuda: 'El curso no está disponible',
    }
  }
  if (curso.estado_inscripcion === 'sin_cupos') {
    return {
      texto: 'SIN CUPOS',
      tono: 'danger',
      puedeInscribirse: false,
      ayuda: 'El curso no tiene cupos disponibles',
    }
  }
  if (curso.estado_inscripcion === 'plazo_vencido') {
    return {
      texto: 'EN CURSO',
      tono: 'danger',
      puedeInscribirse: false,
      ayuda: `Ya no se puede inscribir: el plazo cerró el ${fechaLimite}`,
    }
  }
  if (!curso.curso_iniciado) {
    return {
      texto: textoAntesDelInicio,
      tono: null,
      puedeInscribirse: true,
      ayuda: `Inscripciones abiertas hasta el ${fechaLimite}`,
    }
  }
  return {
    texto: 'EN CURSO',
    tono: 'success',
    puedeInscribirse: true,
    ayuda: `Se puede inscribir hasta el ${fechaLimite}`,
  }
}
