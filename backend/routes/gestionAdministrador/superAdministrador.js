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

const router = express.Router()
router.get('/administradores', getAdministradores)
router.post('/administradores', validarAdministrador, validarCampos, postAdministrador)
router.put('/administradores/:id', validarAdministrador, validarCampos, putAdministrador)
router.delete('/administradores/:id', deleteAdministrador)
router.put('/administradores/:id/activar', activarAdministrador)

router.get('/administradores/es-super', getEsSuper)

export default router
