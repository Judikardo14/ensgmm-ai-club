import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { initials, formatDeadline } from '../../lib/helpers'

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icon = {
  Edit:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Save:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  X:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Camera:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Star:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  File:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Trophy:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L19 7C19 9.76 17.76 12.24 16 14C14.7 15.3 13.4 16 12 16C10.6 16 9.3 15.3 8 14C6.24 12.24 5 9.76 5 7L7 4Z"/><path d="M5 7H3C3 9 4 11 6 12"/><path d="M19 7H21C21 9 20 11 18 12"/></svg>,
  Medal:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.56 2.9A7 7 0 0 1 19 9v1h-2"/><path d="M6.5 9.5 5 9V4"/></svg>,
  Lock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  LogOut:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Link:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Clock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

// ─── Avatar gradients ─────────────────────────────────────────────────────────
const GRADS = [
  'linear-gradient(135deg,#00c468,#2C7BE5)',
  'linear-gradient(135deg,#FFD700,#FF8C00)',
  'linear-gradient(135deg,#7c3aed,#2C7BE5)',
  'linear-gradient(135deg,#FF4B6E,#FFB830)',
]
const pickGrad = (name = '') => GRADS[name.charCodeAt(0) % GRADS.length]

// ─── Input générique ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', disabled = false }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%', padding: '10px 12px',
          background: disabled ? 'var(--bg)' : 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 8, color: disabled ? 'var(--text3)' : 'var(--text)',
          fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
          outline: 'none', transition: 'border-color 0.15s',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#243347' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
      />
    </div>
  )
}

// ─── Section titre ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
      color: 'var(--text2)', textTransform: 'uppercase',
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 14,
    }}>
      <div style={{ width: 3, height: 12, background: '#00FF87', borderRadius: 2, flexShrink: 0 }}/>
      {children}
    </div>
  )
}

// ─── Card submission history ──────────────────────────────────────────────────
function SubmissionRow({ sub }) {
  const statusMap = {
    submitted: { label: 'Soumis',    color: '#2C7BE5', bg: 'rgba(44,123,229,0.1)' },
    graded:    { label: 'Noté',      color: '#00c468', bg: 'rgba(0,255,135,0.08)' },
    late:      { label: 'En retard', color: '#FFB830', bg: 'rgba(255,184,48,0.1)' },
  }
  const s = statusMap[sub.status] || statusMap.submitted

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '12px 14px',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = '#243347'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Ligne 1 : titre + statut */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub.assignments?.title || 'Devoir'}
        </div>
        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, letterSpacing: '0.06em', flexShrink: 0 }}>
          {s.label}
        </span>
      </div>

      {/* Ligne 2 : date + score + lien */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: sub.notes || sub.feedback ? 8 : 0 }}>
        <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 9, height: 9 }}><Icon.Clock /></div>
          {sub.submitted_at ? formatDeadline(sub.submitted_at) : '—'}
        </span>
        {sub.score != null && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#00c468' }}>
            {sub.score} <span style={{ fontSize: 9, color: 'var(--text3)' }}>pts</span>
          </span>
        )}
        {sub.file_url && (
          <a href={sub.file_url} target="_blank" rel="noreferrer"
            style={{ color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, textDecoration: 'none' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 10, height: 10 }}><Icon.Link /></div>
            Fichier
          </a>
        )}
      </div>

      {/* Note de l'étudiant */}
      {sub.notes && (
        <div style={{ marginTop: 6, padding: '7px 10px', background: 'rgba(44,123,229,0.06)', border: '1px solid rgba(44,123,229,0.15)', borderRadius: 6, fontSize: 10, color: '#2C7BE5', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--text3)', marginRight: 6 }}>Ta note :</span>
          {sub.notes}
        </div>
      )}

      {/* Feedback admin */}
      {sub.feedback && (
        <div style={{ marginTop: 6, padding: '7px 10px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: 6, fontSize: 10, color: '#00c468', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--text3)', marginRight: 6 }}>Feedback :</span>
          {sub.feedback}
        </div>
      )}
    </div>
  )
}

// ─── Modal mot de passe ───────────────────────────────────────────────────────
function PasswordModal({ onClose, myProfile }) {
  const [current, setCurrent] = useState('')
  const [next, setNext]       = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

 const handleChange = async () => {
  if (next !== confirm) return setError('Les mots de passe ne correspondent pas.')
  if (next.length < 8)  return setError('Minimum 8 caractères.')
  setLoading(true); setError('')

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: myProfile.email,
    password: current,
  })
  if (signInErr) {
    setError('Mot de passe actuel incorrect.')
    setLoading(false)
    return
  }

  const { error: e } = await supabase.auth.updateUser({ password: next })
  if (e) setError(e.message)
  else { setSuccess(true); setTimeout(onClose, 1800) }
  setLoading(false)
}

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,5,7,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 14, width: '100%', maxWidth: 400,
        padding: '28px 28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        animation: 'fadeUp 0.25s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Sécurité</div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>Changer le mot de passe</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ width: 14, height: 14 }}><Icon.X /></div>
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#00c468', fontSize: 12, letterSpacing: '0.04em' }}>
            <div style={{ width: 24, height: 24, margin: '0 auto 10px', color: '#00FF87' }}><Icon.Check /></div>
            Mot de passe mis à jour !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Mot de passe actuel" type="password" value={current} onChange={setCurrent} placeholder="••••••••" />
            <Field label="Nouveau mot de passe" type="password" value={next}    onChange={setNext}    placeholder="8 caractères min." />
            <Field label="Confirmer"            type="password" value={confirm} onChange={setConfirm} placeholder="Répéter le nouveau" />
            {error && (
              <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '7px 12px' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em' }}>
                Annuler
              </button>
              <button onClick={handleChange} disabled={loading} style={{ flex: 2, padding: '10px 0', background: loading ? '#00c468' : '#00FF87', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>
                {loading ? 'MISE À JOUR…' : 'CONFIRMER →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Profile() {
  const { profile: myProfile, logout, refreshProfile } = useAuthStore()
  const fileInputRef = useRef(null)

  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [showPwdModal, setShowPwd]  = useState(false)
  const [avatarLoading, setAvatarL] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [rank, setRank]             = useState(null)
  const [statsLoading, setStatsL]   = useState(true)

  // Formulaire
  const [form, setForm] = useState({
    full_name: '',
    filiere:   '',
    promo:     '',
  })

  // Init form depuis profil
  useEffect(() => {
    if (myProfile) {
      setForm({
        full_name: myProfile.full_name || '',
        filiere:   myProfile.filiere   || '',
        promo:     myProfile.promo     || '',
      })
    }
  }, [myProfile])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!myProfile?.id) return
    setStatsL(true)

    const [{ data: subs }, { count }] = await Promise.all([
      supabase
        .from('submissions')
        .select('id, status, score, notes, feedback, file_url, submitted_at, assignments(title, max_score)')
        .eq('user_id', myProfile.id)
        .order('submitted_at', { ascending: false })
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', myProfile.total_points || 0),
    ])

    setSubmissions(subs || [])
    setRank((count || 0) + 1)
    setStatsL(false)
  }, [myProfile?.id, myProfile?.total_points])

  useEffect(() => { fetchStats() }, [fetchStats])

  // Save profile
  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        filiere:   form.filiere.trim() || null,
        promo:     form.promo ? parseInt(form.promo) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', myProfile.id)

    if (error) {
      showToast('❌ Erreur lors de la sauvegarde.', '#FF4B6E')
    } else {
      await refreshProfile()
      showToast('✓ Profil mis à jour !', '#00FF87')
      setEditing(false)
    }
    setSaving(false)
  }

  // Upload avatar
  const handleAvatarUpload = async (file) => {
    if (!file) return
    setAvatarL(true)
    const ext  = file.name.split('.').pop()
    const path = `avatars/${myProfile.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { showToast('❌ Upload échoué.', '#FF4B6E'); setAvatarL(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', myProfile.id)
    showToast('✓ Photo mise à jour !', '#00FF87')
    setAvatarL(false)
  }

  const showToast = (msg, color = '#00FF87') => {
    setToast({ msg, color })
    setTimeout(() => setToast(null), 3000)
  }

  const gradientBg    = pickGrad(myProfile?.full_name || '')
  const submittedCount = submissions.filter(s => s.status !== 'pending').length
  const gradedCount    = submissions.filter(s => s.status === 'graded').length
  const avgScore = gradedCount > 0
    ? Math.round(submissions.filter(s => s.score != null).reduce((a, s) => a + s.score, 0) / gradedCount)
    : null

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 860, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .profile-grid-wide {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 700px) {
          .profile-grid-wide { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .profile-actions { flex-direction: column !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          background: toast.color === '#FF4B6E' ? 'rgba(255,75,110,0.12)' : 'rgba(0,255,135,0.12)',
          border: `1px solid ${toast.color}40`,
          borderRadius: 8, padding: '10px 16px',
          fontSize: 11, color: toast.color, letterSpacing: '0.04em',
          animation: 'slideIn 0.3s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          ENSGMM · AI CLUB
        </div>
        <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Mon <span style={{ color: '#00FF87' }}>Profil</span>
        </div>
      </div>

      <div className="profile-grid-wide">

        {/* ── Colonne gauche : carte identité ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Carte avatar */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, overflow: 'hidden',
            animation: 'fadeUp 0.35s 0.05s ease both',
          }}>
            {/* Banner */}
            <div style={{ height: 70, background: gradientBg, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)',
                backgroundSize: '20px 20px',
              }}/>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              {/* Avatar avec upload */}
              <div style={{ position: 'relative', display: 'inline-block', marginTop: -28, marginBottom: 12 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: myProfile?.avatar_url ? 'transparent' : gradientBg,
                  border: '3px solid var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Unbounded',sans-serif", fontSize: 20, fontWeight: 700, color: '#030507',
                  overflow: 'hidden', position: 'relative',
                }}>
                  {myProfile?.avatar_url
                    ? <img src={myProfile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(myProfile?.full_name || '')
                  }
                  {avatarLoading && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 18, height: 18, border: '2px solid #00FF87', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#00FF87', border: '2px solid var(--surface)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#030507',
                  }}
                >
                  <div style={{ width: 10, height: 10 }}><Icon.Camera /></div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleAvatarUpload(e.target.files[0])} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: 3 }}>
                {myProfile?.full_name || '—'}
              </div>
              <div style={{ fontSize: 10, color: '#00c468', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                {myProfile?.role === 'admin' ? 'Administrateur' : 'Membre'}
              </div>
              {myProfile?.filiere && (
                <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.04em' }}>
                  {myProfile.filiere}{myProfile.promo ? ` · Promo ${myProfile.promo}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Stats rapides */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 16,
            animation: 'fadeUp 0.35s 0.1s ease both',
          }}>
            <SectionTitle>Statistiques</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Points totaux',  value: myProfile?.total_points ?? 0, color: '#00FF87', icon: <Icon.Star /> },
                { label: 'Classement',     value: rank ? `#${rank}` : '—',        color: '#2C7BE5', icon: <Icon.Medal /> },
                { label: 'Devoirs soumis', value: submittedCount,                 color: '#FFB830', icon: <Icon.File /> },
                { label: 'Score moyen',    value: avgScore != null ? `${avgScore} pts` : '—', color: '#00c468', icon: <Icon.Trophy /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: 'var(--bg2)',
                  border: '1px solid var(--border)', borderRadius: 8,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 13, height: 13 }}>{icon}</div>
                  </div>
                  <div style={{ flex: 1, fontSize: 10, color: 'var(--text3)', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color, letterSpacing: '0.02em' }}>{statsLoading ? '…' : value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions danger */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 16,
            animation: 'fadeUp 0.35s 0.15s ease both',
          }}>
            <SectionTitle>Compte</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setShowPwd(true)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 8,
                cursor: 'pointer', color: 'var(--text2)',
                fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
                letterSpacing: '0.04em', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#243347'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
              >
                <div style={{ width: 14, height: 14 }}><Icon.Lock /></div>
                Changer le mot de passe
              </button>

              <button onClick={logout} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', background: 'rgba(255,75,110,0.05)',
                border: '1px solid rgba(255,75,110,0.15)', borderRadius: 8,
                cursor: 'pointer', color: '#FF4B6E',
                fontSize: 11, fontFamily: "'IBM Plex Mono',monospace",
                letterSpacing: '0.04em', transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,75,110,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,75,110,0.05)'}
              >
                <div style={{ width: 14, height: 14 }}><Icon.LogOut /></div>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Formulaire édition */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20,
            animation: 'fadeUp 0.35s 0.1s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <SectionTitle>Informations personnelles</SectionTitle>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', background: 'none',
                  border: '1px solid var(--border2)', borderRadius: 6,
                  cursor: 'pointer', color: 'var(--text3)',
                  fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
                  letterSpacing: '0.08em', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = '#00FF87' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
                >
                  <div style={{ width: 11, height: 11 }}><Icon.Edit /></div>
                  MODIFIER
                </button>
              ) : (
                <div className="profile-actions" style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditing(false); setForm({ full_name: myProfile?.full_name || '', filiere: myProfile?.filiere || '', promo: myProfile?.promo || '' }) }} style={{
                    padding: '5px 10px', background: 'none', border: '1px solid var(--border2)',
                    borderRadius: 6, cursor: 'pointer', color: 'var(--text3)',
                    fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em',
                  }}>
                    ANNULER
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', background: saving ? '#00c468' : '#00FF87',
                    border: 'none', borderRadius: 6,
                    cursor: saving ? 'wait' : 'pointer', color: '#030507',
                    fontSize: 9, fontFamily: "'IBM Plex Mono',monospace",
                    fontWeight: 700, letterSpacing: '0.08em',
                  }}>
                    <div style={{ width: 11, height: 11 }}><Icon.Save /></div>
                    {saving ? 'ENREG…' : 'ENREGISTRER'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field
                label="Nom complet"
                value={form.full_name}
                onChange={v => setForm(f => ({ ...f, full_name: v }))}
                placeholder="Prénom Nom"
                disabled={!editing}
              />
              <Field
                label="Email"
                value={myProfile?.email || ''}
                onChange={() => {}}
                disabled
                placeholder="email@ensgmm.dz"
              />
              <div className="profile-grid">
                <Field
                  label="Filière"
                  value={form.filiere}
                  onChange={v => setForm(f => ({ ...f, filiere: v }))}
                  placeholder="Ex : GMM, GI, GC…"
                  disabled={!editing}
                />
                <Field
                  label="Promotion"
                  value={form.promo}
                  onChange={v => setForm(f => ({ ...f, promo: v }))}
                  placeholder="Ex : 2026"
                  type="number"
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          {/* Historique soumissions */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20,
            animation: 'fadeUp 0.35s 0.15s ease both',
          }}>
            <SectionTitle>Historique des soumissions</SectionTitle>

            {statsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ height: 54, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 - i * 0.1 }}/>
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>
                Aucune soumission pour l'instant.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {submissions.map(sub => <SubmissionRow key={sub.id} sub={sub} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal mot de passe */}
      {showPwdModal && <PasswordModal onClose={() => setShowPwd(false)} myProfile={myProfile} />}
    </div>
  )
}
