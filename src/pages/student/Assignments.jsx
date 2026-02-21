import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDeadline, urgencyLevel, initials } from '../../lib/helpers'

// ─── Icônes SVG inline ───────────────────────────────────────────────────────
const Icon = {
  File: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline) - new Date()
      if (diff <= 0) { setTimeLeft('Expiré'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setTimeLeft(`${d}j ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`)
      else setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [deadline])

  return timeLeft
}

// ─── Sous-composant : badge urgence ──────────────────────────────────────────
function UrgencyBadge({ level }) {
  const map = {
    urgent:  { label: 'URGENT',   bg: 'rgba(255,75,110,0.12)',   color: '#FF4B6E' },
    soon:    { label: 'BIENTÔT',  bg: 'rgba(255,184,48,0.12)',   color: '#FFB830' },
    ok:      { label: 'EN COURS', bg: 'rgba(0,255,135,0.08)',    color: '#00c468' },
    expired: { label: 'EXPIRÉ',   bg: 'rgba(61,82,104,0.3)',     color: '#3d5268' },
    done:    { label: 'RENDU',    bg: 'rgba(61,82,104,0.3)',     color: '#6b849e' },
  }
  const { label, bg, color } = map[level] || map.ok
  return (
    <span style={{
      fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em',
      padding: '3px 8px', borderRadius: '4px',
      background: bg, color,
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

// ─── Sous-composant : type d'assignment ──────────────────────────────────────
function TypeIcon({ type }) {
  const styles = {
    homework:    { bg: 'rgba(44,123,229,0.15)',  color: '#2C7BE5' },
    project:     { bg: 'rgba(0,255,135,0.08)',   color: '#00FF87' },
    competition: { bg: 'rgba(255,184,48,0.12)',  color: '#FFB830' },
  }
  const s = styles[type] || styles.homework
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: s.bg, color: s.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 16, height: 16 }}>
        {type === 'competition' ? <Icon.Star /> : <Icon.File />}
      </div>
    </div>
  )
}

// ─── Sous-composant : une card assignment ────────────────────────────────────
function AssignmentCard({ assignment, submission, onSubmit }) {
  const level = submission
    ? 'done'
    : urgencyLevel(assignment.deadline)

  const borderColors = {
    urgent: '#FF4B6E',
    soon:   '#FFB830',
    ok:     '#00c468',
    expired:'#3d5268',
    done:   '#3d5268',
  }

  return (
    <div
      onClick={() => !submission && level !== 'expired' && onSubmit(assignment)}
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeft: `2px solid ${borderColors[level]}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: submission || level === 'expired' ? 'default' : 'pointer',
        opacity: level === 'done' ? 0.65 : 1,
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (submission || level === 'expired') return
        e.currentTarget.style.borderColor = '#243347'
        e.currentTarget.style.transform = 'translateX(2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateX(0)'
      }}
    >
      <TypeIcon type={assignment.type} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>
          {assignment.title}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--text3)', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:10, height:10 }}><Icon.Clock /></div>
            {formatDeadline(assignment.deadline)}
          </span>
          {assignment.max_score && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:10, height:10 }}><Icon.Star /></div>
              {assignment.max_score} pts max
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ marginBottom: 4 }}>
          <UrgencyBadge level={level} />
        </div>
        <CountdownDisplay deadline={assignment.deadline} level={level} submitted={!!submission} />
        {submission && (
          <div style={{
            fontSize: 9, color: '#00c468', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
            marginTop: 3,
          }}>
            <div style={{ width: 9, height: 9 }}><Icon.Check /></div>
            soumis
            {submission.score != null && ` · ${submission.score}/${assignment.max_score || '?'} pts`}
          </div>
        )}
      </div>
    </div>
  )
}

function CountdownDisplay({ deadline, level, submitted }) {
  const time = useCountdown(deadline)
  if (submitted) return null
  return (
    <div style={{
      fontSize: 11, letterSpacing: '0.06em',
      color: level === 'urgent' ? '#FF4B6E' : level === 'soon' ? '#FFB830' : '#3d5268',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {time}
    </div>
  )
}

// ─── Modal de soumission ─────────────────────────────────────────────────────
function SubmitModal({ assignment, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const [file, setFile] = useState(null)
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [tab, setTab] = useState('file') // 'file' | 'link'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (tab === 'file' && !file) return setError('Veuillez sélectionner un fichier.')
    if (tab === 'link' && !link.trim()) return setError('Veuillez entrer un lien.')

    setLoading(true)
    try {
      let fileUrl = null

      if (tab === 'file') {
        const ext = file.name.split('.').pop()
        const path = `submissions/${assignment.id}/${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('assignments')
          .upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      const { error: insertErr } = await supabase.from('submissions').upsert({
        assignment_id: assignment.id,
        user_id: user.id,
        file_url: fileUrl || link.trim(),
        notes: note.trim() || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'assignment_id,user_id' })

      if (insertErr) throw insertErr
      onSuccess()
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(3,5,7,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 14,
        width: '100%', maxWidth: 480,
        padding: '28px 28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        animation: 'fadeUp 0.25s ease both',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              Soumettre un travail
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', letterSpacing: '0.02em', lineHeight: 1.3, marginBottom: assignment.description ? 8 : 0 }}>
              {assignment.title}
            </div>
            {assignment.description && (
              <div style={{
                fontSize: 10, color: 'var(--text3)', lineHeight: 1.6,
                letterSpacing: '0.02em',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {assignment.description}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', flexShrink: 0, marginLeft: 12,
          }}>
            <div style={{ width:14, height:14 }}><Icon.X /></div>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 18,
          background: 'var(--bg2)', borderRadius: 8, padding: 4,
        }}>
          {[['file','📁  Fichier'], ['link','🔗  Lien']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '7px 0',
              background: tab === t ? 'var(--surface)' : 'none',
              border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 10, fontFamily: 'var(--mono)',
              color: tab === t ? 'var(--text)' : 'var(--text3)',
              letterSpacing: '0.06em', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* File upload zone */}
        {tab === 'file' && (
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
            style={{
              border: `2px dashed ${drag ? '#00FF87' : file ? '#00c468' : 'var(--border2)'}`,
              borderRadius: 10, padding: '24px 16px',
              textAlign: 'center', cursor: 'pointer',
              background: drag ? 'rgba(0,255,135,0.03)' : 'var(--bg2)',
              transition: 'all 0.2s', marginBottom: 14,
            }}
          >
            <input
              id="file-input" type="file" style={{ display: 'none' }}
              onChange={e => setFile(e.target.files[0])}
            />
            <div style={{ width: 28, height: 28, margin: '0 auto 10px', color: file ? '#00c468' : 'var(--text3)' }}>
              {file ? <Icon.Check /> : <Icon.Upload />}
            </div>
            {file ? (
              <div>
                <div style={{ fontSize: 11, color: '#00c468', marginBottom: 3 }}>{file.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB — Cliquer pour changer
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>Glisser un fichier ici</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>ou cliquer pour parcourir · .ipynb, .py, .pdf, .zip</div>
              </div>
            )}
          </div>
        )}

        {/* Link input */}
        {tab === 'link' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6 }}>
              URL (Google Colab, GitHub, Drive…)
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14, color: 'var(--text3)',
              }}>
                <Icon.Link />
              </div>
              <input
                type="url" value={link} onChange={e => setLink(e.target.value)}
                placeholder="https://colab.research.google.com/..."
                style={{
                  width: '100%', padding: '10px 12px 10px 34px',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 11,
                  fontFamily: 'var(--mono)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#243347'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6 }}>
            Note (optionnel)
          </div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Commentaire pour l'encadrant…"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: 'var(--mono)', resize: 'none', outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#243347'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {error && (
          <div style={{
            fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)',
            border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6,
            padding: '8px 12px', marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0',
            background: 'none', border: '1px solid var(--border2)',
            borderRadius: 8, cursor: 'pointer', color: 'var(--text3)',
            fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.target.style.color = 'var(--text)'}
          onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '10px 0',
            background: loading ? '#00c468' : '#00FF87',
            border: 'none', borderRadius: 8,
            cursor: loading ? 'wait' : 'pointer',
            color: '#030507', fontWeight: 700,
            fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,135,0.25)',
          }}>
            {loading ? 'ENVOI EN COURS…' : 'SOUMETTRE →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const FILTERS = ['Tous', 'En cours', 'Urgent', 'Soumis', 'Expirés']

export default function Assignments() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({}) // { assignment_id: submission }
  const [filter, setFilter] = useState('Tous')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // assignment pour la modal
  const [toast, setToast] = useState(null)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: asgns }, { data: subs }] = await Promise.all([
      supabase.from('assignments').select('*').order('deadline', { ascending: true }),
      supabase.from('submissions').select('*').eq('user_id', user.id),
    ])
    setAssignments(asgns || [])
    const map = {}
    subs?.forEach(s => { map[s.assignment_id] = s })
    setSubmissions(map)
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Filtrage ──
  const filtered = assignments.filter(a => {
    const sub = submissions[a.id]
    const level = sub ? 'done' : urgencyLevel(a.deadline)
    if (filter === 'Tous')     return true
    if (filter === 'En cours') return level !== 'done' && level !== 'expired'
    if (filter === 'Urgent')   return level === 'urgent'
    if (filter === 'Soumis')   return level === 'done'
    if (filter === 'Expirés')  return level === 'expired'
    return true
  })

  // ── Stats ──
  const stats = {
    total:   assignments.length,
    pending: assignments.filter(a => !submissions[a.id] && urgencyLevel(a.deadline) !== 'expired').length,
    done:    Object.keys(submissions).length,
    urgent:  assignments.filter(a => !submissions[a.id] && urgencyLevel(a.deadline) === 'urgent').length,
  }

  const handleSuccess = () => {
    setSelected(null)
    fetchData()
    setToast('✓ Travail soumis avec succès !')
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div style={{ padding: 28, maxWidth: 860, margin: '0 auto' }}>

      {/* ── Style global pour l'animation ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes slideIn {
          from { opacity:0; transform:translateY(-12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)',
          borderRadius: 8, padding: '10px 16px',
          fontSize: 11, color: '#00FF87', letterSpacing: '0.04em',
          animation: 'slideIn 0.3s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          ENSGMM · AI CLUB
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Devoirs <span style={{ color: '#00FF87' }}>& TPs</span>
          </div>
          {stats.urgent > 0 && (
            <div style={{
              fontSize: 10, color: '#FF4B6E',
              background: 'rgba(255,75,110,0.1)', border: '1px solid rgba(255,75,110,0.2)',
              borderRadius: 6, padding: '5px 12px', letterSpacing: '0.06em',
            }}>
              ⚠ {stats.urgent} devoir{stats.urgent > 1 ? 's' : ''} urgent{stats.urgent > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24,
        animation: 'fadeUp 0.35s 0.05s ease both',
      }}>
        {[
          { label: 'Total', value: stats.total,   color: '#6b849e', bg: 'rgba(107,132,158,0.08)' },
          { label: 'En attente', value: stats.pending, color: '#FFB830', bg: 'rgba(255,184,48,0.08)' },
          { label: 'Soumis', value: stats.done,   color: '#00c468', bg: 'rgba(0,255,135,0.08)' },
          { label: 'Urgents', value: stats.urgent, color: '#FF4B6E', bg: 'rgba(255,75,110,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 10, background: bg, color, borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 10, letterSpacing: '0.06em' }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        animation: 'fadeUp 0.35s 0.1s ease both',
      }}>
        <div style={{ width: 14, height: 14, color: 'var(--text3)', marginTop: 1 }}><Icon.Filter /></div>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 6,
            background: filter === f ? 'rgba(0,255,135,0.07)' : 'none',
            border: filter === f ? '1px solid rgba(0,255,135,0.15)' : '1px solid var(--border)',
            color: filter === f ? '#00FF87' : 'var(--text3)',
            fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        animation: 'fadeUp 0.35s 0.15s ease both',
      }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              height: 70, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 10,
              opacity: 0.5 - i * 0.1,
            }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 0',
            color: 'var(--text3)', fontSize: 11, letterSpacing: '0.06em',
          }}>
            Aucun devoir dans cette catégorie.
          </div>
        ) : (
          filtered.map(a => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              submission={submissions[a.id]}
              onSubmit={setSelected}
            />
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {selected && (
        <SubmitModal
          assignment={selected}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
