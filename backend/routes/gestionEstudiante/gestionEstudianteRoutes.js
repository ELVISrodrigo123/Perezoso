import express from 'express'
import { param } from 'express-validator'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { getMostrarDeudasEstudiante, getMostrarCalificaionesDelEstudiante, getMostrarCursosNoInscritosDelEstudiante, getMostrarcursosParaEstudiantes, postCrearInscripcionAunCursoestudiante } from '../../controllers/gestionEstudiante/cursosParaEstudiantes.js'
import { requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()
router.get('/cursos', requirePermission('menu.learning.courses.view'), getMostrarcursosParaEstudiantes)
router.get('/curso/calificaciones/:idCurso', requirePermission('learning.grades.read'), getMostrarCalificaionesDelEstudiante)
router.get('/curso/no-inscritos', requirePermission('menu.learning.enroll.view'), getMostrarCursosNoInscritosDelEstudiante)
router.post(
  '/curso/inscripcion-a-un-curso/:idCurso',
  requirePermission('learning.enrollments.create'),
  param('idCurso').isInt({ min: 1 }).withMessage('El id del curso debe ser un número entero positivo'),
  validarCampos,
  postCrearInscripcionAunCursoestudiante
)

router.get('/curso/deudas', requirePermission('learning.debts.read'), getMostrarDeudasEstudiante)

export default router
