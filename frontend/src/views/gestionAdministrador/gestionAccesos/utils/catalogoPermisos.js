export const SECCION_OTRAS = 'Otras acciones'

export const agruparCatalogo = (catalogo) => {
  const menus = catalogo
    .filter((permiso) => permiso.type === 'menu')
    .sort((a, b) => a.sort_order - b.sort_order)
  const moduloConMenu = new Set(menus.map((menu) => menu.module))
  const acciones = catalogo.filter((permiso) => permiso.type === 'action')

  const secciones = new Map()
  menus.forEach((menu) => {
    if (!secciones.has(menu.section)) secciones.set(menu.section, [])
    secciones.get(menu.section).push({
      menu,
      acciones: acciones.filter((accion) => accion.module === menu.module),
    })
  })

  const sueltas = acciones.filter((accion) => !moduloConMenu.has(accion.module))
  const grupos = [...secciones.entries()].map(([seccion, items]) => ({ seccion, items }))
  if (sueltas.length) {
    grupos.push({ seccion: SECCION_OTRAS, items: [{ menu: null, acciones: sueltas }] })
  }
  return grupos
}

export const textoDePermiso = (permiso) => permiso.label || permiso.description || permiso.code

export const errorDeApi = (error, porDefecto) =>
  error?.response?.data?.errores?.[0]?.msg || error?.response?.data?.message || porDefecto
