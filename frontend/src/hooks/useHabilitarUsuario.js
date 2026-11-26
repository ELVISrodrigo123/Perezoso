import { useState } from 'react'
import { putHabilitarUsuario } from '../services/gestionAdministrador/habilitarEstados'

export const useHabilitarUsuario = () => {
  const [feedback, setFeedback] = useState(null)

  const mostrarFeedback = (message, color = 'success') => {
    setFeedback({ message, color })
    setTimeout(() => {
      setFeedback(null)
    }, 7000)
  }

  const ejecutarHabilitarUsuario = async (idUsuario, role) => {
    try {
      console.log(`id-cuenta::: ${idUsuario}`)
      const informe = await putHabilitarUsuario(idUsuario, role)
      const mensajeExito = informe?.data?.message || 'Habilitado correctamente'
      mostrarFeedback(mensajeExito, 'success')
    } catch (error) {
      console.error(error)
      const mensajeError = error.response?.data?.message || 'Error interno del servidor'
      mostrarFeedback(mensajeError, 'danger')
    }
  }

  return { feedback1: feedback, ejecutarHabilitarUsuario }
}
