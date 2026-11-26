import express from 'express'
import {
  deletePermisosUsuario,
  getCatalogoPermisos,
  getRoles,
  getUsuarioAcceso,
  getUsuariosAcceso,
  postRol,
  putEstadoRol,
  putPermisosRol,
  putPermisosUsuario,
  putRol,
  putRolesUsuario,
  putSuperAdministrador
} from '../../controllers/accesosController.js'
import {
  validarEstadoRol,
  validarId,
  validarPermisosRol,
  validarPersonalizaciones,
  validarRol,
  validarRolesUsuario,
  validarSuperAdministrador
} from '../../middlewares/accesosValidacion/accesosValidator.js'
import { validarCampos } from '../../middlewares/validarCampos/validarCampos.js'
import { requireAnyPermission, requirePermission } from '../../middlewares/requirePermission.js'

const router = express.Router()

const leerAccesos = requireAnyPermission('roles.read', 'users.access.manage')
const gestionarRoles = requirePermission('roles.manage')
const gestionarUsuarios = requirePermission('users.access.manage')

router.get('/accesos/permisos', leerAccesos, getCatalogoPermisos)
router.get('/accesos/roles', leerAccesos, getRoles)
router.post('/accesos/roles', gestionarRoles, validarRol, validarCampos, postRol)
router.put('/accesos/roles/:id', gestionarRoles, validarId, validarRol, validarCampos, putRol)
router.put('/accesos/roles/:id/estado', gestionarRoles, validarEstadoRol, validarCampos, putEstadoRol)
router.put('/accesos/roles/:id/permisos', gestionarRoles, validarPermisosRol, validarCampos, putPermisosRol)

router.get('/accesos/usuarios', gestionarUsuarios, getUsuariosAcceso)
router.get('/accesos/usuarios/:id', gestionarUsuarios, validarId, validarCampos, getUsuarioAcceso)
router.put('/accesos/usuarios/:id/roles', gestionarUsuarios, validarRolesUsuario, validarCampos, putRolesUsuario)
router.put('/accesos/usuarios/:id/permisos', gestionarUsuarios, validarPersonalizaciones, validarCampos, putPermisosUsuario)
router.delete('/accesos/usuarios/:id/permisos', gestionarUsuarios, validarId, validarCampos, deletePermisosUsuario)
router.put('/accesos/usuarios/:id/super', gestionarUsuarios, validarSuperAdministrador, validarCampos, putSuperAdministrador)

export default router
