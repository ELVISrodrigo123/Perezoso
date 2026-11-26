import { Router } from 'express'
import { posPreinscripcionRechazada, getPreinscripcionEstudiante, postPreinscripcionEstudiante, posPreinscripcionAprobada } from '../controllers/preInscripcionEstudianteController.js'
import { validarEstudiante } from '../middlewares/estudiantesValidacion/estudianteValidator.js'
import { validarCampos } from '../middlewares/validarCampos/validarCampos.js'

import { verificarToken } from '../middlewares/veriificarToken.js'
import { requirePermission } from '../middlewares/requirePermission.js'
import { limitadorFormularioInscripcion } from '../middlewares/publicValidaciones/publicLimiter.js'

const router = Router()

router.post('/preinscripcion/estudiante', limitadorFormularioInscripcion, validarEstudiante, validarCampos, postPreinscripcionEstudiante)
router.get('/admin/preinscripcion/lista', verificarToken, requirePermission('menu.preregistrations.view'), getPreinscripcionEstudiante)
router.post('/admin/preinscripcion/rechazado/:idSolicitud', verificarToken, requirePermission('preregistrations.reject'), posPreinscripcionRechazada)
router.post('/admin/preinscripcion/aceptada/:idSolicitud', verificarToken, requirePermission('preregistrations.approve'), posPreinscripcionAprobada)

export default router
