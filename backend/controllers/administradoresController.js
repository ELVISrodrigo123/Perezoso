import dataBase from '../db/dataBase.js'
import bcrypt from 'bcryptjs'
import { resolverUsuarioParaRol } from '../models/modelsUsuarios/crearUsuario.js'
import {
  obtenerAdministradores,
  registrarAdministrador,
  actualizarAdministrador,
  cambiarEstadoAdministrador,
  existeUsuarioPorEmail,
  existeAdminPorCi,
  existeAdminPorEmail,
  obtenerAdministradorParaEditar,
  obtenerAdministradorParaBaja,
  actualizarEmailUsuario,
  actualizarPasswordUsuario,
  esSuperAdministrador
} from '../models/modelsGestionAdministradores/crudAdministradores.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'

const mensajesDuplicado = {
  usuarios_email_key: 'Ya existe un usuario registrado con ese correo electrónico.',
  administradores_ci_key: 'El documento de identidad ya está registrado para otro administrador.',
  uq_admin_ci: 'El documento de identidad ya está registrado para otro administrador.',
  administradores_correo_key: 'El correo electrónico ya está registrado para otro administrador.',
  uq_admin_email: 'El correo electrónico ya está registrado para otro administrador.'
}

export const getAdministradores = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await obtenerAdministradores({ limit, offset, filtros: req.query })
    res.json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'error del servidor POSTGRES' })
  }
}

export const postAdministrador = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, email } = req.body

    if (!nombre || !apellidoPaterno || !ci || !email || email.trim() === '') {
      return res.status(400).json({
        error: 'campos_requeridos',
        message: 'Nombre, apellido paterno, CI y correo son obligatorios.'
      })
    }

    const emailFinal = email.trim().toLowerCase()
    const datos = {
      usuario: emailFinal,
      password: String(ci).trim(),
      role: 'administrador',
      ci: String(ci).trim()
    }

    await client.query('BEGIN')

    if (await existeAdminPorCi(ci, null, client)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro administrador.'
      })
    }

    if (await existeAdminPorEmail(emailFinal, null, client)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'email_duplicado',
        message: 'El correo electrónico ya está registrado para otro administrador.'
      })
    }

    const { idUsuario, reutilizado } = await resolverUsuarioParaRol(datos, client)

    await registrarAdministrador({
      idUsuarios: idUsuario,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      ci,
      email: emailFinal
    }, client)

    await client.query('COMMIT')
    return res.status(201).json({
      message: reutilizado
        ? 'Este usuario ya existía: se le agregó el rol de administrador con su misma cuenta'
        : 'Administrador creado con éxito',
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
        message: mensajesDuplicado[error.constraint] || 'El registro ya existe.'
      })
    }
    res.status(500).json({ error: 'error_interno', message: 'Error interno en el servidor' })
  } finally {
    client.release()
  }
}

export const putAdministrador = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { id } = req.params
    const { nombre, apellidoPaterno, apellidoMaterno, ci, telefono, email } = req.body

    if (!nombre || !apellidoPaterno || !ci || !email || email.trim() === '') {
      return res.status(400).json({
        error: 'campos_requeridos',
        message: 'Nombre, apellido paterno, CI y correo son obligatorios.'
      })
    }

    const emailFinal = email.trim().toLowerCase()

    await client.query('BEGIN')

    const actual = await obtenerAdministradorParaEditar(id, client)
    if (actual.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'El administrador no existe' })
    }
    const { ci: ciActual, id_usuarios: idUsuario, usuario_actual: usuarioActual } = actual.rows[0]

    const cambiaUsuario = Boolean(idUsuario) && emailFinal !== usuarioActual
    const cambiaCi = Boolean(idUsuario) && String(ci) !== String(ciActual)

    if (cambiaUsuario && await existeUsuarioPorEmail(emailFinal, idUsuario, client)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'usuario_duplicado',
        message: 'Ya existe un usuario registrado con ese correo electrónico.'
      })
    }

    if (await existeAdminPorCi(ci, id, client)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'ci_duplicado',
        message: 'El documento de identidad ya está registrado para otro administrador.'
      })
    }

    if (await existeAdminPorEmail(emailFinal, id, client)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'email_duplicado',
        message: 'El correo electrónico ya está registrado para otro administrador.'
      })
    }

    if (cambiaUsuario) {
      await actualizarEmailUsuario(idUsuario, emailFinal, client)
    }
    if (cambiaCi) {
      const hashContracenia = await bcrypt.hash(String(ci), 10)
      await actualizarPasswordUsuario(idUsuario, hashContracenia, client)
    }

    const actualizarAdmin = await actualizarAdministrador(id, {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      telefono,
      ci,
      email: emailFinal
    }, client)

    await client.query('COMMIT')
    res.json(actualizarAdmin.rows[0])
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    if (error.code === '23505') {
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

// Baja lógica: usuarios.estado = 'Inactivo'
export const deleteAdministrador = async (req, res) => {
  const client = await dataBase.connect()
  try {
    const { id } = req.params

    await client.query('BEGIN')

    const administrador = await obtenerAdministradorParaBaja(id, client)
    if (administrador.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Administrador no encontrado' })
    }

    const { es_super: esSuper } = administrador.rows[0]

    if (esSuper) {
      await client.query('ROLLBACK')
      return res.status(403).json({
        message: 'No se puede dar de baja al super administrador'
      })
    }

    await cambiarEstadoAdministrador(id, 'Inactivo', client)

    await client.query('COMMIT')
    res.status(200).json({ message: 'Administrador dado de baja correctamente' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(error)
    res.status(500).json({ message: 'Error al dar de baja al administrador' })
  } finally {
    client.release()
  }
}

// Reactivar: usuarios.estado = 'Activo'
export const activarAdministrador = async (req, res) => {
  try {
    const { id } = req.params
    const resultado = await cambiarEstadoAdministrador(id, 'Activo')
    if (resultado.rowCount === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' })
    }
    res.status(200).json({ message: 'Administrador activado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al activar al administrador' })
  }
}

export const getEsSuper = async (req, res) => {
  try {
    const idUsuario = req.user.id_usuarios ?? req.user.id
    const esSuper = await esSuperAdministrador(idUsuario)
    res.json({ esSuper })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
