import dataBase from '../../db/dataBase.js'

export const mostrarEstudiantesProfesor = async (idUsuario, { limit, offset }) => {
  const totalResult = await dataBase.query(`
    SELECT COUNT(*)
    FROM profesor pro
    JOIN usuarios usu ON usu.id_usuarios = pro.id_usuario
    LEFT JOIN curso cur ON pro.id_profesor = cur.id_profesor
    LEFT JOIN inscripcion ins ON ins.id_curso = cur.id_curso
    LEFT JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
    WHERE usu.id_usuarios = $1`, [idUsuario])

  const dataResult = await dataBase.query(`
    SELECT
    ins.id_inscripcion,
    (est.nombre||' '||est.a_paterno||' '||est.a_materno) AS estudiante,
    cur.nombre AS curso,
    est.telefono AS telefono_estudiante,
    est.direccion,
    ins.fecha_inscripcion
    FROM profesor pro
    JOIN usuarios usu ON usu.id_usuarios = pro.id_usuario
    LEFT JOIN curso cur ON pro.id_profesor = cur.id_profesor
    LEFT JOIN inscripcion ins ON ins.id_curso = cur.id_curso
    LEFT JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
    WHERE usu.id_usuarios = $1
    ORDER BY cur.nombre, ins.fecha_inscripcion, ins.id_inscripcion
    LIMIT $2 OFFSET $3`, [idUsuario, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}

export const mostrarCursosConEstudiantesProfesor = async (idUsuario) => {
  const resultado = await dataBase.query(`
    SELECT cur.id_curso, cur.nombre AS curso, COUNT(ins.id_inscripcion)::int AS total_estudiantes
    FROM profesor pro
    JOIN usuarios usu ON usu.id_usuarios = pro.id_usuario
    JOIN curso cur ON cur.id_profesor = pro.id_profesor
    LEFT JOIN inscripcion ins ON ins.id_curso = cur.id_curso
    WHERE usu.id_usuarios = $1
    GROUP BY cur.id_curso, cur.nombre
    ORDER BY cur.nombre, cur.id_curso`, [idUsuario])
  return resultado.rows
}

export const mostrarEstudiantesDeCursoProfesor = async (idUsuario, idCurso, { limit, offset, buscar }) => {
  const valores = [idUsuario, idCurso]
  let filtroBusqueda = ''

  if (buscar?.trim()) {
    valores.push(`%${buscar.trim()}%`)
    filtroBusqueda = `AND ((est.nombre || ' ' || est.a_paterno || ' ' || COALESCE(est.a_materno, '')) ILIKE $3
      OR est.telefono::text ILIKE $3)`
  }

  const desde = `
    FROM profesor pro
    JOIN usuarios usu ON usu.id_usuarios = pro.id_usuario
    JOIN curso cur ON cur.id_profesor = pro.id_profesor
    JOIN inscripcion ins ON ins.id_curso = cur.id_curso
    JOIN estudiante est ON est.id_estudiante = ins.id_estudiante
    WHERE usu.id_usuarios = $1 AND cur.id_curso = $2 ${filtroBusqueda}`

  const totalResult = await dataBase.query(`SELECT COUNT(*) ${desde}`, valores)

  const dataResult = await dataBase.query(`
    SELECT
    ins.id_inscripcion,
    (est.nombre||' '||est.a_paterno||' '||est.a_materno) AS estudiante,
    est.telefono AS telefono_estudiante,
    est.direccion,
    ins.fecha_inscripcion
    ${desde}
    ORDER BY ins.fecha_inscripcion, ins.id_inscripcion
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
  [...valores, limit, offset])

  return {
    filas: dataResult.rows,
    total: parseInt(totalResult.rows[0].count, 10)
  }
}
