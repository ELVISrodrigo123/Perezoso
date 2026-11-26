import express from 'express'
import { getProfesor, postProfesor, putProfesor, deleteProfesor } from '../controllers/profesorController.js'
import { validarProfesor } from '../middlewares/profesorValidacion/profesorValidator.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'
import { requireAnyPermission, requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/profesor', requireAnyPermission('menu.teachers.view', 'menu.courses.view', 'menu.enrollments.view'), getProfesor)
router.post('/profesor', requirePermission('teachers.create'), validarProfesor, validarCampos, postProfesor)
router.put('/profesor/:id', requirePermission('teachers.update'), validarProfesor, validarCampos, putProfesor)
router.delete('/profesor/:id', requirePermission('teachers.delete'), deleteProfesor)

export default router
