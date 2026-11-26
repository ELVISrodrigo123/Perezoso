import api from '../api/api'

export const getProfesorPaginado = async (params) => await api.get('/admin/profesor', { params })
export const getProfesor = async () => {
  const res = await api.get('/admin/profesor', { params: { todos: true } })
  return { ...res, data: res.data.datos }
}
export const postProfesor = async (data) => await api.post('/admin/profesor', data)
export const putProfesor = async (id, data) => await api.put(`/admin/profesor/${id}`, data)
export const deleteProfesor = async (id) => await api.delete(`/admin/profesor/${id}`)
