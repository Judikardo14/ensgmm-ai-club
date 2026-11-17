import { useState, useEffect, useRef, Suspense } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/helpers'
import JudiCardoWidget from '../shared/JudiCardoWidget'

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
  LogOut:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Sun:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
}

const STUDENT_NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: Icons.Dashboard },
  { to: '/assignments',  label: 'Devoirs',      Icon: Icons.Assignments,  badge: 'warn' },
  { to: '/competitions', label: 'Compétitions', Icon: Icons.Competitions, badge: 'blue' },
  { to: '/leaderboard',  label: 'Leaderboard',  Icon: Icons.Leaderboard },
]
const PERSONAL_NAV = [{ to: '/profile', label: 'Profil', Icon: Icons.Profile }]
const ADMIN_NAV = [
  { to: '/admin',              label: 'Vue admin',    Icon: Icons.AdminDash },
  { to: '/admin/assignments',  label: 'Devoirs',      Icon: Icons.ManageFiles },
  { to: '/admin/competitions', label: 'Compétitions', Icon: Icons.ManageComps },
  { to: '/admin/users',        label: 'Utilisateurs', Icon: Icons.ManageUsers },
]

const E = 'cubic-bezier(0.4,0,0.2,1)'
const T = `0.18s ${E}`

const notifColor = (type) => ({ assignment:'#FFB830', competition:'#00FF87', result:'#4a9eff', reminder:'#FF4B6E', info:'#5e7d96' }[type] || '#5e7d96')
const notifEmoji = (type) => ({ assignment:'📄', competition:'🏆', result:'⭐', reminder:'⏰', info:'ℹ️' }[type] || '🔔')
const timeAgo = (date) => {
  const diff = Date.now() - new Date(date)
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (d > 0) return `Il y a ${d}j`
  if (h > 0) return `Il y a ${h}h`
  if (m > 0) return `Il y a ${m}min`
  return "À l'instant"
}

// ─── Panel Notifications ──────────────────────────────────────────────────────
function NotifPanel({ userId, onClose, onUnreadChange }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  const fetchNotifs = async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(25)
    setNotifs(data || [])
    setLoading(false)
    onUnreadChange((data || []).filter(n => !n.read).length)
  }

  useEffect(() => {
    fetchNotifs()
    const ch = supabase.channel(`notifs-panel-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, fetchNotifs)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [userId])

  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose() }
    setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifs(updated)
    onUnreadChange(updated.filter(n => !n.read).length)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifs(p => p.map(n => ({ ...n, read: true })))
    onUnreadChange(0)
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div ref={panelRef} style={{
      position: 'absolute', top: 50, right: 0, width: 360, maxHeight: 500,
      background: 'var(--bg2)', border: '1px solid var(--border2)',
      borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 200,
      animation: `notifSlide 0.22s ${E} both`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 1, background: 'linear-gradient(90deg,transparent,var(--accent),transparent)', opacity: 0.5 }}/>

      <div style={{ padding: '16px 18px 13px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginBottom: 3 }}>Notifications</div>
          <div style={{ fontSize: 10, color: unread > 0 ? 'var(--accent)' : 'var(--text3)', letterSpacing: '0.05em' }}>
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu ✓'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", transition: `all ${T}` }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
              Tout lire
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', transition: `all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <div style={{ width: 13, height: 13 }}><Icons.X /></div>
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ padding: '36px 0', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>Chargement…</div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: '44px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Aucune notification</div>
          </div>
        ) : notifs.map((n, i) => (
          <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{
            display: 'flex', gap: 13, padding: '13px 18px',
            borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none',
            background: !n.read ? 'rgba(0,255,135,0.03)' : 'transparent',
            cursor: !n.read ? 'pointer' : 'default',
            transition: `background ${T}`, position: 'relative',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(0,255,135,0.03)' : 'transparent'}
          >
            {!n.read && <div style={{ position: 'absolute', top: 16, right: 14, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}/>}
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${notifColor(n.type)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {notifEmoji(n.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: !n.read ? 'var(--text)' : 'var(--text2)', marginBottom: 4, fontWeight: !n.read ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {n.title}
              </div>
              {n.content && (
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {n.content}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--border2)', marginTop: 5, letterSpacing: '0.04em' }}>{timeAgo(n.created_at)}</div>
            </div>
          </div>
        ))}
      </div>

      {notifs.length > 0 && (
        <div style={{ padding: '11px 18px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', textAlign: 'center', letterSpacing: '0.05em', flexShrink: 0 }}>
          {notifs.length} notification{notifs.length > 1 ? 's' : ''} au total
        </div>
      )}
    </div>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, label, Icon, badge, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <NavLink to={to} onClick={onClick} end={to === '/dashboard' || to === '/admin'}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 12px', borderRadius: 8,
        textDecoration: 'none', marginBottom: 2,
        background: isActive ? 'rgba(0,255,135,0.09)' : hov ? 'var(--surface)' : 'transparent',
        border: isActive ? '1px solid rgba(0,255,135,0.18)' : '1px solid transparent',
        transform: hov && !isActive ? 'translateX(3px)' : 'translateX(0)',
        transition: `all ${T}`,
      })}>
      {({ isActive }) => (
        <>
          <div style={{ width: 16, height: 16, flexShrink: 0, color: isActive ? 'var(--accent)' : hov ? 'var(--text2)' : 'var(--text3)', transition: `color ${T}` }}><Icon /></div>
          <span style={{ fontSize: 12, letterSpacing: '0.05em', flex: 1, color: isActive ? 'var(--accent)' : hov ? 'var(--text)' : 'var(--text2)', transition: `color ${T}` }}>{label}</span>
          {badge && (
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: badge === 'warn' ? 'rgba(255,184,48,0.12)' : 'rgba(74,158,255,0.12)', color: badge === 'warn' ? '#FFB830' : '#4a9eff', border: `1px solid ${badge === 'warn' ? 'rgba(255,184,48,0.25)' : 'rgba(74,158,255,0.25)'}`, fontWeight: 600 }}>!</span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [hov, setHov] = useState(false)
  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return (
    <button onClick={toggle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      style={{ width: 28, height: 28, borderRadius: 7, background: hov ? 'var(--surface)' : 'none', border: `1px solid ${hov ? 'var(--border2)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: hov ? 'var(--text)' : 'var(--text3)', flexShrink: 0, transition: `all ${T}`, transform: hov ? 'scale(1.1) rotate(15deg)' : 'scale(1) rotate(0deg)' }}>
      <div style={{ width: 14, height: 14 }}>{isDark ? <Icons.Sun /> : <Icons.Moon />}</div>
    </button>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarContent({ profile, logout, onNavClick }) {
  const isAdmin = profile?.role === 'admin'
  const [logHov, setLogHov] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 15px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, border: '1.5px solid var(--accent-dim)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,255,135,0.05)', flexShrink: 0, boxShadow: '0 0 14px rgba(0,255,135,0.07)' }}>
          <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, stroke: 'var(--accent)', strokeWidth: 1.5, fill: 'none' }}>
            <circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
            <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
            <line x1="12" y1="9" x2="4" y2="7"/><line x1="12" y1="9" x2="20" y2="7"/>
            <line x1="12" y1="15" x2="4" y2="17"/><line x1="12" y1="15" x2="20" y2="17"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'var(--text2)', textTransform: 'uppercase' }}>ENSGMM</div>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginTop: 2 }}>AI CLUB</div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text3)', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>Principal</div>
          {STUDENT_NAV.map(item => <NavItem key={item.to} {...item} onClick={onNavClick} />)}
        </div>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text3)', textTransform: 'uppercase', padding: '0 10px', marginBottom: 6 }}>Mon espace</div>
          {PERSONAL_NAV.map(item => <NavItem key={item.to} {...item} onClick={onNavClick} />)}
        </div>
        {isAdmin && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,75,110,0.18)' }}/>
              <div style={{ fontSize: 9, letterSpacing: '0.15em', color: '#FF4B6E', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF4B6E', boxShadow: '0 0 6px #FF4B6E' }}/>Admin
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,75,110,0.18)' }}/>
            </div>
            {ADMIN_NAV.map(item => <NavItem key={item.to} {...item} onClick={onNavClick} />)}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {isAdmin && (
          <div style={{ margin: '10px 12px 0', padding: '6px 12px', background: 'rgba(255,75,110,0.06)', border: '1px solid rgba(255,75,110,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 13, height: 13, color: '#FF4B6E' }}><Icons.AdminDash /></div>
            <span style={{ fontSize: 10, color: '#FF4B6E', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mode Administrateur</span>
          </div>
        )}
        <div style={{ padding: '12px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-dim),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#030507', fontFamily: "'Unbounded',sans-serif", flexShrink: 0, overflow: 'hidden', boxShadow: '0 0 12px rgba(0,204,106,0.2)' }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(profile?.full_name || '')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{profile?.full_name || '—'}</div>
            <div style={{ fontSize: 9, color: isAdmin ? '#FF4B6E' : 'var(--accent-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{isAdmin ? 'Admin' : 'Member'}</div>
          </div>
          <button onClick={logout}
            onMouseEnter={() => setLogHov(true)} onMouseLeave={() => setLogHov(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: logHov ? '#FF4B6E' : 'var(--text3)', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6, transition: `all ${T}`, transform: logHov ? 'scale(1.12)' : 'scale(1)' }}>
            <div style={{ width: 15, height: 15 }}><Icons.LogOut /></div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PageWrapper ──────────────────────────────────────────────────────────────
const SIDEBAR_W = 224
const TOPBAR_H  = 58

export default function PageWrapper() {
  const { profile, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellHov, setBellHov] = useState(false)
  const [avatarHov, setAvatarHov] = useState(false)

  const PAGE_TITLES = {
    '/dashboard': 'Dashboard', '/assignments': 'Devoirs', '/competitions': 'Compétitions',
    '/leaderboard': 'Leaderboard', '/profile': 'Profil', '/admin': 'Admin Dashboard',
    '/admin/assignments': 'Gérer les devoirs', '/admin/competitions': 'Gérer les compétitions',
    '/admin/users': 'Gérer les utilisateurs',
  }
  const { pathname } = useLocation()
  const title   = PAGE_TITLES[pathname] || 'Dashboard'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    const fetchUnread = async () => {
      const { count } = await supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).eq('read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
    const ch = supabase.channel(`badge-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => setUnreadCount(c => c + 1))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  return (
  <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes notifSlide {
          from { opacity:0; transform:translateY(-10px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes slideRight {
          from { transform:translateX(-100%); opacity:0; }
          to   { transform:translateX(0); opacity:1; }
        }
        @keyframes fadeIn {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes pageIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow:0 0 6px rgba(0,255,135,0.4); }
          50%      { box-shadow:0 0 14px rgba(0,255,135,0.7); }
        }
        @media (max-width:768px) { .sidebar-desktop{display:none!important} .main-content{margin-left:0!important} }
        @media (min-width:769px) { .sidebar-mobile-overlay{display:none!important} .topbar-menu-btn{display:none!important} }
        nav::-webkit-scrollbar { width:3px; }
        nav::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
      `}</style>

      {/* Sidebar desktop */}
      <aside className="sidebar-desktop" style={{ width: SIDEBAR_W, minHeight: '100vh', background: 'var(--bg2)', borderRight: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', transition: `background 0.3s ${E}` }}>
        <SidebarContent profile={profile} logout={logout} onNavClick={() => {}} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', animation: `fadeIn 0.2s ${E}` }} onClick={() => setMobileOpen(false)}>
          <aside style={{ width: SIDEBAR_W, height: '100%', background: 'var(--bg2)', borderRight: '1px solid var(--border)', animation: `slideRight 0.25s ${E}` }} onClick={e => e.stopPropagation()}>
            <SidebarContent profile={profile} logout={logout} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
       <div className="main-content" style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
         {/* Topbar */}
        <header style={{ height: TOPBAR_H, background: 'rgba(4,8,15,0.88)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', transition: `all ${T}` }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
              <div style={{ width: 17, height: 17 }}><Icons.Menu /></div>
            </button>

            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text)' }}>
              {title}
            </div>

            {pathname.startsWith('/admin') && (
              <div style={{ fontSize: 10, color: '#FF4B6E', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '3px 10px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF4B6E', boxShadow: '0 0 6px #FF4B6E' }}/>ADMIN
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock />

            {/* Cloche */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifs(v => !v)}
                onMouseEnter={() => setBellHov(true)} onMouseLeave={() => setBellHov(false)}
                style={{ width: 34, height: 34, borderRadius: 8, background: showNotifs || bellHov ? 'var(--surface)' : 'none', border: `1px solid ${showNotifs || bellHov ? 'var(--border2)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', color: bellHov || showNotifs ? 'var(--text)' : 'var(--text2)', transition: `all ${T}`, transform: bellHov ? 'scale(1.06)' : 'scale(1)' }}>
                <div style={{ width: 15, height: 15 }}><Icons.Bell /></div>
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 9, background: 'var(--accent)', color: '#030507', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid var(--bg)', animation: 'glow-pulse 2s infinite' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
              {showNotifs && profile?.id && (
                <NotifPanel userId={profile.id} onClose={() => setShowNotifs(false)} onUnreadChange={setUnreadCount} />
              )}
            </div>

            {/* Avatar */}
            <div onClick={() => navigate('/profile')}
              onMouseEnter={() => setAvatarHov(true)} onMouseLeave={() => setAvatarHov(false)}
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-dim),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#030507', fontFamily: "'Unbounded',sans-serif", cursor: 'pointer', overflow: 'hidden', border: isAdmin ? '2px solid #FF4B6E' : `2px solid ${avatarHov ? 'var(--accent)' : 'transparent'}`, boxShadow: avatarHov ? '0 0 16px rgba(0,255,135,0.35)' : 'none', transition: `all 0.2s ${E}`, transform: avatarHov ? 'scale(1.08)' : 'scale(1)' }}
              title={isAdmin ? 'Administrateur' : profile?.full_name}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(profile?.full_name || '')}
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main style={{ flex: 1, animation: `pageIn 0.28s ${E} both` }}>
          <Suspense fallback={<div style={{ padding: 40, color: 'var(--text3)', fontSize: 11, letterSpacing: '0.15em' }}>CHARGEMENT…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <JudiCardoWidget />
    </div>
  )
}

// ─── Horloge ──────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => { const n = new Date(); const p = v => String(v).padStart(2,'0'); setTime(`${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`) }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return (
    <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {time}
    </div>
  )
}
