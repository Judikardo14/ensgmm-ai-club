import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { initials } from '../../lib/helpers'

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icon = {
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trophy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L19 7C19 9.76 17.76 12.24 16 14C14.7 15.3 13.4 16 12 16C10.6 16 9.3 15.3 8 14C6.24 12.24 5 9.76 5 7L7 4Z"/><path d="M5 7H3C3 9 4 11 6 12"/><path d="M19 7H21C21 9 20 11 18 12"/></svg>,
  Star:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  TrendDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Medal: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.56 2.9A7 7 0 0 1 19 9v1h-2"/><path d="M6.5 9.5 5 9V4"/></svg>,
}

// ─── Couleurs podium ──────────────────────────────────────────────────────────
const PODIUM = {
  1: { color: '#FFD700', bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.25)',  shadow: 'rgba(255,215,0,0.15)',  label: '1er' },
  2: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.2)', shadow: 'rgba(192,192,192,0.1)', label: '2ème' },
  3: { color: '#CD7F32', bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.2)',  shadow: 'rgba(205,127,50,0.1)', label: '3ème' },
}

// Gradients avatar déterministes selon le rang
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FFD700,#FF8C00)',
  'linear-gradient(135deg,#aaa,#888)',
  'linear-gradient(135deg,#cd7f32,#a0522d)',
  'linear-gradient(135deg,#1a4fa0,#2C7BE5)',
  'linear-gradient(135deg,#3a0070,#7c3aed)',
  'linear-gradient(135deg,#1a3a20,#2d6a4f)',
  'linear-gradient(135deg,#00c468,#2C7BE5)',
  'linear-gradient(135deg,#2a1a00,#8B4513)',
  'linear-gradient(135deg,#1a0030,#5c0080)',
  'linear-gradient(135deg,#003040,#006080)',
]
const avatarGrad = (i) => AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]

// ─── Carte Podium (top 3) ─────────────────────────────────────────────────────
function PodiumCard({ profile, rank, isMe }) {
  const p = PODIUM[rank]
  const sizes = { 1: 72, 2: 60, 3: 56 }
  const avatarSize = sizes[rank]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      flex: rank === 1 ? '0 0 160px' : '0 0 130px',
      order: rank === 2 ? 1 : rank === 1 ? 2 : 3,
    }}>
      {/* Rang badge */}
      <div style={{
        fontFamily: "'Unbounded',sans-serif",
        fontSize: rank === 1 ? 11 : 9,
        fontWeight: 700, letterSpacing: '0.1em',
        color: p.color, background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: 20, padding: '3px 10px',
      }}>
        {p.label}
      </div>

      {/* Avatar */}
      <div style={{
        width: avatarSize, height: avatarSize,
        borderRadius: '50%',
        background: avatarGrad(rank - 1),
        border: `2px solid ${p.color}`,
        boxShadow: `0 0 20px ${p.shadow}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Unbounded',sans-serif",
        fontSize: rank === 1 ? 20 : 16,
        fontWeight: 700, color: '#030507',
        position: 'relative',
      }}>
        {initials(profile.full_name)}
        {isMe && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            background: '#2C7BE5', border: '2px solid var(--bg)',
            borderRadius: 4, padding: '1px 4px',
            fontSize: 7, color: '#fff', fontFamily: "'IBM Plex Mono',monospace",
            letterSpacing: '0.08em',
          }}>VOUS</div>
        )}
      </div>

      {/* Nom */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: rank === 1 ? 12 : 11, color: 'var(--text)',
          letterSpacing: '0.02em', marginBottom: 3,
          fontWeight: rank === 1 ? 600 : 400,
        }}>
          {profile.full_name}
        </div>
        <div style={{
          fontFamily: "'Unbounded',sans-serif",
          fontSize: rank === 1 ? 16 : 13, fontWeight: 700,
          color: p.color,
          textShadow: `0 0 20px ${p.shadow}`,
        }}>
          {profile.total_points} <span style={{ fontSize: 9, opacity: 0.7 }}>pts</span>
        </div>
      </div>

      {/* Barre podium */}
      <div style={{
        width: '100%',
        height: rank === 1 ? 48 : rank === 2 ? 32 : 20,
        background: p.bg, border: `1px solid ${p.border}`,
        borderRadius: '6px 6px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 16, height: 16, color: p.color }}><Icon.Trophy /></div>
      </div>
    </div>
  )
}

// ─── Ligne leaderboard ────────────────────────────────────────────────────────
function LeaderRow({ profile, rank, isMe, maxPoints }) {
  const pct = maxPoints > 0 ? (profile.total_points / maxPoints) * 100 : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      borderRadius: 8,
      background: isMe ? 'rgba(44,123,229,0.05)' : 'var(--surface)',
      border: isMe ? '1px solid rgba(44,123,229,0.15)' : '1px solid var(--border)',
      transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => { if (!isMe) e.currentTarget.style.borderColor = '#243347' }}
    onMouseLeave={e => { if (!isMe) e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Barre de fond */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: isMe
          ? 'rgba(44,123,229,0.04)'
          : 'rgba(0,255,135,0.02)',
        transition: 'width 1s ease',
        pointerEvents: 'none',
      }}/>

      {/* Rang */}
      <div style={{
        fontFamily: "'Unbounded',sans-serif",
        fontSize: 11, fontWeight: 700, width: 24, textAlign: 'center',
        color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : isMe ? '#2C7BE5' : 'var(--text3)',
        flexShrink: 0, zIndex: 1,
      }}>
        {rank}
      </div>

      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: avatarGrad(rank - 1),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#030507',
        fontFamily: "'Unbounded',sans-serif",
        flexShrink: 0, zIndex: 1,
      }}>
        {initials(profile.full_name)}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{
          fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em',
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {profile.full_name}
          {isMe && (
            <span style={{
              marginLeft: 6, fontSize: 8, color: '#2C7BE5',
              background: 'rgba(44,123,229,0.15)',
              padding: '1px 5px', borderRadius: 3,
              fontFamily: "'IBM Plex Mono',monospace",
              letterSpacing: '0.08em', flexShrink: 0,
            }}>
              VOUS
            </span>
          )}
        </div>
        {profile.filiere && (
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em', marginTop: 2 }}>
            {profile.filiere}{profile.promo ? ` · Promo ${profile.promo}` : ''}
          </div>
        )}
      </div>

      {/* Points */}
      <div style={{ textAlign: 'right', flexShrink: 0, zIndex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
          color: rank <= 3 ? PODIUM[rank].color : isMe ? '#2C7BE5' : 'var(--text2)',
        }}>
          {profile.total_points}
          <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 3 }}>pts</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { profile: myProfile } = useAuthStore()
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, total_points, filiere, promo, avatar_url')
      .order('total_points', { ascending: false })
    setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()

    // Realtime
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
      }, () => {
        setLive(true)
        fetchProfiles()
        setTimeout(() => setLive(false), 2000)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchProfiles])

  const myRank = profiles.findIndex(p => p.id === myProfile?.id) + 1

  const filtered = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.filiere?.toLowerCase().includes(search.toLowerCase())
  )

  const top3    = profiles.slice(0, 3)
  const rest    = filtered.filter((_, i) => filtered.indexOf(filtered[i]) > 2 || search)
  const maxPts  = profiles[0]?.total_points || 1

  // On affiche top3 séparément seulement si pas de recherche
  const showPodium = !search && top3.length >= 2

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 28px)', maxWidth: 780, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes flash   { 0%,100%{opacity:1} 50%{opacity:0.4} }

        @media (max-width: 600px) {
          .lb-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lb-podium     { gap: 8px !important; }
          .lb-podium-card { flex: 0 0 100px !important; }
          .lb-podium-card-main { flex: 0 0 120px !important; }
        }
        @media (max-width: 400px) {
          .lb-podium { flex-direction: column !important; align-items: center !important; }
          .lb-podium-card, .lb-podium-card-main { flex: none !important; width: 100% !important; max-width: 200px; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          ENSGMM · AI CLUB
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Leader<span style={{ color: '#00FF87' }}>board</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#00FF87', background: 'rgba(0,255,135,0.07)',
            border: '1px solid rgba(0,255,135,0.2)', borderRadius: 10,
            padding: '4px 10px',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#00FF87',
              boxShadow: live ? '0 0 10px #00FF87' : '0 0 6px #00FF87',
              animation: 'pulse 1.5s infinite',
            }}/>
            Live
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="lb-stats-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10, marginBottom: 24,
        animation: 'fadeUp 0.35s 0.05s ease both',
      }}>
        {[
          { label: 'Participants', value: profiles.length, color: '#6b849e', bg: 'rgba(107,132,158,0.08)', icon: <Icon.Users /> },
          { label: 'Ton rang',     value: myRank ? `#${myRank}` : '—', color: '#2C7BE5', bg: 'rgba(44,123,229,0.08)', icon: <Icon.Medal /> },
          { label: 'Tes points',   value: myProfile?.total_points ?? 0, color: '#00c468', bg: 'rgba(0,255,135,0.08)', icon: <Icon.Star /> },
          { label: 'Score max',    value: profiles[0]?.total_points ?? 0, color: '#FFD700', bg: 'rgba(255,215,0,0.08)', icon: <Icon.Trophy /> },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 16px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12 }}>{icon}</div>
              </div>
              <div style={{ fontSize: 8, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
            </div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700, color: 'var(--text)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Podium ── */}
      {showPodium && !loading && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 'clamp(16px, 3vw, 24px)',
          marginBottom: 24, animation: 'fadeUp 0.35s 0.1s ease both',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, color: '#FFD700' }}><Icon.Trophy /></div>
            Top 3
          </div>
          <div className="lb-podium" style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16,
          }}>
            {top3.map((p, i) => (
              <PodiumCard
                key={p.id}
                profile={p}
                rank={i + 1}
                isMe={p.id === myProfile?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Recherche ── */}
      <div style={{ marginBottom: 16, animation: 'fadeUp 0.35s 0.15s ease both' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)' }}>
            <Icon.Search />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un étudiant, une filière…"
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 11,
              fontFamily: "'IBM Plex Mono',monospace", outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#243347'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* ── Liste complète ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeUp 0.35s 0.2s ease both' }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                height: 54, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, opacity: 0.5 - i * 0.05,
              }}/>
            ))
          : filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>
              Aucun résultat pour « {search} »
            </div>
          )
          : filtered.map((p, i) => {
            const realRank = profiles.findIndex(pr => pr.id === p.id) + 1
            return (
              <LeaderRow
                key={p.id}
                profile={p}
                rank={realRank}
                isMe={p.id === myProfile?.id}
                maxPoints={maxPts}
              />
            )
          })
        }
      </div>

      {/* ── Sticky : ta position ── */}
      {myRank > 0 && !loading && (
        <div style={{
          position: 'sticky', bottom: 16, marginTop: 20,
          background: 'rgba(6,10,15,0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(44,123,229,0.25)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: avatarGrad(myRank - 1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#030507',
              fontFamily: "'Unbounded',sans-serif",
            }}>
              {initials(myProfile?.full_name || '')}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em' }}>
                {myProfile?.full_name}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.06em' }}>
                Ta position actuelle
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 18, fontWeight: 700, color: '#2C7BE5', letterSpacing: '-0.02em' }}>
                #{myRank}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                {myProfile?.total_points ?? 0}
                <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 3 }}>pts</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
