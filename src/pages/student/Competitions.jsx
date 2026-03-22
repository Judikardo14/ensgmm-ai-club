import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDeadline, initials } from '../../lib/helpers'
import { validateCSV, validateCSVContent, autoScore } from '../../lib/scorer'

const Icon = {
  Star:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Clock:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Link:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Check:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Cpu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
}

function useCountdown(end) {
  const [t, setT] = useState('')
  useEffect(() => {
    const calc = () => {
      const diff = new Date(end) - new Date()
      if (diff <= 0) { setT('Terminée'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (d > 0) setT(`${d}j ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`)
      else setT(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [end])
  return t
}

function getStatus(comp) {
  const now = new Date()
  if (new Date(comp.start_date) > now) return 'upcoming'
  if (new Date(comp.end_date) < now)   return 'ended'
  return 'active'
}

function timeProgress(start, end) {
  const now = new Date()
  const total = new Date(end) - new Date(start)
  const elapsed = now - new Date(start)
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

const BANNERS = {
  ml:      { bg: 'linear-gradient(135deg, #0a2040 0%, #0f3060 50%, #0a1a30 100%)', label: 'Machine Learning' },
  nlp:     { bg: 'linear-gradient(135deg, #1a0a30 0%, #3a0a60 50%, #1a0a30 100%)', label: 'NLP' },
  cv:      { bg: 'linear-gradient(135deg, #001a0a 0%, #003320 50%, #001a0a 100%)', label: 'Computer Vision' },
  default: { bg: 'linear-gradient(135deg, #0a0a20 0%, #1a1a40 50%, #0a0a20 100%)', label: 'IA' },
}

function getBanner(comp) {
  const cat = (comp.category || '').toLowerCase()
  if (cat.includes('nlp') || cat.includes('langue') || cat.includes('text')) return BANNERS.nlp
  if (cat.includes('vision') || cat.includes('image') || cat.includes('cv'))  return BANNERS.cv
  if (cat.includes('ml') || cat.includes('machine') || cat.includes('data'))  return BANNERS.ml
  return BANNERS.default
}

function StatusBadge({ status }) {
  const map = {
    active:   { label: '● ACTIVE',   color:'#00FF87', bg:'rgba(0,255,135,0.08)', border:'rgba(0,255,135,0.2)' },
    upcoming: { label: '◎ À VENIR',  color:'#2C7BE5', bg:'rgba(44,123,229,0.08)', border:'rgba(44,123,229,0.2)' },
    ended:    { label: '○ TERMINÉE', color:'#3d5268', bg:'rgba(61,82,104,0.15)', border:'rgba(61,82,104,0.3)' },
  }
  const s = map[status]
  return (
    <span style={{ fontSize:9, letterSpacing:'0.12em', padding:'3px 8px', borderRadius:10, color:s.color, background:s.bg, border:`1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

function CompModal({ comp, entry, onClose, onAction }) {
  const { user } = useAuthStore()
  const status    = getStatus(comp)
  const banner    = getBanner(comp)
  const countdown = useCountdown(comp.end_date)
  const progress  = timeProgress(comp.start_date, comp.end_date)

  const [tab, setTab]                 = useState('file')
  const [file, setFile]               = useState(null)
  const [link, setLink]               = useState('')
  const [note, setNote]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [scoring, setScoring]         = useState(false)
  const [error, setError]             = useState('')
  const [scoreResult, setScoreResult] = useState(null)
  const [drag, setDrag]               = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [view, setView]               = useState('info')

  const fetchLeaderboard = useCallback(async () => {
  const { data } = await supabase
    .from('competition_entries')
    .select('user_id, score, profiles(full_name, avatar_url)')
    .eq('competition_id', comp.id)
    .not('score', 'is', null)
    .order('score', { ascending: false })
    .limit(10)
  if (data && data.length > 0) setLeaderboard(data)
}, [comp.id])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const handleJoin = async () => {
    setLoading(true); setError('')
    const { error: joinErr } = await supabase.from('competition_entries').insert({
      competition_id: comp.id, user_id: user.id,
    })
    if (joinErr) setError(joinErr.message)
    else onAction()
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (tab === 'file' && !file) return setError('Sélectionner un fichier.')
    if (tab === 'link' && !link.trim()) return setError('Entrer un lien.')
    setLoading(true); setError(''); setScoreResult(null)

    try {
      // ── Vérifier limite soumissions depuis la DB ──
      if (comp.max_submissions) {
        const { data: currentEntry } = await supabase
          .from('competition_entries')
          .select('submission_count')
          .eq('competition_id', comp.id)
          .eq('user_id', user.id)
          .single()

        const currentCount = currentEntry?.submission_count || 0
        if (currentCount >= comp.max_submissions) {
          setError(`Limite atteinte : ${comp.max_submissions} soumission${comp.max_submissions > 1 ? 's' : ''} maximum.`)
          setLoading(false)
          return
        }
      }

      // ── Validation CSV si auto-scoring ──
      if (tab === 'file' && file && comp.auto_score) {
        const basic = validateCSV(file)
        if (!basic.valid) { setError(basic.error); setLoading(false); return }

        if (comp.metric_column) {
          const content = await validateCSVContent(file, comp.metric_column, comp.expected_rows || null)
          if (!content.valid) { setError(content.error); setLoading(false); return }
        }
      }

      // ── Upload fichier ──
      let fileUrl = link.trim()
      if (tab === 'file') {
        const ext  = file.name.split('.').pop()
        const path = `competitions/${comp.id}/${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('competitions').upload(path, file, {
          upsert: true,
          contentType: file.type || 'application/octet-stream',
        })
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('competitions').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      // ── Upsert entry ──
      const { error: submitErr } = await supabase
        .from('competition_entries')
        .upsert({
          competition_id: comp.id,
          user_id:        user.id,
          file_url:       fileUrl,
          notes:          note || null,
          submitted_at:   new Date().toISOString(),
        }, { onConflict: 'competition_id,user_id' })
      if (submitErr) throw submitErr

      // ── Scoring automatique ──
      if (comp.auto_score && fileUrl) {
        setLoading(false)
        setScoring(true)

        const { data: freshEntry } = await supabase
          .from('competition_entries')
          .select('id')
          .eq('competition_id', comp.id)
          .eq('user_id', user.id)
          .single()

        if (freshEntry) {
          const result = await autoScore({
            competition: comp,
            entryId:     freshEntry.id,
            userId:      user.id,
            fileUrl,
          })
          setScoring(false)
          if (result.success) {
            setScoreResult(result)
          } else {
            setError(`Soumission ok, mais scoring échoué : ${result.error}`)
          }
        }
        setScoring(false)
        fetchLeaderboard()
        onAction()
        return
      }

      onAction()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setScoring(false)
    }
  }

  const isParticipant   = !!entry
  const hasSubmitted    = entry?.submitted_at
  const submissionCount = entry?.submission_count || 0

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(3,5,7,0.9)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.8)', animation:'fadeUp 0.25s ease both', overflow:'hidden' }}>

        <div style={{ height:80, position:'relative', background:banner.bg, overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)', backgroundSize:'20px 20px' }}/>
          {status === 'active' && <div style={{ position:'absolute', top:12, right:12, zIndex:2, width:8, height:8, borderRadius:'50%', background:'#00FF87', boxShadow:'0 0 10px #00FF87', animation:'pulse 1.5s infinite' }}/>}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Unbounded',sans-serif", fontSize:10, letterSpacing:'0.2em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>
            {banner.label}
          </div>
          <button onClick={onClose} style={{ position:'absolute', top:10, left:12, zIndex:3, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)' }}>
            <div style={{width:12,height:12}}><Icon.X /></div>
          </button>
        </div>

        <div style={{ padding:'20px 24px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, color:'var(--text)', letterSpacing:'0.02em', marginBottom:6 }}>{comp.title}</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <StatusBadge status={status} />
              {comp.auto_score && (
                <span style={{ fontSize:9, color:'#2C7BE5', background:'rgba(44,123,229,0.1)', border:'1px solid rgba(44,123,229,0.2)', borderRadius:10, padding:'2px 8px', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{width:9,height:9}}><Icon.Cpu /></div>AUTO-SCORE
                </span>
              )}
              <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}>
                <div style={{width:10,height:10}}><Icon.Users /></div>
                {comp.participant_count || 0} participants
              </span>
              {status !== 'upcoming' && (
                <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{width:10,height:10}}><Icon.Clock /></div>
                  {status === 'active' ? countdown : 'Terminée'}
                </span>
              )}
            </div>
          </div>

          {comp.description && (
            <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.7, letterSpacing:'0.02em', marginBottom:16, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              {comp.description}
            </div>
          )}

          {status === 'active' && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text3)', letterSpacing:'0.06em', marginBottom:5 }}>
                <span>Temps écoulé</span><span>{progress}%</span>
              </div>
              <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#00c468,#00FF87)', transition:'width 1s ease' }}/>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:4, marginBottom:18, background:'var(--bg2)', borderRadius:8, padding:4 }}>
            {[['info','Infos'], ['leaderboard','Classement'], ...(isParticipant && status === 'active' ? [['submit','Soumettre']] : [])].map(([k,label]) => (
              <button key={k} onClick={evt => { evt.stopPropagation(); setView(k) }} style={{ flex:1, padding:'6px 0', background:view===k?'var(--surface)':'none', border:view===k?'1px solid var(--border)':'1px solid transparent', borderRadius:6, cursor:'pointer', fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:view===k?'var(--text)':'var(--text3)', letterSpacing:'0.06em', transition:'all 0.15s' }}>{label}</button>
            ))}
          </div>

          {/* ─ Infos ─ */}
          {view === 'info' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  ['Début',   formatDeadline(comp.start_date)],
                  ['Fin',     formatDeadline(comp.end_date)],
                  ...(comp.prize        ? [['Prix',            comp.prize]]                                              : []),
                  ...(comp.metric       ? [['Métrique',        comp.metric]]                                             : []),
                  ...(comp.metric_column? [['Colonne cible',   comp.metric_column]]                                      : []),
                  ...(comp.expected_rows? [['Lignes attendues',`${comp.expected_rows} lignes`]]                          : []),
                  ...(submissionCount > 0 ? [['Soumissions', comp.max_submissions ? `${submissionCount}/${comp.max_submissions}` : `${submissionCount}`]] : []),
                  ...(entry?.rank != null ? [['Rang',         `#${entry.rank}`]]                                         : []),
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:10, color:'var(--text)', letterSpacing:'0.02em' }}>{v}</div>
                  </div>
                ))}
              </div>

              {status === 'active' && !isParticipant && (
                <button onClick={handleJoin} disabled={loading} style={{ width:'100%', padding:'11px 0', background:loading?'#00c468':'#00FF87', border:'none', borderRadius:8, cursor:loading?'wait':'pointer', color:'#030507', fontWeight:700, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em', boxShadow:'0 0 20px rgba(0,255,135,0.25)', transition:'all 0.2s' }}>
                  {loading ? 'INSCRIPTION…' : 'REJOINDRE LA COMPÉTITION →'}
                </button>
              )}
              {isParticipant && status === 'active' && (
                <button onClick={() => setView('submit')} style={{ width:'100%', padding:'11px 0', background:'none', border:'1px solid rgba(0,255,135,0.3)', borderRadius:8, cursor:'pointer', color:'#00FF87', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em', transition:'all 0.2s' }}>
                  {comp.max_submissions ? `SOUMETTRE → (${submissionCount}/${comp.max_submissions})` : 'SOUMETTRE MON TRAVAIL →'}
                </button>
              )}
              {hasSubmitted && (
                <div style={{ textAlign:'center', padding:'10px 0', fontSize:10, color:'#00c468', letterSpacing:'0.06em', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <div style={{width:12,height:12}}><Icon.Check /></div>
                  Soumission enregistrée
                  {entry?.score != null && ` · Score : ${(entry.score * 100).toFixed(2)}%`}
                  {entry?.rank  != null && ` · Rang : #${entry.rank}`}
                </div>
              )}
              {error && <div style={{ fontSize:10, color:'#FF4B6E', marginTop:10, textAlign:'center' }}>{error}</div>}
            </div>
          )}

          {/* ─ Leaderboard ─ */}
          {view === 'leaderboard' && (
          <div style={{ position:'relative' }}>
            {leaderboard.length > 5 && (
              <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.06em' }}>
                  5 sur {leaderboard.length} affichés
                </span>
                <span style={{
                  fontSize:9, padding:'3px 10px', borderRadius:10,
                  background:'rgba(0,255,135,0.08)', border:'1px solid rgba(0,255,135,0.25)',
                  color:'#00FF87', letterSpacing:'0.1em',
                  fontFamily:"'IBM Plex Mono',monospace",
                  animation:'pulse 1.8s ease-in-out infinite',
                }}>
                  +{leaderboard.length - 5} de plus ↓
                </span>
              </div>
            )}
            <div style={{
              display:'flex', flexDirection:'column', gap:6,
              maxHeight: leaderboard.length > 5 ? 300 : 'none',
              overflowY: leaderboard.length > 5 ? 'auto' : 'visible',
              scrollbarWidth:'thin', scrollbarColor:'#1a2535 transparent',
            }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', fontSize:11, color:'var(--text3)', letterSpacing:'0.06em' }}>Aucun score publié pour l'instant.</div>
              ) : leaderboard.map((lb, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:i===0?'rgba(0,255,135,0.04)':lb.user_id===user?.id?'rgba(44,123,229,0.05)':'var(--bg2)', border:i===0?'1px solid rgba(0,255,135,0.15)':lb.user_id===user?.id?'1px solid rgba(44,123,229,0.15)':'1px solid var(--border)' }}>
                  <span style={{ fontFamily:"'Unbounded',sans-serif", fontSize:11, fontWeight:700, width:20, textAlign:'center', color:i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text3)' }}>{lb.rank || i+1}</span>
                  <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#00c468,#2C7BE5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#030507', fontFamily:"'Unbounded',sans-serif" }}>
                    {initials(lb.profiles?.full_name || '?')}
                  </div>
                  <span style={{ flex:1, fontSize:11, color:lb.user_id===user?.id?'#2C7BE5':'var(--text)', letterSpacing:'0.02em' }}>
                    {lb.profiles?.full_name || 'Inconnu'}
                    {lb.user_id === user?.id && <span style={{ marginLeft:6, fontSize:8, color:'#2C7BE5', background:'rgba(44,123,229,0.15)', padding:'1px 5px', borderRadius:3 }}>VOUS</span>}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:i===0?'#00FF87':lb.user_id===user?.id?'#2C7BE5':'var(--text2)' }}>
                    {lb.score != null ? `${(lb.score * 100).toFixed(2)}%` : '—'}
                  </span>
                </div>
              ))}
             </div>
        </div>
          )}

          {/* ─ Soumettre ─ */}
          {view === 'submit' && (
            <div>
              {comp.auto_score && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'9px 13px', background:'rgba(44,123,229,0.06)', border:'1px solid rgba(44,123,229,0.2)', borderRadius:9, marginBottom:14 }}>
                  <div style={{width:13,height:13,color:'#2C7BE5',flexShrink:0,marginTop:1}}><Icon.Cpu /></div>
                  <div style={{ fontSize:10, color:'#4a9eff', lineHeight:1.6 }}>
                    Scoring automatique activé — soumets un fichier <strong>.csv</strong> avec la colonne <code style={{background:'rgba(44,123,229,0.15)',padding:'1px 4px',borderRadius:3}}>{comp.metric_column || 'label'}</code>
                    {comp.expected_rows && ` · ${comp.expected_rows} lignes attendues`}.
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:4, marginBottom:14, background:'var(--bg)', borderRadius:8, padding:4 }}>
                {[['file','📁  Fichier'],['link','🔗  Lien']].map(([t,label]) => (
                  <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'6px 0', background:tab===t?'var(--surface)':'none', border:tab===t?'1px solid var(--border)':'1px solid transparent', borderRadius:6, cursor:'pointer', fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:tab===t?'var(--text)':'var(--text3)', letterSpacing:'0.06em', transition:'all 0.15s' }}>{label}</button>
                ))}
              </div>

              {tab === 'file' && (
                <div
                  onDragOver={evt => { evt.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={evt => { evt.preventDefault(); setDrag(false); const f=evt.dataTransfer.files[0]; if(f) setFile(f) }}
                  onClick={() => document.getElementById('comp-file-input').click()}
                  style={{ border:`2px dashed ${drag?'#00FF87':file?'#00c468':'var(--border2)'}`, borderRadius:10, padding:'20px 16px', textAlign:'center', cursor:'pointer', background:drag?'rgba(0,255,135,0.03)':'var(--bg2)', transition:'all 0.2s', marginBottom:12 }}
                >
                  <input id="comp-file-input" type="file" accept={comp.auto_score ? '.csv' : undefined} style={{display:'none'}} onChange={evt => setFile(evt.target.files[0])} />
                  <div style={{width:24,height:24,margin:'0 auto 8px',color:file?'#00c468':'var(--text3)'}}>
                    {file ? <Icon.Check /> : <Icon.Upload />}
                  </div>
                  {file
                    ? <><div style={{fontSize:11,color:'#00c468',marginBottom:3}}>{file.name}</div><div style={{fontSize:9,color:'var(--text3)'}}>{(file.size/1024/1024).toFixed(2)} MB · Cliquer pour changer</div></>
                    : <><div style={{fontSize:11,color:'var(--text2)',marginBottom:3}}>Glisser un fichier ici</div><div style={{fontSize:9,color:'var(--text3)'}}>{comp.auto_score ? 'Fichier .csv uniquement' : '.py, .ipynb, .zip, .csv'}</div></>
                  }
                </div>
              )}

              {tab === 'link' && (
                <div style={{ marginBottom:12 }}>
                  <div style={{fontSize:9,color:'var(--text3)',letterSpacing:'0.1em',marginBottom:6}}>URL</div>
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:'var(--text3)'}}><Icon.Link /></div>
                    <input type="url" value={link} onChange={evt=>setLink(evt.target.value)} placeholder="https://github.com/..."
                      style={{width:'100%',padding:'9px 12px 9px 30px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",outline:'none'}}
                      onFocus={evt=>evt.target.style.borderColor='#243347'} onBlur={evt=>evt.target.style.borderColor='var(--border)'} />
                  </div>
                </div>
              )}

              <textarea value={note} onChange={evt=>setNote(evt.target.value)} placeholder="Note pour les juges (optionnel)…" rows={2}
                style={{width:'100%',padding:'9px 12px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",resize:'none',outline:'none',marginBottom:12}}
                onFocus={evt=>evt.target.style.borderColor='#243347'} onBlur={evt=>evt.target.style.borderColor='var(--border)'} />

              {scoreResult && (
                <div style={{ background:'rgba(0,255,135,0.06)', border:'1px solid rgba(0,255,135,0.2)', borderRadius:9, padding:'12px 14px', marginBottom:12 }}>
                  <div style={{ fontSize:10, color:'#00FF87', fontWeight:600, marginBottom:4, letterSpacing:'0.06em' }}>✓ Score calculé automatiquement</div>
                  <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:22, fontWeight:700, color:'#00FF87' }}>
                    {(scoreResult.score * 100).toFixed(2)}%
                  </div>
                  <div style={{ fontSize:9, color:'var(--text3)', marginTop:4 }}>
                    Métrique : {scoreResult.detail?.metric?.toUpperCase()} · {scoreResult.detail?.n_samples} échantillons
                    {scoreResult.rank && ` · Rang : #${scoreResult.rank}`}
                  </div>
                </div>
              )}

              {scoring && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(44,123,229,0.06)', border:'1px solid rgba(44,123,229,0.2)', borderRadius:9, marginBottom:12 }}>
                  <div style={{ width:12, height:12, color:'#2C7BE5', animation:'spin 1s linear infinite' }}><Icon.Cpu /></div>
                  <span style={{ fontSize:10, color:'#4a9eff', letterSpacing:'0.06em' }}>Calcul du score en cours…</span>
                </div>
              )}

              {error && <div style={{fontSize:10,color:'#FF4B6E',background:'rgba(255,75,110,0.08)',border:'1px solid rgba(255,75,110,0.2)',borderRadius:6,padding:'7px 12px',marginBottom:10}}>{error}</div>}

              <div style={{display:'flex',gap:8}}>
                <button onClick={() => setView('info')} style={{flex:1,padding:'10px 0',background:'none',border:'1px solid var(--border2)',borderRadius:8,cursor:'pointer',color:'var(--text3)',fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:'0.08em'}}>
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading || scoring} style={{flex:2,padding:'10px 0',background:loading||scoring?'#00c468':'#00FF87',border:'none',borderRadius:8,cursor:loading||scoring?'wait':'pointer',color:'#030507',fontWeight:700,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:'0.1em',boxShadow:'0 0 16px rgba(0,255,135,0.2)'}}>
                  {loading ? 'ENVOI…' : scoring ? 'SCORING…' : 'SOUMETTRE →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompCard({ comp, entry, onClick }) {
  const status   = getStatus(comp)
  const banner   = getBanner(comp)
  const progress = status === 'active' ? timeProgress(comp.start_date, comp.end_date) : 0
  const countdown = useCountdown(comp.end_date)

  return (
    <div onClick={onClick}
      style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'all 0.2s' }}
      onMouseEnter={evt => { evt.currentTarget.style.borderColor='#243347'; evt.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={evt => { evt.currentTarget.style.borderColor='var(--border)'; evt.currentTarget.style.transform='translateY(0)' }}
    >
      <div style={{ height:70, position:'relative', background:banner.bg, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)', backgroundSize:'20px 20px' }}/>
        {status === 'active' && <div style={{ position:'absolute', top:10, right:10, zIndex:2, width:7, height:7, borderRadius:'50%', background:'#00FF87', boxShadow:'0 0 8px #00FF87', animation:'pulse 1.5s infinite' }}/>}
        {entry?.submitted_at && <div style={{ position:'absolute', top:8, right:8, zIndex:2, background:'rgba(0,255,135,0.15)', border:'1px solid rgba(0,255,135,0.3)', borderRadius:4, padding:'2px 7px', fontSize:8, color:'#00FF87', letterSpacing:'0.1em' }}>✓ SOUMIS</div>}
        {comp.auto_score && <div style={{ position:'absolute', bottom:8, left:10, zIndex:2, fontSize:8, color:'#4a9eff', background:'rgba(44,123,229,0.15)', border:'1px solid rgba(44,123,229,0.2)', borderRadius:4, padding:'1px 6px', letterSpacing:'0.08em' }}>AUTO-SCORE</div>}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Unbounded',sans-serif", fontSize:9, letterSpacing:'0.2em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase' }}>
          {banner.label}
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:12, color:'var(--text)', letterSpacing:'0.02em', marginBottom:8 }}>{comp.title}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <StatusBadge status={status} />
          <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{width:10,height:10}}><Icon.Users /></div>{comp.participant_count || 0}
          </span>
        </div>

        {status === 'active' && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text3)', letterSpacing:'0.06em', marginBottom:4 }}>
              <span>Temps écoulé</span>
              <span style={{ color:progress>80?'#FF4B6E':progress>60?'#FFB830':'var(--text3)' }}>{progress}%</span>
            </div>
            <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:progress>80?'linear-gradient(90deg,#FF4B6E,#ff6b87)':progress>60?'linear-gradient(90deg,#FFB830,#ffd080)':'linear-gradient(90deg,#00c468,#00FF87)', transition:'width 1s ease' }}/>
            </div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, letterSpacing:'0.06em', color:status==='active'?(progress>80?'#FF4B6E':'var(--text3)'):'var(--text3)', fontVariantNumeric:'tabular-nums' }}>
            {status==='active' ? countdown : status==='upcoming' ? `Début : ${formatDeadline(comp.start_date)}` : 'Terminée'}
          </span>
          <span style={{ fontSize:10, color:'#00c468', display:'flex', alignItems:'center', gap:4 }}>
            {entry ? (entry.submitted_at ? 'Voir résultats' : 'Soumettre') : 'Détails'}
            <div style={{width:12,height:12}}><Icon.ChevronRight /></div>
          </span>
        </div>
      </div>
    </div>
  )
}

const FILTERS = ['Toutes', 'Actives', 'À venir', 'Terminées', 'Mes inscriptions']

export default function Competitions() {
  const { user } = useAuthStore()
  const [competitions, setCompetitions] = useState([])
  const [entries, setEntries]           = useState({})
  const [filter, setFilter]             = useState('Toutes')
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState(null)
  const [toast, setToast]               = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: comps }, { data: ents }] = await Promise.all([
      supabase.from('competitions').select('*').order('end_date', { ascending: true }),
      supabase.from('competition_entries').select('*').eq('user_id', user.id),
    ])
    const counts = {}
    if (comps) {
      await Promise.all(comps.map(async c => {
        const { count } = await supabase.from('competition_entries').select('*', { count:'exact', head:true }).eq('competition_id', c.id)
        counts[c.id] = count || 0
      }))
    }
    setCompetitions((comps || []).map(c => ({ ...c, participant_count: counts[c.id] || 0 })))
    const map = {}
    ents?.forEach(ent => { map[ent.competition_id] = ent })
    setEntries(map)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('competitions-realtime')
      .on('postgres_changes', { event:'*', schema:'public', table:'competitions' }, () => fetchData())
      .on('postgres_changes', { event:'*', schema:'public', table:'competition_entries' }, () => fetchData())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetchData])

  const filtered = competitions.filter(c => {
    const status = getStatus(c)
    if (filter === 'Toutes')           return true
    if (filter === 'Actives')          return status === 'active'
    if (filter === 'À venir')          return status === 'upcoming'
    if (filter === 'Terminées')        return status === 'ended'
    if (filter === 'Mes inscriptions') return !!entries[c.id]
    return true
  })

  const stats = {
    active:    competitions.filter(c => getStatus(c) === 'active').length,
    upcoming:  competitions.filter(c => getStatus(c) === 'upcoming').length,
    joined:    Object.keys(entries).length,
    submitted: Object.values(entries).filter(ent => ent.submitted_at).length,
  }

  const handleAction = () => {
    setSelected(null)
    fetchData()
    setToast('✓ Action enregistrée !')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div style={{ padding:28, maxWidth:900, margin:'0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:2000, background:'rgba(0,255,135,0.12)', border:'1px solid rgba(0,255,135,0.3)', borderRadius:8, padding:'10px 16px', fontSize:11, color:'#00FF87', letterSpacing:'0.04em', animation:'slideIn 0.3s ease', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>ENSGMM · AI CLUB</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Compé<span style={{color:'#00FF87'}}>titions</span>
          </div>
          {stats.active > 0 && (
            <div style={{ fontSize:10, color:'#00FF87', background:'rgba(0,255,135,0.08)', border:'1px solid rgba(0,255,135,0.2)', borderRadius:6, padding:'5px 12px', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#00FF87',boxShadow:'0 0 6px #00FF87',animation:'pulse 1.5s infinite'}}/>
              {stats.active} compétition{stats.active>1?'s':''} active{stats.active>1?'s':''}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24, animation:'fadeUp 0.35s 0.05s ease both' }}>
        {[
          { label:'Actives',     value:stats.active,    color:'#00FF87', bg:'rgba(0,255,135,0.08)' },
          { label:'À venir',     value:stats.upcoming,  color:'#2C7BE5', bg:'rgba(44,123,229,0.08)' },
          { label:'Inscrit',     value:stats.joined,    color:'#FFB830', bg:'rgba(255,184,48,0.08)' },
          { label:'Soumissions', value:stats.submitted, color:'#00c468', bg:'rgba(0,255,135,0.06)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:9, background:bg, color, borderRadius:4, padding:'2px 6px', display:'inline-block', marginBottom:10, letterSpacing:'0.06em' }}>{label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:22, fontWeight:700, color:'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', animation:'fadeUp 0.35s 0.1s ease both' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 14px', borderRadius:6, background:filter===f?'rgba(0,255,135,0.07)':'none', border:filter===f?'1px solid rgba(0,255,135,0.15)':'1px solid var(--border)', color:filter===f?'#00FF87':'var(--text3)', fontSize:10, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.15s' }}>{f}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14, animation:'fadeUp 0.35s 0.15s ease both' }}>
        {loading
          ? Array.from({length:4}).map((_,i) => <div key={i} style={{ height:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, opacity:0.5-i*0.08 }}/>)
          : filtered.length === 0
          ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:11, letterSpacing:'0.06em' }}>Aucune compétition dans cette catégorie.</div>
          : filtered.map(c => <CompCard key={c.id} comp={c} entry={entries[c.id]} onClick={() => setSelected(c)} />)
        }
      </div>

      {selected && (
        <CompModal comp={selected} entry={entries[selected.id]} onClose={() => setSelected(null)} onAction={handleAction} />
      )}
    </div>
  )
}
