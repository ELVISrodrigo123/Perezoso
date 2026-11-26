import { body } from 'express-validator'

export const validarAdministrador = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('apellidoPaterno').trim().notEmpty().withMessage('Apellido paterno obligatorio').escape(),
  body('apellidoMaterno').optional({ checkFalsy: true }).trim().escape(),
  body('ci').trim().notEmpty().withMessage('CI es obligatorio').escape(),
  body('telefono').optional({ checkFalsy: true }).trim().isNumeric().withMessage('Teléfono debe ser numérico').escape(),
  // Sin .escape() en el email: el controller ya lo hace trim + lowercase y escape podría alterar caracteres válidos
  body('email').trim().notEmpty().withMessage('El correo es obligatorio').isEmail().withMessage('Email inválido').toLowerCase()
]
