// src/pages/student/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import CountdownTimer from '../../components/shared/CountdownTimer'

// ── Utilitaires ──
const urgencyOf = (deadline, submitted) => {
  if (submitted) return 'done'
  const diff = new Date(deadline) - new Date()
  if (diff < 0)           return 'expired'
  if (diff < 86400000)    return 'urgent'
  if (diff < 259200000)   return 'soon'
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
  ({ assignment:'#FFB830', competition:'#00FF87', result:'#2C7BE5', reminder:'#FFB830', info:'#2C7BE5' }[type] || '#3d5268')

// ── Composants ──
function Card({ children, style }) {
  return (
    <div style={{
      background:'#0a1018', border:'1px solid #1a2535', borderRadius:10,
      padding:'16px 20px', position:'relative', overflow:'hidden', ...style,
    }}>
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:1,
        background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)',
      }}/>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, fontSize:10,
      fontWeight:600, letterSpacing:'0.12em', color:'#6b849e', textTransform:'uppercase',
    }}>
      <div style={{ width:3, height:12, background:'#00FF87', borderRadius:2 }}/>
      {children}
    </div>
  )
}

function StatCard({ icon, value, label, trend, trendUp, color }) {
  return (
    <Card style={{ padding:16 }}>
      <div style={{ width:28, height:28, borderRadius:6, marginBottom:12,
        background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div style={{ fontFamily:"'Unbounded',sans-serif", fontSize:22, fontWeight:700,
        color:'#dce8f5', letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>
        {value}
      </div>
      <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.12em', textTransform:'uppercase' }}>
        {label}
      </div>
      {trend && (
        <div style={{ position:'absolute', top:14, right:14, display:'flex', alignItems:'center',
          gap:3, fontSize:9, color: trendUp ? '#00FF87' : '#FF4B6E' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {trendUp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
          </svg>
          {trend}
        </div>
      )}
    </Card>
  )
}

function AssignmentCard({ item, isMobile }) {
  const u = urgencyOf(item.deadline, item.submitted)
  const urg = URGENCY[u]
  return (
    <div style={{
      background:'#0a1018', border:'1px solid #1a2535',
      borderLeft:`2px solid ${urg.border}`, borderRadius:10,
      padding:'14px 16px', display:'flex', alignItems:'center', gap:14,
      opacity: u === 'done' || u === 'expired' ? 0.6 : 1,
      cursor:'pointer', flexWrap: isMobile ? 'wrap' : 'nowrap',
      transition:'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = urg.border}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2535'}
    >
      <div style={{
        width:36, height:36, borderRadius:8, flexShrink:0,
        background: item.type === 'project' ? 'rgba(0,255,135,0.08)' : 'rgba(44,123,229,0.1)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={item.type === 'project' ? '#00FF87' : '#2C7BE5'} strokeWidth="1.5">
          {item.type === 'project'
            ? <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>
            : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>
          }
        </svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:'#dce8f5', marginBottom:4,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ display:'flex', gap:8, fontSize:10, color:'#3d5268' }}>
          <span>{item.author}</span>
          {item.score != null && <span style={{ color:'#00c468' }}>· {item.score}/{item.max_score}</span>}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, marginBottom:6,
          background:urg.bg, fontSize:9, color:urg.color, letterSpacing:'0.12em' }}>
          {urg.label}
        </div>
        <div>
          {u === 'done' || u === 'expired'
            ? <div style={{ fontSize:10, color:'#3d5268' }}>{u === 'done' ? '✓ Soumis' : 'Expiré'}</div>
            : <CountdownTimer deadline={item.deadline} size="sm" />
          }
        </div>
      </div>
    </div>
  )
}

function LeaderRow({ rank, name, points, isMe, maxPoints }) {
  const rankColors = { 1:'#FFD700', 2:'#C0C0C0', 3:'#CD7F32' }
  const color = rankColors[rank] || (isMe ? '#2C7BE5' : '#3d5268')
  const pct = Math.round((points / Math.max(maxPoints, 1)) * 100)
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:8,
      background: rank === 1 ? 'rgba(0,255,135,0.04)' : isMe ? 'rgba(44,123,229,0.05)' : '#0a1018',
      border:`1px solid ${rank === 1 ? 'rgba(0,255,135,0.15)' : isMe ? 'rgba(44,123,229,0.15)' : '#1a2535'}`,
      borderLeft:`2px solid ${rank <= 3 ? color : isMe ? '#2C7BE5' : '#1a2535'}`,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ fontSize:11, fontWeight:700, width:20, textAlign:'center', color, flexShrink:0 }}>
        {rank}
      </div>
      <div style={{
        width:26, height:26, borderRadius:'50%', flexShrink:0,
        background:`linear-gradient(135deg,${color}66,${color}22)`,
        border:`1px solid ${color}33`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:9, fontWeight:700, color,
      }}>{initials}</div>
      <div style={{ flex:1, fontSize:11, color:'#dce8f5',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {name}
        {isMe && <span style={{ marginLeft:6, fontSize:8, color:'#2C7BE5',
          background:'rgba(44,123,229,0.15)', padding:'1px 5px', borderRadius:3 }}>VOUS</span>}
      </div>
      <div style={{ fontSize:12, fontWeight:600, flexShrink:0,
        color: rank === 1 ? '#00FF87' : isMe ? '#2C7BE5' : '#6b849e' }}>
        {points} pts
      </div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'#1a2535' }}>
        <div style={{
          height:'100%', width:`${pct}%`, borderRadius:'0 1px 1px 0',
          background: rank === 1 ? 'linear-gradient(90deg,#00c468,transparent)'
            : isMe ? 'linear-gradient(90deg,#2C7BE5,transparent)'
            : 'linear-gradient(90deg,#243347,transparent)',
          transition:'width 1s ease',
        }}/>
      </div>
    </div>
  )
}

function ActivityItem({ color, title, desc, time, isLast }) {
  return (
    <div style={{ display:'flex', gap:12 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:3 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
          background:color, boxShadow:`0 0 6px ${color}` }}/>
        {!isLast && <div style={{ width:1, flex:1, background:'#1a2535', marginTop:6, minHeight:20 }}/>}
      </div>
      <div style={{ flex:1, paddingBottom: isLast ? 0 : 16 }}>
        <div style={{ fontSize:11, color:'#dce8f5', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:10, color:'#3d5268', lineHeight:1.6, marginBottom:4 }}>{desc}</div>
        <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.06em' }}>{time}</div>
      </div>
    </div>
  )
}

// ── Modal Soumission ──
function SubmitModal({ competition, profile, onClose, onSuccess }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!file) return setError('Sélectionne un fichier.')
    if (!file.name.toLowerCase().endsWith('.csv'))
      return setError('Seuls les fichiers CSV sont acceptés.')

    setLoading(true)
    const path = `submissions/${competition.id}/${profile.id}_${Date.now()}.csv`

    const { error: upErr } = await supabase.storage
      .from('submissions')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setError('Erreur upload : ' + upErr.message)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('submissions').upsert({
      user_id:        profile.id,
      competition_id: competition.id,
      file_url:       urlData.publicUrl,
      status:         'submitted',
      submitted_at:   new Date().toISOString(),
    })

    if (dbErr) {
      setError('Erreur sauvegarde : ' + dbErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => { onSuccess(); onClose() }, 2000)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(3,5,7,0.88)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'#0a1018', border:'1px solid #1a2535', borderRadius:14,
        width:'100%', maxWidth:420, padding:'28px 28px 24px',
        boxShadow:'0 24px 64px rgba(0,0,0,0.7)',
        position:'relative', overflow:'hidden',
      }}>
        {/* top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg,transparent,rgba(0,255,135,0.3),transparent)' }}/>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.15em',
              textTransform:'uppercase', marginBottom:4 }}>SOUMISSION</div>
            <div style={{ fontSize:14, color:'#dce8f5' }}>{competition.title}</div>
          </div>
          <button onClick={onClose} style={{
            background:'none', border:'1px solid #1a2535', borderRadius:6,
            width:28, height:28, cursor:'pointer', color:'#3d5268',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
          }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
            <div style={{ fontSize:12, color:'#00FF87', letterSpacing:'0.04em' }}>
              Soumission envoyée avec succès !
            </div>
          </div>
        ) : (
          <>
            {/* Format info */}
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              background:'rgba(0,255,135,0.05)', border:'1px solid rgba(0,255,135,0.15)',
              borderRadius:8, marginBottom:16,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00c468" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize:10, color:'#6b849e', letterSpacing:'0.04em' }}>
                Format accepté : <span style={{ color:'#00FF87' }}>CSV uniquement</span>
              </span>
            </div>

            {/* Zone drop */}
            <label style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:10, padding:'28px 16px',
              border:`2px dashed ${file ? '#00c468' : '#1a2535'}`,
              borderRadius:10, cursor:'pointer', marginBottom:14,
              background: file ? 'rgba(0,196,104,0.04)' : 'transparent',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { if (!file) e.currentTarget.style.borderColor = '#243347' }}
              onMouseLeave={e => { if (!file) e.currentTarget.style.borderColor = '#1a2535' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={file ? '#00c468' : '#3d5268'} strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {file ? (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#00c468', marginBottom:3 }}>{file.name}</div>
                  <div style={{ fontSize:9, color:'#3d5268' }}>
                    {(file.size / 1024).toFixed(1)} KB · Cliquer pour changer
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#6b849e', marginBottom:3 }}>
                    Cliquer pour choisir un fichier
                  </div>
                  <div style={{ fontSize:9, color:'#3d5268' }}>CSV uniquement</div>
                </div>
              )}
              <input type="file" accept=".csv" style={{ display:'none' }}
                onChange={e => { setFile(e.target.files[0]); setError('') }} />
            </label>

            {/* Erreur */}
            {error && (
              <div style={{
                fontSize:10, color:'#FF4B6E',
                background:'rgba(255,75,110,0.08)', border:'1px solid rgba(255,75,110,0.2)',
                borderRadius:6, padding:'8px 12px', marginBottom:14,
                display:'flex', alignItems:'center', gap:8,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Boutons */}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose} style={{
                flex:1, padding:'10px 0', background:'none',
                border:'1px solid #1a2535', borderRadius:8, cursor:'pointer',
                color:'#3d5268', fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                letterSpacing:'0.08em',
              }}>
                ANNULER
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex:2, padding:'10px 0',
                background: loading ? '#00c468' : '#00FF87',
                border:'none', borderRadius:8,
                cursor: loading ? 'wait' : 'pointer',
                color:'#030507', fontWeight:700, fontSize:10,
                fontFamily:"'IBM Plex Mono',monospace", letterSpacing:'0.1em',
                opacity: !file ? 0.6 : 1,
              }}>
                {loading ? 'ENVOI EN COURS…' : 'CONFIRMER →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════
// PAGE DASHBOARD
// ══════════════════════════════════
export default function Dashboard() {
  const { profile } = useAuthStore()
  const [myRank, setMyRank] = useState(null)
  const [assignments, setAssignments]   = useState([])
  const [submissions, setSubmissions]   = useState([])
  const [leaders, setLeaders]           = useState([])
  const [activities, setActivities]     = useState([])
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768)

  // ── Modal soumission ──
  const [submitTarget, setSubmitTarget] = useState(null) // competition object

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  useEffect(() => { if (profile?.id) fetchAll() }, [profile])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchAssignments(), fetchLeaders(), fetchActivities(), fetchCompetitions()])
    setLoading(false)
  }

  const fetchAssignments = async () => {
    const [{ data: asgn }, { data: subs }] = await Promise.all([
      supabase.from('assignments').select('*, profiles(full_name)')
        .eq('status', 'open').order('deadline', { ascending: true }).limit(5),
      supabase.from('submissions').select('assignment_id, score, status, max_score')
        .eq('user_id', profile.id),
    ])
    setSubmissions(subs || [])
    setAssignments((asgn || []).map(a => ({
      id: a.id, title: a.title, type: a.type,
      deadline: a.deadline, max_score: a.max_score,
      author: a.profiles?.full_name || 'Admin',
      submitted: (subs || []).some(s => s.assignment_id === a.id),
      score: (subs || []).find(s => s.assignment_id === a.id)?.score,
    })))
  }

  const fetchLeaders = async () => {
  const [{ data }, { count }] = await Promise.all([
    supabase.from('profiles')
      .select('id, full_name, total_points')
      .order('total_points', { ascending: false }).limit(8),
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', profile?.total_points || 0),
  ])
  setLeaders(data || [])
  setMyRank((count || 0) + 1)
}

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false }).limit(5)
    setActivities(data || [])
  }

  const fetchCompetitions = async () => {
    const { data } = await supabase.from('competitions')
      .select('*').eq('status', 'active').limit(2)
    setCompetitions(data || [])
  }

  // Realtime leaderboard
  useEffect(() => {
    const ch = supabase.channel('lb')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles' }, fetchLeaders)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // Calculs dérivés
  const myPoints = profile?.total_points || 0
  const maxPts   = leaders[0]?.total_points || 1
  const pending  = assignments.filter(a => !a.submitted && urgencyOf(a.deadline, false) !== 'expired').length
  const graded   = submissions.filter(s => s.status === 'graded').length
  const nextDl   = assignments.find(a => !a.submitted && urgencyOf(a.deadline, false) !== 'expired')
  const firstName = profile?.full_name?.split(' ')[0] || 'Étudiant'
  const lastName  = profile?.full_name?.split(' ').slice(1).join(' ') || ''

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:32, height:32, border:'2px solid #1a2535',
        borderTop:'2px solid #00FF87', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize:10, color:'#3d5268', letterSpacing:'0.15em' }}>
        CHARGEMENT...
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace" }}>

      {/* ── Welcome Banner ── */}
      <Card style={{ marginBottom:20, padding:'22px 24px' }}>
        <div style={{
          position:'absolute', right:0, top:0, bottom:0, width:'50%',
          backgroundImage:'linear-gradient(rgba(0,255,135,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.04) 1px,transparent 1px)',
          backgroundSize:'24px 24px',
          WebkitMaskImage:'linear-gradient(90deg,transparent,rgba(0,0,0,0.4))',
          maskImage:'linear-gradient(90deg,transparent,rgba(0,0,0,0.4))',
        }}/>
        <div style={{
          display:'flex', alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent:'space-between', gap:16,
          flexDirection: isMobile ? 'column' : 'row', position:'relative', zIndex:1,
        }}>
          <div>
            <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.15em',
              textTransform:'uppercase', marginBottom:6 }}>BIENVENUE DE RETOUR</div>
            <div style={{ fontFamily:"'Unbounded',sans-serif",
              fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#dce8f5',
              letterSpacing:'-0.02em', marginBottom:8 }}>
              {firstName} <span style={{ color:'#00FF87' }}>{lastName}</span>
            </div>
            <div style={{ fontSize:11, color:'#3d5268', marginBottom: nextDl ? 14 : 0 }}>
              {pending} devoir{pending !== 1 ? 's' : ''} en attente
              · {competitions.length} compétition{competitions.length !== 1 ? 's' : ''} active{competitions.length !== 1 ? 's' : ''}
            </div>
            {nextDl && (
              <>
                <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.1em', marginBottom:8 }}>
                  PROCHAINE DEADLINE
                </div>
                <CountdownTimer deadline={nextDl.deadline} size="md" />
              </>
            )}
            {!nextDl && (
              <div style={{ fontSize:11, color:'#00c468', marginTop:8 }}>
                ✓ Tous les devoirs sont à jour
              </div>
            )}
          </div>
          {myRank && (
            <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink:0 }}>
              <div style={{ fontFamily:"'Unbounded',sans-serif",
                fontSize: isMobile ? 40 : 52, fontWeight:900, color:'#00FF87',
                letterSpacing:'-0.04em', lineHeight:1,
                textShadow:'0 0 30px rgba(0,255,135,0.4)' }}>
                #{myRank}
              </div>
              <div style={{ fontSize:9, color:'#3d5268', letterSpacing:'0.15em',
                textTransform:'uppercase', marginTop:4 }}>CLASSEMENT GÉNÉRAL</div>
              <div style={{ fontSize:11, color:'#6b849e', marginTop:4 }}>{myPoints} points</div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Stats ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
        gap:12, marginBottom:20,
      }}>
        <StatCard color="#00FF87" value={graded} label="DEVOIRS NOTÉS"
          trend={graded > 0 ? `+${graded}` : null} trendUp
          icon={<polyline points="20 6 9 17 4 12"/>} />
        <StatCard color="#FFB830" value={pending} label="EN ATTENTE"
          icon={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
        <StatCard color="#2C7BE5" value={myPoints} label="POINTS TOTAUX"
          icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />
        <StatCard color="#00FF87" value={myRank ? `#${myRank}` : '—'} label="CLASSEMENT"
          icon={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />
      </div>

      {/* ── Grid principale ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
        gap:20, alignItems:'start',
      }}>

        {/* GAUCHE */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Devoirs */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionTitle>Devoirs & Projets</SectionTitle>
              <button style={{ fontSize:10, color:'#3d5268', background:'none', border:'none',
                cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace" }}>
                Voir tout →
              </button>
            </div>
            {assignments.length === 0
              ? <Card><div style={{ textAlign:'center', color:'#3d5268', fontSize:11, padding:'20px 0' }}>
                  Aucun devoir ouvert pour le moment
                </div></Card>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {assignments.map(a => <AssignmentCard key={a.id} item={a} isMobile={isMobile} />)}
                </div>
            }
          </div>

          {/* Activités */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionTitle>Activités récentes</SectionTitle>
              <button style={{ fontSize:10, color:'#3d5268', background:'none', border:'none',
                cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace" }}>
                Tout voir →
              </button>
            </div>
            <Card>
              {activities.length === 0
                ? <div style={{ textAlign:'center', color:'#3d5268', fontSize:11, padding:'20px 0' }}>
                    Aucune activité récente
                  </div>
                : activities.map((a, i) => (
                    <ActivityItem key={a.id}
                      color={activityColor(a.type)}
                      title={a.title} desc={a.content || ''}
                      time={timeAgo(a.created_at)}
                      isLast={i === activities.length - 1}
                    />
                  ))
              }
            </Card>
          </div>
        </div>

        {/* DROITE */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Leaderboard */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <SectionTitle>Leaderboard</SectionTitle>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:9,
                color:'#00FF87', letterSpacing:'0.1em', padding:'2px 8px',
                border:'1px solid rgba(0,255,135,0.2)', borderRadius:10,
                background:'rgba(0,255,135,0.05)' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#00FF87',
                  boxShadow:'0 0 6px #00FF87', animation:'pulse 1.5s infinite' }}/>
                LIVE
              </div>
            </div>
            {leaders.length === 0
              ? <Card><div style={{ textAlign:'center', color:'#3d5268', fontSize:11, padding:'20px 0' }}>
                  Aucun classement disponible
                </div></Card>
              : <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {leaders.map((l, i) => (
                    <LeaderRow key={l.id} rank={i+1} name={l.full_name}
                      points={l.total_points} isMe={l.id === profile?.id} maxPoints={maxPts} />
                  ))}
                </div>
            }
          </div>

          {/* Compétitions */}
          <div>
            <div style={{ marginBottom:12 }}><SectionTitle>Compétitions actives</SectionTitle></div>
            {competitions.length === 0
              ? <Card><div style={{ textAlign:'center', color:'#3d5268', fontSize:11, padding:'20px 0' }}>
                  Aucune compétition active
                </div></Card>
              : competitions.map(c => {
                  const elapsed = Math.min(100, Math.round(
                    ((new Date() - new Date(c.start_date)) / (new Date(c.end_date) - new Date(c.start_date))) * 100
                  ))
                  return (
                    <Card key={c.id} style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
                      <div style={{ height:56, position:'relative',
                        background:'linear-gradient(135deg,#0a2040,#0f3060,#0a1a30)',
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ position:'absolute', inset:0,
                          backgroundImage:'linear-gradient(rgba(0,255,135,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,135,0.06) 1px,transparent 1px)',
                          backgroundSize:'20px 20px' }}/>
                        <span style={{ position:'relative', zIndex:1, fontSize:9, letterSpacing:'0.2em',
                          color:'rgba(255,255,255,0.3)', fontFamily:"'Unbounded',sans-serif",
                          textTransform:'uppercase' }}>{c.scoring_type}</span>
                        <div style={{ position:'absolute', top:8, right:8, width:7, height:7,
                          borderRadius:'50%', background:'#00FF87', boxShadow:'0 0 8px #00FF87',
                          animation:'pulse 1.5s infinite' }}/>
                      </div>
                      <div style={{ padding:'12px 14px' }}>
                        <div style={{ fontSize:12, color:'#dce8f5', marginBottom:8 }}>{c.title}</div>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          fontSize:10, color:'#3d5268', marginBottom:10 }}>
                          <span>En cours</span>
                          <CountdownTimer deadline={c.end_date} size="sm" />
                        </div>
                        <div style={{ marginBottom:12 }}>
                          <div style={{ display:'flex', justifyContent:'space-between',
                            fontSize:9, color:'#3d5268', marginBottom:4 }}>
                            <span>TEMPS ÉCOULÉ</span><span>{elapsed}%</span>
                          </div>
                          <div style={{ height:3, background:'#1a2535', borderRadius:2, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${elapsed}%`,
                              background:'linear-gradient(90deg,#00c468,#00FF87)' }}/>
                          </div>
                        </div>
                        <button
                          onClick={() => setSubmitTarget(c)}
                          style={{ padding:'7px 14px', background:'#00FF87', color:'#030507',
                            border:'none', borderRadius:6, cursor:'pointer',
                            fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:600,
                            letterSpacing:'0.08em', display:'inline-flex', alignItems:'center', gap:6 }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 16px rgba(0,255,135,0.3)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          SOUMETTRE
                        </button>
                      </div>
                    </Card>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* ── Modal soumission ── */}
      {submitTarget && (
        <SubmitModal
          competition={submitTarget}
          profile={profile}
          onClose={() => setSubmitTarget(null)}
          onSuccess={fetchCompetitions}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
