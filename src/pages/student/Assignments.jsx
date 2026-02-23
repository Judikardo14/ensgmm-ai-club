import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDeadline, urgencyLevel, initials } from '../../lib/helpers'

const E = 'cubic-bezier(0.4,0,0.2,1)'
const T = `0.18s ${E}`

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icon = {
  File:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Clock:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  X:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Star:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Link:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Edit:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Lock:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Draft:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
}

// ─── Countdown ────────────────────────────────────────────────────────────────
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
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [deadline])
  return timeLeft
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function UrgencyBadge({ level }) {
  const map = {
    urgent:  { label:'URGENT',   bg:'rgba(255,75,110,0.12)',  color:'#FF4B6E' },
    soon:    { label:'BIENTÔT',  bg:'rgba(255,184,48,0.12)',  color:'#FFB830' },
    ok:      { label:'EN COURS', bg:'rgba(0,255,135,0.08)',   color:'#00c468' },
    expired: { label:'EXPIRÉ',   bg:'rgba(61,82,104,0.3)',    color:'#3d5268' },
    done:    { label:'SOUMIS',   bg:'rgba(0,196,104,0.12)',   color:'#00c468' },
    draft:   { label:'BROUILLON',bg:'rgba(255,184,48,0.12)',  color:'#FFB830' },
  }
  const { label, bg, color } = map[level] || map.ok
  return (
    <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.06em', padding:'3px 9px', borderRadius:5, background:bg, color, display:'inline-block' }}>
      {label}
    </span>
  )
}

function TypeIcon({ type }) {
  const styles = {
    homework:    { bg:'rgba(44,123,229,0.15)',  color:'#4a9eff' },
    project:     { bg:'rgba(0,255,135,0.08)',   color:'#00FF87' },
    competition: { bg:'rgba(255,184,48,0.12)',  color:'#FFB830' },
  }
  const s = styles[type] || styles.homework
  return (
    <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background:s.bg, color:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:17, height:17 }}>
        {type === 'competition' ? <Icon.Star /> : <Icon.File />}
      </div>
    </div>
  )
}

// ─── Card Assignment ──────────────────────────────────────────────────────────
function AssignmentCard({ assignment, submission, onOpen }) {
  const [hov, setHov] = useState(false)
  const isDraft   = submission?.is_draft === true
  const isFinal   = submission && !isDraft
  const isExpired = !submission && urgencyLevel(assignment.deadline) === 'expired'

  const level = isFinal ? 'done' : isDraft ? 'draft' : urgencyLevel(assignment.deadline)

  const borderColors = { urgent:'#FF4B6E', soon:'#FFB830', ok:'#00c468', expired:'var(--border)', done:'#00c468', draft:'#FFB830' }
  const canClick = !isFinal && !isExpired

  return (
    <div
      onMouseEnter={() => canClick && setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => canClick && onOpen(assignment)}
      style={{
        background:'var(--surface)',
        border:`1px solid ${hov ? borderColors[level] : 'var(--border)'}`,
        borderLeft:`3px solid ${borderColors[level]}`,
        borderRadius:10, padding:'16px 18px',
        display:'flex', alignItems:'center', gap:16,
        cursor: canClick ? 'pointer' : 'default',
        opacity: isFinal || isExpired ? 0.7 : 1,
        transition:`all ${T}`,
        transform: hov ? 'translateX(3px)' : 'translateX(0)',
        boxShadow: hov ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
      }}>
      <TypeIcon type={assignment.type} />

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:'var(--text)', letterSpacing:'0.02em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:5, fontWeight:500 }}>
          {assignment.title}
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:11, height:11 }}><Icon.Clock /></div>
            {formatDeadline(assignment.deadline)}
          </span>
          {assignment.max_score && (
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:11, height:11 }}><Icon.Star /></div>
              {assignment.max_score} pts max
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ marginBottom:5 }}>
          <UrgencyBadge level={level} />
        </div>
        {!isFinal && !isExpired && <CountdownDisplay deadline={assignment.deadline} level={level} />}
        {isDraft && (
          <div style={{ fontSize:10, color:'#FFB830', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:4 }}>
            <div style={{ width:10, height:10 }}><Icon.Edit /></div>
            Cliquer pour modifier
          </div>
        )}
        {isFinal && (
          <div style={{ fontSize:10, color:'#00c468', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:4 }}>
            <div style={{ width:10, height:10 }}><Icon.Lock /></div>
            {submission.score != null ? `${submission.score}/${assignment.max_score || '?'} pts` : 'Soumis définitivement'}
          </div>
        )}
      </div>
    </div>
  )
}

function CountdownDisplay({ deadline, level }) {
  const time = useCountdown(deadline)
  return (
    <div style={{ fontSize:11, letterSpacing:'0.06em', color: level === 'urgent' ? '#FF4B6E' : level === 'soon' ? '#FFB830' : 'var(--text3)', fontVariantNumeric:'tabular-nums' }}>
      {time}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function SubmitModal({ assignment, existingSubmission, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const isDraft = existingSubmission?.is_draft === true
  const isNew   = !existingSubmission

  const [file, setFile]             = useState(null)
  const [link, setLink]             = useState(existingSubmission?.file_url?.startsWith('http') && !existingSubmission?.file_url?.includes('supabase') ? existingSubmission.file_url : '')
  const [note, setNote]             = useState(existingSubmission?.notes || '')
  const [tab, setTab]               = useState(existingSubmission?.file_url && !existingSubmission?.file_url?.startsWith('http') ? 'file' : link ? 'link' : 'file')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [drag, setDrag]             = useState(false)
  const [confirmFinal, setConfirmFinal] = useState(false)

  const save = async (asDraft) => {
    setError('')
    if (tab === 'file' && !file && isNew) return setError('Veuillez sélectionner un fichier.')
    if (tab === 'link' && !link.trim()) return setError('Veuillez entrer un lien.')
    setLoading(true)

    try {
      let fileUrl = existingSubmission?.file_url || null

      if (tab === 'file' && file) {
        const ext = file.name.split('.').pop()
        const path = `submissions/${assignment.id}/${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('assignments').upload(path, file, { upsert: true })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      } else if (tab === 'link') {
        fileUrl = link.trim()
      }

      const { error: dbErr } = await supabase.from('submissions').upsert({
      assignment_id: assignment.id,
      user_id:       user.id,
      file_url:      fileUrl,
      notes:         note.trim() || null,
      is_draft:      asDraft,
      status:        asDraft ? 'draft' : 'submitted',
    }, { onConflict: 'assignment_id,user_id' })

      if (dbErr) throw dbErr
      onSuccess(asDraft)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
      setConfirmFinal(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(3,5,7,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:`fadeIn 0.2s ${E}` }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, width:'100%', maxWidth:490, padding:'30px 30px 26px', boxShadow:'0 32px 80px rgba(0,0,0,0.75)', position:'relative', overflow:'hidden', animation:`slideUp 0.25s ${E}` }}>

        {/* Accent line */}
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background: isDraft ? 'linear-gradient(90deg,transparent,rgba(255,184,48,0.5),transparent)' : 'linear-gradient(90deg,transparent,rgba(0,255,135,0.4),transparent)' }}/>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color: isDraft ? '#FFB830' : 'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              {isDraft ? <><div style={{ width:11, height:11 }}><Icon.Draft /></div> Modifier le brouillon</> : 'Soumettre un travail'}
            </div>
            <div style={{ fontSize:15, color:'var(--text)', letterSpacing:'0.02em', lineHeight:1.3 }}>
              {assignment.title}
            </div>
            {assignment.description && (
              <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(74,158,255,0.05)', border:'1px solid rgba(74,158,255,0.12)', borderRadius:8, fontSize:11, color:'var(--text2)', lineHeight:1.7, maxHeight:80, overflowY:'auto' }}>
                {assignment.description}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', flexShrink:0, marginLeft:14, transition:`all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
            <div style={{ width:14, height:14 }}><Icon.X /></div>
          </button>
        </div>

        {/* Bannière brouillon existant */}
        {isDraft && (
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px', background:'rgba(255,184,48,0.07)', border:'1px solid rgba(255,184,48,0.2)', borderRadius:9, marginBottom:18 }}>
            <div style={{ width:14, height:14, color:'#FFB830' }}><Icon.Draft /></div>
            <span style={{ fontSize:11, color:'#FFB830' }}>Brouillon enregistré — tu peux encore modifier avant de soumettre définitivement.</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:18, background:'var(--bg2)', borderRadius:8, padding:4 }}>
          {[['file','📁  Fichier'], ['link','🔗  Lien']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px 0', background: tab === t ? 'var(--surface)' : 'none', border: tab === t ? '1px solid var(--border)' : '1px solid transparent', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color: tab === t ? 'var(--text)' : 'var(--text3)', letterSpacing:'0.05em', transition:`all ${T}` }}>
              {label}
            </button>
          ))}
        </div>

        {/* Zone fichier */}
        {tab === 'file' && (
          <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) { if (f.size > 20*1024*1024) { setError('Max 20MB.'); return } setFile(f); setError('') } }}
            onClick={() => document.getElementById('file-input').click()}
            style={{ border:`2px dashed ${drag ? 'var(--accent)' : file ? 'var(--accent-dim)' : 'var(--border2)'}`, borderRadius:10, padding:'26px 18px', textAlign:'center', cursor:'pointer', background: drag ? 'rgba(0,255,135,0.03)' : 'var(--bg2)', transition:`all ${T}`, marginBottom:14 }}>
            <input id="file-input" type="file" style={{ display:'none' }} onChange={e => { const f = e.target.files[0]; if (!f) return; if (f.size > 20*1024*1024) { setError('Max 20MB.'); return } setFile(f); setError('') }} />
            <div style={{ width:30, height:30, margin:'0 auto 12px', color: file ? 'var(--accent-dim)' : 'var(--text3)' }}>
              {file ? <Icon.Check /> : <Icon.Upload />}
            </div>
            {file ? (
              <div>
                <div style={{ fontSize:12, color:'var(--accent-dim)', marginBottom:4 }}>{file.name}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{(file.size/1024/1024).toFixed(2)} MB · Cliquer pour changer</div>
              </div>
            ) : existingSubmission?.file_url && !existingSubmission.file_url.startsWith('http') ? (
              <div>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Fichier déjà chargé</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>Cliquer pour remplacer</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Glisser un fichier ici</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>ou cliquer pour parcourir · .ipynb, .py, .pdf, .zip · max 20MB</div>
              </div>
            )}
          </div>
        )}

        {/* Zone lien */}
        {tab === 'link' && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:7 }}>URL (Google Colab, GitHub, Drive…)</div>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'var(--text3)' }}><Icon.Link /></div>
              <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://colab.research.google.com/..." style={{ width:'100%', padding:'11px 12px 11px 36px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", outline:'none', transition:`border-color ${T}` }}
                onFocus={e => e.target.style.borderColor = 'var(--border2)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:7 }}>Note pour l'encadrant (optionnel)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Commentaire, précisions…" rows={2}
            style={{ width:'100%', padding:'11px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", resize:'none', outline:'none', transition:`border-color ${T}` }}
            onFocus={e => e.target.style.borderColor = 'var(--border2)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>

        {error && (
          <div style={{ fontSize:11, color:'#FF4B6E', background:'rgba(255,75,110,0.08)', border:'1px solid rgba(255,75,110,0.2)', borderRadius:7, padding:'9px 13px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            {error}
          </div>
        )}

        {/* ── Confirmation finale ── */}
        {confirmFinal ? (
          <div style={{ background:'rgba(255,75,110,0.06)', border:'1px solid rgba(255,75,110,0.2)', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:12, color:'#FF4B6E', marginBottom:6, fontWeight:600 }}>⚠ Action irréversible</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16, lineHeight:1.6 }}>
              Une fois soumis définitivement, tu ne pourras plus modifier ce travail. L'encadrant pourra commencer la correction.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmFinal(false)} style={{ flex:1, padding:'10px 0', background:'none', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', color:'var(--text3)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", transition:`all ${T}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
                Annuler
              </button>
              <button onClick={() => save(false)} disabled={loading} style={{ flex:2, padding:'10px 0', background:'#FF4B6E', border:'none', borderRadius:8, cursor: loading ? 'wait' : 'pointer', color:'#fff', fontWeight:700, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.08em', transition:`all ${T}` }}>
                {loading ? 'ENVOI…' : 'CONFIRMER LA SOUMISSION →'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', gap:8 }}>
            {/* Brouillon */}
            <button onClick={() => save(true)} disabled={loading} style={{ flex:1, padding:'11px 0', background:'rgba(255,184,48,0.08)', border:'1px solid rgba(255,184,48,0.25)', borderRadius:9, cursor: loading ? 'wait' : 'pointer', color:'#FFB830', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.08em', transition:`all ${T}`, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,184,48,0.13)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,184,48,0.08)'}>
              <div style={{ width:13, height:13 }}><Icon.Draft /></div>
              {isDraft ? 'METTRE À JOUR' : 'BROUILLON'}
            </button>
            {/* Soumettre définitivement */}
            <button onClick={() => setConfirmFinal(true)} disabled={loading} style={{ flex:2, padding:'11px 0', background:'var(--accent)', border:'none', borderRadius:9, cursor: loading ? 'wait' : 'pointer', color:'#030507', fontWeight:700, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em', boxShadow:'0 0 20px rgba(0,255,135,0.2)', transition:`all ${T}` }}>
              SOUMETTRE DÉFINITIVEMENT →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
const FILTERS = ['Tous', 'En cours', 'Brouillons', 'Urgent', 'Soumis', 'Expirés']

export default function Assignments() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [filter, setFilter]           = useState('Tous')
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)
  const [toast, setToast]             = useState(null)

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

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('assignments-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'submissions', filter:`user_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event:'*', schema:'public', table:'assignments' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchData])

  const filtered = assignments.filter(a => {
    const sub   = submissions[a.id]
    const isDraft = sub?.is_draft === true
    const isFinal = sub && !isDraft
    const level = urgencyLevel(a.deadline)
    if (filter === 'Tous')       return true
    if (filter === 'En cours')   return !sub && level !== 'expired'
    if (filter === 'Brouillons') return isDraft
    if (filter === 'Urgent')     return !sub && level === 'urgent'
    if (filter === 'Soumis')     return isFinal
    if (filter === 'Expirés')    return !sub && level === 'expired'
    return true
  })

  const stats = {
    total:    assignments.length,
    pending:  assignments.filter(a => !submissions[a.id] && urgencyLevel(a.deadline) !== 'expired').length,
    drafts:   Object.values(submissions).filter(s => s.is_draft).length,
    done:     Object.values(submissions).filter(s => !s.is_draft).length,
    urgent:   assignments.filter(a => !submissions[a.id] && urgencyLevel(a.deadline) === 'urgent').length,
  }

  const handleSuccess = (asDraft) => {
    setSelected(null)
    fetchData()
    setToast(asDraft ? '📝 Brouillon enregistré — tu peux encore modifier.' : '✓ Travail soumis définitivement !')
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div style={{ padding:'clamp(16px,3vw,28px)', maxWidth:860, margin:'0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:22, right:22, zIndex:2000, background: toast.startsWith('✓') ? 'rgba(0,255,135,0.12)' : 'rgba(255,184,48,0.12)', border:`1px solid ${toast.startsWith('✓') ? 'rgba(0,255,135,0.3)' : 'rgba(255,184,48,0.3)'}`, borderRadius:9, padding:'11px 18px', fontSize:12, color: toast.startsWith('✓') ? 'var(--accent)' : '#FFB830', letterSpacing:'0.04em', animation:'slideIn 0.3s ease', boxShadow:'0 8px 28px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:26, animation:`fadeUp 0.3s ${E} both` }}>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:7 }}>ENSGMM · AI CLUB</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:'clamp(17px,4vw,21px)', fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Devoirs <span style={{ color:'var(--accent)' }}>&amp; TPs</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {stats.drafts > 0 && (
              <div style={{ fontSize:11, color:'#FFB830', background:'rgba(255,184,48,0.1)', border:'1px solid rgba(255,184,48,0.2)', borderRadius:6, padding:'5px 12px', letterSpacing:'0.05em' }}>
                📝 {stats.drafts} brouillon{stats.drafts > 1 ? 's' : ''}
              </div>
            )}
            {stats.urgent > 0 && (
              <div style={{ fontSize:11, color:'#FF4B6E', background:'rgba(255,75,110,0.1)', border:'1px solid rgba(255,75,110,0.2)', borderRadius:6, padding:'5px 12px', letterSpacing:'0.05em' }}>
                ⚠ {stats.urgent} urgent{stats.urgent > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:24, animation:`fadeUp 0.35s 0.05s ${E} both` }}>
        {[
          { label:'Total',      value:stats.total,   color:'var(--text3)', bg:'rgba(107,132,158,0.08)' },
          { label:'En attente', value:stats.pending,  color:'#FFB830',      bg:'rgba(255,184,48,0.08)' },
          { label:'Brouillons', value:stats.drafts,   color:'#FFB830',      bg:'rgba(255,184,48,0.08)' },
          { label:'Soumis',     value:stats.done,     color:'var(--accent-dim)', bg:'rgba(0,255,135,0.08)' },
          { label:'Urgents',    value:stats.urgent,   color:'#FF4B6E',      bg:'rgba(255,75,110,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'13px 14px' }}>
            <div style={{ fontSize:9, background:bg, color, borderRadius:4, padding:'2px 7px', display:'inline-block', marginBottom:9, letterSpacing:'0.06em' }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:22, fontWeight:700, color:'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', animation:`fadeUp 0.35s 0.1s ${E} both` }}>
        <div style={{ width:15, height:15, color:'var(--text3)', marginTop:4 }}><Icon.Filter /></div>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 14px', borderRadius:6, background: filter === f ? 'rgba(0,255,135,0.07)' : 'none', border: filter === f ? '1px solid rgba(0,255,135,0.15)' : '1px solid var(--border)', color: filter === f ? 'var(--accent)' : 'var(--text3)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.06em', cursor:'pointer', transition:`all ${T}` }}
            onMouseEnter={e => { if (filter !== f) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' } }}
            onMouseLeave={e => { if (filter !== f) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' } }}>
            {f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, animation:`fadeUp 0.35s 0.15s ${E} both` }}>
        {loading
          ? Array.from({ length:3 }).map((_, i) => <div key={i} style={{ height:72, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, opacity:0.5 - i*0.1 }} />)
          : filtered.length === 0
          ? <div style={{ textAlign:'center', padding:'44px 0', color:'var(--text3)', fontSize:12, letterSpacing:'0.06em' }}>Aucun devoir dans cette catégorie.</div>
          : filtered.map(a => (
              <AssignmentCard key={a.id} assignment={a} submission={submissions[a.id]} onOpen={setSelected} />
            ))
        }
      </div>

      {/* Modal */}
      {selected && (
        <SubmitModal
          assignment={selected}
          existingSubmission={submissions[selected.id]}
          onClose={() => setSelected(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
