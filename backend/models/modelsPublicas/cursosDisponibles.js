import dataBase from '../../db/dataBase.js'
import { COLUMNAS_ESTADO_INSCRIPCION, unirEstadoInscripcion } from '../modelsCursos/estadoInscripcionCurso.js'

export const obtenerCursosDisponibles = async () => {
  const informe = await dataBase.query(`
    SELECT cu.id_curso, cu.nombre AS materia, cu.descripcion, cu.fecha_creacion,
           (cu.fecha_creacion + cu.duracion) AS fecha_fin, cu.duracion, cu.costo, cu.cupo_total,
           ${COLUMNAS_ESTADO_INSCRIPCION}
    FROM curso cu
    ${unirEstadoInscripcion('cu')}`
  , [])
  return informe
}
