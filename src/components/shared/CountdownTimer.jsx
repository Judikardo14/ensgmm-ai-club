import { useState, useEffect } from 'react'

export default function CountdownTimer({ deadline, size = 'md' }) {
  const calc = () => {
    const diff = new Date(deadline) - new Date()
    if (diff <= 0) return { expired: true, d:0, h:0, m:0, s:0 }
    return {
      expired: false,
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }

  const [time, setTime] = useState(calc())
  const [tick, setTick] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setTime(calc())
      setTick(v => !v)
    }, 1000)
    return () => clearInterval(t)
  }, [deadline])

  const pad = n => String(n).padStart(2, '0')

  const urgency = () => {
    const diff = new Date(deadline) - new Date()
    if (diff < 0)         return { color: '#3d5268', glow: 'none' }
    if (diff < 86400000)  return { color: '#FF4B6E', glow: '0 0 8px rgba(255,75,110,0.5)' }
    if (diff < 259200000) return { color: '#FFB830', glow: '0 0 8px rgba(255,184,48,0.4)' }
    return { color: '#00FF87', glow: '0 0 8px rgba(0,255,135,0.3)' }
  }

  const { color, glow } = urgency()

  // ── VERSION SM (inline, une ligne) ──
  if (size === 'sm') {
    return (
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11, color, letterSpacing: '0.08em',
        textShadow: glow,
      }}>
        {time.expired
          ? '[ EXPIRÉ ]'
          : time.d > 0
            ? `[ ${pad(time.d)}d ${pad(time.h)}h ${pad(time.m)}m ]`
            : `[ ${pad(time.h)}:${pad(time.m)}:${pad(time.s)} ]`
        }
      </span>
    )
  }

  // ── VERSION MD (blocs terminal) ──
  const parts = time.d > 0
    ? [{ v: time.d, u: 'DAY' }, { v: time.h, u: 'HRS' }, { v: time.m, u: 'MIN' }]
    : [{ v: time.h, u: 'HRS' }, { v: time.m, u: 'MIN' }, { v: time.s, u: 'SEC' }]

  if (time.expired) return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12, color: '#3d5268', letterSpacing: '0.1em',
    }}>
      <span style={{ color: '#3d5268' }}>{'>'}</span> DEADLINE_EXPIRED
      <span style={{ animation: 'blink 1s step-end infinite', color: '#3d5268' }}>_</span>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Ligne prefix terminal */}
      <div style={{
        fontSize: 9, color: '#3d5268', letterSpacing: '0.12em',
        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: '#00c468' }}>{'>'}</span>
        COUNTDOWN
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: color, boxShadow: glow,
          animation: 'blink 1s step-end infinite',
        }}/>
      </div>

      {/* Blocs chiffres */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        {parts.map(({ v, u }, i) => (
          <div key={u} style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            {/* Bloc */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 28, fontWeight: 600, color,
                letterSpacing: '-0.04em', lineHeight: 1,
                textShadow: glow,
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.3s',
                // Effet scanline
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.15) 2px,
                  rgba(0,0,0,0.15) 4px
                )`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: color,
              }}>
                {pad(v)}
              </div>
              <div style={{
                fontSize: 7, color: '#3d5268', letterSpacing: '0.2em',
                marginTop: 3, textTransform: 'uppercase',
              }}>{u}</div>
            </div>

            {/* Séparateur (pas après le dernier) */}
            {i < parts.length - 1 && (
              <div style={{
                fontSize: 20, color,
                opacity: tick ? 1 : 0.2,
                transition: 'opacity 0.1s',
                marginBottom: 14, lineHeight: 1,
                textShadow: glow,
              }}>:</div>
            )}
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{ marginTop: 10 }}>
        <div style={{ height: 1, background: '#1a2535', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: (() => {
              const diff = new Date(deadline) - new Date()
              const total = 7 * 86400000 // référence 7 jours
              return `${Math.max(0, Math.min(100, (diff / total) * 100))}%`
            })(),
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transition: 'width 1s linear',
          }}/>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}