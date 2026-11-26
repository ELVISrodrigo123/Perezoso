import express from 'express'
import { putHabilitarUsuario } from '../../controllers/authController.js'
import { requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()

router.put('/habilitar-usuario/:idUsuario', requirePermission('users.enable'), putHabilitarUsuario)

export default router
