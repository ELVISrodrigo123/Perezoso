import { body, param } from 'express-validator'

export const DIAS_PLAZO_MINIMO = 0
export const DIAS_PLAZO_MAXIMO = 90

const mensajeRango = `Los días deben ser un número entero entre ${DIAS_PLAZO_MINIMO} y ${DIAS_PLAZO_MAXIMO}`

const esDiaValido = (valor) =>
  Number.isInteger(valor) && valor >= DIAS_PLAZO_MINIMO && valor <= DIAS_PLAZO_MAXIMO

export const validarIdCurso = [
  param('id').isInt({ min: 1 }).withMessage('El id del curso debe ser un número entero positivo').toInt()
]

export const validarPlazoGlobal = [
  body('dias')
    .exists({ values: 'null' }).withMessage('Los días son obligatorios')
    .bail()
    .custom(esDiaValido).withMessage(mensajeRango)
]

export const validarPlazoCurso = [
  ...validarIdCurso,
  body('dias')
    .exists().withMessage('Envía "dias" como número o null para usar el plazo global')
    .bail()
    .custom((valor) => valor === null || esDiaValido(valor)).withMessage(`${mensajeRango}, o null para usar el plazo global`)
]
