import dataBase from '../../db/dataBase.js'
import { unirEstadoInscripcion, ZONA_HORARIA_ACADEMIA } from '../modelsCursos/estadoInscripcionCurso.js'

export const cursosActivos = async () => {
  const { rows } = await dataBase.query(
    `SELECT cu.id_curso, cu.nombre, cu.descripcion, cu.duracion, cu.costo, cu.cupo_total,
            cu.fecha_creacion, (cu.fecha_creacion + cu.duracion) AS fecha_fin,
            CASE
              WHEN (NOW() AT TIME ZONE '${ZONA_HORARIA_ACADEMIA}')::date < cu.fecha_creacion::date
                THEN 'Próximo'
              WHEN (NOW() AT TIME ZONE '${ZONA_HORARIA_ACADEMIA}')::date <= (cu.fecha_creacion + cu.duracion)::date
                THEN 'En curso'
              ELSE 'Finalizado'
            END AS estado_fecha,
            (plazo.estado = 'abierta') AS inscripcion_abierta,
            to_char(plazo.fecha_limite, 'YYYY-MM-DD') AS fecha_limite_inscripcion
     FROM curso cu
     ${unirEstadoInscripcion('cu')}
     WHERE cu.estado = 'Activo'
     ORDER BY cu.fecha_creacion`
  )
  return rows
}
