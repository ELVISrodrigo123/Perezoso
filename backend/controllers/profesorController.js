import dataBase from '../db/dataBase.js'
import bcrypt from 'bcryptjs'
import { resolverUsuarioParaRol } from '../models/modelsUsuarios/crearUsuario.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'
import { columnaRolesActivos } from '../models/modelsUsuarios/rolesDeCuenta.js'

export const getProfesor = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { profesor, ci, telefono, email, especialidad, registro, estado } = req.query

    const condiciones = []
    const valores = []
    const agregar = (sql, valor) => {
      valores.push(valor)
      condiciones.push(sql.replace('?', `$${valores.length}`))
    }

    if (profesor?.trim()) agregar('(pro.nombre || \' \' || pro.a_paterno || \' \' || COALESCE(pro.a_materno, \'\')) ILIKE ?', `%${profesor.trim()}%`)
    if (ci?.trim()) agregar('pro.ci::text ILIKE ?', `%${ci.trim()}%`)
    if (telefono?.trim()) agregar('pro.telefono::text ILIKE ?', `%${telefono.trim()}%`)
    if (email?.trim()) agregar('pro.email ILIKE ?', `%${email.trim()}%`)
    if (especialidad?.trim()) agregar('pro.especialidad ILIKE ?', `%${especialidad.trim()}%`)
    if (registro?.trim()) agregar('pro.fecha_registro::date = ?::date', registro.trim())
    if (estado?.trim()) agregar('ur.estado = ?', estado.trim())

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''

    const totalResult = await dataBase.query(`
      SELECT COUNT(*)
            FROM profesor pro
      JOIN usuario_roles ur ON ur.id_usuario = pro.id_usuario AND ur.role = 'profesor'
      ${where}`, valores)
    const total = parseInt(totalResult.rows[0].count, 10)

    const dataResult = await dataBase.query(`
      SELECT pro.*, ur.estado, pro.id_usuario AS id_cuenta, ${columnaRolesActivos('pro.id_usuario')}
      FROM profesor pro
      JOIN usuario_roles ur ON ur.id_usuario = pro.id_usuario AND ur.role = 'profesor'
      ${where}
      ORDER BY pro.fecha_registro DESC, pro.id_profesor DESC
      LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limit, offset])

    res.json(armarRespuestaPaginada(dataResult.rows, total, page, limit))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error del Servidor POSTGRES' })
  }
}

export const postProfesor = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, email, especialidad } = req.body
    const emailFinal = (email && email.trim() !== '') ? email.trim() : null

    const datos = {
      usuario: emailFinal || (telefono ? String(telefono).trim() : null),
      password: ci,
      role: 'profesor',
      ci
    }

    if (!datos.usuario) {
      return res.status(400).json({
        error: 'usuario_requerido',
        message: 'Debes indicar un correo electrónico o un teléfono.'
      })
    }

    await client.query('BEGIN')

    const ciExistente = await client.query(
      'SELECT 1 FROM profesor WHERE ci = $1 LIMIT 1',
      [ci]
    )
    if (ciExistente.rowCount > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro profesor.'
      })
    }

    if (emailFinal) {
      const emailProfesorExistente = await client.query(
        'SELECT 1 FROM profesor WHERE email = $1 LIMIT 1',
        [emailFinal]
      )
      if (emailProfesorExistente.rowCount > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'email_duplicado',
          message: 'El correo electrónico ya está registrado para otro profesor.'
        })
      }
    }

    const { idUsuario, reutilizado } = await resolverUsuarioParaRol(datos, client)

    await client.query(
    `INSERT INTO profesor
    (nombre, a_paterno, a_materno, ci, telefono, email, especialidad, id_usuario)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [nombre, apellidoPaterno, apellidoMaterno, ci, telefono, emailFinal, especialidad, idUsuario])

    await client.query('COMMIT')
    res.status(201).json({
      message: reutilizado
        ? 'Este usuario ya existía: se le agregó el rol de profesor con su misma cuenta'
        : 'Profesor creado con éxito',
      reutilizado,
      Usuario: datos.usuario,
      Contraceña: reutilizado ? null : ci
    })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    if (error.esNegocio) {
      return res.status(400).json({ error: error.codigo, message: error.message })
    }
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'registro_duplicado',
        message: 'El documento de identidad o correo ya se encuentra registrado.'
      })
    }

    res.status(500).json({ error: 'error_interno', message: 'Error interno en el servidor' })
  } finally {
    client.release()
  }
}

export const putProfesor = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { id } = req.params
    const idProfesor = parseInt(id)
    const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, email, especialidad } = req.body
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
      `SELECT pro.ci, pro.id_usuario, usu.email AS usuario_actual
       FROM profesor pro
       LEFT JOIN usuarios usu ON usu.id_usuarios = pro.id_usuario
       WHERE pro.id_profesor = $1`,
      [idProfesor]
    )
    if (actual.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'El profesor no existe' })
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
      'SELECT 1 FROM profesor WHERE ci = $1 AND id_profesor <> $2 LIMIT 1',
      [ci, idProfesor]
    )
    if (ciExistente.rowCount > 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro profesor.'
      })
    }

    if (emailFinal) {
      const emailProfesorExistente = await client.query(
        'SELECT 1 FROM profesor WHERE email = $1 AND id_profesor <> $2 LIMIT 1',
        [emailFinal, idProfesor]
      )
      if (emailProfesorExistente.rowCount > 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'email_duplicado',
          message: 'El correo electrónico ya está registrado para otro profesor.'
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

    const actualizarProfesor = await client.query(`
    UPDATE profesor
    SET  nombre = $1, a_paterno = $2, a_materno = $3, ci = $4, telefono = $5, email = $6, especialidad = $7
    WHERE id_profesor = $8 RETURNING *`,
    [nombre, apellidoPaterno, apellidoMaterno, ci, telefono, emailFinal, especialidad, idProfesor]
    )

    await client.query('COMMIT')
    res.status(200).json(actualizarProfesor.rows[0])
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'registro_duplicado',
        message: 'El documento de identidad o correo ya se encuentra registrado.'
      })
    }
    res.status(500).json({ error: 'Error al actualizar profesor' })
  } finally {
    client.release()
  }
}

export const deleteProfesor = async (req, res) => {
  const client = await dataBase.connect()

  try {
    const { id } = req.params
    const idProfesor = parseInt(id)

    await client.query('BEGIN')

    const profesor = await client.query(
      `SELECT id_usuario
       FROM profesor
       WHERE id_profesor = $1`,
      [idProfesor]
    )

    if (profesor.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Profesor no existe' })
    }

    const idUsuario = profesor.rows[0].id_usuario
    if (idUsuario) {
      await client.query(
        `UPDATE usuario_roles
         SET estado = 'Inactivo'
         WHERE id_usuario = $1 AND role = 'profesor'`,
        [idUsuario]
      )
    }

    await client.query('COMMIT')

    res.status(200).json({ message: 'Profesor y usuario eliminado correctamente' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar profesor' })
  } finally {
    client.release()
  }
}
