import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setError('Email ou mot de passe incorrect.')
    setLoading(false)
    return
  }

  // Récupérer le profil pour connaître le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    navigate('/admin')
  } else {
    navigate('/dashboard')
  }

  }

  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bgDots} />
      <div style={styles.bgGlow} />
      <div style={styles.scanLine} />

      {/* Corners */}
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

      <div style={styles.wrapper}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.brandLogo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
              <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
              <line x1="12" y1="9" x2="4" y2="7"/><line x1="12" y1="9" x2="20" y2="7"/>
              <line x1="12" y1="15" x2="4" y2="17"/><line x1="12" y1="15" x2="20" y2="17"/>
            </svg>
          </div>
          <div style={styles.brandName}>ENSGMM</div>
          <div style={styles.brandSub}>Artificial Intelligence Club</div>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <div style={styles.cardTitle}>Connexion</div>
          <div style={styles.cardDesc}>Accédez à votre espace membre</div>

          {error && (
            <div style={styles.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <div style={styles.inputWrap}>
                <svg style={styles.inputIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre.email@gmail.com"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#00c468'}
                  onBlur={e => e.target.style.borderColor = '#1a2535'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.formGroup}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <label style={styles.label}>MOT DE PASSE</label>
                <Link to="/forgot" style={styles.linkSmall}>Oublié ?</Link>
              </div>
              <div style={styles.inputWrap}>
                <svg style={styles.inputIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#00c468'}
                  onBlur={e => e.target.style.borderColor = '#1a2535'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={styles.pwToggle}>
                  {showPw
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1}}>
              {loading ? 'CONNEXION...' : 'ACCÉDER AU SYSTÈME'}
            </button>
          </form>
        </div>

        <div style={styles.footer}>
          Pas encore membre ?&nbsp;
          <Link to="/register" style={styles.link}>Rejoindre le club →</Link>
        </div>
      </div>
    </div>
  )
}

function Corner({ pos }) {
  const positions = {
    tl: { top: 20, left: 20 },
    tr: { top: 20, right: 20, transform: 'scaleX(-1)' },
    bl: { bottom: 20, left: 20, transform: 'scaleY(-1)' },
    br: { bottom: 20, right: 20, transform: 'scale(-1)' },
  }
  return (
    <div style={{ position:'fixed', width:60, height:60, opacity:0.4, ...positions[pos] }}>
      <div style={{ position:'absolute', width:2, height:30, background:'#00FF87' }} />
      <div style={{ position:'absolute', width:30, height:2, background:'#00FF87' }} />
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#030507',
    fontFamily: "'IBM Plex Mono', monospace", position: 'relative', overflow: 'hidden',
  },
  bgDots: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, #1a2535 1px, transparent 1px)',
    backgroundSize: '32px 32px', opacity: 0.5,
  },
  bgGlow: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.04) 0%, transparent 70%)',
  },
  scanLine: {
    position: 'fixed', left: 0, right: 0, height: 2, pointerEvents: 'none',
    background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,135,0.25) 50%, transparent 100%)',
    animation: 'scan 6s linear infinite',
  },
  wrapper: { width: '100%', maxWidth: 420, padding: '20px', zIndex: 10 },
  brand: { textAlign: 'center', marginBottom: 28 },
  brandLogo: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 56, height: 56, border: '1.5px solid #00c468', borderRadius: 8,
    background: 'rgba(0,255,135,0.04)', marginBottom: 14,
  },
  brandName: {
    fontFamily: "'Unbounded', sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: '0.25em', color: '#6b849e', textTransform: 'uppercase', marginBottom: 4,
  },
  brandSub: { fontSize: 9, letterSpacing: '0.2em', color: '#3d5268', textTransform: 'uppercase' },
  card: {
    background: '#0a1018', border: '1px solid #1a2535', borderRadius: 12,
    padding: 32, position: 'relative', overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  cardTopLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.3), transparent)',
  },
  cardTitle: {
    fontFamily: "'Unbounded', sans-serif", fontSize: 18, fontWeight: 700,
    color: '#dce8f5', letterSpacing: '-0.02em', marginBottom: 6,
  },
  cardDesc: { fontSize: 11, color: '#3d5268', letterSpacing: '0.05em', marginBottom: 24 },
  alertError: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 8, marginBottom: 20,
    background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)',
    color: '#FF4B6E', fontSize: 11, letterSpacing: '0.03em',
  },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#3d5268', marginBottom: 8 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#3d5268', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '11px 14px 11px 40px',
    background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8,
    color: '#dce8f5', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
    outline: 'none', transition: 'border-color 0.2s',
  },
  pwToggle: {
    position: 'absolute', right: 12, background: 'none', border: 'none',
    cursor: 'pointer', color: '#3d5268', display: 'flex', alignItems: 'center', padding: 4,
  },
  btnPrimary: {
    width: '100%', padding: '12px 20px', marginTop: 8,
    background: '#00FF87', color: '#030507', border: 'none', borderRadius: 8,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
    letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
  },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: '#3d5268' },
  link: { color: '#00FF87', textDecoration: 'none', letterSpacing: '0.04em' },
  linkSmall: { color: '#00FF87', textDecoration: 'none', fontSize: 10, letterSpacing: '0.05em' },
}
