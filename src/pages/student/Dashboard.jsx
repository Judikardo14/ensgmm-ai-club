// src/pages/student/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import CountdownTimer from '../../components/shared/CountdownTimer'

const E = 'cubic-bezier(0.4,0,0.2,1)'
const T = `0.18s ${E}`

// ── Utilitaires ──
const urgencyOf = (deadline, submitted) => {
  if (submitted) return 'done'
  const diff = new Date(deadline) - new Date()
  if (diff < 0)         return 'expired'
  if (diff < 86400000)  return 'urgent'
  if (diff < 259200000) return 'soon'
  return 'ok'
}
const URGENCY = {
  urgent:  { border:'#FF4B6E', bg:'rgba(255,75,110,0.08)',  color:'#FF4B6E',  label:'URGENT'  },
  soon:    { border:'#FFB830', bg:'rgba(255,184,48,0.08)',  color:'#FFB830',  label:'BIENTÔT' },
  ok:      { border:'#00c468', bg:'rgba(0,196,104,0.08)',   color:'#00c468',  label:'OUVERT'  },
  done:    { border:'#3d5268', bg:'rgba(61,82,104,0.08)',   color:'#3d5268',  label:'RENDU'   },
  expired: { border:'#3d5268', bg:'rgba(61,82,104,0.06)',   color:'#3d5268',  label:'EXPIRÉ'  },
}
const timeAgo = (date) => {
  const diff = Date.now() - new Date(date)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `Il y a ${d} jour${d > 1 ? 's' : ''}`
  if (h > 0) return `Il y a ${h} heure${h > 1 ? 's' : ''}`
  return "À l'instant"
}
const activityColor = (type) =>
  ({ assignment:'#FFB830', competition:'#00FF87', result:'#4a9eff', reminder:'#FFB830', info:'#4a9eff' }[type] || '#5e7d96')

// ── Composants ──
function Card({ children, style, hover = false }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:12, padding:'18px 22px',
        position:'relative', overflow:'hidden',
        transition: `border-color ${T}, box-shadow ${T}, transform ${T}`,
        borderColor: hover && hov ? 'var(--border2)' : 'var(--border)',
        boxShadow: hover && hov ? '0 6px 28px rgba(0,0,0,0.4)' : 'none',
        transform: hover && hov ? 'translateY(-1px)' : 'translateY(0)',
        ...style,
      }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)' }}/>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:'var(--text3)', textTransform:'uppercase' }}>
      <div style={{ width:3, height:13, background:'var(--accent)', borderRadius:2 }}/>
      {children}
    </div>
  )
}

function StatCard({ icon, value, label, trend, trendUp, color }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background:'var(--surface)', border:`1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`,
      borderRadius:12, padding:18, position:'relative', overflow:'hidden',
      transition: `all ${T}`,
      boxShadow: hov ? '0 6px 24px rgba(0,0,0,0.35)' : 'none',
      transform: hov ? 'translateY(-2px)' : 'translateY(0)',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)' }}/>
      <div style={{ width:32, height:32, borderRadius:8, marginBottom:14, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', transition:`background ${T}`, ...(hov && { background:`${color}28` }) }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em', lineHeight:1, marginBottom:6 }}>
        {value}
      </div>
      <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
        {label}
      </div>
      {trend && (
        <div style={{ position:'absolute', top:16, right:16, display:'flex', alignItems:'center', gap:3, fontSize:10, color: trendUp ? 'var(--accent)' : '#FF4B6E' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {trendUp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
          </svg>
          {trend}
        </div>
      )}
    </div>
  )
}

function AssignmentCard({ item, isMobile }) {
  const [hov, setHov] = useState(false)
  const u = urgencyOf(item.deadline, item.submitted)
  const urg = URGENCY[u]
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:'var(--surface)',
        border:`1px solid ${hov ? urg.border : 'var(--border)'}`,
        borderLeft:`3px solid ${urg.border}`,
        borderRadius:10, padding:'15px 18px',
        display:'flex', alignItems:'center', gap:14,
        opacity: u === 'done' || u === 'expired' ? 0.65 : 1,
        cursor:'pointer', flexWrap: isMobile ? 'wrap' : 'nowrap',
        transition: `all ${T}`,
        transform: hov && u !== 'done' && u !== 'expired' ? 'translateX(3px)' : 'translateX(0)',
        boxShadow: hov ? `0 4px 20px rgba(0,0,0,0.3)` : 'none',
      }}>
      <div style={{ width:38, height:38, borderRadius:9, flexShrink:0, background: item.type === 'project' ? 'rgba(0,255,135,0.08)' : 'rgba(74,158,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={item.type === 'project' ? 'var(--accent)' : 'var(--blue)'} strokeWidth="1.5">
          {item.type === 'project'
            ? <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>
            : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
          }
        </svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, color:'var(--text)', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:500 }}>
          {item.title}
        </div>
        <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--text3)' }}>
          <span>{item.author}</span>
          {item.score != null && <span style={{ color:'var(--accent-dim)' }}>· {item.score}/{item.max_score}</span>}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ display:'inline-block', padding:'3px 10px', borderRadius:5, marginBottom:7, background:urg.bg, fontSize:10, color:urg.color, letterSpacing:'0.1em' }}>
          {urg.label}
        </div>
        <div>
          {u === 'done' || u === 'expired'
            ? <div style={{ fontSize:11, color:'var(--text3)' }}>{u === 'done' ? '✓ Soumis' : 'Expiré'}</div>
            : <CountdownTimer deadline={item.deadline} size="sm" />
          }
        </div>
      </div>
    </div>
  )
}

function LeaderRow({ rank, name, points, isMe, maxPoints }) {
  const [hov, setHov] = useState(false)
  const rankColors = { 1:'#FFD700', 2:'#C0C0C0', 3:'#CD7F32' }
  const color = rankColors[rank] || (isMe ? 'var(--blue)' : 'var(--text3)')
  const pct = Math.round((points / Math.max(maxPoints, 1)) * 100)
  const ini = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:9,
        background: rank === 1 ? 'rgba(0,255,135,0.04)' : isMe ? 'rgba(74,158,255,0.05)' : hov ? 'var(--surface2)' : 'var(--surface)',
        border:`1px solid ${rank === 1 ? 'rgba(0,255,135,0.15)' : isMe ? 'rgba(74,158,255,0.15)' : hov ? 'var(--border2)' : 'var(--border)'}`,
        borderLeft:`2px solid ${rank <= 3 ? color : isMe ? 'var(--blue)' : 'var(--border)'}`,
        position:'relative', overflow:'hidden',
        transition: `all ${T}`,
        transform: hov && !isMe ? 'translateX(2px)' : 'translateX(0)',
      }}>
      <div style={{ fontSize:12, fontWeight:700, width:22, textAlign:'center', color, flexShrink:0 }}>{rank}</div>
      <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${color}66,${color}22)`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color }}>{ini}</div>
      <div style={{ flex:1, fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {name}
        {isMe && <span style={{ marginLeft:7, fontSize:9, color:'var(--blue)', background:'rgba(74,158,255,0.15)', padding:'1px 6px', borderRadius:3 }}>VOUS</span>}
      </div>
      <div style={{ fontSize:13, fontWeight:600, flexShrink:0, color: rank === 1 ? 'var(--accent)' : isMe ? 'var(--blue)' : 'var(--text2)' }}>
        {points} <span style={{ fontSize:10, color:'var(--text3)' }}>pts</span>
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'var(--border)' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:'0 1px 1px 0', background: rank === 1 ? 'linear-gradient(90deg,var(--accent-dim),transparent)' : isMe ? 'linear-gradient(90deg,var(--blue),transparent)' : 'linear-gradient(90deg,var(--border2),transparent)', transition:'width 1s ease' }}/>
      </div>
    </div>
  )
}

function ActivityItem({ color, title, desc, time, isLast }) {
  return (
    <div style={{ display:'flex', gap:13 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:3 }}>
        <div style={{ width:9, height:9, borderRadius:'50%', flexShrink:0, background:color, boxShadow:`0 0 7px ${color}` }}/>
        {!isLast && <div style={{ width:1, flex:1, background:'var(--border)', marginTop:6, minHeight:20 }}/>}
      </div>
      <div style={{ flex:1, paddingBottom: isLast ? 0 : 18 }}>
        <div style={{ fontSize:13, color:'var(--text)', marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, marginBottom:5 }}>{desc}</div>
        <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.06em' }}>{time}</div>
      </div>
    </div>
  )
}

// ── Modal Soumission ──
function SubmitModal({ competition, profile, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!file) return setError('Sélectionne un fichier.')
    if (!file.name.toLowerCase().endsWith('.csv')) return setError('Seuls les fichiers CSV sont acceptés.')
    setLoading(true)
    const path = `competitions/${competition.id}/${profile.id}_${Date.now()}.csv`
    const { error: upErr } = await supabase.storage.from('competitions').upload(path, file, { upsert: true })
    if (upErr) { setError('Erreur upload : ' + upErr.message); setLoading(false); return }
    const { data: urlData } = supabase.storage.from('competitions').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('competition_entries').update({ file_url: urlData.publicUrl, submitted_at: new Date().toISOString() }).eq('competition_id', competition.id).eq('user_id', user.id)
    if (dbErr) { setError('Erreur sauvegarde : ' + dbErr.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
    setTimeout(() => { onSuccess(); onClose() }, 2000)
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(3,5,7,0.9)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:`fadeIn 0.2s ${E}` }}
      onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:16, width:'100%', maxWidth:440, padding:'30px 30px 26px', boxShadow:'0 32px 80px rgba(0,0,0,0.7)', position:'relative', overflow:'hidden', animation:`slideUp 0.25s ${E}` }}>
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(0,255,135,0.4),transparent)' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:5 }}>SOUMISSION</div>
            <div style={{ fontSize:15, color:'var(--text)', fontWeight:500 }}>{competition.title}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, width:30, height:30, cursor:'pointer', color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:`all ${T}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:36, marginBottom:14 }}>✓</div>
            <div style={{ fontSize:13, color:'var(--accent)', letterSpacing:'0.04em' }}>Soumission envoyée avec succès !</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px', background:'rgba(0,255,135,0.05)', border:'1px solid rgba(0,255,135,0.15)', borderRadius:9, marginBottom:18 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dim)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize:11, color:'var(--text2)', letterSpacing:'0.03em' }}>Format accepté : <span style={{ color:'var(--accent)' }}>CSV uniquement</span></span>
            </div>

            <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:11, padding:'30px 18px', border:`2px dashed ${file ? 'var(--accent-dim)' : 'var(--border)'}`, borderRadius:12, cursor:'pointer', marginBottom:16, background: file ? 'rgba(0,196,104,0.04)' : 'transparent', transition:`all ${T}` }}
              onMouseEnter={evt => { if (!file) evt.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={evt => { if (!file) evt.currentTarget.style.borderColor = 'var(--border)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={file ? 'var(--accent-dim)' : 'var(--text3)'} strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {file ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, color:'var(--accent-dim)', marginBottom:4 }}>{file.name}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{(file.size / 1024).toFixed(1)} KB · Cliquer pour changer</div>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Cliquer pour choisir un fichier</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>CSV uniquement</div>
                </div>
              )}
              <input type="file" accept=".csv" style={{ display:'none' }} onChange={evt => { setFile(evt.target.files[0]); setError('') }} />
            </label>

            {error && (
              <div style={{ fontSize:11, color:'#FF4B6E', background:'rgba(255,75,110,0.08)', border:'1px solid rgba(255,75,110,0.2)', borderRadius:7, padding:'9px 13px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:'11px 0', background:'none', border:'1px solid var(--border)', borderRadius:9, cursor:'pointer', color:'var(--text3)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.08em', transition:`all ${T}` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}>
                ANNULER
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'11px 0', background: loading ? 'var(--accent-dim)' : 'var(--accent)', border:'none', borderRadius:9, cursor: loading ? 'wait' : 'pointer', color:'#030507', fontWeight:700, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em', opacity: !file ? 0.6 : 1, transition:`all ${T}`, transform: !loading ? 'scale(1)' : 'scale(0.98)' }}>
                {loading ? 'ENVOI EN COURS…' : 'CONFIRMER →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CompCarousel({ competitions }) {
  const [idx, setIdx] = useState(0)
  const BANNERS = {
    ml:      'linear-gradient(135deg, #0a2040 0%, #0f3060 50%, #0a1a30 100%)',
    nlp:     'linear-gradient(135deg, #1a0a30 0%, #3a0a60 50%, #1a0a30 100%)',
    cv:      'linear-gradient(135deg, #001a0a 0%, #003320 50%, #001a0a 100%)',
    default: 'linear-gradient(135deg, #0a0a20 0%, #1a1a40 50%, #0a0a20 100%)',
  }
  const getBannerBg = (comp) => {
    const cat = (comp.category || '').toLowerCase()
    if (cat.includes('nlp') || cat.includes('langue') || cat.includes('text')) return BANNERS.nlp
    if (cat.includes('vision') || cat.includes('image') || cat.includes('cv')) return BANNERS.cv
    if (cat.includes('ml') || cat.includes('machine') || cat.includes('data')) return BANNERS.ml
    return BANNERS.default
  }

  if (competitions.length === 0) return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
      <SectionTitle>Compétitions actives</SectionTitle>
      <div style={{ textAlign:'center', padding:'22px 0', fontSize:12, color:'var(--text3)' }}>Aucune compétition active.</div>
    </div>
  )

  const comp = competitions[Math.min(idx, competitions.length - 1)]
  const now = new Date()
  const total = new Date(comp.end_date) - new Date(comp.start_date)
  const elapsed = now - new Date(comp.start_date)
  const progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
  const urgentColor = progress > 80 ? '#FF4B6E' : progress > 60 ? '#FFB830' : 'var(--accent)'

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <SectionTitle>Compétitions actives</SectionTitle>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
            style={{ background:'none', border:'1px solid var(--border)', borderRadius:5, width:24, height:24, cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'var(--border2)' : 'var(--text2)', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:`all ${T}` }}>‹</button>
          <span style={{ fontSize:10, color:'var(--text3)' }}>{idx + 1}/{competitions.length}</span>
          <button onClick={() => setIdx(i => Math.min(competitions.length - 1, i + 1))} disabled={idx === competitions.length - 1}
            style={{ background:'none', border:'1px solid var(--border)', borderRadius:5, width:24, height:24, cursor: idx === competitions.length - 1 ? 'not-allowed' : 'pointer', color: idx === competitions.length - 1 ? 'var(--border2)' : 'var(--text2)', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', transition:`all ${T}` }}>›</button>
        </div>
      </div>

      <div style={{ background:'var(--bg2)', border:`1px solid ${urgentColor}33`, borderRadius:10, overflow:'hidden', transition:`border-color ${T}` }}>
        <div style={{ height:44, background: getBannerBg(comp), position:'relative' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)', backgroundSize:'14px 14px' }}/>
          <div style={{ position:'absolute', top:9, right:9, width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 7px var(--accent)', animation:'pulse 1.5s infinite' }}/>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, letterSpacing:'0.2em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase', fontFamily:"'Unbounded',sans-serif" }}>
            {(comp.category || 'IA').toUpperCase()}
          </div>
        </div>
        <div style={{ padding:'13px 15px' }}>
          <div style={{ fontSize:12, color:'var(--text)', marginBottom:11, lineHeight:1.5 }}>{comp.title}</div>
          <div style={{ marginBottom:11 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text3)', marginBottom:4 }}>
              <span>Temps écoulé</span>
              <span style={{ color:urgentColor }}>{progress}%</span>
            </div>
            <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg, ${urgentColor}77, ${urgentColor})`, transition:'width 1s ease', borderRadius:2 }}/>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:10, color:'var(--text3)' }}>{comp.participant_count || 0} participants</div>
            {comp.prize && <div style={{ fontSize:10, color:'#FFB830', letterSpacing:'0.04em' }}>🏆 {comp.prize}</div>}
          </div>
        </div>
      </div>

      <a href="/competitions" style={{ display:'block', textAlign:'center', marginTop:12, padding:'9px 0', background:'none', border:'1px solid rgba(0,255,135,0.2)', borderRadius:8, color:'var(--accent)', fontSize:11, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.08em', textDecoration:'none', transition:`all ${T}` }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,135,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,255,135,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(0,255,135,0.2)' }}>
        VOIR LES COMPÉTITIONS →
      </a>

      {competitions.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12 }}>
          {competitions.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 16 : 6, height:6, borderRadius:3, background: i === idx ? 'var(--accent)' : 'var(--border)', cursor:'pointer', transition:`all 0.3s ${E}` }}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════
// PAGE DASHBOARD
// ══════════════════════════════════
export default function Dashboard() {
  const { profile } = useAuthStore()
  const [myRank, setMyRank]             = useState(null)
  const [assignments, setAssignments]   = useState([])
  const [submissions, setSubmissions]   = useState([])
  const [leaders, setLeaders]           = useState([])
  const [activities, setActivities]     = useState([])
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768)
  const [submitTarget, setSubmitTarget] = useState(null)

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => {
  if (profile?.id) {
    fetchAll()

    const ch = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_entries' }, () => fetchAll())
      .subscribe()

    return () => supabase.removeChannel(ch)
  }
}, [profile])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchAssignments(), fetchLeaders(), fetchActivities(), fetchCompetitions()])
    setLoading(false)
  }

  const fetchAssignments = async () => {
    const [{ data: asgn }, { data: subs }] = await Promise.all([
      supabase.from('assignments').select('*, profiles(full_name)').eq('status', 'open').order('deadline', { ascending: true }).limit(5),
      supabase.from('submissions').select('assignment_id, score, status, max_score').eq('user_id', profile.id),
    ])
    setSubmissions(subs || [])
    setAssignments((asgn || []).map(a => ({
      id: a.id, title: a.title, type: a.type, deadline: a.deadline, max_score: a.max_score,
      author: a.profiles?.full_name || 'Admin',
      submitted: (subs || []).some(s => s.assignment_id === a.id),
      score: (subs || []).find(s => s.assignment_id === a.id)?.score,
    })))
  }

  const fetchLeaders = async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, total_points').order('total_points', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('total_points', profile?.total_points || 0),
    ])
    setLeaders(data || [])
    setMyRank((count || 0) + 1)
  }

  const fetchActivities = async () => {
    const { data } = await supabase.rpc('get_my_activity_feed')
    setActivities(data || [])
  }

  const fetchCompetitions = async () => {
    const now = new Date().toISOString()
    const { data } = await supabase.from('competitions').select('*').lte('start_date', now).gte('end_date', now).limit(10)
    setCompetitions(data || [])
  }

  useEffect(() => {
    const ch = supabase.channel('lb')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles' }, fetchLeaders)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const myPoints  = profile?.total_points || 0
  const maxPts    = leaders[0]?.total_points || 1
  const pending   = assignments.filter(a => !a.submitted && urgencyOf(a.deadline, false) !== 'expired').length
  const graded    = submissions.filter(s => s.status === 'graded').length
  const nextDl    = assignments.find(a => !a.submitted && urgencyOf(a.deadline, false) !== 'expired')
  const firstName = profile?.full_name?.split(' ')[0] || 'Étudiant'
  const lastName  = profile?.full_name?.split(' ').slice(1).join(' ') || ''
  const meInTop   = leaders.some(l => l.id === profile?.id)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:18 }}>
      <div style={{ width:34, height:34, border:'2px solid var(--border)', borderTop:'2px solid var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.15em' }}>CHARGEMENT...</div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", padding:'clamp(16px,3vw,28px)' }}>

      {/* ── Welcome Banner ── */}
      <Card style={{ marginBottom:22, padding:'24px 28px' }}>
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', backgroundImage:'linear-gradient(rgba(0,255,135,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.04) 1px,transparent 1px)', backgroundSize:'24px 24px', WebkitMaskImage:'linear-gradient(90deg,transparent,rgba(0,0,0,0.4))', maskImage:'linear-gradient(90deg,transparent,rgba(0,0,0,0.4))' }}/>
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', gap:18, flexDirection: isMobile ? 'column' : 'row', position:'relative', zIndex:1 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:7 }}>BIENVENUE DE RETOUR</div>
            <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize: isMobile ? 19 : 23, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em', marginBottom:9 }}>
              {firstName} <span style={{ color:'var(--accent)' }}>{lastName}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom: nextDl ? 16 : 0 }}>
              {pending} devoir{pending !== 1 ? 's' : ''} en attente · {competitions.length} compétition{competitions.length !== 1 ? 's' : ''} active{competitions.length !== 1 ? 's' : ''}
            </div>
            {nextDl && (
              <>
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', marginBottom:9 }}>PROCHAINE DEADLINE</div>
                <CountdownTimer deadline={nextDl.deadline} size="md" />
              </>
            )}
            {!nextDl && (
              <div style={{ fontSize:12, color:'var(--accent-dim)', marginTop:9 }}>✓ Tous les devoirs sont à jour</div>
            )}
          </div>
          {myRank && (
            <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink:0 }}>
              <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize: isMobile ? 44 : 56, fontWeight:900, color:'var(--accent)', letterSpacing:'-0.04em', lineHeight:1, textShadow:'0 0 32px rgba(0,255,135,0.4)' }}>
                #{myRank}
              </div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.15em', textTransform:'uppercase', marginTop:5 }}>CLASSEMENT GÉNÉRAL</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:5 }}>{myPoints} points</div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard color="#00FF87" value={graded} label="DEVOIRS NOTÉS" trend={graded > 0 ? `+${graded}` : null} trendUp icon={<polyline points="20 6 9 17 4 12"/>} />
        <StatCard color="#FFB830" value={pending} label="EN ATTENTE" icon={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
        <StatCard color="#4a9eff" value={myPoints} label="POINTS TOTAUX" icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />
        <StatCard color="#00FF87" value={myRank ? `#${myRank}` : '—'} label="CLASSEMENT" icon={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />
      </div>

      {/* ── Grid principale ── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 310px', gap:22, alignItems:'start' }}>

        {/* GAUCHE */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Devoirs */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:13 }}>
              <SectionTitle>Devoirs & Projets</SectionTitle>
              <button onClick={() => window.location.href = '/assignments'} style={{ fontSize:11, color:'var(--text3)', background:'none', border:'none', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", transition:`color ${T}` }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
                Voir tout →
              </button>
            </div>
            {assignments.length === 0
              ? <Card><div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:'22px 0' }}>Aucun devoir ouvert pour le moment</div></Card>
              : <div style={{ display:'flex', flexDirection:'column', gap:9, maxHeight: assignments.length > 2 ? 260 : 'none', overflowY: assignments.length > 2 ? 'auto' : 'visible', scrollbarWidth:'thin', scrollbarColor:'var(--border) transparent', paddingRight: assignments.length > 2 ? 4 : 0 }}>
                  {assignments.map(a => <AssignmentCard key={a.id} item={a} isMobile={isMobile} />)}
                </div>
            }
            {assignments.length > 2 && (
              <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', letterSpacing:'0.08em', marginTop:9, animation:'pulse 2s infinite' }}>
                ↓ {assignments.length - 2} de plus
              </div>
            )}
          </div>

          {/* Activités */}
          <div>
            <div style={{ marginBottom:13 }}><SectionTitle>Activités récentes</SectionTitle></div>
            <Card style={{ padding:0 }}>
              {activities.length === 0
                ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:'22px 0' }}>Aucune activité récente</div>
                : <div style={{ maxHeight:260, overflowY: activities.length > 2 ? 'auto' : 'visible', scrollbarWidth:'thin', scrollbarColor:'var(--border) transparent', padding:'18px 22px' }}>
                    {activities.map((a, i) => (
                      <ActivityItem key={a.id} color={activityColor(a.type)} title={a.title} desc={a.content || ''} time={timeAgo(a.created_at)} isLast={i === activities.length - 1} />
                    ))}
                  </div>
              }
              {activities.length > 2 && (
                <div style={{ textAlign:'center', fontSize:10, color:'var(--text3)', letterSpacing:'0.08em', padding:'9px 0', borderTop:'1px solid var(--border)', animation:'pulse 2s infinite' }}>
                  ↓ {activities.length - 2} de plus
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* DROITE */}
        <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

          {/* Leaderboard */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:13 }}>
              <SectionTitle>Leaderboard</SectionTitle>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:10, color:'var(--accent)', letterSpacing:'0.1em', padding:'3px 9px', border:'1px solid rgba(0,255,135,0.2)', borderRadius:10, background:'rgba(0,255,135,0.05)' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 6px var(--accent)', animation:'pulse 1.5s infinite' }}/>
                LIVE
              </div>
            </div>

            {leaders.length === 0
              ? <Card><div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:'22px 0' }}>Aucun classement disponible</div></Card>
              : <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'visible' }}>
                  <div style={{ maxHeight:280, overflowY:'auto', padding:'9px 9px 0', scrollbarWidth:'thin', scrollbarColor:'var(--border) transparent' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5, paddingBottom:9 }}>
                      {leaders.map((l, i) => (
                        <LeaderRow key={l.id} rank={i+1} name={l.full_name} points={l.total_points} isMe={l.id === profile?.id} maxPoints={maxPts} />
                      ))}
                    </div>
                  </div>
                  {!meInTop && myRank && (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 18px', borderTop:'1px solid var(--border)' }}>
                        <div style={{ flex:1, height:1, background:'var(--border)' }}/><span style={{ fontSize:9, color:'var(--text3)', letterSpacing:'0.1em' }}>···</span><div style={{ flex:1, height:1, background:'var(--border)' }}/>
                      </div>
                      <div style={{ padding:'0 9px 9px' }}>
                        <LeaderRow rank={myRank} name={profile?.full_name || ''} points={myPoints} isMe={true} maxPoints={maxPts} />
                      </div>
                    </>
                  )}
                </div>
            }
          </div>

          <CompCarousel competitions={competitions} />
        </div>
      </div>

      {submitTarget && (
        <SubmitModal competition={submitTarget} profile={profile} onClose={() => setSubmitTarget(null)} onSuccess={fetchCompetitions} />
      )}

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
