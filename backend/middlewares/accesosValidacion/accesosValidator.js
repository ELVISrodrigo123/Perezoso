import { body, param } from 'express-validator'

export const validarId = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero positivo')
]

export const validarRol = [
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('El nombre del rol debe tener entre 2 y 60 caracteres'),
  body('description').optional({ values: 'null' }).isString().isLength({ max: 250 }).withMessage('La descripción admite hasta 250 caracteres')
]

export const validarEstadoRol = [
  ...validarId,
  body('status').isIn(['activo', 'inactivo']).withMessage('El estado debe ser activo o inactivo')
]

export const validarPermisosRol = [
  ...validarId,
  body('permissions').isArray().withMessage('permissions debe ser una lista'),
  body('permissions.*').isString().withMessage('Cada permiso debe ser un código')
]

export const validarRolesUsuario = [
  ...validarId,
  body('roles').isArray().withMessage('roles debe ser una lista'),
  body('roles.*').isString().withMessage('Cada rol debe ser un código'),
  body('fichas').optional().isObject().withMessage('fichas debe ser un objeto')
]

export const validarPersonalizaciones = [
  ...validarId,
  body('overrides').isArray().withMessage('overrides debe ser una lista'),
  body('overrides.*.code').isString().withMessage('Cada personalización necesita un código de permiso'),
  body('overrides.*.effect').isIn(['allow', 'deny']).withMessage('El efecto debe ser allow o deny')
]

export const validarSuperAdministrador = [
  ...validarId,
  body('esSuper').isBoolean({ strict: true }).withMessage('esSuper debe ser verdadero o falso')
]
