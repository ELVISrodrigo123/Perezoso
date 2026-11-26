import dataBase from '../../db/dataBase.js'

export const cursosActivos = async () => {
  const { rows } = await dataBase.query(
    `SELECT id_curso, nombre, descripcion, duracion, costo, cupo_total,
            fecha_creacion, (fecha_creacion + duracion) AS fecha_fin,
            CASE
              WHEN (NOW() AT TIME ZONE 'America/La_Paz')::date < fecha_creacion::date
                THEN 'Próximo'
              WHEN (NOW() AT TIME ZONE 'America/La_Paz')::date <= (fecha_creacion + duracion)::date
                THEN 'En curso'
              ELSE 'Finalizado'
            END AS estado_fecha
     FROM curso
     WHERE estado = 'Activo'
     ORDER BY fecha_creacion`
  )
  return rows
}
