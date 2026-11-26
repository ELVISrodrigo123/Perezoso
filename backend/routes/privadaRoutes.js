import express from 'express'
import { verificarToken } from '../middlewares/veriificarToken.js'

const route = express.Router()

route.get('/perfil', verificarToken, (req, res) => {
  const { id, email, role, roles, permisos } = req.user
  res.json({
    message: 'token autorizado',
    usuario: { id, email, role, roles, permisos }
  })
})

export default route
