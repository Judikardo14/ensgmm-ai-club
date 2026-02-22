import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  },
  {
    path: '/assignments',
    label: 'Devoirs',
    badge: '3', badgeColor: '#FFB830',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  },
  {
    path: '/competitions',
    label: 'Compétitions',
    badge: '2', badgeColor: '#2C7BE5',
    icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  },
  {
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  },
  {
    path: '/profile',
    label: 'Mon Profil',
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { profile, logout } = useAuthStore()
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved)
    setIsDark(saved !== 'light')
    }
  }, [])


  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AI'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.brandLogo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#00FF87" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
            <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
            <line x1="12" y1="9" x2="4" y2="7"/><line x1="12" y1="9" x2="20" y2="7"/>
            <line x1="12" y1="15" x2="4" y2="17"/><line x1="12" y1="15" x2="20" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={s.brandName}>ENSGMM</div>
          <div style={s.brandSub}>AI CLUB</div>
        </div>
        <button onClick={() => {
          const next = !isDark
          setIsDark(next)
          document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
          localStorage.setItem('theme', next ? 'dark' : 'light')
        }} title={isDark ? 'Mode clair' : 'Mode sombre'} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: '#6b849e', fontSize: 14,
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLabel}>PRINCIPAL</div>
        {NAV.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              ...s.navItem,
              background: active ? 'rgba(0,255,135,0.07)' : 'transparent',
              border: `1px solid ${active ? 'rgba(0,255,135,0.12)' : 'transparent'}`,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={active ? '#00FF87' : '#3d5268'}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
              <span style={{...s.navItemLabel, color: active ? '#00FF87' : '#6b849e', flex:1}}>
                {item.label}
              </span>
              {item.badge && (
                <span style={{...s.badge, background: item.badgeColor}}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

     {/* User */}
      <div style={s.user}>
        <div style={s.avatar}>{initials}</div>
        <div style={{flex:1, overflow:'hidden'}}>
          <div style={s.userName}>{profile?.full_name || 'Utilisateur'}</div>
          <div style={s.userRole}>{profile?.role || 'member'}</div>
        </div>
        <button onClick={handleLogout} title="Déconnexion" style={s.logoutBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 220, minHeight: '100vh', background: 'var(--bg2)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', position: 'fixed',
    top: 0, left: 0, bottom: 0, zIndex: 100,
  },
  brand: {
    padding: '18px 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  brandLogo: {
    width: 32, height: 32, border: '1.5px solid #00c468',
    borderRadius: 6, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,255,135,0.04)', flexShrink: 0,
  },
  brandName: {
    fontFamily: "'Unbounded',sans-serif", fontSize: 9, fontWeight: 700,
    letterSpacing: '0.2em', color: 'var(--text2)', textTransform: 'uppercase',
  },
  brandSub: { fontSize: 7, letterSpacing: '0.15em', color: 'var(--text3)', textTransform: 'uppercase' },
  nav: { flex: 1, padding: '12px 8px', overflowY: 'auto', minHeight: 0 },
  navLabel: {
    fontSize: 8, letterSpacing: '0.2em', color: 'var(--text3)',
    textTransform: 'uppercase', padding: '0 8px', marginBottom: 4,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 6, cursor: 'pointer',
    width: '100%', textAlign: 'left', marginBottom: 1,
    transition: 'all 0.15s', fontFamily: "'IBM Plex Mono',monospace",
  },
  navItemLabel: { fontSize: 11, letterSpacing: '0.06em', transition: 'color 0.15s' },
  badge: {
    fontSize: 9, padding: '1px 6px', borderRadius: 10,
    color: '#030507', fontWeight: 600,
  },
  user: {
    padding: '12px 14px', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  avatar: {
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#00c468,#2C7BE5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: '#030507',
    fontFamily: "'Unbounded',sans-serif",
  },
  userName: {
    fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  userRole: { fontSize: 9, color: '#00c468', letterSpacing: '0.1em', textTransform: 'uppercase' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center',
  },
}
