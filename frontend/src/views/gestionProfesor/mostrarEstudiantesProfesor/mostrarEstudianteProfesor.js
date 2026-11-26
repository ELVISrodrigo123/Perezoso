import TableEstudianteProfesor from './components/TableEstudianteProfesor'
import { useMostrarEstudianteProfesor } from './hooks/useMostrarEstudianteProfesor'

const MostrarEstudianteProfesor = () => {
  const { cursos, totalEstudiantes, cargando, error } = useMostrarEstudianteProfesor()
  return (
    <div className="estudiantes-profesor__container">
      <div className="estudiantes-profesor__header">
        <h1 className="estudiantes-profesor__title">Mis estudiantes</h1>
      </div>
      <TableEstudianteProfesor
        cursos={cursos}
        totalEstudiantes={totalEstudiantes}
        cargando={cargando}
        error={error}
      />
    </div>
  )
}

export default MostrarEstudianteProfesor
