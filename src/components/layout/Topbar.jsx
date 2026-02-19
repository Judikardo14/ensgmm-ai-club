import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':    { title: 'Dashboard',    sub: 'Vue générale' },
  '/assignments':  { title: 'Devoirs',      sub: 'Mes assignements' },
  '/competitions': { title: 'Compétitions', sub: 'Challenges actifs' },
  '/leaderboard':  { title: 'Leaderboard',  sub: 'Classement général' },
  '/profile':      { title: 'Mon Profil',   sub: 'Informations personnelles' },
}

export default function Topbar({ onMenuClick, isMobile }) {
  const location = useLocation()
  const [clock, setClock] = useState('')
  const info = TITLES[location.pathname] || { title: 'ENSGMM AI Club', sub: '' }

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const p = v => String(v).padStart(2, '0')
      setClock(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={s.topbar}>
      <div style={s.topLine} />

      {/* GAUCHE */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {/* Hamburger sur mobile/tablette */}
        {isMobile && (
          <button onClick={onMenuClick} style={s.hamburger}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#6b849e" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <div style={s.title}>{info.title}</div>
        {info.sub && !isMobile && <div style={s.sub}>/ {info.sub}</div>}
      </div>

      {/* DROITE */}
      <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 12 }}>

        {/* SYS.ONLINE — masqué sur mobile */}
        {!isMobile && (
          <>
            <div style={s.statusGroup}>
              <div style={s.pulseDot} />
              <span style={s.statusText}>SYS.ONLINE</span>
            </div>
            <div style={s.sep} />
          </>
        )}

        {/* SECURE */}
        <div style={s.secureTag}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {!isMobile && 'SECURE'}
        </div>

        <div style={s.sep} />

        {/* Horloge */}
        <div style={s.clock}>{clock}</div>

        {/* Tag ENSGMM — masqué sur mobile */}
        {!isMobile && (
          <>
            <div style={s.sep} />
            <div style={s.tag}>ENSGMM // AI LAB</div>
          </>
        )}

        <div style={s.sep} />

        {/* Notif */}
        <button style={s.notifBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#6b849e" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={s.notifDot} />
        </button>
      </div>
    </header>
  )
}

const s = {
  topbar: {
    height: 56, background: 'rgba(6,10,15,0.95)',
    borderBottom: '1px solid #1a2535', backdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', position: 'sticky', top: 0, zIndex: 50,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.2), transparent)',
  },
  title: {
    fontFamily: "'Unbounded',sans-serif", fontSize: 13, fontWeight: 700,
    letterSpacing: '0.05em', color: '#dce8f5',
  },
  sub: { fontSize: 10, color: '#3d5268', letterSpacing: '0.08em' },
  hamburger: {
    width: 32, height: 32, borderRadius: 6, background: 'none',
    border: '1px solid #1a2535', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  statusGroup: { display:'flex', alignItems:'center', gap:6 },
  pulseDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#00FF87', boxShadow: '0 0 6px #00FF87',
    animation: 'pulse 2s infinite',
  },
  statusText: { fontSize: 9, color: '#3d5268', letterSpacing: '0.12em', textTransform: 'uppercase' },
  secureTag: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', border: '1px solid #00c468', borderRadius: 2,
    fontSize: 9, letterSpacing: '0.15em', color: '#00FF87',
    background: 'rgba(0,255,135,0.04)',
  },
  tag: {
    padding: '2px 8px', border: '1px solid #1a2535',
    borderRadius: 2, fontSize: 9, letterSpacing: '0.12em', color: '#3d5268',
  },
  clock: {
    fontSize: 11, color: '#3d5268', letterSpacing: '0.1em',
    fontVariantNumeric: 'tabular-nums', minWidth: 60,
  },
  sep: { width: 1, height: 16, background: '#1a2535', flexShrink: 0 },
  notifBtn: {
    width: 30, height: 30, borderRadius: 6, background: 'none',
    border: '1px solid #1a2535', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0,
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 5, height: 5, borderRadius: '50%',
    background: '#00FF87', boxShadow: '0 0 5px #00FF87',
  },
}