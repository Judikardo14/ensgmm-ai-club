import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDeadline, urgencyLevel } from '../../lib/helpers'

const E = 'cubic-bezier(0.4,0,0.2,1)'
const T = `0.18s ${E}`

const Icon = {
  Plus:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  File:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Clock:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Alert:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Eye:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Lock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
}

const EMPTY_FORM = { title:'', description:'', type:'homework', deadline:'', max_score:'' }

const inputStyle = {
  width:'100%', padding:'10px 12px',
  background:'var(--bg2)', border:'1px solid var(--border)',
  borderRadius:8, color:'var(--text)', fontSize:11,
  fontFamily:"'IBM Plex Mono',monospace", outline:'none',
  transition:`border-color ${T}`,
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:7 }}>{label}</div>
      {children}
    </div>
  )
}

// ─── Modal création / édition ─────────────────────────────────────────────────
function AssignmentModal({ assignment, onClose, onSaved }) {
  const [form, setForm] = useState(
    assignment
      ? { title:assignment.title, description:assignment.description||'', type:assignment.type, deadline:assignment.deadline?.slice(0,16), max_score:assignment.max_score||'' }
      : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return setError('Le titre est requis.')
    if (!form.deadline)     return setError('La deadline est requise.')
    setLoading(true); setError('')
    const payload = { title:form.title.trim(), description:form.description.trim()||null, type:form.type, deadline:form.deadline+':00', max_score:form.max_score ? parseInt(form.max_score) : null }
    const { error: e } = assignment
      ? await supabase.from('assignments').update(payload).eq('id', assignment.id)
      : await supabase.from('assignments').insert(payload)
    if (e) setError(e.message)
    else onSaved()
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(3,5,7,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:`fadeIn 0.2s ${E}` }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, width:'100%', maxWidth:500, padding:'28px 28px 24px', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', animation:`slideUp 0.25s ${E}`, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:5 }}>{assignment ? 'Modifier le devoir' : 'Nouveau devoir'}</div>
            <div style={{ fontSize:15, color:'var(--text)' }}>{assignment ? assignment.title : 'Créer un devoir'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', flexShrink:0, transition:`all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
            <div style={{ width:14, height:14 }}><Icon.X /></div>
          </button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Field label="Titre *">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex : TP Régression Linéaire" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Instructions, consignes, ressources…" style={{ ...inputStyle, resize:'vertical' }}
              onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inputStyle, cursor:'pointer' }}>
                <option value="homework">Devoir</option>
                <option value="project">Projet</option>
                <option value="competition">Compétition</option>
              </select>
            </Field>
            <Field label="Score max">
              <input type="number" value={form.max_score} onChange={e => set('max_score', e.target.value)} placeholder="Ex : 20" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
          </div>
          <Field label="Deadline *">
            <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ ...inputStyle, colorScheme:'dark' }}
              onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>
        </div>

        {error && <div style={{ fontSize:11, color:'#FF4B6E', background:'rgba(255,75,110,0.08)', border:'1px solid rgba(255,75,110,0.2)', borderRadius:7, padding:'8px 13px', marginTop:14 }}>{error}</div>}

        <div style={{ display:'flex', gap:8, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', background:'none', border:'1px solid var(--border2)', borderRadius:8, cursor:'pointer', color:'var(--text3)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.08em', transition:`all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={loading} style={{ flex:2, padding:'11px 0', background: loading ? 'var(--accent-dim)' : 'var(--accent)', border:'none', borderRadius:8, cursor: loading ? 'wait' : 'pointer', color:'#030507', fontWeight:700, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em', transition:`all ${T}` }}>
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
    <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(3,5,7,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid rgba(255,75,110,0.3)', borderRadius:14, width:'100%', maxWidth:360, padding:28, boxShadow:'0 24px 64px rgba(0,0,0,0.7)', animation:`slideUp 0.2s ${E}` }}>
        <div style={{ width:38, height:38, borderRadius:9, background:'rgba(255,75,110,0.1)', color:'#FF4B6E', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:19, height:19 }}><Icon.Alert /></div>
        </div>
        <div style={{ fontSize:14, color:'var(--text)', marginBottom:7 }}>Supprimer ce devoir ?</div>
        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:22 }}>
          « {title} » sera définitivement supprimé ainsi que toutes ses soumissions.
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px 0', background:'none', border:'1px solid var(--border2)', borderRadius:8, cursor:'pointer', color:'var(--text3)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", transition:`all ${T}` }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
            Annuler
          </button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }} style={{ flex:1, padding:'11px 0', background:'#FF4B6E', border:'none', borderRadius:8, cursor:'pointer', color:'#fff', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, transition:`all ${T}` }}>
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
    urgent:  { label:'URGENT',   color:'#FF4B6E', bg:'rgba(255,75,110,0.1)' },
    soon:    { label:'BIENTÔT',  color:'#FFB830', bg:'rgba(255,184,48,0.1)' },
    ok:      { label:'EN COURS', color:'#00c468', bg:'rgba(0,255,135,0.08)' },
    expired: { label:'EXPIRÉ',   color:'var(--text3)', bg:'rgba(61,82,104,0.2)' },
  }
  const s = map[level] || map.ok
  return <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:s.bg, color:s.color, letterSpacing:'0.08em' }}>{s.label}</span>
}

// ─── Modal soumissions ────────────────────────────────────────────────────────
function SubmissionsModal({ assignment, onClose }) {
  const [submissions, setSubmissions] = useState([])
  const [drafts, setDrafts]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [grading, setGrading]         = useState({})
  const [saving, setSaving]           = useState(null)
  const [toast, setToast]             = useState(null)
  const [tab, setTab]                 = useState('final') // 'final' | 'drafts'

  useEffect(() => {
    const fetchSubs = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*, profiles(full_name)')
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false })

      const finals  = (data || []).filter(s => !s.is_draft)
      const draftList = (data || []).filter(s => s.is_draft)
      setSubmissions(finals)
      setDrafts(draftList)

      const init = {}
      finals.forEach(s => { init[s.id] = { score: s.score ?? '', feedback: s.feedback || '' } })
      setGrading(init)
      setLoading(false)
    }
    fetchSubs()
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
    setToast('✓ Note enregistrée !')
    setTimeout(() => setToast(null), 2500)
  }

  const list = tab === 'final' ? submissions : drafts

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(3,5,7,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:`fadeIn 0.2s ${E}` }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, width:'100%', maxWidth:640, padding:28, boxShadow:'0 24px 64px rgba(0,0,0,0.7)', animation:`slideUp 0.25s ${E}`, maxHeight:'88vh', overflowY:'auto' }}>

        {toast && (
          <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:'rgba(0,255,135,0.12)', border:'1px solid rgba(0,255,135,0.3)', borderRadius:8, padding:'10px 16px', fontSize:12, color:'var(--accent)' }}>{toast}</div>
        )}

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:5 }}>Soumissions</div>
            <div style={{ fontSize:15, color:'var(--text)' }}>{assignment.title}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', transition:`all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
            <div style={{ width:14, height:14 }}><Icon.X /></div>
          </button>
        </div>

        {/* Tabs final / brouillons */}
        <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--bg2)', borderRadius:8, padding:4 }}>
          <button onClick={() => setTab('final')} style={{ flex:1, padding:'8px 0', background: tab === 'final' ? 'var(--surface)' : 'none', border: tab === 'final' ? '1px solid var(--border)' : '1px solid transparent', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: tab === 'final' ? 'var(--accent)' : 'var(--text3)', letterSpacing:'0.05em', transition:`all ${T}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <div style={{ width:12, height:12 }}><Icon.Lock /></div>
              Finales ({submissions.length})
            </div>
          </button>
          <button onClick={() => setTab('drafts')} style={{ flex:1, padding:'8px 0', background: tab === 'drafts' ? 'var(--surface)' : 'none', border: tab === 'drafts' ? '1px solid rgba(255,184,48,0.25)' : '1px solid transparent', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: tab === 'drafts' ? '#FFB830' : 'var(--text3)', letterSpacing:'0.05em', transition:`all ${T}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              📝 Brouillons ({drafts.length})
            </div>
          </button>
        </div>

        {/* Info brouillons */}
        {tab === 'drafts' && drafts.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px', background:'rgba(255,184,48,0.06)', border:'1px solid rgba(255,184,48,0.18)', borderRadius:9, marginBottom:16, fontSize:11, color:'#FFB830' }}>
            📝 Ces travaux sont encore en brouillon — l'étudiant peut les modifier. Ils ne sont pas à corriger.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:12 }}>Chargement…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)', fontSize:12 }}>
            {tab === 'final' ? 'Aucune soumission finale pour ce devoir.' : 'Aucun brouillon en cours.'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {list.map(sub => (
              <div key={sub.id} style={{ background:'var(--bg2)', border:`1px solid ${tab === 'drafts' ? 'rgba(255,184,48,0.15)' : 'var(--border)'}`, borderRadius:10, padding:'15px 17px', transition:`border-color ${T}` }}>

                {/* Étudiant + date */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>
                    {sub.profiles?.full_name || 'Inconnu'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {tab === 'drafts' && (
                      <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:'rgba(255,184,48,0.12)', color:'#FFB830', letterSpacing:'0.08em' }}>BROUILLON</span>
                    )}
                    {tab === 'final' && sub.status === 'graded' && (
                      <span style={{ fontSize:9, padding:'2px 8px', borderRadius:4, background:'rgba(0,255,135,0.1)', color:'var(--accent-dim)', letterSpacing:'0.08em' }}>NOTÉ</span>
                    )}
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.04em' }}>
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </div>
                  </div>
                </div>

                {/* Note étudiant */}
                {sub.notes && (
                  <div style={{ marginBottom:11, padding:'8px 12px', background:'rgba(74,158,255,0.06)', border:'1px solid rgba(74,158,255,0.15)', borderRadius:7, fontSize:11, color:'var(--blue)', lineHeight:1.6 }}>
                    <span style={{ color:'var(--text3)', marginRight:7 }}>Note étudiant :</span>{sub.notes}
                  </div>
                )}

                {/* Fichier */}
                {sub.file_url && (
                  <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:'var(--accent-dim)', marginBottom: tab === 'final' ? 14 : 0, textDecoration:'none', transition:`color ${T}` }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-dim)'}>
                    <div style={{ width:12, height:12 }}><Icon.File /></div>
                    Voir le fichier soumis
                  </a>
                )}

                {/* Notation — uniquement pour les finales */}
                {tab === 'final' && (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'90px 1fr', gap:9, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:6 }}>SCORE</div>
                        <input type="number" value={grading[sub.id]?.score ?? ''} onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], score: e.target.value } }))}
                          placeholder={assignment.max_score ? `/ ${assignment.max_score}` : 'pts'}
                          style={{ ...inputStyle, padding:'8px 10px' }}
                          onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:6 }}>FEEDBACK</div>
                        <input type="text" value={grading[sub.id]?.feedback ?? ''} onChange={e => setGrading(g => ({ ...g, [sub.id]: { ...g[sub.id], feedback: e.target.value } }))}
                          placeholder="Commentaire pour l'étudiant…"
                          style={{ ...inputStyle, padding:'8px 10px' }}
                          onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>
                    <button onClick={() => handleGrade(sub)} disabled={saving === sub.id} style={{ padding:'8px 16px', background: saving === sub.id ? 'var(--accent-dim)' : 'var(--accent)', border:'none', borderRadius:7, cursor:'pointer', color:'#030507', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, letterSpacing:'0.08em', transition:`all ${T}` }}>
                      {saving === sub.id ? 'ENREG…' : '✓ NOTER'}
                    </button>
                  </>
                )}
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
  const [assignments, setAssignments]   = useState([])
  const [subCounts, setSubCounts]       = useState({}) // { id: { final, draft } }
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [viewing, setViewing]           = useState(null)
  const [toast, setToast]               = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('assignments').select('*').order('deadline', { ascending: true })
    setAssignments(data || [])

    if (data?.length) {
      const counts = {}
      await Promise.all(data.map(async a => {
        const [{ count: final }, { count: draft }] = await Promise.all([
          supabase.from('submissions').select('*', { count:'exact', head:true }).eq('assignment_id', a.id).eq('is_draft', false),
          supabase.from('submissions').select('*', { count:'exact', head:true }).eq('assignment_id', a.id).eq('is_draft', true),
        ])
        counts[a.id] = { final: final || 0, draft: draft || 0 }
      }))
      setSubCounts(counts)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const ch = supabase.channel('manage-assignments-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'assignments' }, fetchAll)
      .on('postgres_changes', { event:'*', schema:'public', table:'submissions' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchAll])

  const handleDelete = async (a) => {
    await supabase.from('submissions').delete().eq('assignment_id', a.id)
    await supabase.from('assignments').delete().eq('id', a.id)
    setDeleting(null); fetchAll(); showToast('✓ Devoir supprimé.')
  }

  const filtered = assignments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ padding:'clamp(16px,4vw,28px)', maxWidth:900, margin:'0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background:'rgba(0,255,135,0.12)', border:'1px solid rgba(0,255,135,0.3)', borderRadius:9, padding:'11px 18px', fontSize:12, color:'var(--accent)', letterSpacing:'0.04em', animation:'slideIn 0.3s ease', boxShadow:'0 8px 28px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom:26, animation:`fadeUp 0.3s ${E} both` }}>
        <div style={{ fontSize:10, color:'#FF4B6E', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:7, display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF4B6E', boxShadow:'0 0 6px #FF4B6E' }}/>Admin
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:'clamp(16px,4vw,20px)', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Gérer les <span style={{ color:'var(--accent)' }}>Devoirs</span>
          </div>
          <button onClick={() => setModal('create')} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', background:'var(--accent)', border:'none', borderRadius:9, cursor:'pointer', color:'#030507', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, letterSpacing:'0.08em', boxShadow:'0 0 18px rgba(0,255,135,0.2)', flexShrink:0, transition:`all ${T}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(0,255,135,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 18px rgba(0,255,135,0.2)'}>
            <div style={{ width:14, height:14 }}><Icon.Plus /></div>
            NOUVEAU DEVOIR
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div style={{ position:'relative', marginBottom:18, animation:`fadeUp 0.35s 0.05s ${E} both` }}>
        <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'var(--text3)' }}><Icon.Search /></div>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un devoir…"
          style={{ width:'100%', padding:'11px 12px 11px 36px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, color:'var(--text)', fontSize:12, fontFamily:"'IBM Plex Mono',monospace", outline:'none', transition:`border-color ${T}` }}
          onFocus={e => e.target.style.borderColor = 'var(--border2)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:9, animation:`fadeUp 0.35s 0.1s ${E} both` }}>
        {loading
          ? Array.from({ length:5 }).map((_, i) => <div key={i} style={{ height:66, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, opacity:0.5-i*0.08 }}/>)
          : filtered.length === 0
          ? <div style={{ textAlign:'center', padding:'36px 0', fontSize:12, color:'var(--text3)', letterSpacing:'0.06em' }}>Aucun devoir trouvé.</div>
          : filtered.map(a => {
              const counts = subCounts[a.id] || { final:0, draft:0 }
              return (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 15px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, transition:`all ${T}`, flexWrap:'wrap' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}>

                  <div style={{ width:36, height:36, borderRadius:8, background:'rgba(74,158,255,0.1)', color:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <div style={{ width:16, height:16 }}><Icon.File /></div>
                  </div>

                  <div style={{ flex:1, minWidth:140 }}>
                    <div style={{ fontSize:13, color:'var(--text)', letterSpacing:'0.02em', marginBottom:5, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontWeight:500 }}>
                      {a.title}
                      <UrgencyBadge deadline={a.deadline} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:10, height:10 }}><Icon.Clock /></div>
                        {formatDeadline(a.deadline)}
                      </span>
                      {/* Compteur finales */}
                      <span style={{ fontSize:10, color:'var(--accent-dim)', display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:10, height:10 }}><Icon.Lock /></div>
                        {counts.final} finale{counts.final !== 1 ? 's' : ''}
                      </span>
                      {/* Compteur brouillons */}
                      {counts.draft > 0 && (
                        <span style={{ fontSize:10, color:'#FFB830' }}>
                          📝 {counts.draft} brouillon{counts.draft > 1 ? 's' : ''}
                        </span>
                      )}
                      {a.max_score && <span style={{ fontSize:10, color:'var(--text3)' }}>/ {a.max_score} pts</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                    <button onClick={() => setViewing(a)} style={{ padding:'7px 12px', background:'none', border:'1px solid var(--border2)', borderRadius:7, cursor:'pointer', color:'var(--text3)', display:'flex', alignItems:'center', gap:5, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.05em', transition:`all ${T}` }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--blue)'; e.currentTarget.style.borderColor = 'var(--blue)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
                      <div style={{ width:12, height:12 }}><Icon.Eye /></div>
                      {counts.final} soumission{counts.final !== 1 ? 's' : ''}
                    </button>
                    <button onClick={() => setModal(a)} style={{ padding:'7px 12px', background:'none', border:'1px solid var(--border2)', borderRadius:7, cursor:'pointer', color:'var(--text3)', display:'flex', alignItems:'center', gap:5, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.05em', transition:`all ${T}` }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
                      <div style={{ width:12, height:12 }}><Icon.Edit /></div>
                      Modifier
                    </button>
                    <button onClick={() => setDeleting(a)} style={{ padding:'7px 10px', background:'rgba(255,75,110,0.06)', border:'1px solid rgba(255,75,110,0.15)', borderRadius:7, cursor:'pointer', color:'#FF4B6E', display:'flex', alignItems:'center', transition:`all ${T}` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,75,110,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,75,110,0.06)'}>
                      <div style={{ width:14, height:14 }}><Icon.Trash /></div>
                    </button>
                  </div>
                </div>
              )
            })
        }
      </div>

      {modal && <AssignmentModal assignment={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchAll(); showToast(modal === 'create' ? '✓ Devoir créé !' : '✓ Devoir modifié !') }} />}
      {deleting && <ConfirmModal title={deleting.title} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />}
      {viewing && <SubmissionsModal assignment={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
