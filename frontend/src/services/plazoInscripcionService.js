import api from '../api/api'

export const getPlazoGlobal = () => api.get('/admin/configuracion/plazo-inscripcion')

export const putPlazoGlobal = (dias) => api.put('/admin/configuracion/plazo-inscripcion', { dias })

export const getPlazoCurso = (idCurso) => api.get(`/admin/cursos/${idCurso}/plazo-inscripcion`)

export const putPlazoCurso = (idCurso, dias) =>
  api.put(`/admin/cursos/${idCurso}/plazo-inscripcion`, { dias })
