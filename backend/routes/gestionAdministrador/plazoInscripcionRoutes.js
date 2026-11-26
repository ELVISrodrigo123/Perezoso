import express from 'express'
import { getPlazoCurso, getPlazoGlobal, putPlazoCurso, putPlazoGlobal } from '../../controllers/plazoInscripcionController.js'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { validarIdCurso, validarPlazoCurso, validarPlazoGlobal } from '../../middlewares/plazoInscripcionValidacion/plazoInscripcionValidator.js'
import { requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()

router.get('/configuracion/plazo-inscripcion', requirePermission('menu.settings.view'), getPlazoGlobal)
router.put('/configuracion/plazo-inscripcion', requirePermission('settings.enrollment_deadline.update'), validarPlazoGlobal, validarCampos, putPlazoGlobal)

router.get('/cursos/:id/plazo-inscripcion', requirePermission('menu.courses.view'), validarIdCurso, validarCampos, getPlazoCurso)
router.put('/cursos/:id/plazo-inscripcion', requirePermission('courses.enrollment_deadline.update'), validarPlazoCurso, validarCampos, putPlazoCurso)

export default router
