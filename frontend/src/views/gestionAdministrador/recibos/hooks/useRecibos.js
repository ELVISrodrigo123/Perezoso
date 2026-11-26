import { useCallback, useEffect, useState } from 'react'
import { getRecibosPaginado } from '../../../../services/controlPagosParaEstudiantes.js'

const filtrosResumenIniciales = { padre_tutor: '', padre_ci: '', recibos: '', total: '' }
const filtrosDetalleIniciales = {
  id_recibo: '',
  estudiante: '',
  curso: '',
  monto_pagado: '',
  fecha_pago: '',
}

const construirParametros = (filtros, base) => {
  const params = { ...base }
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor && String(valor).trim() !== '') params[clave] = String(valor).trim()
  })
  return params
}

export const useRecibos = () => {
  const [cargando, setCargando] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [padreSeleccionado, setPadreSeleccionado] = useState(null)

  const [filtrosResumen, setFiltrosResumen] = useState(filtrosResumenIniciales)
  const [filtrosDetalle, setFiltrosDetalle] = useState(filtrosDetalleIniciales)

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const [grupos, setGrupos] = useState([])
  const [recibosPadre, setRecibosPadre] = useState([])
  const [totales, setTotales] = useState({ recibos: 0, recaudado: 0 })
  const [resumenDetalle, setResumenDetalle] = useState({ total_recibos: 0, total_pagado: 0 })

  const cargarRecibos = useCallback(async () => {
    try {
      const base = { page: paginaActual, limit: registrosPorPagina }
      if (searchTerm.trim()) base.buscar = searchTerm.trim()

      let paginacion
      if (padreSeleccionado) {
        const params = construirParametros(filtrosDetalle, {
          ...base,
          vista: 'detalle',
          grupo: padreSeleccionado.identificador,
        })
        const respuesta = await getRecibosPaginado(params)
        setRecibosPadre(respuesta.data.datos)
        setResumenDetalle(respuesta.data.resumen)
        paginacion = respuesta.data.paginacion
      } else {
        const params = construirParametros(filtrosResumen, { ...base, vista: 'resumen' })
        const respuesta = await getRecibosPaginado(params)
        setGrupos(respuesta.data.datos)
        setTotales(respuesta.data.totales)
        paginacion = respuesta.data.paginacion
      }

      setTotalRegistros(paginacion.total)
      setTotalPaginas(paginacion.totalPaginas)
      if (paginacion.totalPaginas > 0 && paginaActual > paginacion.totalPaginas) {
        setPaginaActual(paginacion.totalPaginas)
      }
    } catch (error) {
      console.error('Error al cargar los recibos:', error)
    } finally {
      setCargando(false)
    }
  }, [
    searchTerm,
    padreSeleccionado,
    filtrosResumen,
    filtrosDetalle,
    paginaActual,
    registrosPorPagina,
  ])

  useEffect(() => {
    const temporizador = setTimeout(cargarRecibos, 300)
    return () => clearTimeout(temporizador)
  }, [cargarRecibos])

  const cambiarBusqueda = (valor) => {
    setSearchTerm(valor)
    setPaginaActual(1)
  }
  const cambiarFiltrosResumen = (actualizar) => {
    setFiltrosResumen(actualizar)
    setPaginaActual(1)
  }
  const cambiarFiltrosDetalle = (actualizar) => {
    setFiltrosDetalle(actualizar)
    setPaginaActual(1)
  }
  const seleccionarPadre = (grupo) => {
    setRecibosPadre([])
    setFiltrosDetalle(filtrosDetalleIniciales)
    setPaginaActual(1)
    setPadreSeleccionado({
      identificador: grupo.identificador,
      padre_tutor: grupo.padre_tutor,
      padre_ci: grupo.padre_ci,
    })
  }
  const volverAlResumen = () => {
    setPadreSeleccionado(null)
    setPaginaActual(1)
  }

  return {
    cargando,
    searchTerm,
    cambiarBusqueda,
    padreSeleccionado,
    seleccionarPadre,
    volverAlResumen,
    grupos,
    recibosPadre,
    totales,
    resumenDetalle,
    filtrosResumen,
    cambiarFiltrosResumen,
    filtrosDetalle,
    cambiarFiltrosDetalle,
    paginaActual,
    setPaginaActual,
    registrosPorPagina,
    setRegistrosPorPagina,
    totalRegistros,
    totalPaginas,
  }
}
