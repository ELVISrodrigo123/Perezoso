import jwt from 'jsonwebtoken'

export const TIPO_ACCESS_TOKEN = 'access'
export const TIPO_REFRESH_TOKEN = 'refresh'

export const verificarToken = (req, res, next) => {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ')

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'token no autorizado ' })
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET)
    if (usuario.type !== TIPO_ACCESS_TOKEN) {
      return res.status(401).json({ message: 'token no  valido o expirado ' })
    }
    req.user = usuario
    next()
  } catch (err) {
    return res.status(401).json({ message: 'token no  valido o expirado ' })
  }
}
