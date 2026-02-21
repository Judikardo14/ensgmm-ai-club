import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { initials } from '../../lib/helpers'
import { useAuthStore } from '../../store/authStore'

const Icon = {
  Search:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Shield:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  User:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Star:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  File:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  X:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Warning: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Medal:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.56 2.9A7 7 0 0 1 19 9v1h-2"/><path d="M6.5 9.5 5 9V4"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#00c468,#2C7BE5)',
  'linear-gradient(135deg,#FFD700,#FF8C00)',
  'linear-gradient(135deg,#7c3aed,#2C7BE5)',
  'linear-gradient(135deg,#FF4B6E,#FFB830)',
  'linear-gradient(135deg,#1a4fa0,#2C7BE5)',
  'linear-gradient(135deg,#cd7f32,#a0522d)',
]
const avatarGrad = (name = '') => AVATAR_GRADS[name.charCodeAt(0) % AVATAR_GRADS.length]

// ─── Modal détail étudiant ─────────────────────────────────────────────────────
function UserModal({ profile: initialProfile, rank, onClose, onRoleChanged, onDeleted }) {
  const { profile: myProfile } = useAuthStore()
  const [profile, setProfile]     = useState({ ...initialProfile })
  const [subs, setSubs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [changing, setChanging]   = useState(false)
  const [roleError, setRoleError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    supabase
      .from('submissions')
      .select('*, assignments(title, max_score)')
      .eq('user_id', profile.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setSubs(data || []); setLoading(false) })
  }, [profile.id])

  const toggleRole = async () => {
    if (profile.id === myProfile?.id) return
    setChanging(true)
    setRoleError('')
    const newRole = profile.role === 'admin' ? 'student' : 'admin'

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id)

    setChanging(false)

    if (error) {
      // Erreur RLS la plus fréquente
      if (error.code === '42501' || error.message.includes('row-level security')) {
        setRoleError('Accès refusé par Supabase RLS. Voir instructions ci-dessous.')
      } else {
        setRoleError(error.message)
      }
      return
    }

    // Mise à jour locale immédiate → badge change dans la modal
    setProfile(prev => ({ ...prev, role: newRole }))
    // Notifier le parent (re-fetch liste + toast)
    onRoleChanged(profile.id, newRole)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')

    // Supprimer les soumissions d'abord (FK cascade normalement, mais on s'assure)
    await supabase.from('submissions').delete().eq('user_id', profile.id)
    await supabase.from('competition_entries').delete().eq('user_id', profile.id)

    // Supprimer le profil (cascade supprime aussi auth.users grâce au ON DELETE CASCADE)
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id)

    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
      return
    }

    // Notifier le parent
    onDeleted(profile.id)
  }

  const gradedSubs = subs.filter(s => s.score != null)
  const avgScore = gradedSubs.length > 0
    ? Math.round(gradedSubs.reduce((a, s) => a + s.score, 0) / gradedSubs.length)
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.25s ease both', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>

        {/* Banner */}
        <div style={{ height: 70, background: avatarGrad(profile.full_name), position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)', backgroundSize: '20px 20px' }}/>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ width: 12, height: 12 }}><Icon.X /></div>
          </button>
        </div>

        <div style={{ padding: '0 22px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Avatar + nom */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -22, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarGrad(profile.full_name), border: '3px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Unbounded',sans-serif", fontSize: 17, fontWeight: 700, color: '#030507' }}>
              {initials(profile.full_name)}
            </div>
            {/* Toggle role */}
            {profile.id !== myProfile?.id && (
              <button onClick={toggleRole} disabled={changing} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                background: profile.role === 'admin' ? 'rgba(255,75,110,0.08)' : 'rgba(0,255,135,0.07)',
                border: `1px solid ${profile.role === 'admin' ? 'rgba(255,75,110,0.2)' : 'rgba(0,255,135,0.2)'}`,
                borderRadius: 6, cursor: changing ? 'wait' : 'pointer',
                color: profile.role === 'admin' ? '#FF4B6E' : '#00c468',
                fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em',
                transition: 'all 0.2s', opacity: changing ? 0.6 : 1,
              }}>
                <div style={{ width: 11, height: 11 }}>{profile.role === 'admin' ? <Icon.User /> : <Icon.Shield />}</div>
                {changing ? 'MISE À JOUR…' : profile.role === 'admin' ? 'Rétrograder Student' : 'Promouvoir Admin'}
              </button>
            )}
          </div>

          {/* Erreur RLS */}
          {roleError && (
            <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, lineHeight: 1.7 }}>
              ⚠ {roleError}
              {roleError.includes('RLS') && (
                <div style={{ marginTop: 8, color: '#FFB830', fontSize: 9 }}>
                  → Supabase Dashboard › Authentication › Policies › profiles<br/>
                  → Ajouter : UPDATE allowed WHERE role = 'admin'
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, letterSpacing: '0.02em', marginBottom: 4 }}>{profile.full_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.04em', marginBottom: 4 }}>{profile.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: profile.role === 'admin' ? 'rgba(255,75,110,0.1)' : 'rgba(0,255,135,0.08)', color: profile.role === 'admin' ? '#FF4B6E' : '#00c468', border: `1px solid ${profile.role === 'admin' ? 'rgba(255,75,110,0.2)' : 'rgba(0,255,135,0.2)'}`, letterSpacing: '0.1em', transition: 'all 0.3s' }}>
                {profile.role === 'admin' ? 'ADMIN' : 'STUDENT'}
              </span>
              {profile.filiere && <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em' }}>{profile.filiere}{profile.promo ? ` · ${profile.promo}` : ''}</span>}
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { label: 'Rang',    value: rank ? `#${rank}` : '—', color: '#2C7BE5' },
              { label: 'Points',  value: profile.total_points,     color: '#00FF87' },
              { label: 'Moy.',    value: avgScore != null ? `${avgScore}` : '—', color: '#FFB830' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 16, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Soumissions */}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text2)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 3, height: 12, background: '#00FF87', borderRadius: 2 }}/>
            Soumissions ({subs.length})
          </div>
          {loading ? (
            <div style={{ height: 60, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 }}/>
          ) : subs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>Aucune soumission.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subs.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(44,123,229,0.1)', color: '#2C7BE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12 }}><Icon.File /></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.assignments?.title || '—'}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, letterSpacing: '0.04em' }}>
                      {s.status === 'graded' ? 'Noté' : 'Soumis'}
                    </div>
                  </div>
                  {s.score != null && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#00c468', flexShrink: 0 }}>
                      {s.score}<span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 2 }}>/{s.assignments?.max_score || '?'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Zone suppression ── */}
          {profile.id !== myProfile?.id && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{ width: '100%', padding: '9px 0', background: 'rgba(255,75,110,0.06)', border: '1px solid rgba(255,75,110,0.15)', borderRadius: 8, cursor: 'pointer', color: '#FF4B6E', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,75,110,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,75,110,0.06)'}
                >
                  <div style={{ width: 13, height: 13 }}><Icon.Trash /></div>
                  SUPPRIMER CE COMPTE
                </button>
              ) : (
                <div style={{ background: 'rgba(255,75,110,0.06)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 15, height: 15, color: '#FF4B6E', flexShrink: 0 }}><Icon.Warning /></div>
                    <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>Confirmer la suppression</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 12 }}>
                    Le compte de <span style={{ color: 'var(--text)' }}>{profile.full_name}</span> sera définitivement supprimé ainsi que toutes ses soumissions. Cette action est irréversible.
                  </div>
                  {deleteError && (
                    <div style={{ fontSize: 10, color: '#FF4B6E', marginBottom: 10, letterSpacing: '0.03em' }}>⚠ {deleteError}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setConfirmDelete(false); setDeleteError('') }}
                      style={{ flex: 1, padding: '8px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 7, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{ flex: 1, padding: '8px 0', background: '#FF4B6E', border: 'none', borderRadius: 7, cursor: deleting ? 'wait' : 'pointer', color: '#fff', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: '0.06em', opacity: deleting ? 0.7 : 1 }}
                    >
                      {deleting ? 'SUPPRESSION…' : 'CONFIRMER'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const FILTERS = ['Tous', 'Étudiants', 'Admins']

export default function ManageUsers() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('Tous')
  const [selected, setSelected] = useState(null)
  const [toast, setToast]       = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('total_points', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleBan = async (user) => {
  await supabase.from('profiles')
    .update({ banned: true })
    .eq('id', user.id)
  fetchAll()
  showToast(`⊘ ${user.full_name} banni.`)
}

const handleUnban = async (user) => {
  await supabase.from('profiles')
    .update({ banned: false })
    .eq('id', user.id)
  fetchAll()
  showToast(`✓ ${user.full_name} débanni.`)
}

  const filtered = profiles.filter(p => {
    const matchSearch = p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.filiere?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' ? true : filter === 'Admins' ? p.role === 'admin' : p.role === 'student'
    return matchSearch && matchFilter
  })

  const stats = {
    total:   profiles.length,
    students: profiles.filter(p => p.role === 'student').length,
    admins:  profiles.filter(p => p.role === 'admin').length,
    avgPts:  profiles.length > 0 ? Math.round(profiles.reduce((a, p) => a + (p.total_points || 0), 0) / profiles.length) : 0,
  }

  return (
    <div style={{ padding: 'clamp(16px,4vw,28px)', maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .user-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        @media(max-width:600px){ .user-stats{ grid-template-columns:repeat(2,1fr); } }
        .user-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg2); border:1px solid var(--border); border-radius:8px; transition:all 0.2s; cursor:pointer; flex-wrap:wrap; }
        .user-row:hover { border-color:#243347; transform:translateX(2px); }
        @media(max-width:480px){ .manage-users-header{ flex-direction:column; align-items:flex-start !important; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 11, color: '#00FF87', letterSpacing: '0.04em', animation: 'slideIn 0.3s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ fontSize: 9, color: '#FF4B6E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4B6E' }}/>
          Admin
        </div>
        <div className="manage-users-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Gérer les <span style={{ color: '#00FF87' }}>Utilisateurs</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.06em' }}>
            {stats.total} membre{stats.total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="user-stats" style={{ marginBottom: 24, animation: 'fadeUp 0.35s 0.05s ease both' }}>
        {[
          { label: 'Total',     value: stats.total,    color: '#6b849e', bg: 'rgba(107,132,158,0.08)' },
          { label: 'Étudiants', value: stats.students, color: '#2C7BE5', bg: 'rgba(44,123,229,0.08)' },
          { label: 'Admins',    value: stats.admins,   color: '#FF4B6E', bg: 'rgba(255,75,110,0.08)' },
          { label: 'Moy. pts',  value: stats.avgPts,   color: '#00FF87', bg: 'rgba(0,255,135,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 'clamp(10px,2vw,14px) clamp(12px,2.5vw,16px)' }}>
            <div style={{ fontSize: 9, background: bg, color, borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: 'var(--text)' }}>
              {loading ? '…' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', animation: 'fadeUp 0.35s 0.1s ease both' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)' }}><Icon.Search /></div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, filière…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '9px 14px', borderRadius: 8,
            background: filter === f ? 'rgba(0,255,135,0.07)' : 'none',
            border: filter === f ? '1px solid rgba(0,255,135,0.15)' : '1px solid var(--border)',
            color: filter === f ? '#00FF87' : 'var(--text3)',
            fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
            letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s',
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeUp 0.35s 0.15s ease both' }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 58, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 - i * 0.07 }}/>
            ))
          : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>Aucun utilisateur trouvé.</div>
          : filtered.map((p) => {
              const rank = profiles.findIndex(pr => pr.id === p.id) + 1
              return (
                <div key={p.id} className="user-row" onClick={() => setSelected({ profile: p, rank })}>
                  {/* Rang */}
                  <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 11, fontWeight: 700, width: 24, textAlign: 'center', color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text3)', flexShrink: 0 }}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarGrad(p.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#030507', fontFamily: "'Unbounded',sans-serif", flexShrink: 0 }}>
                    {initials(p.full_name)}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
                      {p.full_name}
                      <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 10, background: p.role === 'admin' ? 'rgba(255,75,110,0.1)' : 'rgba(0,255,135,0.07)', color: p.role === 'admin' ? '#FF4B6E' : '#00c468', border: `1px solid ${p.role === 'admin' ? 'rgba(255,75,110,0.2)' : 'rgba(0,255,135,0.15)'}`, letterSpacing: '0.1em' }}>
                        {p.role === 'admin' ? 'ADMIN' : 'STUDENT'}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em' }}>
                      {p.email}{p.filiere ? ` · ${p.filiere}` : ''}{p.promo ? ` ${p.promo}` : ''}
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: rank <= 3 ? ['#FFD700','#C0C0C0','#CD7F32'][rank-1] : 'var(--text2)', letterSpacing: '0.02em', flexShrink: 0 }}>
                    {p.total_points}
                    <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 3 }}>pts</span>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Modal */}
      {selected && (
        <UserModal
          profile={selected.profile}
          rank={selected.rank}
          onClose={() => setSelected(null)}
          onRoleChanged={(userId, newRole) => {
            setProfiles(prev => prev.map(p =>
              p.id === userId ? { ...p, role: newRole } : p
            ))
            showToast(`✓ Rôle mis à jour : ${newRole === 'admin' ? 'Admin ↑' : 'Student ↓'}`)
            fetchAll()
          }}
          onDeleted={(userId) => {
            setSelected(null)
            setProfiles(prev => prev.filter(p => p.id !== userId))
            showToast('✓ Compte supprimé.')
            fetchAll()
          }}
        />
      )}
    </div>
  )
}
