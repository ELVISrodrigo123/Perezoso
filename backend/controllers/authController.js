import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { habilitarUsuario, loginUsuario } from '../models/modelsUsuarios/loginUsuario.js'
import { obtenerAccesoEfectivo } from '../models/modelsUsuarios/permisosUsuario.js'
import { TIPO_ACCESS_TOKEN, TIPO_REFRESH_TOKEN } from '../middlewares/veriificarToken.js'

dotenv.config({ path: './.env' })

const MENSAJE_INACTIVO = 'Tu cuenta se encuentra inactiva. Por favor, contacta al administrador.'

const crearAccessToken = (acceso) => {
  return jwt.sign(
    {
      id: acceso.id,
      email: acceso.email,
      roles: acceso.roles,
      permissions: acceso.permissions,
      permissions_version: acceso.version,
      type: TIPO_ACCESS_TOKEN
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '10m'
    }
  )
}

const crearRefreshToken = (acceso) => {
  return jwt.sign(
    { id: acceso.id, email: acceso.email, type: TIPO_REFRESH_TOKEN },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
}

const tieneAcceso = (acceso) => acceso && acceso.estado === 'Activo' && (acceso.esSuper || acceso.roles.length > 0)

const emitirSesion = (res, acceso) => {
  guardarRefreshTokenEnCookie(res, crearRefreshToken(acceso))
  return crearAccessToken(acceso)
}

const guardarRefreshTokenEnCookie = (res, token) => {
  const esProduccion = process.env.NODE_ENV === 'production'

  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: esProduccion ? 'none' : 'lax',
    secure: esProduccion,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  })
}
const leerCookie = (req, nombre) => {
  const cookies = req.headers.cookie || ''
  const valor = cookies
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${nombre}=`))

  if (!valor) return null

  return decodeURIComponent(valor.split('=').slice(1).join('='))
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await loginUsuario(email)

    if (!result.rows.length) {
      return res.status(400).json({ message: 'Usuario no existe o credenciales inválidas' })
    }

    const usuario = result.rows[0]
    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrecta' })
    }

    const acceso = await obtenerAccesoEfectivo(usuario.id_usuarios)

    if (!tieneAcceso(acceso)) {
      return res.status(403).json({ message: MENSAJE_INACTIVO })
    }

    return res.json({ token: emitirSesion(res, acceso) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const tokenCookie = leerCookie(req, 'refreshToken')

    if (!tokenCookie) {
      return res.status(401).json({ message: 'Refresh token no disponible' })
    }

    const payload = jwt.verify(tokenCookie, process.env.JWT_SECRET)

    if (payload.type !== TIPO_REFRESH_TOKEN) {
      return res.status(401).json({ message: 'Refresh token inválido' })
    }

    const acceso = await obtenerAccesoEfectivo(payload.id)
    if (!tieneAcceso(acceso)) {
      return res.status(401).json({ message: 'Cuenta inactiva o sin roles activos' })
    }

    return res.json({ token: emitirSesion(res, acceso) })
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token inválido o expirado' })
  }
}

export const putHabilitarUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params
    const { role } = req.query
    if (!['estudiante', 'profesor', 'administrador'].includes(role)) {
      return res.status(400).json({ message: 'Debes indicar el rol a habilitar.' })
    }
    const informe = await habilitarUsuario(idUsuario, role)
    if (informe.rowCount === 0) {
      return res.status(200).json({ message: 'Usuario no habilitado ' })
    }

    return res.status(200).json({ message: 'Usuario habilitado correctamente' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}
