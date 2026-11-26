import api from '../../api/api'

export const putHabilitarUsuario = async (idUsuario, role) =>
  api.put(`/admin/habilitar-usuario/${idUsuario}`, null, { params: { role } })
