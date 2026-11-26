import {
  mostrarRecibos, registrarRecibos, telefonoTutorActivo, controlPagosDeEstudiantesACursos, marcarInscripcionComoPagada, verificarRecibo, mostrarResumenRecibosPorPadre,
  mostrarRecibosDePadre
} from '../models/modelsInscripcion/controlPagosDeEstudianteACursos.js'
import { crearTokenRecibo, obtenerIdDesdeTokenRecibo } from '../utils/tokenVerificacionRecibo.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'

import { avisarPagoAN8n } from '../services/n8nWebhook.js'

export const getMostrarRecibos = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { vista } = req.query

    if (vista === 'resumen') {
      const { filas, total, totales } = await mostrarResumenRecibosPorPadre({ limit, offset, filtros: req.query })
      return res.status(200).json({ ...armarRespuestaPaginada(filas, total, page, limit), totales })
    }

    if (vista === 'detalle') {
      if (!req.query.grupo) {
        return res.status(400).json({ message: 'Falta el identificador del padre o tutor' })
      }
      const { filas, total, resumen } = await mostrarRecibosDePadre({ limit, offset, filtros: req.query })
      return res.status(200).json({ ...armarRespuestaPaginada(filas, total, page, limit), resumen })
    }

    const { filas, total } = await mostrarRecibos({ limit, offset })
    return res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const postRegistrarRecibos = async (req, res) => {
  try {
    const informe = await registrarRecibos(req.body)
    if (informe.rowCount === 0) {
      return res.status(400).json({ message: 'No se pudo registrar el recibo' })
    }
    const recibo = informe.rows[0]

    try {
      const telefono = await telefonoTutorActivo(req.body.idPadre)
      if (telefono) {
        await avisarPagoAN8n({
          telefono,
          estudiante: req.body.estudiante,
          curso: req.body.curso,
          montoPagado: recibo.monto_pagado,
          fechaPago: recibo.fecha_pago,
          idRecibo: recibo.id_recibo
        })
      }
    } catch (error) {
      console.error('Error al preparar el aviso de pago:', error.message)
    }

    return res.status(201).json({
      message: 'Recibo registrado correctamente',
      datos: { ...recibo, token_verificacion: crearTokenRecibo(recibo.id_recibo) }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const getVerificarRecibo = async (req, res) => {
  try {
    const idRecibo = obtenerIdDesdeTokenRecibo(req.params.token)

    if (!idRecibo) {
      return res.status(400).json({ message: 'Código de recibo inválido' })
    }

    const informe = await verificarRecibo(idRecibo)

    if (informe.rowCount === 0) {
      return res.status(404).json({ message: 'Recibo no encontrado' })
    }

    return res.status(200).json({
      valido: true,
      recibo: informe.rows[0]
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const getControlDePagosEstudiante = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await controlPagosDeEstudiantesACursos({ limit, offset, filtros: req.query })
    return res.status(200).json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}

export const putMarcarInscripcionComoPagada = async (req, res) => {
  try {
    const { idInscripcion } = req.params
    const informe = await marcarInscripcionComoPagada(idInscripcion)
    if (informe.rowCount === 0) {
      return res.status(404).json({ message: 'No se encontró la inscripción' })
    }
    return res.status(200).json({ message: 'Pago registrado correctamente' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error interno servidor' })
  }
}
