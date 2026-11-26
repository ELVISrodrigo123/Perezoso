import api from '../../api/api'

const BASE = '/admin/accesos'

export const getCatalogoPermisos = async () => (await api.get(`${BASE}/permisos`)).data.permisos

export const getRoles = async () => (await api.get(`${BASE}/roles`)).data.roles

export const crearRol = async (datos) => (await api.post(`${BASE}/roles`, datos)).data

export const actualizarRol = async (id, datos) => (await api.put(`${BASE}/roles/${id}`, datos)).data

export const cambiarEstadoRol = async (id, status) =>
  (await api.put(`${BASE}/roles/${id}/estado`, { status })).data

export const guardarPermisosRol = async (id, permissions) =>
  (await api.put(`${BASE}/roles/${id}/permisos`, { permissions })).data

export const buscarUsuariosAcceso = async (params) =>
  (await api.get(`${BASE}/usuarios`, { params })).data

export const getAccesoUsuario = async (id) => (await api.get(`${BASE}/usuarios/${id}`)).data

export const guardarRolesUsuario = async (id, roles, fichas) =>
  (await api.put(`${BASE}/usuarios/${id}/roles`, { roles, fichas })).data

export const guardarPersonalizaciones = async (id, overrides) =>
  (await api.put(`${BASE}/usuarios/${id}/permisos`, { overrides })).data

export const restablecerPersonalizaciones = async (id) =>
  (await api.delete(`${BASE}/usuarios/${id}/permisos`)).data

export const cambiarSuperAdministrador = async (id, esSuper) =>
  (await api.put(`${BASE}/usuarios/${id}/super`, { esSuper })).data
