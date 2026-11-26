import { jwtDecode } from 'jwt-decode'

let accessToken = null
const oyentes = new Set()

const firmaDeAccesos = (token) => {
  if (!token) return ''
  try {
    const { id, permissions = [] } = jwtDecode(token)
    return `${id}|${[...permissions].sort().join(',')}`
  } catch {
    return ''
  }
}

export const notificarCambioSesion = () => {
  oyentes.forEach((fn) => fn())
}

export const setAccessToken = (token) => {
  const firmaAnterior = firmaDeAccesos(accessToken)
  accessToken = token
  if (firmaAnterior && firmaAnterior !== firmaDeAccesos(token)) notificarCambioSesion()
}

export const getAccessToken = () => accessToken

export const clearAccessToken = () => {
  accessToken = null
}

export const suscribirCambioSesion = (fn) => {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}
