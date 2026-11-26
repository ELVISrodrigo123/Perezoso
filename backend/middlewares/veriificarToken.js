import jwt from 'jsonwebtoken'
import { obtenerVersionDePermisos } from '../models/modelsUsuarios/permisosUsuario.js'

export const TIPO_ACCESS_TOKEN = 'access'
export const TIPO_REFRESH_TOKEN = 'refresh'

const DURACION_CACHE_MS = 5000
const cacheDeVersiones = new Map()

export const invalidarCacheDePermisos = (idUsuario) => {
  if (idUsuario === undefined) {
    cacheDeVersiones.clear()
    return
  }
  cacheDeVersiones.delete(Number(idUsuario))
}

const obtenerVersionVigente = async (idUsuario) => {
  const enCache = cacheDeVersiones.get(idUsuario)
  if (enCache && enCache.expira > Date.now()) return enCache.vigente

  const vigente = await obtenerVersionDePermisos(idUsuario)
  cacheDeVersiones.set(idUsuario, { vigente, expira: Date.now() + DURACION_CACHE_MS })
  return vigente
}

export const verificarToken = async (req, res, next) => {
  if (req.user) return next()

  const [esquema, token] = (req.headers.authorization ?? '').split(' ')

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'token no autorizado ' })
  }

  let usuario
  try {
    usuario = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ message: 'token no  valido o expirado ' })
  }

  if (usuario.type !== TIPO_ACCESS_TOKEN) {
    return res.status(401).json({ message: 'token no  valido o expirado ' })
  }

  try {
    const vigente = await obtenerVersionVigente(Number(usuario.id))
    if (!vigente || vigente.estado !== 'Activo' || vigente.version !== usuario.permissions_version) {
      return res.status(401).json({
        error: 'permisos_desactualizados',
        message: 'Tus accesos cambiaron: vuelve a cargar la sesión'
      })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error interno servidor' })
  }

  req.user = usuario
  next()
}
