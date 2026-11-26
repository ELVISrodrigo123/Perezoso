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
 * - Arma el menú desde los permisos de tipo menú del usuario
 *
 * @component
 * @example
 * return (
 *   <AppSidebar />
 * )
 */

import React, { useEffect, useMemo, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CNavItem,
  CNavTitle,
  CSidebar,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import { AppSidebarNav } from './AppSidebarNav'

import logo0 from '../assets/images/logo0.svg'
import { getMenuDelUsuario } from '../services/menuService'
import { SECCION_SIN_TITULO, agruparMenuPorSeccion, iconoDeMenu } from '../views/utils/iconosMenu'

const construirItems = (menu) =>
  agruparMenuPorSeccion(menu).flatMap(({ seccion, items }) => [
    ...(seccion === SECCION_SIN_TITULO ? [] : [{ component: CNavTitle, name: seccion }]),
    ...items.map((item) => ({
      component: CNavItem,
      name: item.label,
      to: item.route,
      icon: <CIcon icon={iconoDeMenu(item.icon)} customClassName="nav-icon" />,
    })),
  ])

/**
 * AppSidebar functional component
 *
 * Manages sidebar state with Redux:
 * - sidebarShow: Controls sidebar visibility
 * - sidebarUnfoldable: Controls narrow/wide mode
 *
 * Renders navigation from the menu permissions of the user.
 * Memoized to prevent unnecessary re-renders.
 *
 * @returns {React.ReactElement} Sidebar with navigation
 */
const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const [menu, setMenu] = useState([])

  useEffect(() => {
    let activo = true
    getMenuDelUsuario()
      .then((items) => {
        if (activo) setMenu(items)
      })
      .catch(() => {
        if (activo) setMenu([])
      })
    return () => {
      activo = false
    }
  }, [])

  const items = useMemo(() => construirItems(menu), [menu])

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
