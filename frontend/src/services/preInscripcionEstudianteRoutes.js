import publicApi from '../api/publicApi'
import api from '../api/api'

export const postPreinscripcionEstudiante = async (data) =>
  await publicApi.post('/preinscripcion/estudiante', data)

export const getPreinscripcionPaginado = async (params) =>
  await api.get('/admin/preinscripcion/lista', { params })

export const getPreinscripcionEstudiante = async () => {
  const res = await api.get('/admin/preinscripcion/lista', { params: { todos: true } })
  return { ...res, data: res.data.datos }
}

export const postPreinscripcionRechazado = async (idSolicitud) =>
  await api.post(`/admin/preinscripcion/rechazado/${idSolicitud}`)

export const postPreinscripcionAceptada = async (idSolicitud) =>
  await api.post(`/admin/preinscripcion/aceptada/${idSolicitud}`)
