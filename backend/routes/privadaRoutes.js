import express from 'express'
import { verificarToken } from '../middlewares/veriificarToken.js'
import { obtenerMenuPorPermisos } from '../models/modelsUsuarios/permisosUsuario.js'

const route = express.Router()

route.get('/perfil', verificarToken, (req, res) => {
  const { id, email, roles, permissions } = req.user
  res.json({
    message: 'token autorizado',
    usuario: { id, email, roles, permissions }
  })
})

route.get('/perfil/menu', verificarToken, async (req, res) => {
  try {
    const menu = await obtenerMenuPorPermisos(req.user.permissions ?? [])
    res.json({ menu })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno servidor' })
  }
})

export default route
