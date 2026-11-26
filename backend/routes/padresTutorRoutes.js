import express from 'express'
import { getPadresTutors, postPadreTutor, putPadreTutor, deletePadreTutor } from '../controllers/padreTutorController.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'
import { validarPadreTutor } from '../middlewares/padresValidacion/padresValidator.js'
import { requireAnyPermission, requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()
router.get('/padres-tutores', requireAnyPermission('menu.guardians.view', 'menu.students.view'), getPadresTutors)
router.post('/padres-tutores/registro', requirePermission('guardians.create'), validarPadreTutor, validarCampos, postPadreTutor)
router.put('/padres-tutores/actualizar/:id', requirePermission('guardians.update'), validarPadreTutor, validarCampos, putPadreTutor)
router.delete('/padres-tutores/eliminar/:id', requirePermission('guardians.delete'), deletePadreTutor)

export default router
