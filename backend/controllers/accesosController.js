import dataBase from '../db/dataBase.js'
import { invalidarCacheDePermisos } from '../middlewares/veriificarToken.js'
import {
  activarRolDelUsuario,
  actualizarRol,
  borrarPersonalizaciones,
  buscarPermisosPorCodigo,
  buscarUsuarios,
  cambiarEstadoRol,
  cambiarSuperAdministrador,
  crearFichaEstudiante,
  crearFichaProfesor,
  crearRol,
  desactivarRolesExcepto,
  existeCiEnTabla,
  obtenerCatalogoDePermisos,
  obtenerFichasDelUsuario,
  obtenerPermisosHeredados,
  obtenerPersonalizaciones,
  obtenerRolPorId,
  obtenerRoles,
  obtenerRolesDelUsuario,
  reemplazarPermisosDelRol,
  reemplazarPersonalizaciones
} from '../models/modelsAccesos/accesos.js'
import {
  ROL_SUPER_ADMINISTRADOR,
  obtenerAccesoEfectivo,
  obtenerMenuPorPermisos
} from '../models/modelsUsuarios/permisosUsuario.js'
import { obtenerPaginacion, armarRespuestaPaginada } from '../utils/paginacion.js'

const ROLES_CON_FICHA = ['profesor', 'estudiante']

class ErrorAcceso extends Error {
  constructor (status, codigo, message, detalle = {}) {
    super(message)
    this.status = status
    this.codigo = codigo
    this.detalle = detalle
  }
}

const responderError = (res, error) => {
  if (error instanceof ErrorAcceso) {
    return res.status(error.status).json({ error: error.codigo, message: error.message, ...error.detalle })
  }
  if (error.code === 'BM001' || error.code === 'BM002') {
    return res.status(409).json({ error: 'super_administrador_protegido', message: error.message })
  }
  if (error.code === '23505') {
    return res.status(409).json({ error: 'registro_duplicado', message: 'Ya existe un registro con esos datos.' })
  }
  if (error.code === '23502') {
    return res.status(400).json({ error: 'dato_requerido', message: 'Falta un dato obligatorio de la ficha.' })
  }
  console.error(error)
  return res.status(500).json({ message: 'Error interno servidor' })
}

const enTransaccion = async (trabajo) => {
  const client = await dataBase.connect()
  try {
    await client.query('BEGIN')
    const resultado = await trabajo(client)
    await client.query('COMMIT')
    return resultado
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

const generarCodigoDeRol = (nombre) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]+/, '')

const validarCodigosDePermisos = async (codigos, db) => {
  const unicos = [...new Set(codigos)]
  const encontrados = await buscarPermisosPorCodigo(unicos, db)
  if (encontrados.length !== unicos.length) {
    const conocidos = new Set(encontrados.map((p) => p.code))
    throw new ErrorAcceso(400, 'permiso_desconocido', 'Hay permisos que no existen en el catálogo.', {
      permisos: unicos.filter((codigo) => !conocidos.has(codigo))
    })
  }
  return encontrados
}

const armarDetalleDeUsuario = async (idUsuario, db = dataBase) => {
  const fichas = await obtenerFichasDelUsuario(idUsuario, db)
  if (!fichas) return null
  const [roles, heredados, personalizaciones, acceso] = await Promise.all([
    obtenerRolesDelUsuario(idUsuario, db),
    obtenerPermisosHeredados(idUsuario, db),
    obtenerPersonalizaciones(idUsuario, db),
    obtenerAccesoEfectivo(idUsuario, db)
  ])
  return {
    idUsuario: fichas.id_usuarios,
    email: fichas.email,
    estado: fichas.estado,
    esSuper: Boolean(fichas.administrador?.es_super),
    fichas: {
      administrador: fichas.administrador,
      profesor: fichas.profesor,
      estudiante: fichas.estudiante
    },
    roles: roles.filter((rol) => rol.estado === 'Activo').map((rol) => rol.code).sort(),
    permisosHeredados: heredados,
    personalizaciones,
    permisosEfectivos: acceso.permissions,
    menu: await obtenerMenuPorPermisos(acceso.permissions, db)
  }
}

export const getCatalogoPermisos = async (req, res) => {
  try {
    res.json({ permisos: await obtenerCatalogoDePermisos() })
  } catch (error) {
    responderError(res, error)
  }
}

export const getRoles = async (req, res) => {
  try {
    res.json({ roles: await obtenerRoles() })
  } catch (error) {
    responderError(res, error)
  }
}

export const postRol = async (req, res) => {
  try {
    const { name, description } = req.body
    const code = generarCodigoDeRol(name)
    if (!code) {
      throw new ErrorAcceso(400, 'nombre_invalido', 'El nombre del rol debe tener al menos una letra.')
    }
    const rol = await crearRol({ code, name: name.trim(), description })
    res.status(201).json({ message: 'Rol creado', rol })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'rol_duplicado', message: 'Ya existe un rol con ese nombre.' })
    }
    responderError(res, error)
  }
}

export const putRol = async (req, res) => {
  try {
    const rol = await actualizarRol(req.params.id, { name: req.body.name.trim(), description: req.body.description })
    if (!rol) return res.status(404).json({ message: 'Rol no encontrado' })
    res.json({ message: 'Rol actualizado', rol })
  } catch (error) {
    responderError(res, error)
  }
}

export const putEstadoRol = async (req, res) => {
  try {
    const actual = await obtenerRolPorId(req.params.id)
    if (!actual) return res.status(404).json({ message: 'Rol no encontrado' })
    if (actual.is_system) {
      throw new ErrorAcceso(409, 'rol_del_sistema', 'Los roles del sistema no se pueden desactivar.')
    }
    const rol = await cambiarEstadoRol(actual.id, req.body.status)
    invalidarCacheDePermisos()
    res.json({ message: rol.status === 'activo' ? 'Rol activado' : 'Rol desactivado', rol })
  } catch (error) {
    responderError(res, error)
  }
}

export const putPermisosRol = async (req, res) => {
  try {
    const resultado = await enTransaccion(async (client) => {
      const rol = await obtenerRolPorId(req.params.id, client)
      if (!rol) throw new ErrorAcceso(404, 'rol_no_encontrado', 'Rol no encontrado')
      if (rol.code === ROL_SUPER_ADMINISTRADOR) {
        throw new ErrorAcceso(409, 'rol_super_administrador', 'El super administrador siempre tiene todos los permisos.')
      }
      const permisos = await validarCodigosDePermisos(req.body.permissions, client)
      await reemplazarPermisosDelRol(rol.id, permisos.map((p) => p.id), client)
      return { rol, total: permisos.length }
    })
    invalidarCacheDePermisos()
    res.json({ message: `Permisos del rol "${resultado.rol.name}" guardados`, total: resultado.total })
  } catch (error) {
    responderError(res, error)
  }
}

export const getUsuariosAcceso = async (req, res) => {
  try {
    const { page, limit, offset } = obtenerPaginacion(req.query)
    const { filas, total } = await buscarUsuarios({
      buscar: req.query.buscar ?? '',
      rol: req.query.rol ?? '',
      limit: limit ?? 100,
      offset
    })
    res.json(armarRespuestaPaginada(filas, total, page, limit))
  } catch (error) {
    responderError(res, error)
  }
}

export const getUsuarioAcceso = async (req, res) => {
  try {
    const detalle = await armarDetalleDeUsuario(req.params.id)
    if (!detalle) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(detalle)
  } catch (error) {
    responderError(res, error)
  }
}

const ciDeOtraFicha = (fichas) =>
  [fichas.administrador, fichas.profesor, fichas.estudiante].find(Boolean)?.ci ?? null

const crearFichasFaltantes = async (idUsuario, rolesNuevos, fichasEnviadas, client) => {
  const fichas = await obtenerFichasDelUsuario(idUsuario, client)
  const faltantes = rolesNuevos.filter((rol) => ROLES_CON_FICHA.includes(rol) && !fichas[rol])
  const sinDatos = faltantes.filter((rol) => !fichasEnviadas?.[rol])

  if (sinDatos.length) {
    const base = [fichas.administrador, fichas.profesor, fichas.estudiante].find(Boolean)
    throw new ErrorAcceso(422, 'ficha_requerida', 'Para asignar este rol hay que completar la ficha del usuario.', {
      faltantes: sinDatos,
      sugerencia: base
        ? { nombre: base.nombre, apellidoPaterno: base.a_paterno, apellidoMaterno: base.a_materno, ci: base.ci, telefono: base.telefono }
        : null
    })
  }

  const ciExistente = ciDeOtraFicha(fichas)
  for (const rol of faltantes) {
    const ficha = fichasEnviadas[rol]
    const ci = String(ficha.ci ?? '').trim()
    if (!ficha.nombre?.trim() || !ficha.apellidoPaterno?.trim() || !ci) {
      throw new ErrorAcceso(400, 'ficha_incompleta', 'Nombre, apellido paterno y CI son obligatorios.', { rol })
    }
    if (ciExistente && String(ciExistente).trim() !== ci) {
      throw new ErrorAcceso(400, 'ci_distinto', 'El CI debe coincidir con el de la otra ficha del usuario.', { rol })
    }
    if (await existeCiEnTabla(rol, ci, client)) {
      throw new ErrorAcceso(409, 'ci_duplicado', `Ya existe un ${rol} con ese CI.`, { rol })
    }
    const datos = { ...ficha, nombre: ficha.nombre.trim(), apellidoPaterno: ficha.apellidoPaterno.trim(), ci }
    if (rol === 'profesor') await crearFichaProfesor(idUsuario, datos, fichas.email, client)
    if (rol === 'estudiante') await crearFichaEstudiante(idUsuario, datos, fichas.email, client)
  }
}

export const putRolesUsuario = async (req, res) => {
  const idUsuario = Number(req.params.id)
  try {
    const solicitados = [...new Set(req.body.roles)]
    if (solicitados.includes(ROL_SUPER_ADMINISTRADOR)) {
      throw new ErrorAcceso(400, 'rol_no_asignable', 'El super administrador se asigna con su propio interruptor, no como rol.')
    }
    if (!solicitados.length) {
      throw new ErrorAcceso(400, 'sin_roles', 'El usuario debe tener al menos un rol.')
    }

    await enTransaccion(async (client) => {
      const fichas = await obtenerFichasDelUsuario(idUsuario, client)
      if (!fichas) throw new ErrorAcceso(404, 'usuario_no_encontrado', 'Usuario no encontrado')
      if (fichas.administrador?.es_super && !solicitados.includes('administrador')) {
        throw new ErrorAcceso(409, 'super_administrador_protegido', 'Al super administrador no se le puede quitar el rol de administrador.')
      }

      const catalogo = await obtenerRoles(client)
      const porCodigo = new Map(catalogo.map((rol) => [rol.code, rol]))
      const actuales = (await obtenerRolesDelUsuario(idUsuario, client))
        .filter((rol) => rol.estado === 'Activo').map((rol) => rol.code)

      for (const codigo of solicitados) {
        const rol = porCodigo.get(codigo)
        if (!rol) throw new ErrorAcceso(400, 'rol_desconocido', `El rol "${codigo}" no existe.`)
        if (rol.status !== 'activo' && !actuales.includes(codigo)) {
          throw new ErrorAcceso(409, 'rol_inactivo', `El rol "${rol.name}" está inactivo.`)
        }
      }

      const nuevos = solicitados.filter((codigo) => !actuales.includes(codigo))
      await crearFichasFaltantes(idUsuario, nuevos, req.body.fichas, client)
      for (const codigo of nuevos) await activarRolDelUsuario(idUsuario, codigo, client)
      await desactivarRolesExcepto(idUsuario, solicitados, client)
    })

    invalidarCacheDePermisos(idUsuario)
    res.json({ message: 'Roles actualizados', ...(await armarDetalleDeUsuario(idUsuario)) })
  } catch (error) {
    responderError(res, error)
  }
}

export const putPermisosUsuario = async (req, res) => {
  const idUsuario = Number(req.params.id)
  try {
    await enTransaccion(async (client) => {
      const fichas = await obtenerFichasDelUsuario(idUsuario, client)
      if (!fichas) throw new ErrorAcceso(404, 'usuario_no_encontrado', 'Usuario no encontrado')
      if (fichas.administrador?.es_super) {
        throw new ErrorAcceso(409, 'super_administrador_protegido', 'El super administrador siempre tiene todos los permisos y no se puede bloquear.')
      }
      const personalizaciones = req.body.overrides
      const permisos = await validarCodigosDePermisos(personalizaciones.map((p) => p.code), client)
      const idPorCodigo = new Map(permisos.map((p) => [p.code, p.id]))
      await reemplazarPersonalizaciones(
        idUsuario,
        personalizaciones.map((p) => ({ id: idPorCodigo.get(p.code), effect: p.effect })),
        req.user.id,
        client
      )
    })
    invalidarCacheDePermisos(idUsuario)
    res.json({ message: 'Permisos del usuario guardados', ...(await armarDetalleDeUsuario(idUsuario)) })
  } catch (error) {
    responderError(res, error)
  }
}

export const deletePermisosUsuario = async (req, res) => {
  const idUsuario = Number(req.params.id)
  try {
    const borrados = await borrarPersonalizaciones(idUsuario)
    invalidarCacheDePermisos(idUsuario)
    const detalle = await armarDetalleDeUsuario(idUsuario)
    if (!detalle) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json({ message: 'El usuario vuelve a tener solo los permisos de sus roles', borrados, ...detalle })
  } catch (error) {
    responderError(res, error)
  }
}

export const putSuperAdministrador = async (req, res) => {
  const idUsuario = Number(req.params.id)
  const { esSuper } = req.body
  try {
    if (!esSuper && idUsuario === Number(req.user.id)) {
      throw new ErrorAcceso(409, 'super_administrador_protegido', 'No puedes quitarte a ti mismo el estado de super administrador.')
    }
    const actualizados = await cambiarSuperAdministrador(idUsuario, esSuper)
    if (!actualizados) {
      throw new ErrorAcceso(409, 'sin_ficha_administrador', 'Solo un usuario con ficha de administrador puede ser super administrador.')
    }
    invalidarCacheDePermisos(idUsuario)
    res.json({ message: esSuper ? 'Ahora es super administrador' : 'Ya no es super administrador', ...(await armarDetalleDeUsuario(idUsuario)) })
  } catch (error) {
    responderError(res, error)
  }
}
