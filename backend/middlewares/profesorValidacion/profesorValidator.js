import { body } from 'express-validator'

export const validarProfesor = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('apellidoPaterno').trim().notEmpty().withMessage('Apellido es obligatorio').escape(),
  body('apellidoMaterno').optional().trim().escape(),
  body('ci').trim().notEmpty().withMessage('CI es obligatorio').matches(/^[0-9\- ]+$/).withMessage('CI inválido'),
  body('telefono').trim().notEmpty().withMessage('Teléfono es obligatorio').isNumeric().withMessage('El telefono solo debe contener número'),
  body('email').trim().notEmpty().withMessage('El correo electrónico es obligatorio').isEmail().withMessage('Debe ser un email válido').toLowerCase(),
  body('especialidad').trim().notEmpty().withMessage('Especialidad es obligatoria').escape()
]
