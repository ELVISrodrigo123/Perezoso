import dataBase from '../../db/dataBase.js'

export const profesorDictaCurso = async (idUsuario, idCurso, db = dataBase) => {
  const { rowCount } = await db.query(`
    SELECT 1
    FROM curso cu
    JOIN profesor pro ON pro.id_profesor = cu.id_profesor
    WHERE pro.id_usuario = $1 AND cu.id_curso = $2`, [idUsuario, idCurso])
  return rowCount > 0
}
