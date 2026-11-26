import express from 'express'
import { deleteEstudiante, getEstudiantes, postEstudiante, putEstudiante } from '../controllers/estudiantesController.js'
import { validarEstudiante } from '../middlewares/estudiantesValidacion/estudianteValidator.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'
import { requireAnyPermission, requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/estudiantes', requireAnyPermission('menu.students.view', 'menu.payments.view'), getEstudiantes)
router.post('/estudiantes', requirePermission('students.create'), validarEstudiante, validarCampos, postEstudiante)
router.put('/estudiantes/:id', requirePermission('students.update'), validarEstudiante, validarCampos, putEstudiante)
router.delete('/estudiantes/:id', requirePermission('students.delete'), deleteEstudiante)

export default router
