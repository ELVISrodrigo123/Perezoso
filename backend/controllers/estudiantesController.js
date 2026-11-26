import dataBase from '../db/dataBase.js'
import bcrypt from 'bcryptjs'
import { resolverUsuarioParaRol } from '../models/modelsUsuarios/crearUsuario.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'

export const getEstudiantes = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { estudiante, ci, colegio, telefono, email, registro, estado } = req.query

    const condiciones = []
    const valores = []
    const agregar = (sql, valor) => {
      valores.push(valor)
      condiciones.push(sql.replace('?', `$${valores.length}`))
    }

    if (estudiante?.trim()) agregar('(est.nombre || \' \' || est.a_paterno || \' \' || COALESCE(est.a_materno, \'\')) ILIKE ?', `%${estudiante.trim()}%`)
    if (ci?.trim()) agregar('est.ci::text ILIKE ?', `%${ci.trim()}%`)
    if (colegio?.trim()) agregar('est.colegio ILIKE ?', `%${colegio.trim()}%`)
    if (telefono?.trim()) agregar('est.telefono::text ILIKE ?', `%${telefono.trim()}%`)
    if (email?.trim()) agregar('est.email ILIKE ?', `%${email.trim()}%`)
    if (registro?.trim()) agregar('est.fecha_registro::date = ?::date', registro.trim())
    if (estado?.trim()) agregar('ur.estado = ?', estado.trim())

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

    const totalResult = await dataBase.query(`
      SELECT COUNT(*)
      FROM estudiante est
      JOIN usuario_roles ur ON ur.id_usuario = est.id_usuario AND ur.role = 'estudiante'
      ${where}`, valores)
    const total = parseInt(totalResult.rows[0].count, 10)

    const dataResult = await dataBase.query(`
      SELECT est.*, ur.estado, est.id_usuario AS id_cuenta
      FROM estudiante est
      JOIN usuario_roles ur ON ur.id_usuario = est.id_usuario AND ur.role = 'estudiante'
      ${where}
      ORDER BY est.fecha_registro DESC, est.id_estudiante DESC
      LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limit, offset])

    res.json(armarRespuestaPaginada(dataResult.rows, total, page, limit))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'error del servidor POSTGRES' })
  }
}

// usuario, password, role
export const postEstudiante = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { nombre, apellidoPaterno, apellidoMaterno, colegio, ci, direccion, telefono, email, idTutor } = req.body
    const emailFinal = (email && email.trim() !== '') ? email.trim() : null
    const datos = {
      usuario: emailFinal || telefono,
      password: ci,
      role: 'estudiante',
      ci
    }

    await client.query('BEGIN')

    const ciExistente = await client.query(
      'SELECT 1 FROM estudiante WHERE ci = $1 LIMIT 1',
      [ci]
    )
    if (ciExistente.rowCount > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro estudiante.'
      })
    }

    if (email) {
      const emailEstudianteExistente = await client.query(
        'SELECT 1 FROM estudiante WHERE email = $1 LIMIT 1',
        [email]
      )
      if (emailEstudianteExistente.rowCount > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'email_duplicado',
          message: 'El correo electrónico ya está registrado para otro estudiante.'
        })
      }
    }

    const { idUsuario, reutilizado } = await resolverUsuarioParaRol(datos, client)
    console.log(`id usuario: ${idUsuario}`)
    const result = await client.query(
    `INSERT INTO estudiante 
    (nombre, a_paterno, a_materno, ci, direccion, telefono, email, id_usuario, colegio, id_tutor)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ) RETURNING *`,
    [nombre, apellidoPaterno, apellidoMaterno, ci, direccion, telefono, emailFinal, idUsuario, colegio, idTutor]
    )
    await client.query('COMMIT')
    console.log(result.rows, 'llego aqui y debe motrar los datos insertados')
    return res.status(201).json({
      message: reutilizado
        ? 'Este usuario ya existía: se le agregó el rol de estudiante con su misma cuenta'
        : 'Estudiante creado con éxito',
      reutilizado,
      Usuario: datos.usuario,
      Contraceña: reutilizado ? null : ci
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.log(error)
    if (error.esNegocio) {
      return res.status(400).json({ error: error.codigo, message: error.message })
    }
    if (error.code === '23505') {
      const mensajesDuplicado = {
        usuarios_email_key: 'Ya existe un usuario registrado con ese correo o número de teléfono.',
        estudiante_ci_key: 'El documento de identidad ya está registrado para otro estudiante.',
        estudiante_email_key: 'El correo electrónico ya está registrado para otro estudiante.',
        unique_email: 'El correo electrónico ya está registrado para otro estudiante.'
      }
      return res.status(400).json({
        error: 'registro_duplicado',
        message: mensajesDuplicado[error.constraint] || 'El registro ya existe.'
      })
    }

    res.status(500).json({ error: 'error_interno', message: 'Error interno en el servidor' })
  } finally {
    client.release()
  }
}

export const putEstudiante = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { id } = req.params
    const { nombre, apellidoPaterno, apellidoMaterno, ci, direccion, telefono, email, colegio, idTutor } = req.body
    const emailFinal = (email && email.trim() !== '') ? email.trim() : null

    const usuarioNuevo = emailFinal || (telefono ? String(telefono).trim() : null)

    if (!usuarioNuevo) {
      return res.status(400).json({
        error: 'usuario_requerido',
        message: 'Debes indicar un correo electrónico o un teléfono.'
      })
    }

    await client.query('BEGIN')

    const actual = await client.query(
      `SELECT est.ci, est.id_usuario, usu.email AS usuario_actual
       FROM estudiante est
       LEFT JOIN usuarios usu ON usu.id_usuarios = est.id_usuario
       WHERE est.id_estudiante = $1`,
      [id]
    )
    if (actual.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'El estudiante no existe' })
    }
    const { ci: ciActual, id_usuario: idUsuario, usuario_actual: usuarioActual } = actual.rows[0]

    const cambiaUsuario = Boolean(idUsuario) && usuarioNuevo !== usuarioActual
    const cambiaCi = Boolean(idUsuario) && String(ci) !== String(ciActual)

    if (cambiaUsuario) {
      const usuarioExistente = await client.query(
        'SELECT 1 FROM usuarios WHERE email = $1 AND id_usuarios <> $2 LIMIT 1',
        [usuarioNuevo, idUsuario]
      )
      if (usuarioExistente.rowCount > 0) {
        await client.query('ROLLBACK')
        const tipoUsuario = emailFinal ? 'correo electrónico' : 'número de teléfono'
        return res.status(400).json({
          error: 'usuario_duplicado',
          message: `Ya existe un usuario registrado con ese ${tipoUsuario}.`
        })
      }
    }

    const ciExistente = await client.query(
      'SELECT 1 FROM estudiante WHERE ci = $1 AND id_estudiante <> $2 LIMIT 1',
      [ci, id]
    )
    if (ciExistente.rowCount > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro estudiante.'
      })
    }

    if (emailFinal) {
      const emailEstudianteExistente = await client.query(
        'SELECT 1 FROM estudiante WHERE email = $1 AND id_estudiante <> $2 LIMIT 1',
        [emailFinal, id]
      )
      if (emailEstudianteExistente.rowCount > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'email_duplicado',
          message: 'El correo electrónico ya está registrado para otro estudiante.'
        })
      }
    }

    if (cambiaUsuario) {
      await client.query(
        'UPDATE usuarios SET email = $1 WHERE id_usuarios = $2',
        [usuarioNuevo, idUsuario]
      )
    }
    if (cambiaCi) {
      const hashContracenia = await bcrypt.hash(ci, 10)
      await client.query(
        'UPDATE usuarios SET password_hash = $1 WHERE id_usuarios = $2',
        [hashContracenia, idUsuario]
      )
    }

    const actualizarEstudiante = await client.query(`
      UPDATE estudiante
      SET nombre = $1, a_paterno = $2, a_materno =$3, ci=$4, direccion = $5, telefono = $6, email = $7, colegio = $8, id_tutor = $9
      WHERE id_estudiante = $10  RETURNING *`,
    [nombre, apellidoPaterno, apellidoMaterno, ci, direccion, telefono, emailFinal, colegio, idTutor, id])

    await client.query('COMMIT')
    console.log(actualizarEstudiante.rows[0], 'se deberia actualizar')
    res.json(actualizarEstudiante.rows[0])
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    if (error.code === '23505') {
      const mensajesDuplicado = {
        usuarios_email_key: 'Ya existe un usuario registrado con ese correo o número de teléfono.',
        estudiante_ci_key: 'El documento de identidad ya está registrado para otro estudiante.',
        estudiante_email_key: 'El correo electrónico ya está registrado para otro estudiante.',
        unique_email: 'El correo electrónico ya está registrado para otro estudiante.'
      }
      return res.status(400).json({
        error: 'registro_duplicado',
        message: mensajesDuplicado[error.constraint] || 'El registro ya existe.'
      })
    }
    res.status(500).json({ message: 'Error interno del servidor' })
  } finally {
    client.release()
  }
}

export const deleteEstudiante = async (req, res) => {
  const client = await dataBase.connect()

  try {
    const { id } = req.params

    await client.query('BEGIN')

    const estudiante = await client.query(
      `SELECT id_usuario
       FROM estudiante
       WHERE id_estudiante = $1`,
      [id]
    )

    if (estudiante.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({
        message: 'Estudiante no encontrado'
      })
    }

    const idUsuario = estudiante.rows[0].id_usuario

    if (idUsuario) {
      await client.query(
        `UPDATE usuario_roles
         SET estado = 'Inactivo'
         WHERE id_usuario = $1 AND role = 'estudiante'`,
        [idUsuario]
      )
    }

    await client.query('COMMIT')

    res.status(200).json({
      message: 'Usuario eliminado correctamente'
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})

    console.error(error)

    res.status(500).json({
      message: 'Error al eliminar estudiante'
    })
  } finally {
    client.release()
  }
}
