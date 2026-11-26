import api from '../api/api'

export const getCursosPaginado = async (params) => await api.get('/admin/cursos', { params })
export const getCursos = async () => {
  const res = await api.get('/admin/cursos', { params: { todos: true } })
  return { ...res, data: res.data.datos }
}
export const getCursosPorVencer = async () => await api.get('/admin/cursos/por-vencer')

export const postCursos = async (data) => await api.post('/admin/cursos', data)

export const putCursos = async (id, data) => await api.put(`/admin/cursos/${id}`, data)

export const deleteCursos = async (id) => await api.delete(`/admin/cursos/${id}`)
