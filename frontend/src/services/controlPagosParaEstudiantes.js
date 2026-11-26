import api from '../api/api'

export const getControlDePagosPaginado = async (params) =>
  await api.get('/admin/inscripciones/control-pagos', { params })

export const getControlDePagosParaLosEstudiante = async () =>
  await api.get('/admin/inscripciones/control-pagos', { params: { todos: true } })

export const putMarcarInscripcionPagada = async (idInscripcion) =>
  await api.put(`/admin/inscripciones/marcar-pagado/${idInscripcion}`)

export const getRecibosPaginado = async (params) =>
  await api.get('/admin/inscripciones/mostrar-recibos', { params })

export const getMostrarRecibos = async () =>
  await api.get('/admin/inscripciones/mostrar-recibos', { params: { todos: true } })

export const postRegistrarRecibos = async (reciboData) =>
  await api.post('/admin/inscripciones/registrar-recibos', reciboData)
