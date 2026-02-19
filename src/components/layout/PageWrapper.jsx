import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function PageWrapper() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handle = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const showSidebar = !isTablet || sidebarOpen

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#030507' }}>

      {/* Scan line */}
      <div style={{
        position:'fixed', left:0, right:0, height:2,
        zIndex:300, pointerEvents:'none',
        background:'linear-gradient(90deg,transparent,rgba(0,255,135,0.2),transparent)',
        animation:'scan 6s linear infinite',
      }}/>

      {/* Dot grid */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage:'radial-gradient(circle, #1a2535 1px, transparent 1px)',
        backgroundSize:'32px 32px', opacity:0.4,
      }}/>

      {/* Overlay (mobile/tablette) */}
      {isTablet && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          zIndex:150, backdropFilter:'blur(2px)',
        }}/>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          position: isTablet ? 'fixed' : 'fixed',
          top:0, left:0, bottom:0, zIndex:200,
          transform: isTablet && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition:'transform 0.3s ease',
        }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div style={{
        marginLeft: isTablet ? 0 : 220,
        flex:1, display:'flex', flexDirection:'column',
        position:'relative', zIndex:1,
        minWidth:0,
      }}>
        <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMobile={isTablet} />
        <main style={{ flex:1, padding: isMobile ? 16 : 28, overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>

    </div>
  )
}