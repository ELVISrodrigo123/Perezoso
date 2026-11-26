import { useEffect, useState } from 'react'
import { getCursosConEstudiantesProfesor } from '../../../../services/gestionProfesor/gestionprofesCursos'

export const useMostrarEstudianteProfesor = () => {
  const [cursos, setCursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let componenteActivo = true

    getCursosConEstudiantesProfesor()
      .then((respuesta) => {
        if (componenteActivo) setCursos(respuesta.data.datos)
      })
      .catch((errorCarga) => {
        console.error(errorCarga)
        if (componenteActivo) setError(true)
      })
      .finally(() => {
        if (componenteActivo) setCargando(false)
      })

    return () => {
      componenteActivo = false
    }
  }, [])

  const totalEstudiantes = cursos.reduce(
    (total, curso) => total + Number(curso.total_estudiantes || 0),
    0,
  )

  return { cursos, totalEstudiantes, cargando, error }
}
