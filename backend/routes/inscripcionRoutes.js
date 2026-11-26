import { Router } from 'express'
import {
  deleteEliminarTodasInscripcionesDelCurso,
  deleteinscripcionPorEstudiante,
  deleteInscripcionPorId,
  mostrarInscripcionPorEstudiante,
  getInscripciones, getInscripcionesPorCurso, getInscripcionesPorProfesor, postInscripciones
} from '../controllers/inscripcionController.js'
import { validarInscripcion } from '../middlewares/inscripcionValidacion/inscripcionValidator.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'
import { getMostrarRecibos, postRegistrarRecibos, getControlDePagosEstudiante, putMarcarInscripcionComoPagada } from '../controllers/controlDePagosEstudiante.js'
import { requireAnyPermission, requirePermission } from '../middlewares/requirePermission.js'

const router = Router()

router.get('/inscripciones', requirePermission('menu.enrollments.view'), getInscripciones)
router.get('/inscripciones/curso/:id', requireAnyPermission('menu.enrollments.view', 'menu.courses.view'), getInscripcionesPorCurso)
router.get('/inscripciones/profesor/:id', requireAnyPermission('menu.enrollments.view', 'menu.teachers.view'), getInscripcionesPorProfesor)
router.post('/inscripciones', requirePermission('enrollments.create'), validarInscripcion, validarCampos, postInscripciones)
router.get('/inscripciones/estudiante/:id', requireAnyPermission('menu.enrollments.view', 'menu.students.view'), mostrarInscripcionPorEstudiante)
router.delete('/inscripciones/:id', requirePermission('enrollments.delete'), deleteInscripcionPorId)
router.delete('/inscripciones/:id/estudiante', requirePermission('enrollments.delete'), deleteinscripcionPorEstudiante)
router.delete('/inscripciones/eliminar-por-curso/:idCurso', requirePermission('enrollments.delete'), deleteEliminarTodasInscripcionesDelCurso)

router.get('/inscripciones/control-pagos', requirePermission('menu.payments.view'), getControlDePagosEstudiante)
router.put('/inscripciones/marcar-pagado/:idInscripcion', requirePermission('payments.mark_paid'), putMarcarInscripcionComoPagada)

router.get('/inscripciones/mostrar-recibos', requirePermission('menu.receipts.view'), getMostrarRecibos)
router.post('/inscripciones/registrar-recibos', requirePermission('receipts.create'), postRegistrarRecibos)

export default router
