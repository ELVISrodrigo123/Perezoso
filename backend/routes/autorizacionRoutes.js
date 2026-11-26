import express from 'express'
import { login, refreshToken, cambiarRol } from '../controllers/authController.js'
import { limitadorLogin } from '../middlewares/publicValidaciones/publicLimiter.js'
import { verificarToken } from '../middlewares/veriificarToken.js'

const router = express.Router()

router.post('/login', limitadorLogin, login)
router.post('/refresh', refreshToken)
router.post('/cambiar-rol', verificarToken, cambiarRol)

export default router
