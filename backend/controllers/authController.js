import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  habilitarUsuario,
  loginUsuario,
  obtenerCuentaPorId,
  obtenerRolesActivos
} from '../models/modelsUsuarios/loginUsuario.js'

dotenv.config({ path: './.env' })

const PRIORIDAD_ROLES = ['administrador', 'profesor', 'estudiante']

const elegirRolPorDefecto = (roles) =>
  PRIORIDAD_ROLES.find((rol) => roles.includes(rol)) ?? roles[0]

const crearAccessToken = (usuario, roles, role) => {
  return jwt.sign(
    { id: usuario.id_usuarios, email: usuario.email, role, roles },
    process.env.JWT_SECRET,
    {
      expiresIn: '10m'
    }
  )
}

const crearRefreshToken = (usuario, role) => {
  return jwt.sign(
    { id: usuario.id_usuarios, email: usuario.email, role, type: 'refresh' },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
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
    const { email, password, role: rolSolicitado } = req.body
    const result = await loginUsuario(email)

    if (!result.rows.length) {
      return res.status(400).json({ message: 'Usuario no existe o credenciales inválidas' })
    }

    const usuario = result.rows[0]
    const passwordValida = await bcrypt.compare(password, usuario.password_hash)

    if (!passwordValida) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrecta' })
    }

    const mensajeInactivo = 'Tu cuenta se encuentra inactiva. Por favor, contacta al administrador.'

    if (usuario.estado !== 'Activo') {
      return res.status(403).json({ message: mensajeInactivo })
    }

    const roles = await obtenerRolesActivos(usuario.id_usuarios)

    if (!roles.length) {
      return res.status(403).json({ message: mensajeInactivo })
    }

    const role = roles.includes(rolSolicitado) ? rolSolicitado : elegirRolPorDefecto(roles)

    const token = crearAccessToken(usuario, roles, role)
    const refreshToken = crearRefreshToken(usuario, role)

    guardarRefreshTokenEnCookie(res, refreshToken)

    return res.json({ token })
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

    if (payload.type !== 'refresh') {
      return res.status(401).json({ message: 'Refresh token inválido' })
    }

    // Se consulta la BD: si al usuario le quitaron un rol o lo desactivaron, se nota aqui
    const cuenta = await obtenerCuentaPorId(payload.id)
    if (!cuenta || cuenta.estado !== 'Activo') {
      return res.status(401).json({ message: 'Cuenta inactiva' })
    }

    const roles = await obtenerRolesActivos(payload.id)
    if (!roles.length) {
      return res.status(401).json({ message: 'Sin roles activos' })
    }

    const role = roles.includes(payload.role) ? payload.role : elegirRolPorDefecto(roles)

    const usuario = { id_usuarios: cuenta.id_usuarios, email: cuenta.email }

    const nuevoAccessToken = crearAccessToken(usuario, roles, role)
    const nuevoRefreshToken = crearRefreshToken(usuario, role)

    guardarRefreshTokenEnCookie(res, nuevoRefreshToken)

    return res.json({ token: nuevoAccessToken })
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token inválido o expirado' })
  }
}

// Cambiar de rol sin volver a escribir la contraseña (requiere token valido)
export const cambiarRol = async (req, res) => {
  try {
    const { role } = req.body

    const cuenta = await obtenerCuentaPorId(req.user.id)
    if (!cuenta || cuenta.estado !== 'Activo') {
      return res.status(403).json({ message: 'Cuenta inactiva' })
    }

    const roles = await obtenerRolesActivos(req.user.id)

    if (!roles.includes(role)) {
      return res.status(403).json({ message: 'No tienes ese rol asignado o está inactivo' })
    }

    const usuario = { id_usuarios: cuenta.id_usuarios, email: cuenta.email }

    guardarRefreshTokenEnCookie(res, crearRefreshToken(usuario, role))

    return res.json({ token: crearAccessToken(usuario, roles, role) })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}

export const putHabilitarUsuario = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'administrador') {
      return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden acceder a esta información.' })
    }
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
