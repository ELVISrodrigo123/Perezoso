import api from '../api/api'

export const getMenuDelUsuario = async () => {
  const respuesta = await api.get('/perfil/menu')
  return respuesta.data.menu ?? []
}
