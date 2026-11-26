import express from 'express'
import {
  getAdministradores,
  postAdministrador,
  putAdministrador,
  deleteAdministrador,
  activarAdministrador,
  getEsSuper
} from '../../controllers/administradoresController.js'
import { validarAdministrador } from '../../middlewares/administradorValidacion/administradorvalidator.js'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()
router.get('/administradores', requirePermission('menu.admins.view'), getAdministradores)
router.post('/administradores', requirePermission('admins.create'), validarAdministrador, validarCampos, postAdministrador)
router.put('/administradores/:id', requirePermission('admins.update'), validarAdministrador, validarCampos, putAdministrador)
router.delete('/administradores/:id', requirePermission('admins.delete'), deleteAdministrador)
router.put('/administradores/:id/activar', requirePermission('admins.activate'), activarAdministrador)

router.get('/administradores/es-super', getEsSuper)

export default router
