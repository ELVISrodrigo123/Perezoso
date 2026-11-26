import dataBase from '../../db/dataBase.js'
import bcrypt from 'bcryptjs'

export const agregarRolAUsuario = async (idUsuario, role, connection = dataBase) => {
  await connection.query(`
    INSERT INTO usuario_roles (id_usuario, role)
    VALUES ($1, $2)
    ON CONFLICT (id_usuario, role) DO UPDATE SET estado = 'Activo'
    `, [idUsuario, role])
}

export const postUsuario = async (user, connection = dataBase) => {
  const { usuario, password, role } = user
  const hashContracenia = await bcrypt.hash(password, 10)
  const datos = await connection.query(`
    INSERT INTO usuarios (email, password_hash)
    values ($1, $2) RETURNING id_usuarios
    `, [usuario, hashContracenia])

  const idUsuario = datos.rows[0].id_usuarios
  await agregarRolAUsuario(idUsuario, role, connection)

  return idUsuario
}

const TABLAS_PERFIL = [
  { tabla: 'estudiante', col: 'id_usuario' },
  { tabla: 'profesor', col: 'id_usuario' },
  { tabla: 'administradores', col: 'id_usuarios' }
]

const errorNegocio = (codigo, message) => {
  const e = new Error(message)
  e.esNegocio = true
  e.codigo = codigo
  return e
}

export const resolverUsuarioParaRol = async (user, connection = dataBase) => {
  const { usuario, role, ci } = user
  const ciTxt = String(ci).trim()

  const existente = await connection.query(
    'SELECT id_usuarios FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [usuario]
  )
  const idExistente = existente.rows[0]?.id_usuarios ?? null

  let identidadConfirmada = false
  for (const { tabla, col } of TABLAS_PERFIL) {
    const otroDueno = await connection.query(
      `SELECT ${col} AS id FROM ${tabla} WHERE ci::text = $1 AND ${col} IS DISTINCT FROM $2 LIMIT 1`,
      [ciTxt, idExistente]
    )
    if (otroDueno.rowCount > 0) {
      throw errorNegocio(
        'ci_de_otro_usuario',
        'Este documento de identidad ya pertenece a otra cuenta. Usa el mismo correo/teléfono con el que se registró esa persona.'
      )
    }
    if (idExistente) {
      const propio = await connection.query(
        `SELECT ci FROM ${tabla} WHERE ${col} = $1 LIMIT 1`,
        [idExistente]
      )
      if (propio.rowCount > 0) {
        if (String(propio.rows[0].ci).trim() !== ciTxt) {
          throw errorNegocio(
            'usuario_de_otra_persona',
            'Ese correo/teléfono ya pertenece a otra persona con un documento de identidad distinto.'
          )
        }
        identidadConfirmada = true
      }
    }
  }

  if (!idExistente) {
    const idUsuario = await postUsuario(user, connection)
    return { idUsuario, reutilizado: false }
  }

  if (!identidadConfirmada) {
    throw errorNegocio(
      'usuario_duplicado',
      'Ya existe un usuario registrado con ese correo o teléfono.'
    )
  }

  await agregarRolAUsuario(idExistente, role, connection)
  return { idUsuario: idExistente, reutilizado: true }
}
