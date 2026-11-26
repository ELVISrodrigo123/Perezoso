import api from '../../api/api'

export const obtenerAdministradoresPaginado = async (params) => {
  const respuesta = await api.get('/admin/administradores', { params })
  return respuesta.data
}

export const obtenerAdministradores = async () => {
  const respuesta = await api.get('/admin/administradores', { params: { todos: true } })
  return respuesta.data.datos
}

export const registrarAdministrador = async (datos) => {
  const respuesta = await api.post('/admin/administradores', datos)
  return respuesta.data
}

export const actualizarAdministrador = async (id, datos) => {
  const respuesta = await api.put(`/admin/administradores/${id}`, datos)
  return respuesta.data
}

export const darBajaAdministrador = async (id) => {
  const respuesta = await api.delete(`/admin/administradores/${id}`)
  return respuesta.data
}

export const activarAdministrador = async (id) => {
  const respuesta = await api.put(`/admin/administradores/${id}/activar`)
  return respuesta.data
}

export const verificarEsSuper = async () => {
  const respuesta = await api.get('/admin/administradores/es-super')
  return respuesta.data.esSuper
}
