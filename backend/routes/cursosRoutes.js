import express from 'express'
import { getMostrarCursosPorVencer, getCursos, postCursos, putCursos, deleteCurso } from '../controllers/cursosController.js'
import { validarCurso } from '../middlewares/cursosValidacion/cursosValidator.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'
import { requireAnyPermission, requirePermission } from '../middlewares/requirePermission.js'

const router = express.Router()

router.get('/cursos', requireAnyPermission('menu.courses.view', 'menu.students.view', 'menu.enrollments.view'), getCursos)
router.get('/cursos/por-vencer', requirePermission('menu.courses.view'), getMostrarCursosPorVencer)
router.post('/cursos', requirePermission('courses.create'), validarCurso, validarCampos, postCursos)
router.put('/cursos/:id', requirePermission('courses.update'), validarCurso, validarCampos, putCursos)
router.delete('/cursos/:id', requirePermission('courses.delete'), deleteCurso)

export default router
