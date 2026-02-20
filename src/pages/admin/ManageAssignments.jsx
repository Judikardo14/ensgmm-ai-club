import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDeadline, urgencyLevel } from '../../lib/helpers'

const Icon = {
  Plus:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  File:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Clock:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Eye:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
}

const EMPTY_FORM = { title: '', description: '', type: 'homework', deadline: '', max_score: '' }

// ─── Champ générique ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 11,
  fontFamily: "'IBM Plex Mono',monospace", outline: 'none',
  transition: 'border-color 0.15s',
}

// ─── Modal création / édition ─────────────────────────────────────────────────
function AssignmentModal({ assignment, onClose, onSaved }) {
  const [form, setForm] = useState(
    assignment
      ? { title: assignment.title, description: assignment.description || '', type: assignment.type, deadline: assignment.deadline?.slice(0, 16), max_score: assignment.max_score || '' }
      : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim())    return setError('Le titre est requis.')
    if (!form.deadline)        return setError('La deadline est requise.')
    setLoading(true); setError('')

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      type:        form.type,
      deadline:    new Date(form.deadline).toISOString(),
      max_score:   form.max_score ? parseInt(form.max_score) : null,
    }

    const { error: e } = assignment
      ? await supabase.from('assignments').update(payload).eq('id', assignment.id)
      : await supabase.from('assignments').insert(payload)

    if (e) setError(e.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 500, padding: '26px 26px 22px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.25s ease both', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
              {assignment ? 'Modifier le devoir' : 'Nouveau devoir'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>
              {assignment ? assignment.title : 'Créer un devoir'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexShrink: 0 }}>
            <div style={{ width: 14, height: 14 }}><Icon.X /></div>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Titre *">
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Ex : TP Régression Linéaire"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Instructions, consignes, ressources…"
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="homework">Devoir</option>
                <option value="project">Projet</option>
                <option value="competition">Compétition</option>
              </select>
            </Field>
            <Field label="Score max">
              <input type="number" value={form.max_score} onChange={e => set('max_score', e.target.value)}
                placeholder="Ex : 20"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>
          </div>

          <Field label="Deadline *">
            <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </Field>
        </div>

        {error && (
          <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '7px 12px', marginTop: 14 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em' }}>Annuler</button>
          <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '10px 0', background: loading ? '#00c468' : '#00FF87', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>
            {loading ? 'ENREGISTREMENT…' : assignment ? 'MODIFIER →' : 'CRÉER →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm delete ───────────────────────────────────────────────────────────
function ConfirmModal({ title, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,75,110,0.3)', borderRadius: 14, width: '100%', maxWidth: 360, padding: '26px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.2s ease both' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,75,110,0.1)', color: '#FF4B6E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 18, height: 18 }}><Icon.AlertTriangle /></div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>Supprimer ce devoir ?</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>
          « {title} » sera définitivement supprimé ainsi que toutes ses soumissions.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>Annuler</button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }} style={{ flex: 1, padding: '10px 0', background: '#FF4B6E', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>
            {loading ? '…' : 'SUPPRIMER'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Badge urgence ────────────────────────────────────────────────────────────
function UrgencyBadge({ deadline }) {
  const level = urgencyLevel(deadline)
  const map = {
    urgent:  { label: 'URGENT',   color: '#FF4B6E', bg: 'rgba(255,75,110,0.1)' },
    soon:    { label: 'BIENTÔT',  color: '#FFB830', bg: 'rgba(255,184,48,0.1)' },
    ok:      { label: 'EN COURS', color: '#00c468', bg: 'rgba(0,255,135,0.08)' },
    expired: { label: 'EXPIRÉ',   color: '#3d5268', bg: 'rgba(61,82,104,0.2)' },
  }
  const s = map[level] || map.ok
  return <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 4, background: s.bg, color: s.color, letterSpacing: '0.08em' }}>{s.label}</span>
}

function SubmissionsModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState({}) // { id: { score, feedback } }
  const [saving, setSaving] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase
      .from('submissions')
      .select('*, profiles(full_name)')
      .eq('assignment_id', assignment.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setSubmissions(data || [])
        const init = {}
        data?.forEach(s => {
          init[s.id] = { score: s.score ?? '', feedback: s.feedback || '' }
        })
        setGrading(init)
        setLoading(false)
      })
  }, [assignment.id])

  const handleGrade = async (sub) => {
    setSaving(sub.id)
    const g = grading[sub.id]
    await supabase.from('submissions').update({
      score:    g.score !== '' ? parseInt(g.score) : null,
      feedback: g.feedback.trim() || null,
      status:   'graded',
    }).eq('id', sub.id)
    setSaving(null)
    setToast('✓ Noté !')
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 620, padding: '26px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.25s ease both', maxHeight: '85vh', overflowY: 'auto' }}>

        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 11, color: '#00FF87' }}>{toast}</div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Soumissions</div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{assignment.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
            <div style={{ width: 14, height: 14 }}><Icon.X /></div>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: 11 }}>Chargement…</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)', fontSize: 11 }}>Aucune soumission pour ce devoir.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                {/* Étudiant */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                    {sub.profiles?.full_name || 'Inconnu'}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>

                {/* Note de l'étudiant */}
                {sub.notes && (
                  <div style={{ marginBottom: 10, padding: '8px 12px', background: 'rgba(44,123,229,0.06)', border: '1px solid rgba(44,123,229,0.15)', borderRadius: 6, fontSize: 10, color: '#2C7BE5', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--text3)', marginRight: 6 }}>Note étudiant :</span>
                    {sub.notes}
                  </div>
                )}

                {/* Lien fichier */}
                {sub.file_url && (
                  <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#00c468', marginBottom: 12, textDecoration: 'none' }}>
                    <div style={{ width: 11, height: 11 }}><Icon.File /></div>
                    Voir le fichier soumis
                  </a>
                )}

                {/* Notation */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 5 }}>SCORE</div>
                    <input
                      type="number"
                      value={grading[sub.id]?.score ?? ''}
                      onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], score: e.target.value } }))}
                      placeholder={assignment.max_score ? `/ ${assignment.max_score}` : 'pts'}
                      style={{ ...inputStyle, padding: '8px 10px' }}
                      onFocus={e => e.target.style.borderColor = '#243347'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 5 }}>FEEDBACK</div>
                    <input
                      type="text"
                      value={grading[sub.id]?.feedback ?? ''}
                      onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value } }))}
                      placeholder="Commentaire pour l'étudiant…"
                      style={{ ...inputStyle, padding: '8px 10px' }}
                      onFocus={e => e.target.style.borderColor = '#243347'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                </div>

                <button onClick={() => handleGrade(sub)} disabled={saving === sub.id} style={{ padding: '7px 14px', background: saving === sub.id ? '#00c468' : '#00FF87', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#030507', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: '0.08em' }}>
                  {saving === sub.id ? 'ENREG…' : '✓ NOTER'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// ─── Page principale ──────────────────────────────────────────────────────────
export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([])
  const [submissionCounts, setSubCounts] = useState({})
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // null | 'create' | assignment object
  const [deleting, setDeleting] = useState(null)
  const [toast, setToast]       = useState(null)
  const [viewing, setViewing] = useState(null) // dans les états en haut

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('assignments').select('*').order('deadline', { ascending: true })
    setAssignments(data || [])

    // Compte soumissions par devoir
    if (data?.length) {
      const counts = {}
      await Promise.all(data.map(async a => {
        const { count } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('assignment_id', a.id)
        counts[a.id] = count || 0
      }))
      setSubCounts(counts)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (a) => {
    await supabase.from('submissions').delete().eq('assignment_id', a.id)
    await supabase.from('assignments').delete().eq('id', a.id)
    setDeleting(null)
    fetchAll()
    showToast('✓ Devoir supprimé.')
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = assignments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 'clamp(16px,4vw,28px)', maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .manage-row { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg2); border:1px solid var(--border); border-radius:8px; transition:border-color 0.2s; flex-wrap:wrap; }
        .manage-row:hover { border-color:#243347; }
        .manage-row-actions { display:flex; gap:6px; flex-shrink:0; }
        @media(max-width:500px){ .manage-header{ flex-direction:column; align-items:flex-start !important; } }
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
        <div className="manage-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Gérer les <span style={{ color: '#00FF87' }}>Devoirs</span>
          </div>
          <button onClick={() => setModal('create')} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', background: '#00FF87', border: 'none',
            borderRadius: 8, cursor: 'pointer', color: '#030507',
            fontSize: 10, fontFamily: "'IBM Plex Mono',monospace",
            fontWeight: 700, letterSpacing: '0.08em',
            boxShadow: '0 0 16px rgba(0,255,135,0.2)',
            flexShrink: 0,
          }}>
            <div style={{ width: 13, height: 13 }}><Icon.Plus /></div>
            NOUVEAU DEVOIR
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 16, animation: 'fadeUp 0.35s 0.05s ease both' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)' }}><Icon.Search /></div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un devoir…"
          style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#243347'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.35s 0.1s ease both' }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 62, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 - i * 0.08 }}/>
            ))
          : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>
              Aucun devoir trouvé.
            </div>
          : filtered.map(a => (
              <div key={a.id} className="manage-row">
                {/* Icône type */}
                <div style={{ width: 34, height: 34, borderRadius: 7, background: 'rgba(44,123,229,0.1)', color: '#2C7BE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 15, height: 15 }}><Icon.File /></div>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {a.title}
                    <UrgencyBadge deadline={a.deadline} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 9, height: 9 }}><Icon.Clock /></div>
                      {formatDeadline(a.deadline)}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 9, height: 9 }}><Icon.Users /></div>
                      {submissionCounts[a.id] ?? '—'} soumission{submissionCounts[a.id] !== 1 ? 's' : ''}
                    </span>
                    {a.max_score && (
                      <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em' }}>
                        / {a.max_score} pts
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="manage-row-actions">
                  
                  <button onClick={() => setViewing(a)} style={{ padding: '6px 11px', background: 'none', border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#2C7BE5'; e.currentTarget.style.borderColor = '#2C7BE5' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
                    <div style={{ width: 11, height: 11 }}><Icon.Eye /></div>
                    {submissionCounts[a.id] || 0} soumissions
                  </button>
                  <button onClick={() => setModal(a)} style={{ padding: '6px 11px', background: 'none', border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = '#00FF87' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
                    <div style={{ width: 11, height: 11 }}><Icon.Edit /></div>
                    Modifier
                  </button>
                  <button onClick={() => setDeleting(a)} style={{ padding: '6px 10px', background: 'rgba(255,75,110,0.06)', border: '1px solid rgba(255,75,110,0.15)', borderRadius: 6, cursor: 'pointer', color: '#FF4B6E', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,75,110,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,75,110,0.06)'}>
                    <div style={{ width: 13, height: 13 }}><Icon.Trash /></div>
                  </button>
                </div>
              </div>
            ))
        }
      </div>

      {/* Modals */}
      {modal && (
        <AssignmentModal
          assignment={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll(); showToast(modal === 'create' ? '✓ Devoir créé !' : '✓ Devoir modifié !') }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title={deleting.title}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
      {viewing && (
        <SubmissionsModal
          assignment={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
