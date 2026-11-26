import {
  cilBook,
  cilCash,
  cilCircle,
  cilEducation,
  cilGroup,
  cilNotes,
  cilPeople,
  cilSchool,
  cilSettings,
  cilShieldAlt,
  cilSpeedometer,
  cilTask,
  cilUserFollow,
} from '@coreui/icons'

const ICONOS_MENU = {
  cilBook,
  cilCash,
  cilEducation,
  cilGroup,
  cilNotes,
  cilPeople,
  cilSchool,
  cilSettings,
  cilShieldAlt,
  cilSpeedometer,
  cilTask,
  cilUserFollow,
}

export const iconoDeMenu = (nombre) => ICONOS_MENU[nombre] || cilCircle

export const SECCION_SIN_TITULO = 'General'

export const agruparMenuPorSeccion = (menu) => {
  const secciones = new Map()
  ;[...menu]
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((item) => {
      if (!secciones.has(item.section)) secciones.set(item.section, [])
      secciones.get(item.section).push(item)
    })
  return [...secciones.entries()].map(([seccion, items]) => ({ seccion, items }))
}
