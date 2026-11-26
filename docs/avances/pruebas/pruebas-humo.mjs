import { readFileSync } from 'node:fs'

const API = process.env.API_URL ?? 'http://localhost:5001'
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY ?? ''
const usuarios = JSON.parse(readFileSync(new URL('./usuarios-prueba.json', import.meta.url), 'utf8'))

const resultados = []

const decodificar = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))

const pedir = async (metodo, ruta, { token, cuerpo, cookie, cabeceras = {} } = {}) => {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...cabeceras
    },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  })
  const texto = await respuesta.text()
  let datos = texto
  try { datos = JSON.parse(texto) } catch {}
  const refresh = respuesta.headers.getSetCookie().find((c) => c.startsWith('refreshToken='))
  return { status: respuesta.status, datos, cookie: refresh ? refresh.split(';')[0] : null }
}

const caso = (nombre, esperado, obtenido, ok) => {
  resultados.push({ caso: nombre, esperado, obtenido, resultado: ok ? 'OK' : 'FALLA' })
}

const login = async (clave, role) => {
  const r = await pedir('POST', '/login', { cuerpo: { ...usuarios[clave], ...(role ? { role } : {}) } })
  return { ...r, token: r.datos.token, payload: r.datos.token ? decodificar(r.datos.token) : null }
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sesiones = {}
for (const clave of Object.keys(usuarios)) {
  sesiones[clave] = await login(clave)
  if (Object.keys(sesiones).length % 3 === 0) await esperar(61000)
}

const esperadosLogin = {
  super: ['administrador', 36],
  admin: ['administrador', 30],
  profe1: ['profesor', 9],
  profe2: ['profesor', 9],
  est1: ['estudiante', 5],
  est2: ['estudiante', 5],
  est3: ['estudiante', 5],
  est4: ['estudiante', 5],
  profeEst: ['profesor', 9],
  adminProfe: ['administrador', 30]
}
for (const [clave, [rol, cantidad]] of Object.entries(esperadosLogin)) {
  const p = sesiones[clave].payload
  caso(`Login ${clave}: rol y permisos en el JWT`, `200, ${rol}, ${cantidad} permisos, type=access`,
    `${sesiones[clave].status}, ${p?.role}, ${p?.permisos?.length} permisos, type=${p?.type}`,
    sesiones[clave].status === 200 && p?.role === rol && p?.permisos?.length === cantidad && p?.type === 'access')
}

const tokenDe = (clave) => sesiones[clave].token
const superTienePermisoGlobal = sesiones.super.payload.permisos.includes('settings.enrollment_deadline.update')
const adminTienePermisoGlobal = sesiones.admin.payload.permisos.includes('settings.enrollment_deadline.update')
caso('Permiso global solo en super admin', 'super: sí, admin: no', `super: ${superTienePermisoGlobal}, admin: ${adminTienePermisoGlobal}`,
  superTienePermisoGlobal && !adminTienePermisoGlobal)

const cambioProfeEst = await pedir('POST', '/cambiar-rol', { token: tokenDe('profeEst'), cuerpo: { role: 'estudiante' } })
const pProfeEst = decodificar(cambioProfeEst.datos.token)
caso('Multirol profe+est: cambiar a estudiante', '200, estudiante, 5 permisos learning.*',
  `${cambioProfeEst.status}, ${pProfeEst.role}, ${pProfeEst.permisos.length} permisos`,
  cambioProfeEst.status === 200 && pProfeEst.role === 'estudiante' && pProfeEst.permisos.length === 5 && pProfeEst.permisos.every((x) => x.startsWith('learning.')))
sesiones.profeEstComoEstudiante = { token: cambioProfeEst.datos.token }

const cambioAdminProfe = await pedir('POST', '/cambiar-rol', { token: tokenDe('adminProfe'), cuerpo: { role: 'profesor' } })
const pAdminProfe = decodificar(cambioAdminProfe.datos.token)
caso('Multirol admin+profe: cambiar a profesor', '200, profesor, 9 permisos teaching.*',
  `${cambioAdminProfe.status}, ${pAdminProfe.role}, ${pAdminProfe.permisos.length} permisos`,
  cambioAdminProfe.status === 200 && pAdminProfe.role === 'profesor' && pAdminProfe.permisos.length === 9)

const adminProfeComoProfeEnAdmin = await pedir('GET', '/admin/cursos', { token: cambioAdminProfe.datos.token })
caso('Multirol admin+profe como profesor entra a /admin/cursos', '403', adminProfeComoProfeEnAdmin.status, adminProfeComoProfeEnAdmin.status === 403)

const rolAjeno = await pedir('POST', '/cambiar-rol', { token: tokenDe('est1'), cuerpo: { role: 'administrador' } })
caso('Cambiar a un rol no asignado', '403', rolAjeno.status, rolAjeno.status === 403)

const refresh = await pedir('POST', '/refresh', { cookie: sesiones.est1.cookie })
const pRefresh = refresh.datos.token ? decodificar(refresh.datos.token) : {}
caso('Refresh con cookie recalcula permisos', '200, 5 permisos, type=access', `${refresh.status}, ${pRefresh.permisos?.length} permisos, type=${pRefresh.type}`,
  refresh.status === 200 && pRefresh.permisos?.length === 5 && pRefresh.type === 'access')

const refreshComoAccess = await pedir('GET', '/perfil', { token: decodeURIComponent(sesiones.est1.cookie.split('=')[1]) })
caso('Refresh token usado como access en /perfil', '401', refreshComoAccess.status, refreshComoAccess.status === 401)

const refreshComoAccessAdmin = await pedir('GET', '/admin/cursos', { token: decodeURIComponent(sesiones.super.cookie.split('=')[1]) })
caso('Refresh token del super admin usado en /admin/cursos', '401', refreshComoAccessAdmin.status, refreshComoAccessAdmin.status === 401)

const sinBearer = await pedir('GET', '/perfil', { cabeceras: { Authorization: tokenDe('est1') } })
caso('Authorization sin "Bearer"', '401', sinBearer.status, sinBearer.status === 401)

const perfil = await pedir('GET', '/perfil', { token: tokenDe('est1') })
caso('/perfil devuelve el usuario', '200, email TEST_est1, role estudiante, 5 permisos',
  `${perfil.status}, ${perfil.datos.usuario?.email}, ${perfil.datos.usuario?.role}, ${perfil.datos.usuario?.permisos?.length}`,
  perfil.status === 200 && perfil.datos.usuario?.email === usuarios.est1.email && perfil.datos.usuario?.role === 'estudiante' && perfil.datos.usuario?.permisos?.length === 5)

for (const [metodo, ruta] of [['GET', '/estudiante/inscripciones'], ['DELETE', '/estudiante/inscripciones/1'], ['PUT', '/estudiante/inscripciones/marcar-pagado/1'], ['GET', '/estudiante/inscripciones/control-pagos']]) {
  const r = await pedir(metodo, ruta, { token: tokenDe('est1') })
  caso(`Estudiante ${metodo} ${ruta} (ruta vieja)`, '404', r.status, r.status === 404)
}

for (const [clave, ruta] of [['est1', '/admin/cursos'], ['profe1', '/admin/cursos'], ['est1', '/admin/configuracion/plazo-inscripcion'], ['profe1', '/docente/cursos']]) {
  const r = await pedir('GET', ruta, { token: tokenDe(clave) })
  const esperado = clave === 'profe1' && ruta.startsWith('/docente') ? 200 : 403
  caso(`${clave} GET ${ruta}`, String(esperado), r.status, r.status === esperado)
}

const cursos = (await pedir('GET', '/admin/cursos?todos=true&curso=TEST_', { token: tokenDe('admin') })).datos.datos
const idDe = (prefijo) => cursos.find((c) => c.nombre.startsWith(prefijo)).id_curso
const cursoPorNombre = Object.fromEntries(cursos.map((c) => [c.nombre.slice(0, 8), c]))

const esperadosEstado = {
  TEST_C01: 'abierta', TEST_C02: 'abierta', TEST_C03: 'plazo_vencido', TEST_C04: 'plazo_vencido', TEST_C05: 'abierta',
  TEST_C06: 'abierta', TEST_C07: 'plazo_vencido', TEST_C08: 'abierta', TEST_C09: 'terminado', TEST_C10: 'inactivo',
  TEST_C11: 'abierta', TEST_C12: 'sin_cupos', TEST_C13: 'abierta'
}
for (const [prefijo, estado] of Object.entries(esperadosEstado)) {
  const c = cursoPorNombre[prefijo]
  caso(`Listado admin ${c.nombre}: estado inicial`, estado, `${c.estado_inscripcion} (límite ${c.fecha_limite_inscripcion}, ${c.origen_plazo})`, c.estado_inscripcion === estado)
}
const c08 = cursoPorNombre.TEST_C08
caso('C08 curso corto: fecha límite = fecha de fin', c08.fecha_fin_curso, c08.fecha_limite_inscripcion, c08.fecha_limite_inscripcion === c08.fecha_fin_curso)
const c06 = cursoPorNombre.TEST_C06
caso('C06 con 0 días: fecha límite = fecha de inicio', c06.fecha_inicio_inscripcion, c06.fecha_limite_inscripcion, c06.fecha_limite_inscripcion === c06.fecha_inicio_inscripcion)

const leerGlobalAdmin = await pedir('GET', '/admin/configuracion/plazo-inscripcion', { token: tokenDe('admin') })
caso('Admin común lee el plazo global', '200, dias=10', `${leerGlobalAdmin.status}, dias=${leerGlobalAdmin.datos.dias}`, leerGlobalAdmin.status === 200 && leerGlobalAdmin.datos.dias === 10)

const editarGlobalAdmin = await pedir('PUT', '/admin/configuracion/plazo-inscripcion', { token: tokenDe('admin'), cuerpo: { dias: 15 } })
caso('Admin común edita el plazo global', '403', editarGlobalAdmin.status, editarGlobalAdmin.status === 403)

for (const dias of [91, -1, 'abc', 2.5, null]) {
  const r = await pedir('PUT', '/admin/configuracion/plazo-inscripcion', { token: tokenDe('super'), cuerpo: { dias } })
  caso(`Super admin global dias=${JSON.stringify(dias)}`, '400', r.status, r.status === 400)
}

const subirGlobal = await pedir('PUT', '/admin/configuracion/plazo-inscripcion', { token: tokenDe('super'), cuerpo: { dias: 16 } })
const c03TrasSubir = (await pedir('GET', `/admin/cursos/${idDe('TEST_C03')}/plazo-inscripcion`, { token: tokenDe('admin') })).datos
caso('Super admin sube el global a 16: C03 (15 días) se reabre', '200, global 16, C03 abierta',
  `${subirGlobal.status}, global ${subirGlobal.datos.dias}, C03 ${c03TrasSubir.estadoInscripcion}`,
  subirGlobal.status === 200 && subirGlobal.datos.dias === 16 && c03TrasSubir.estadoInscripcion === 'abierta')
caso('Historial global registra quién y cuándo', `${usuarios.super.email}, 10 → 16`,
  `${subirGlobal.datos.historial?.[0]?.modificado_por_email}, ${subirGlobal.datos.historial?.[0]?.dias_anterior} → ${subirGlobal.datos.historial?.[0]?.dias_nuevo}`,
  subirGlobal.datos.historial?.[0]?.modificado_por_email === usuarios.super.email && subirGlobal.datos.historial[0].dias_anterior === 10 && subirGlobal.datos.historial[0].dias_nuevo === 16)
const volverGlobal = await pedir('PUT', '/admin/configuracion/plazo-inscripcion', { token: tokenDe('super'), cuerpo: { dias: 10 } })
const c03TrasBajar = (await pedir('GET', `/admin/cursos/${idDe('TEST_C03')}/plazo-inscripcion`, { token: tokenDe('admin') })).datos
caso('Super admin vuelve el global a 10: C03 se cierra', '200, C03 plazo_vencido', `${volverGlobal.status}, C03 ${c03TrasBajar.estadoInscripcion}`,
  volverGlobal.status === 200 && c03TrasBajar.estadoInscripcion === 'plazo_vencido')

const reabrir = await pedir('PUT', `/admin/cursos/${idDe('TEST_C04')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo: { dias: 20 } })
caso('Admin sube C04 a 20 días: se reabre', '200, abierta, origen curso',
  `${reabrir.status}, ${reabrir.datos.estadoInscripcion}, ${reabrir.datos.origenPlazo}, límite ${reabrir.datos.fechaLimite}`,
  reabrir.status === 200 && reabrir.datos.estadoInscripcion === 'abierta' && reabrir.datos.origenPlazo === 'curso')
caso('C04 guarda quién y cuándo', `${usuarios.admin.email}, fecha presente, historial null → 20`,
  `${reabrir.datos.actualizadoPor?.email}, ${Boolean(reabrir.datos.actualizadoEn)}, ${reabrir.datos.historial?.[0]?.dias_anterior} → ${reabrir.datos.historial?.[0]?.dias_nuevo}`,
  reabrir.datos.actualizadoPor?.email === usuarios.admin.email && Boolean(reabrir.datos.actualizadoEn) && reabrir.datos.historial?.[0]?.dias_anterior === null && reabrir.datos.historial?.[0]?.dias_nuevo === 20)

const reducir = await pedir('PUT', `/admin/cursos/${idDe('TEST_C05')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo: { dias: 2 } })
caso('Admin baja C05 a 2 días: se cierra', '200, plazo_vencido', `${reducir.status}, ${reducir.datos.estadoInscripcion}, límite ${reducir.datos.fechaLimite}`,
  reducir.status === 200 && reducir.datos.estadoInscripcion === 'plazo_vencido')

const vaciar = await pedir('PUT', `/admin/cursos/${idDe('TEST_C02')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo: { dias: null } })
caso('Admin vacía C02 (20 → global 10)', '200, origen global, diasCurso null, plazo_vencido',
  `${vaciar.status}, ${vaciar.datos.origenPlazo}, diasCurso ${vaciar.datos.diasCurso}, ${vaciar.datos.estadoInscripcion}`,
  vaciar.status === 200 && vaciar.datos.origenPlazo === 'global' && vaciar.datos.diasCurso === null && vaciar.datos.estadoInscripcion === 'plazo_vencido')
const restaurarC02 = await pedir('PUT', `/admin/cursos/${idDe('TEST_C02')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo: { dias: 20 } })
caso('Admin restaura C02 a 20', '200, abierta', `${restaurarC02.status}, ${restaurarC02.datos.estadoInscripcion}`, restaurarC02.status === 200 && restaurarC02.datos.estadoInscripcion === 'abierta')

for (const cuerpo of [{ dias: 91 }, { dias: '5' }, {}]) {
  const r = await pedir('PUT', `/admin/cursos/${idDe('TEST_C01')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo })
  caso(`Plazo de curso con ${JSON.stringify(cuerpo)}`, '400', r.status, r.status === 400)
}
const cursoInexistente = await pedir('PUT', '/admin/cursos/999999/plazo-inscripcion', { token: tokenDe('admin'), cuerpo: { dias: 5 } })
caso('Plazo de curso inexistente', '404', cursoInexistente.status, cursoInexistente.status === 404)
const profeEditaPlazo = await pedir('PUT', `/admin/cursos/${idDe('TEST_C01')}/plazo-inscripcion`, { token: tokenDe('profe1'), cuerpo: { dias: 5 } })
caso('Profesor edita plazo de curso', '403', profeEditaPlazo.status, profeEditaPlazo.status === 403)

const inscribir = (clave, prefijo) => pedir('POST', `/estudiante/curso/inscripcion-a-un-curso/${idDe(prefijo)}`, { token: sesiones[clave].token })

const casosEstudiante = [
  ['est1', 'TEST_C01', 201, null],
  ['est1', 'TEST_C01', 400, 'Ya estás inscrito'],
  ['est2', 'TEST_C03', 409, 'plazo_inscripcion_vencido'],
  ['est1', 'TEST_C04', 201, null],
  ['est1', 'TEST_C05', 409, 'plazo_inscripcion_vencido'],
  ['est1', 'TEST_C06', 201, null],
  ['est1', 'TEST_C07', 409, 'plazo_inscripcion_vencido'],
  ['est1', 'TEST_C08', 201, null],
  ['est1', 'TEST_C09', 409, 'curso_terminado'],
  ['est1', 'TEST_C10', 409, 'curso_inactivo'],
  ['est1', 'TEST_C12', 409, 'curso_sin_cupos'],
  ['est1', 'TEST_C02', 201, null]
]
for (const [clave, prefijo, status, codigo] of casosEstudiante) {
  const r = await inscribir(clave, prefijo)
  const obtenido = `${r.status}${r.datos.error ? ` ${r.datos.error}` : ''}: ${r.datos.message}`
  const ok = r.status === status && (!codigo || r.datos.error === codigo || String(r.datos.message).includes(codigo))
  caso(`Estudiante ${clave} se inscribe a ${prefijo}`, `${status}${codigo ? ` ${codigo}` : ''}`, obtenido, ok)
}

const noExiste = await pedir('POST', '/estudiante/curso/inscripcion-a-un-curso/999999', { token: tokenDe('est1') })
caso('Estudiante se inscribe a curso inexistente', '404', noExiste.status, noExiste.status === 404)
const idInvalido = await pedir('POST', '/estudiante/curso/inscripcion-a-un-curso/abc', { token: tokenDe('est1') })
caso('Estudiante con id de curso inválido', '400', idInvalido.status, idInvalido.status === 400)

const [concurrenteA, concurrenteB] = await Promise.all([inscribir('est2', 'TEST_C11'), inscribir('est3', 'TEST_C11')])
const estados = [concurrenteA.status, concurrenteB.status].sort()
caso('Dos inscripciones simultáneas a C11 (1 cupo)', '[201, 409 curso_sin_cupos]',
  `[${estados.join(', ')}] ${[concurrenteA, concurrenteB].find((r) => r.status === 409)?.datos.message ?? ''}`,
  estados[0] === 201 && estados[1] === 409)

const estudiantes = (await pedir('GET', '/admin/estudiantes?todos=true&estudiante=TEST_', { token: tokenDe('admin') })).datos.datos
const idEstudiante = (nombre) => estudiantes.find((e) => e.nombre === nombre).id_estudiante
const cursosDeEstudiante = async (nombre) =>
  ((await pedir('GET', `/admin/inscripciones/estudiante/${idEstudiante(nombre)}`, { token: tokenDe('admin') })).datos.idsCursos ?? []).sort((a, b) => a - b)

const antesEst4 = await cursosDeEstudiante('TEST_Est4')
const adminVencido = await pedir('POST', '/admin/inscripciones', { token: tokenDe('admin'), cuerpo: { idEstudiante: idEstudiante('TEST_Est4'), idCurso: [idDe('TEST_C13'), idDe('TEST_C03')] } })
const despuesEst4 = await cursosDeEstudiante('TEST_Est4')
caso('Admin inscribe a C03 vencido (y quita C12): rollback completo', '409 plazo_inscripcion_vencido, C12 sigue inscrito',
  `${adminVencido.status} ${adminVencido.datos.error}, antes ${JSON.stringify(antesEst4)}, después ${JSON.stringify(despuesEst4)}`,
  adminVencido.status === 409 && adminVencido.datos.error === 'plazo_inscripcion_vencido' && JSON.stringify(antesEst4) === JSON.stringify(despuesEst4))

for (const [prefijo, codigo] of [['TEST_C09', 'curso_terminado'], ['TEST_C10', 'curso_inactivo'], ['TEST_C11', 'curso_sin_cupos']]) {
  const r = await pedir('POST', '/admin/inscripciones', { token: tokenDe('admin'), cuerpo: { idEstudiante: idEstudiante('TEST_Est4'), idCurso: [idDe('TEST_C12'), idDe(prefijo)] } })
  caso(`Admin inscribe a ${prefijo}`, `409 ${codigo}`, `${r.status} ${r.datos.error}: ${r.datos.message}`, r.status === 409 && r.datos.error === codigo)
}

const adminOk = await pedir('POST', '/admin/inscripciones', { token: tokenDe('admin'), cuerpo: { idEstudiante: idEstudiante('TEST_Est4'), idCurso: [idDe('TEST_C12'), idDe('TEST_C13')] } })
caso('Admin inscribe a C13 abierto conservando C12', '200, insertados 1, eliminados 0', `${adminOk.status}, insertados ${adminOk.datos.insertados}, eliminados ${adminOk.datos.eliminados}`,
  adminOk.status === 200 && adminOk.datos.insertados === 1 && adminOk.datos.eliminados === 0)

const adminConservaCerrado = await pedir('POST', '/admin/inscripciones', { token: tokenDe('admin'), cuerpo: { idEstudiante: idEstudiante('TEST_Est1'), idCurso: await cursosDeEstudiante('TEST_Est1') } })
caso('Admin reenvía las inscripciones de Est1 (incluye C03 cerrado ya inscrito)', '200, insertados 0, eliminados 0',
  `${adminConservaCerrado.status}, insertados ${adminConservaCerrado.datos.insertados}, eliminados ${adminConservaCerrado.datos.eliminados}`,
  adminConservaCerrado.status === 200 && adminConservaCerrado.datos.insertados === 0 && adminConservaCerrado.datos.eliminados === 0)

const reduccionNoAnula = await pedir('GET', `/admin/cursos/${idDe('TEST_C04')}/plazo-inscripcion`, { token: tokenDe('admin') })
await pedir('PUT', `/admin/cursos/${idDe('TEST_C04')}/plazo-inscripcion`, { token: tokenDe('admin'), cuerpo: { dias: 0 } })
const trasReducirC04 = await pedir('GET', `/admin/cursos/${idDe('TEST_C04')}/plazo-inscripcion`, { token: tokenDe('admin') })
caso('Reducir C04 a 0 no anula inscripciones hechas', `cerrado y cuposOcupados = ${reduccionNoAnula.datos.cuposOcupados}`,
  `${trasReducirC04.datos.estadoInscripcion}, cuposOcupados ${trasReducirC04.datos.cuposOcupados}`,
  trasReducirC04.datos.estadoInscripcion === 'plazo_vencido' && trasReducirC04.datos.cuposOcupados === reduccionNoAnula.datos.cuposOcupados)

const publico = await pedir('GET', '/public/cursos-disponibles')
const c01Publico = Array.isArray(publico.datos) ? publico.datos.find((c) => c.materia.startsWith('TEST_C01')) : null
caso('Portal público expone el estado de inscripción', '200, C01 con fecha_limite_inscripcion y estado',
  `${publico.status}, ${c01Publico?.estado_inscripcion}, ${c01Publico?.fecha_limite_inscripcion}`,
  publico.status === 200 && c01Publico?.estado_inscripcion === 'abierta' && Boolean(c01Publico?.fecha_limite_inscripcion))

const noInscritos = await pedir('GET', '/estudiante/curso/no-inscritos?todos=true', { token: tokenDe('est2') })
const c07NoInscrito = noInscritos.datos.datos?.find((c) => c.materia.startsWith('TEST_C07'))
caso('Estudiante ve cursos no inscritos con su estado', '200, C07 plazo_vencido', `${noInscritos.status}, ${c07NoInscrito?.estado_inscripcion}`,
  noInscritos.status === 200 && c07NoInscrito?.estado_inscripcion === 'plazo_vencido')

if (CHATBOT_API_KEY) {
  const chatbot = await pedir('GET', '/api/chatbot/cursos', { cabeceras: { 'x-api-key': CHATBOT_API_KEY } })
  const c13Chat = chatbot.datos.cursos?.find((c) => c.nombre.startsWith('TEST_C13'))
  const c10Chat = chatbot.datos.cursos?.find((c) => c.nombre.startsWith('TEST_C10'))
  caso('Chatbot informa inscripción abierta y fecha límite', '200, C13 abierta con fecha, C10 no listado (inactivo)',
    `${chatbot.status}, C13 ${c13Chat?.inscripcion_abierta} ${c13Chat?.fecha_limite_inscripcion}, C10 ${c10Chat ? 'listado' : 'no listado'}`,
    chatbot.status === 200 && c13Chat?.inscripcion_abierta === true && Boolean(c13Chat?.fecha_limite_inscripcion) && !c10Chat)
}

const fallas = resultados.filter((r) => r.resultado === 'FALLA')
console.log('| # | Caso | Esperado | Obtenido | Resultado |')
console.log('|---|---|---|---|---|')
resultados.forEach((r, i) => {
  const limpiar = (v) => String(v).replaceAll('|', '\\|').replaceAll('\n', ' ')
  console.log(`| ${i + 1} | ${limpiar(r.caso)} | ${limpiar(r.esperado)} | ${limpiar(r.obtenido)} | ${r.resultado} |`)
})
console.log(`\nTotal: ${resultados.length}, OK: ${resultados.length - fallas.length}, FALLA: ${fallas.length}`)
process.exitCode = fallas.length ? 1 : 0
