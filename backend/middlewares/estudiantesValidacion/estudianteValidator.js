import { body } from 'express-validator'

export const validarEstudiante = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('apellidoPaterno').trim().notEmpty().withMessage('Apellido paterno obligatorio').escape(),
  body('apellidoMaterno').optional().trim().escape(),
  body('ci').trim().notEmpty().withMessage('CI es obligatorio').escape(),
  body('direccion').trim().notEmpty().withMessage('Dirección es obligatorio').escape(),
  body('telefono').trim().notEmpty().withMessage('Teléfono es obligatorio').isNumeric().withMessage('Teléfono debe ser numérico').escape(),
  body('email').trim().notEmpty().withMessage('El correo electrónico es obligatorio').isEmail().withMessage('Email inválido').toLowerCase(),
  body('colegio').optional({ checkFalsy: true }).trim().escape()
]
