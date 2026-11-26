import api from '../api/api'

export const postLogin = async (data) => await api.post('/login', data)

export const postCambiarRol = async (role) => await api.post('/cambiar-rol', { role })
