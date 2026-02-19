import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { initials } from '../../lib/helpers'

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Assignments:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Competitions: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Leaderboard:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Profile:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  AdminDash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ManageFiles:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  ManageUsers:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ManageComps:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Bell:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Menu:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:            () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Dots:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  LogOut:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

// ─── Config navigation ────────────────────────────────────────────────────────
const STUDENT_NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: Icons.Dashboard },
  { to: '/assignments',  label: 'Devoirs',      Icon: Icons.Assignments,  badge: 'warn' },
  { to: '/competitions', label: 'Compétitions', Icon: Icons.Competitions, badge: 'blue' },
  { to: '/leaderboard',  label: 'Leaderboard',  Icon: Icons.Leaderboard },
]

const PERSONAL_NAV = [
  { to: '/profile', label: 'Profil', Icon: Icons.Profile },
]

const ADMIN_NAV = [
  { to: '/admin',              label: 'Vue admin',     Icon: Icons.AdminDash },
  { to: '/admin/assignments',  label: 'Devoirs',       Icon: Icons.ManageFiles },
  { to: '/admin/competitions', label: 'Compétitions',  Icon: Icons.ManageComps },
  { to: '/admin/users',        label: 'Utilisateurs',  Icon: Icons.ManageUsers },
]

// ─── Composant NavItem ────────────────────────────────────────────────────────
function NavItem({ to, label, Icon, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/dashboard' || to === '/admin'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 6,
        textDecoration: 'none', marginBottom: 1,
        background: isActive ? 'rgba(0,255,135,0.07)' : 'transparent',
        border: isActive ? '1px solid rgba(0,255,135,0.12)' : '1px solid transparent',
        transition: 'all 0.15s',
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? '#00FF87' : '#3d5268', transition: 'color 0.15s' }}>
            <Icon />
          </div>
          <span style={{ fontSize: 11, letterSpacing: '0.06em', color: isActive ? '#00FF87' : '#6b849e', flex: 1, transition: 'color 0.15s' }}>
            {label}
          </span>
          {badge && (
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 10,
              background: badge === 'warn' ? '#FFB830' : '#2C7BE5',
              color: '#030507', fontWeight: 600,
            }}>
              !
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ profile, logout, onNavClick }) {
  const isAdmin = profile?.role === 'admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, border: '1.5px solid #00c468', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,255,135,0.06)', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: '#00FF87', strokeWidth: 1.5, fill: 'none' }}>
            <circle cx="12" cy="12" r="3"/>
            <circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
            <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
            <line x1="12" y1="9" x2="4" y2="7"/><line x1="12" y1="9" x2="20" y2="7"/>
            <line x1="12" y1="15" x2="4" y2="17"/><line x1="12" y1="15" x2="20" y2="17"/>
          </svg>
        </div>
        <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#6b849e', textTransform: 'uppercase', lineHeight: 1.3 }}>
          ENSGMM
          <span style={{ display: 'block', color: '#00FF87', fontSize: 7, letterSpacing: '0.15em', marginTop: 2 }}>AI CLUB</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>

        {/* Section principale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3d5268', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
            Principal
          </div>
          {STUDENT_NAV.map(item => (
            <NavItem key={item.to} {...item} onClick={onNavClick} />
          ))}
        </div>

        {/* Section Mon espace */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3d5268', textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
            Mon espace
          </div>
          {PERSONAL_NAV.map(item => (
            <NavItem key={item.to} {...item} onClick={onNavClick} />
          ))}
        </div>

        {/* Section Admin — visible seulement pour les admins */}
        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            {/* Séparateur admin */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 8px', marginBottom: 6,
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,75,110,0.2)' }}/>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#FF4B6E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF4B6E' }}/>
                Admin
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,75,110,0.2)' }}/>
            </div>

            {ADMIN_NAV.map(item => (
              <NavItem key={item.to} {...item} onClick={onNavClick} />
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {/* Badge admin si applicable */}
        {isAdmin && (
          <div style={{
            margin: '8px 12px 0',
            padding: '5px 10px',
            background: 'rgba(255,75,110,0.06)',
            border: '1px solid rgba(255,75,110,0.15)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 12, height: 12, color: '#FF4B6E' }}><Icons.AdminDash /></div>
            <span style={{ fontSize: 9, color: '#FF4B6E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Mode Administrateur
            </span>
          </div>
        )}

        <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg,#00c468,#2C7BE5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#030507',
            fontFamily: "'Unbounded',sans-serif", flexShrink: 0,
            overflow: 'hidden',
          }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : initials(profile?.full_name || '')
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || '—'}
            </div>
            <div style={{ fontSize: 9, color: isAdmin ? '#FF4B6E' : '#00c468', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isAdmin ? 'Admin' : 'Member'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Se déconnecter"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5268', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#FF4B6E'}
            onMouseLeave={e => e.currentTarget.style.color = '#3d5268'}
          >
            <div style={{ width: 14, height: 14 }}><Icons.LogOut /></div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PageWrapper principal ────────────────────────────────────────────────────
const SIDEBAR_W = 220
const TOPBAR_H  = 56

export default function PageWrapper() {
  const { profile, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const PAGE_TITLES = {
    '/dashboard':            'Dashboard',
    '/assignments':          'Devoirs',
    '/competitions':         'Compétitions',
    '/leaderboard':          'Leaderboard',
    '/profile':              'Profil',
    '/admin':                'Admin Dashboard',
    '/admin/assignments':    'Gérer les devoirs',
    '/admin/competitions':   'Gérer les compétitions',
    '/admin/users':          'Gérer les utilisateurs',
  }
  const path     = window.location.pathname
  const title    = PAGE_TITLES[path] || 'Dashboard'
  const isAdmin  = profile?.role === 'admin'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content    { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile-overlay { display: none !important; }
          .topbar-menu-btn        { display: none !important; }
        }
        .nav-item-hover:hover { background: var(--surface) !important; }
        .nav-item-hover:hover span { color: var(--text) !important; }
        .nav-item-hover:hover div  { color: #6b849e !important; }
      `}</style>

      {/* ── Sidebar desktop ── */}
      <aside className="sidebar-desktop" style={{
        width: SIDEBAR_W, minHeight: '100vh',
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, display: 'flex', flexDirection: 'column',
      }}>
        <SidebarContent profile={profile} logout={logout} onNavClick={() => {}} />
      </aside>

      {/* ── Sidebar mobile overlay ── */}
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(3,5,7,0.7)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileOpen(false)}>
          <aside style={{
            width: SIDEBAR_W, height: '100%',
            background: 'var(--bg2)', borderRight: '1px solid var(--border)',
            animation: 'slideRight 0.25s ease',
          }} onClick={e => e.stopPropagation()}>
            <SidebarContent
              profile={profile}
              logout={logout}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="main-content" style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <header style={{
          height: TOPBAR_H,
          background: 'rgba(6,10,15,0.8)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Burger mobile */}
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}
            >
              <div style={{ width: 16, height: 16 }}><Icons.Menu /></div>
            </button>

            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)' }}>
              {title}
            </div>

            {/* Fil d'Ariane admin */}
            {path.startsWith('/admin') && (
              <div style={{ fontSize: 10, color: '#FF4B6E', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF4B6E' }}/>
                ADMIN
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Horloge */}
            <Clock />

            {/* Notifs */}
            <button style={{ width: 32, height: 32, borderRadius: 6, background: 'none', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', color: 'var(--text2)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ width: 14, height: 14 }}><Icons.Bell /></div>
              <div style={{ position: 'absolute', top: 7, right: 7, width: 5, height: 5, borderRadius: '50%', background: '#00FF87', boxShadow: '0 0 6px #00FF87' }}/>
            </button>

            {/* Avatar cliquable → profil */}
            <div
              onClick={() => navigate('/profile')}
              style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#00c468,#2C7BE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#030507', fontFamily: "'Unbounded',sans-serif", cursor: 'pointer', overflow: 'hidden', border: isAdmin ? '1.5px solid #FF4B6E' : '1.5px solid transparent', transition: 'border-color 0.2s' }}
              title={isAdmin ? 'Administrateur' : profile?.full_name}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : initials(profile?.full_name || '')
              }
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes slideRight { from{transform:translateX(-100%)} to{transform:translateX(0)} }
      `}</style>
    </div>
  )
}

// ─── Horloge ──────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      const p = v => String(v).padStart(2, '0')
      setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ fontSize: 11, color: '#3d5268', letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>
      {time}
    </div>
  )
}

// import useEffect manquant
import { useEffect } from 'react'