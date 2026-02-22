
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDeadline, initials } from '../../lib/helpers'

// ─── Icônes ──────────────────────────────────────────────────────────────────
const Icon = {
  Star:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Clock:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Users:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Send:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Link:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Check:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trophy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L19 7C19 9.76 17.76 12.24 16 14C14.7 15.3 13.4 16 12 16C10.6 16 9.3 15.3 8 14C6.24 12.24 5 9.76 5 7L7 4Z"/><path d="M5 7H3C3 9 4 11 6 12"/><path d="M19 7H21C21 9 20 11 18 12"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Modal détail / soumission ────────────────────────────────────────────────
function CompModal({ comp, entry, onClose, onAction }) {
  const { user } = useAuthStore()
  const status = getStatus(comp)
  const banner = getBanner(comp)
  const countdown = useCountdown(comp.end_date)
  const progress = timeProgress(comp.start_date, comp.end_date)

  const [tab, setTab] = useState('file')
  const [file, setFile] = useState(null)
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [view, setView] = useState('info')

  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('competition_entries')
      .select('user_id, score, profiles(full_name, avatar_url)')
      .eq('competition_id', comp.id)
      .not('score', 'is', null)
      .order('score', { ascending: false })
      .limit(10)
    setLeaderboard(data || [])
  }, [comp.id])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

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
  setLoading(true); setError('')
  try {
    // Vérifier le nombre de soumissions déjà effectuées
    if (comp.max_submissions) {
      const { count } = await supabase
        .from('competition_entries')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', comp.id)
        .eq('user_id', user.id)
        .not('submitted_at', 'is', null)

      if (count >= comp.max_submissions) {
        setError(`Limite atteinte : ${comp.max_submissions} soumission${comp.max_submissions > 1 ? 's' : ''} maximum.`)
        setLoading(false)
        return
      }
    }

    let fileUrl = link.trim()
    if (tab === 'file') {
      const ext = file.name.split('.').pop()
      const path = `competitions/${comp.id}/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('competitions').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: urlData } = supabase.storage.from('competitions').getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }

    const { error: submitErr } = await supabase
      .from('competition_entries')
      .upsert({
        competition_id: comp.id,
        user_id: user.id,
        file_url: fileUrl,
        notes: note || null,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'competition_id,user_id' })

    if (submitErr) throw submitErr
    onAction()
  } catch (err) {
    setError(err.message)
  }
  setLoading(false)
}
  const isParticipant = !!entry
  const hasSubmitted  = entry?.submitted_at

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(3,5,7,0.9)', backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{
        background:'var(--surface)', border:'1px solid var(--border2)',
        borderRadius:14, width:'100%', maxWidth:520,
        boxShadow:'0 32px 80px rgba(0,0,0,0.8)',
        animation:'fadeUp 0.25s ease both', overflow:'hidden',
      }}>
        {/* Banner */}
        <div style={{ height:80, position:'relative', background:banner.bg, overflow:'hidden' }}>
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)',
            backgroundSize:'20px 20px',
          }}/>
          {status === 'active' && (
            <div style={{
              position:'absolute', top:12, right:12, zIndex:2,
              width:8, height:8, borderRadius:'50%',
              background:'#00FF87', boxShadow:'0 0 10px #00FF87',
              animation:'pulse 1.5s infinite',
            }}/>
          )}
          <div style={{
            position:'absolute', inset:0, display:'flex',
            alignItems:'center', justifyContent:'center',
            fontFamily:"'Unbounded',sans-serif", fontSize:10,
            letterSpacing:'0.2em', color:'rgba(255,255,255,0.35)',
            textTransform:'uppercase',
          }}>
            {banner.label}
          </div>
          <button onClick={onClose} style={{
            position:'absolute', top:10, left:12, zIndex:3,
            background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:6, width:26, height:26, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)',
          }}>
            <div style={{width:12,height:12}}><Icon.X /></div>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:14, color:'var(--text)', letterSpacing:'0.02em', marginBottom:6 }}>
              {comp.title}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <StatusBadge status={status} />
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
            <div style={{
              fontSize:11, color:'var(--text3)', lineHeight:1.7,
              letterSpacing:'0.02em', marginBottom:16,
              paddingBottom:16, borderBottom:'1px solid var(--border)',
            }}>
              {comp.description}
            </div>
          )}

          {status === 'active' && (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text3)', letterSpacing:'0.06em', marginBottom:5 }}>
                <span>Temps écoulé</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#00c468,#00FF87)', transition:'width 1s ease' }}/>
              </div>
            </div>
          )}

          {/* Tabs nav */}
          <div style={{ display:'flex', gap:4, marginBottom:18, background:'var(--bg2)', borderRadius:8, padding:4 }}>
            {[['info','Infos'], ['leaderboard','Classement'], ...(isParticipant && status === 'active' ? [['submit','Soumettre']] : [])].map(([k,label]) => (
              <button key={k} onClick={evt => { evt.stopPropagation(); setView(k) }} style={{
                flex:1, padding:'6px 0',
                background: view===k ? 'var(--surface)' : 'none',
                border: view===k ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius:6, cursor:'pointer',
                fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                color: view===k ? 'var(--text)' : 'var(--text3)',
                letterSpacing:'0.06em', transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* ─ Vue : Infos ─ */}
          {view === 'info' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  ['Début', formatDeadline(comp.start_date)],
                  ['Fin', formatDeadline(comp.end_date)],
                  ...(comp.prize ? [['Prix', comp.prize]] : []),
                  ...(comp.metric ? [['Métrique', comp.metric]] : []),
                ].map(([k,v]) => (
                  <div key={k} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:10, color:'var(--text)', letterSpacing:'0.02em' }}>{v}</div>
                  </div>
                ))}
              </div>

              {status === 'active' && !isParticipant && (
                <button onClick={handleJoin} disabled={loading} style={{
                  width:'100%', padding:'11px 0',
                  background: loading ? '#00c468' : '#00FF87',
                  border:'none', borderRadius:8, cursor: loading ? 'wait' : 'pointer',
                  color:'#030507', fontWeight:700, fontSize:11,
                  fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em',
                  boxShadow:'0 0 20px rgba(0,255,135,0.25)', transition:'all 0.2s',
                }}>
                  {loading ? 'INSCRIPTION…' : 'REJOINDRE LA COMPÉTITION →'}
                </button>
              )}
             {isParticipant && status === 'active' && (
                comp.max_submissions
                  ? (entry?.submission_count || 0) < comp.max_submissions
                  : !hasSubmitted
              ) && (
                <button onClick={() => setView('submit')} style={{
                  width:'100%', padding:'11px 0',
                  background:'none', border:'1px solid rgba(0,255,135,0.3)',
                  borderRadius:8, cursor:'pointer',
                  color:'#00FF87', fontSize:11,
                  fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em',
                  transition:'all 0.2s',
                }}>
                  {comp.max_submissions
                    ? `SOUMETTRE → (${entry?.submission_count || 0}/${comp.max_submissions})`
                    : 'SOUMETTRE MON TRAVAIL →'
                  }
                </button>
              )}
              {hasSubmitted && (
                <div style={{
                  textAlign:'center', padding:'10px 0',
                  fontSize:10, color:'#00c468', letterSpacing:'0.06em',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                }}>
                  <div style={{width:12,height:12}}><Icon.Check /></div>
                  Soumission enregistrée
                  {entry?.score != null && ` · Score : ${entry.score}`}
                </div>
              )}
              {error && <div style={{ fontSize:10, color:'#FF4B6E', marginTop:10, textAlign:'center' }}>{error}</div>}
            </div>
          )}

          {/* ─ Vue : Leaderboard ─ */}
          {view === 'leaderboard' && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', fontSize:11, color:'var(--text3)', letterSpacing:'0.06em' }}>
                  Aucun score publié pour l'instant.
                </div>
              ) : leaderboard.map((lb, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:8,
                  background: i===0 ? 'rgba(0,255,135,0.04)' : lb.user_id === user?.id ? 'rgba(44,123,229,0.05)' : 'var(--bg2)',
                  border: i===0 ? '1px solid rgba(0,255,135,0.15)' : lb.user_id === user?.id ? '1px solid rgba(44,123,229,0.15)' : '1px solid var(--border)',
                }}>
                  <span style={{
                    fontFamily:"'Unbounded',sans-serif", fontSize:11, fontWeight:700, width:20, textAlign:'center',
                    color: i===0 ? '#FFD700' : i===1 ? '#C0C0C0' : i===2 ? '#CD7F32' : 'var(--text3)',
                  }}>{i+1}</span>
                  <div style={{
                    width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg, #00c468, #2C7BE5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700, color:'#030507', fontFamily:"'Unbounded',sans-serif",
                  }}>
                    {initials(lb.profiles?.full_name || '?')}
                  </div>
                  <span style={{ flex:1, fontSize:11, color: lb.user_id === user?.id ? '#2C7BE5' : 'var(--text)', letterSpacing:'0.02em' }}>
                    {lb.profiles?.full_name || 'Inconnu'}
                    {lb.user_id === user?.id && (
                      <span style={{ marginLeft:6, fontSize:8, color:'#2C7BE5', background:'rgba(44,123,229,0.15)', padding:'1px 5px', borderRadius:3 }}>VOUS</span>
                    )}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color: i===0 ? '#00FF87' : lb.user_id === user?.id ? '#2C7BE5' : 'var(--text2)' }}>
                    {lb.score}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ─ Vue : Soumettre ─ */}
          {view === 'submit' && (
            <div>
              <div style={{ display:'flex', gap:4, marginBottom:14, background:'var(--bg)', borderRadius:8, padding:4 }}>
                {[['file','📁  Fichier'],['link','🔗  Lien']].map(([t,label]) => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex:1, padding:'6px 0',
                    background: tab===t ? 'var(--surface)' : 'none',
                    border: tab===t ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius:6, cursor:'pointer', fontSize:10,
                    fontFamily:"'IBM Plex Mono',monospace",
                    color: tab===t ? 'var(--text)' : 'var(--text3)',
                    letterSpacing:'0.06em', transition:'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>

              {tab === 'file' && (
                <div
                  onDragOver={evt => { evt.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={evt => { evt.preventDefault(); setDrag(false); const f=evt.dataTransfer.files[0]; if(f) setFile(f) }}
                  onClick={() => document.getElementById('comp-file-input').click()}
                  style={{
                    border:`2px dashed ${drag ? '#00FF87' : file ? '#00c468' : 'var(--border2)'}`,
                    borderRadius:10, padding:'20px 16px', textAlign:'center', cursor:'pointer',
                    background: drag ? 'rgba(0,255,135,0.03)' : 'var(--bg2)', transition:'all 0.2s', marginBottom:12,
                  }}
                >
                  <input id="comp-file-input" type="file" style={{display:'none'}} onChange={evt => setFile(evt.target.files[0])} />
                  <div style={{width:24,height:24,margin:'0 auto 8px',color:file?'#00c468':'var(--text3)'}}>
                    {file ? <Icon.Check /> : <Icon.Upload />}
                  </div>
                  {file
                    ? <><div style={{fontSize:11,color:'#00c468',marginBottom:3}}>{file.name}</div><div style={{fontSize:9,color:'var(--text3)'}}>{(file.size/1024/1024).toFixed(2)} MB</div></>
                    : <><div style={{fontSize:11,color:'var(--text2)',marginBottom:3}}>Glisser un fichier ici</div><div style={{fontSize:9,color:'var(--text3)'}}>ou cliquer pour parcourir · .py, .ipynb, .zip</div></>
                  }
                </div>
              )}

              {tab === 'link' && (
                <div style={{ marginBottom:12 }}>
                  <div style={{fontSize:9,color:'var(--text3)',letterSpacing:'0.1em',marginBottom:6}}>URL</div>
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:'var(--text3)'}}><Icon.Link /></div>
                    <input type="url" value={link} onChange={evt=>setLink(evt.target.value)}
                      placeholder="https://github.com/..."
                      style={{width:'100%',padding:'9px 12px 9px 30px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",outline:'none'}}
                      onFocus={evt=>evt.target.style.borderColor='#243347'} onBlur={evt=>evt.target.style.borderColor='var(--border)'}
                    />
                  </div>
                </div>
              )}

              <textarea value={note} onChange={evt=>setNote(evt.target.value)} placeholder="Note pour les juges (optionnel)…" rows={2}
                style={{width:'100%',padding:'9px 12px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:11,fontFamily:"'IBM Plex Mono',monospace",resize:'none',outline:'none',marginBottom:12}}
                onFocus={evt=>evt.target.style.borderColor='#243347'} onBlur={evt=>evt.target.style.borderColor='var(--border)'}
              />

              {error && <div style={{fontSize:10,color:'#FF4B6E',background:'rgba(255,75,110,0.08)',border:'1px solid rgba(255,75,110,0.2)',borderRadius:6,padding:'7px 12px',marginBottom:10}}>{error}</div>}

              <div style={{display:'flex',gap:8}}>
                <button onClick={() => setView('info')} style={{flex:1,padding:'10px 0',background:'none',border:'1px solid var(--border2)',borderRadius:8,cursor:'pointer',color:'var(--text3)',fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:'0.08em'}}>
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading} style={{flex:2,padding:'10px 0',background:loading?'#00c468':'#00FF87',border:'none',borderRadius:8,cursor:loading?'wait':'pointer',color:'#030507',fontWeight:700,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:'0.1em',boxShadow:'0 0 16px rgba(0,255,135,0.2)'}}>
                  {loading ? 'ENVOI…' : 'SOUMETTRE →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Badge statut ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   { label: '● ACTIVE',    color:'#00FF87', bg:'rgba(0,255,135,0.08)', border:'rgba(0,255,135,0.2)' },
    upcoming: { label: '◎ À VENIR',   color:'#2C7BE5', bg:'rgba(44,123,229,0.08)', border:'rgba(44,123,229,0.2)' },
    ended:    { label: '○ TERMINÉE',  color:'#3d5268', bg:'rgba(61,82,104,0.15)', border:'rgba(61,82,104,0.3)' },
  }
  const s = map[status]
  return (
    <span style={{
      fontSize:9, letterSpacing:'0.12em', padding:'3px 8px',
      borderRadius:10, color:s.color, background:s.bg, border:`1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  )
}

// ─── Card compétition ─────────────────────────────────────────────────────────
function CompCard({ comp, entry, onClick }) {
  const status   = getStatus(comp)
  const banner   = getBanner(comp)
  const progress = status === 'active' ? timeProgress(comp.start_date, comp.end_date) : 0
  const countdown = useCountdown(comp.end_date)

  return (
    <div
      onClick={onClick}
      style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:10, overflow:'hidden', cursor:'pointer',
        transition:'all 0.2s',
      }}
      onMouseEnter={evt => { evt.currentTarget.style.borderColor='#243347'; evt.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={evt => { evt.currentTarget.style.borderColor='var(--border)'; evt.currentTarget.style.transform='translateY(0)' }}
    >
      <div style={{ height:70, position:'relative', background:banner.bg, overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)',
          backgroundSize:'20px 20px',
        }}/>
        {status === 'active' && (
          <div style={{
            position:'absolute', top:10, right:10, zIndex:2,
            width:7, height:7, borderRadius:'50%',
            background:'#00FF87', boxShadow:'0 0 8px #00FF87',
            animation:'pulse 1.5s infinite',
          }}/>
        )}
        {entry?.submitted_at && (
          <div style={{
            position:'absolute', top:8, right:8, zIndex:2,
            background:'rgba(0,255,135,0.15)', border:'1px solid rgba(0,255,135,0.3)',
            borderRadius:4, padding:'2px 7px', fontSize:8, color:'#00FF87', letterSpacing:'0.1em',
          }}>✓ SOUMIS</div>
        )}
        <div style={{
          position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Unbounded',sans-serif", fontSize:9, letterSpacing:'0.2em',
          color:'rgba(255,255,255,0.3)', textTransform:'uppercase',
        }}>
          {banner.label}
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:12, color:'var(--text)', letterSpacing:'0.02em', marginBottom:8 }}>
          {comp.title}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <StatusBadge status={status} />
          <span style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.04em', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{width:10,height:10}}><Icon.Users /></div>
            {comp.participant_count || 0}
          </span>
        </div>

        {status === 'active' && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text3)', letterSpacing:'0.06em', marginBottom:4 }}>
              <span>Temps écoulé</span>
              <span style={{ color: progress > 80 ? '#FF4B6E' : progress > 60 ? '#FFB830' : 'var(--text3)' }}>{progress}%</span>
            </div>
            <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${progress}%`,
                background: progress > 80
                  ? 'linear-gradient(90deg,#FF4B6E,#ff6b87)'
                  : progress > 60
                  ? 'linear-gradient(90deg,#FFB830,#ffd080)'
                  : 'linear-gradient(90deg,#00c468,#00FF87)',
                transition:'width 1s ease',
              }}/>
            </div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{
            fontSize:10, letterSpacing:'0.06em',
            color: status === 'active' ? (progress > 80 ? '#FF4B6E' : 'var(--text3)') : 'var(--text3)',
            fontVariantNumeric:'tabular-nums',
          }}>
            {status === 'active' ? countdown : status === 'upcoming' ? `Début : ${formatDeadline(comp.start_date)}` : 'Terminée'}
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

// ─── Page principale ──────────────────────────────────────────────────────────
const FILTERS = ['Toutes', 'Actives', 'À venir', 'Terminées', 'Mes inscriptions']

export default function Competitions() {
  const { user } = useAuthStore()
  const [competitions, setCompetitions] = useState([])
  const [entries, setEntries] = useState({})
  const [filter, setFilter] = useState('Toutes')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: comps }, { data: ents }] = await Promise.all([
      supabase.from('competitions').select('*').order('end_date', { ascending: true }),
      supabase.from('competition_entries').select('*').eq('user_id', user.id),
    ])

    const counts = {}
    if (comps) {
      await Promise.all(comps.map(async c => {
        const { count } = await supabase
          .from('competition_entries')
          .select('*', { count: 'exact', head: true })
          .eq('competition_id', c.id)
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
  fetchAll()

  const ch = supabase.channel('competitions-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchAll())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_entries' }, () => fetchAll())
    .subscribe()

  return () => supabase.removeChannel(ch)
}, [fetchAll])

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
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn{ from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:2000,
          background:'rgba(0,255,135,0.12)', border:'1px solid rgba(0,255,135,0.3)',
          borderRadius:8, padding:'10px 16px', fontSize:11, color:'#00FF87',
          letterSpacing:'0.04em', animation:'slideIn 0.3s ease',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
        }}>{toast}</div>
      )}

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>
          ENSGMM · AI CLUB
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
            Compé<span style={{color:'#00FF87'}}>titions</span>
          </div>
          {stats.active > 0 && (
            <div style={{
              fontSize:10, color:'#00FF87',
              background:'rgba(0,255,135,0.08)', border:'1px solid rgba(0,255,135,0.2)',
              borderRadius:6, padding:'5px 12px', letterSpacing:'0.06em',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#00FF87',boxShadow:'0 0 6px #00FF87',animation:'pulse 1.5s infinite'}}/>
              {stats.active} compétition{stats.active>1?'s':''} active{stats.active>1?'s':''}
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24, animation:'fadeUp 0.35s 0.05s ease both' }}>
        {[
          { label:'Actives',    value:stats.active,    color:'#00FF87', bg:'rgba(0,255,135,0.08)' },
          { label:'À venir',    value:stats.upcoming,  color:'#2C7BE5', bg:'rgba(44,123,229,0.08)' },
          { label:'Inscrit',    value:stats.joined,    color:'#FFB830', bg:'rgba(255,184,48,0.08)' },
          { label:'Soumissions',value:stats.submitted, color:'#00c468', bg:'rgba(0,255,135,0.06)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:9, background:bg, color, borderRadius:4, padding:'2px 6px', display:'inline-block', marginBottom:10, letterSpacing:'0.06em' }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:22, fontWeight:700, color:'var(--text)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', animation:'fadeUp 0.35s 0.1s ease both' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'5px 14px', borderRadius:6,
            background: filter===f ? 'rgba(0,255,135,0.07)' : 'none',
            border: filter===f ? '1px solid rgba(0,255,135,0.15)' : '1px solid var(--border)',
            color: filter===f ? '#00FF87' : 'var(--text3)',
            fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
            letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.15s',
          }}>{f}</button>
        ))}
      </div>

      <div style={{
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',
        gap:14, animation:'fadeUp 0.35s 0.15s ease both',
      }}>
        {loading
          ? Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ height:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, opacity:0.5-i*0.08 }}/>
            ))
          : filtered.length === 0
          ? <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 0', color:'var(--text3)', fontSize:11, letterSpacing:'0.06em' }}>
              Aucune compétition dans cette catégorie.
            </div>
          : filtered.map(c => (
              <CompCard key={c.id} comp={c} entry={entries[c.id]} onClick={() => setSelected(c)} />
            ))
        }
      </div>

      {selected && (
        <CompModal
          comp={selected}
          entry={entries[selected.id]}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  )
}
