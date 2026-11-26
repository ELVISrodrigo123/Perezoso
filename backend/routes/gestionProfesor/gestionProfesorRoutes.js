import express from 'express'
import { getCursosAsignados, getEstudiantesAsignados } from '../../controllers/gestionProfesor/gestionProfesor.js'
import { deleteEvaluacionDeunCurso, getCursosEvaluacion, getEvaluacionCurso, getListarCalificacionesEvaluacion, postCrearEvaluacionAunCurso, putActualizarEvaluacionDeunCurso } from '../../controllers/gestionProfesor/evaluacion.js'
import { postCalificarEvaluacion, putCalificarEvaluacion, getMostrarExamenesCalificados } from '../../controllers/gestionProfesor/calificarEvaluacion.js'
import { validarCalificacion } from '../../middlewares/gestionProfesor/calificacionValidacion/calificacionValidator.js'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { validarEvaluacion } from '../../middlewares/gestionProfesor/evaluacionValidacion/evaluacionValidator.js'
import { requireAnyPermission, requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()
router.get('/cursos', requireAnyPermission('menu.teaching.courses.view', 'menu.teaching.evaluations.view'), getCursosAsignados)
router.get('/estudiantes', requirePermission('menu.teaching.students.view'), getEstudiantesAsignados)
router.get('/cursos/evaluacion', requireAnyPermission('menu.teaching.evaluations.view'), getCursosEvaluacion)
router.get('/cursos/evaluacion/examen/:idCurso', requirePermission('menu.teaching.evaluations.view'), getEvaluacionCurso)
router.post('/cursos/evaluacion/examen/crearEvaluacion', requirePermission('teaching.evaluations.create'), validarEvaluacion, validarCampos, postCrearEvaluacionAunCurso)
router.put('/cursos/evaluacion/examen/editarEvaluacion', requirePermission('teaching.evaluations.update'), validarEvaluacion, validarCampos, putActualizarEvaluacionDeunCurso)
router.delete('/cursos/evaluacion/examen/eliminarEvaluacion/:idEvaluacion', requirePermission('teaching.evaluations.delete'), deleteEvaluacionDeunCurso)

router.get('/cursos/evaluacion/examen/listarCalificaciones/:idCurso/:idEvaluacion', requirePermission('teaching.grades.read'), getListarCalificacionesEvaluacion)
router.post('/cursos/evaluacion/examen/listarCalificaciones/calificarExamen', requirePermission('teaching.grades.create'), validarCalificacion, validarCampos, postCalificarEvaluacion)
router.put('/cursos/evaluacion/examen/listarCalificaciones/editarExamen', requirePermission('teaching.grades.update'), validarCalificacion, validarCampos, putCalificarEvaluacion)

router.get('/cursos/evaluacion/examen/ya-calificados/:idCurso', requirePermission('teaching.grades.read'), getMostrarExamenesCalificados)

export default router
