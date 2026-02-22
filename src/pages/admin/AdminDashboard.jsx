import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDeadline, initials } from '../../lib/helpers'

const Icon = {
  Users:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  File:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Star:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Trophy:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L19 7C19 9.76 17.76 12.24 16 14C14.7 15.3 13.4 16 12 16C10.6 16 9.3 15.3 8 14C6.24 12.24 5 9.76 5 7L7 4Z"/></svg>,
  Clock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Link:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  X:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text2)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 12, background: '#00FF87', borderRadius: 2 }}/>
      {children}
    </div>
  )
}

// Modal de notation
function GradeModal({ sub, onClose, onSaved }) {
  const [score, setScore] = useState(sub.score ?? '')
  const [feedback, setFeedback] = useState(sub.feedback ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const val = parseFloat(score)
    if (isNaN(val) || val < 0) return setError('Score invalide.')
    setLoading(true)
    const { error: e } = await supabase
      .from('submissions')
      .update({ score: val, feedback: feedback.trim() || null, status: 'graded' })
      .eq('id', sub.id)
    if (e) setError(e.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 420, padding: '26px 26px 22px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.25s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Notation</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{sub.profiles?.full_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{sub.assignments?.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ width: 14, height: 14 }}><Icon.X /></div>
          </button>
        </div>

        {sub.file_url && (
          <a href={sub.file_url} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
            color: '#2C7BE5', fontSize: 10, letterSpacing: '0.04em',
            textDecoration: 'none', marginBottom: 14, transition: 'border-color 0.15s',
          }}>
            <div style={{ width: 12, height: 12 }}><Icon.Link /></div>
            Voir la soumission
          </a>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Score {sub.assignments?.max_score ? `(/ ${sub.assignments.max_score})` : ''}
            </div>
            <input
              type="number" value={score} onChange={e => setScore(e.target.value)}
              placeholder={`0 — ${sub.assignments?.max_score || '100'}`}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Feedback (optionnel)</div>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
              placeholder="Commentaire pour l'étudiant…"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", resize: 'none', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '7px 12px', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em' }}>Annuler</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '10px 0', background: loading ? '#00c468' : '#00FF87', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>
            {loading ? 'ENREGISTREMENT…' : 'NOTER →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]       = useState({ users: 0, assignments: 0, submissions: 0, competitions: 0 })
  const [pending, setPending]   = useState([])
  const [grading, setGrading]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { count: users },
      { count: assignments },
      { count: submissions },
      { count: competitions },
      { data: pendingSubs },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('assignments').select('*', { count: 'exact', head: true }),
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
      supabase.from('competitions').select('*', { count: 'exact', head: true }),
      supabase.from('submissions')
        .select('*, profiles(full_name), assignments(title, max_score)')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(20),
    ])
    setStats({ users: users || 0, assignments: assignments || 0, submissions: submissions || 0, competitions: competitions || 0 })
    setPending(pendingSubs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
  fetchAll()

  const ch = supabase.channel('admin-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAll())
    .subscribe()

  return () => supabase.removeChannel(ch)
}, [fetchAll])
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  return (
    <div style={{ padding: 'clamp(16px,4vw,28px)', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn{ from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .admin-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        @media(max-width:640px){ .admin-stats{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:360px){ .admin-stats{ grid-template-columns:1fr; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 11, color: '#00FF87', letterSpacing: '0.04em', animation: 'slideIn 0.3s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ fontSize: 9, color: '#FF4B6E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4B6E' }}/>
          Espace Admin
        </div>
        <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Admin <span style={{ color: '#00FF87' }}>Dashboard</span>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats" style={{ marginBottom: 24, animation: 'fadeUp 0.35s 0.05s ease both' }}>
        {[
          { label: 'Étudiants',    value: stats.users,       color: '#2C7BE5', bg: 'rgba(44,123,229,0.1)',    icon: <Icon.Users /> },
          { label: 'Devoirs',      value: stats.assignments,  color: '#FFB830', bg: 'rgba(255,184,48,0.1)',   icon: <Icon.File /> },
          { label: 'Soumissions',  value: stats.submissions,  color: '#00c468', bg: 'rgba(0,255,135,0.08)',   icon: <Icon.Check /> },
          { label: 'Compétitions', value: stats.competitions, color: '#FF4B6E', bg: 'rgba(255,75,110,0.08)',  icon: <Icon.Trophy /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 'clamp(12px,2vw,16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 13, height: 13 }}>{icon}</div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
            </div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, color: 'var(--text)' }}>
              {loading ? '…' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Soumissions à noter */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, animation: 'fadeUp 0.35s 0.1s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionTitle>Soumissions en attente de notation</SectionTitle>
          {pending.length > 0 && (
            <span style={{ fontSize: 9, background: 'rgba(255,184,48,0.12)', color: '#FFB830', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 10, padding: '2px 8px', letterSpacing: '0.08em' }}>
              {pending.length} en attente
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 58, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 - i * 0.08 }} />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>
            ✓ Toutes les soumissions sont notées.
          </div>
       ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: pending.length > 2 ? 'auto' : 'visible', scrollbarWidth: 'thin', scrollbarColor: '#1a2535 transparent', paddingRight: pending.length > 2 ? 4 : 0 }}>
            {pending.map(sub => (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 8,
                flexWrap: 'wrap',
              }}>
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00c468,#2C7BE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#030507', fontFamily: "'Unbounded',sans-serif", flexShrink: 0 }}>
                  {initials(sub.profiles?.full_name || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: 2 }}>{sub.profiles?.full_name || '—'}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em' }}>{sub.assignments?.title || '—'}</div>
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ width: 9, height: 9 }}><Icon.Clock /></div>
                  {sub.submitted_at ? formatDeadline(sub.submitted_at) : '—'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ padding: '5px 10px', background: 'none', border: '1px solid var(--border2)', borderRadius: 6, color: '#2C7BE5', fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 10, height: 10 }}><Icon.Link /></div>
                      Voir
                    </a>
                  )}
                  <button onClick={() => setGrading(sub)} style={{ padding: '5px 12px', background: '#00FF87', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#030507', fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: '0.08em' }}>
                    NOTER
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pending.length > 2 && (
            <div style={{ textAlign: 'center', fontSize: 9, color: '#3d5268', letterSpacing: '0.08em', marginTop: 8, animation: 'pulse 2s infinite' }}>
              ↓ {pending.length - 2} de plus
            </div>
          )}
        </>
        )}
      </div>

      {grading && (
        <GradeModal
          sub={grading}
          onClose={() => setGrading(null)}
          onSaved={() => { setGrading(null); fetchAll(); showToast('✓ Note enregistrée !') }}
        />
      )}
    </div>
  )
}
