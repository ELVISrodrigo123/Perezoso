import express from 'express'
import { param } from 'express-validator'
import { requirePermission } from '../../middlewares/requirePermission.js'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { getMostrarDeudasEstudiante, getMostrarCalificaionesDelEstudiante, getMostrarCursosNoInscritosDelEstudiante, getMostrarcursosParaEstudiantes, postCrearInscripcionAunCursoestudiante } from '../../controllers/gestionEstudiante/cursosParaEstudiantes.js'

const router = express.Router()
router.get('/cursos', getMostrarcursosParaEstudiantes)
router.get('/curso/calificaciones/:idCurso', getMostrarCalificaionesDelEstudiante)
router.get('/curso/no-inscritos', getMostrarCursosNoInscritosDelEstudiante)
router.post(
  '/curso/inscripcion-a-un-curso/:idCurso',
  requirePermission('learning.enrollments.create'),
  param('idCurso').isInt({ min: 1 }).withMessage('El id del curso debe ser un número entero positivo'),
  validarCampos,
  postCrearInscripcionAunCursoestudiante
)

router.get('/curso/deudas', getMostrarDeudasEstudiante)

export default router
