let accessToken = null
const oyentes = new Set()

export const setAccessToken = (token) => {
  accessToken = token
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
}

export const suscribirCambioRol = (fn) => {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

export const notificarCambioRol = () => {
  oyentes.forEach((fn) => fn())
}
