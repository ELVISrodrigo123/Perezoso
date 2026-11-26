import React, { useEffect, useState } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import { suscribirCambioSesion } from '../services/authSession'

const DefaultLayout = () => {
  const [version, setVersion] = useState(0)

  useEffect(() => suscribirCambioSesion(() => setVersion((v) => v + 1)), [])

  return (
    <div key={version}>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
