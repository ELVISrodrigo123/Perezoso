/**
 * AppSidebar Component
 *
 * Collapsible navigation sidebar with branding, menu items, and toggle controls.
 *
 * Features:
 * - Redux-controlled visibility state
 * - Unfoldable/narrow mode for more screen space
 * - Brand logo with full and narrow variants
 * - Close button for mobile devices
 * - Footer with toggle button
 * - Dark color scheme
 * - Fixed positioning
 * - Oculta los ítems marcados con soloSuper si el usuario no es super administrador
 *
 * @component
 * @example
 * return (
 *   <AppSidebar />
 * )
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { CSidebar, CSidebarFooter, CSidebarHeader, CSidebarToggler } from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'

import logo0 from '../assets/images/logo0.svg'
// sidebar nav config
import navigation from '../_nav'
import { verificarEsSuper } from '../services/gestionAdministrador/superAdministrador'
import { obtenerRol } from '../views/utils/usuario'

/**
 * AppSidebar functional component
 *
 * Manages sidebar state with Redux:
 * - sidebarShow: Controls sidebar visibility
 * - sidebarUnfoldable: Controls narrow/wide mode
 *
 * Renders navigation from _nav.js configuration file.
 * Memoized to prevent unnecessary re-renders.
 *
 * @returns {React.ReactElement} Sidebar with navigation
 */
const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const [esSuper, setEsSuper] = useState(false)

  // Solo un administrador necesita saber si además es super administrador
  useEffect(() => {
    if (obtenerRol() !== 'administrador') return undefined
    let activo = true
    verificarEsSuper()
      .then((valor) => {
        if (activo) setEsSuper(valor === true)
      })
      .catch(() => {
        if (activo) setEsSuper(false)
      })
    return () => {
      activo = false
    }
  }, [])

  // Oculta los ítems marcados con soloSuper si el usuario no es super administrador
  const items = useMemo(
    () =>
      navigation.filter((item) => !item.soloSuper || esSuper).map(({ soloSuper, ...item }) => item),
    [esSuper],
  )

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom p-2 " style={{ height: '50px' }}>
        <img
          src={logo0}
          className="sidebar-brand-full"
          alt="Logo"
          style={{
            width: '100%',
            height: '52px',
            display: 'block',
            objectFit: 'fill',
            transform: 'scaleX(1.3)',
            filter:
              'invert(53%) sepia(87%) saturate(1814%) hue-rotate(360deg) brightness(102%) contrast(106%)',
          }}
        />
      </CSidebarHeader>

      <AppSidebarNav items={items} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
