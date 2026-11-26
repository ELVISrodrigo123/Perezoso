import api from '../api/api.js'

export const getEstudiantesPaginado = async (params) =>
  await api.get('/admin/estudiantes', { params })

export const getEstudiantes = async () => {
  const res = await api.get('/admin/estudiantes', { params: { todos: true } })
  return { ...res, data: res.data.datos }
}

export const postEstudiantes = async (data) => await api.post('/admin/estudiantes', data)

export const putEstudiantes = async (id, data) => await api.put(`/admin/estudiantes/${id}`, data)

export const deleteEstudiantes = (id) => api.delete(`/admin/estudiantes/${id}`)
