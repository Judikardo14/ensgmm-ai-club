import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPw, setShowPw]   = useState(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: '', filiere: '', promo: '',
    password: '', confirmPassword: '',
    terms: false,
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const pwStrength = (pw) => {
    let score = 0
    if (pw.length >= 8)          score++
    if (/[A-Z]/.test(pw))        score++
    if (/[0-9]/.test(pw))        score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength       = pwStrength(form.password)
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort', 'Excellent']
  const strengthColors = ['', '#FF4B6E', '#FFB830', '#00c468', '#00FF87']

  // ─── Validation par étape ──────────────────────────────────────────────────
  const nextStep = async () => {
  setError('')
  if (step === 1) {
  if (!form.firstName.trim() || !form.lastName.trim())
    return setError('Prénom et nom requis.')
  if (!form.email.trim() || !form.email.includes('@'))
    return setError('Email invalide.')
  if (!form.filiere.trim() || !form.promo)
    return setError('Filière et promotion requises.')

  // Email banni ?
  const { data: isBanned } = await supabase
    .from('banned_emails')
    .select('email')
    .eq('email', form.email.trim().toLowerCase())
    .single()
  if (isBanned) return setError('Cette adresse email est bannie de la plateforme.')

  // Email déjà utilisé ?
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', form.email.trim().toLowerCase())
    .single()
  if (existingUser) return setError('Un compte existe déjà avec cette adresse email.')
}
  if (step === 2) {
    if (!form.password || form.password.length < 8)
      return setError('Mot de passe trop court (8 caractères min).')
    if (form.password !== form.confirmPassword)
      return setError('Les mots de passe ne correspondent pas.')
  }
  setStep(s => s + 1)
}

  // ─── Inscription ───────────────────────────────────────────────────────────
 const handleRegister = async () => {
  if (!form.terms) return setError('Acceptez le règlement pour continuer.')
  setLoading(true); setError('')

  const { data, error: signUpError } = await supabase.auth.signUp({
    email:    form.email.trim().toLowerCase(),
    password: form.password,
    options: {
      data: {
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        filiere:   form.filiere.trim(),
        promo:     parseInt(form.promo),
      }
    }
  })

  if (signUpError) {
    setError(translateAuthError(signUpError.message))
    setLoading(false)
    return
  }

  // Attendre que le trigger crée le profil puis updater
  if (data.user) {
    await new Promise(r => setTimeout(r, 1500))
    await supabase
      .from('profiles')
      .update({
        full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        filiere:   form.filiere.trim(),
        promo:     parseInt(form.promo),
      })
      .eq('id', data.user.id)
  }

  await supabase.auth.signOut()
  setLoading(false)
  setStep(4)
}

  // ─── Traduction erreurs Auth ───────────────────────────────────────────────
  function translateAuthError(msg) {
    if (msg.includes('already registered') || msg.includes('User already registered'))
      return 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.'
    if (msg.includes('Invalid email'))
      return 'Adresse email invalide.'
    if (msg.includes('Password should be at least'))
      return 'Mot de passe trop court (8 caractères minimum).'
    if (msg.includes('rate limit') || msg.includes('too many'))
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    return msg
  }

  // ─── Écran succès ─────────────────────────────────────────────────────────
  if (step === 4) return (
    <div style={styles.page}>
      <div style={styles.bgDots} />
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <div style={{ textAlign: 'center' }}>
            <div style={styles.successCircle}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ ...styles.cardTitle, marginBottom: 8 }}>Compte créé !</div>
            <div style={{ ...styles.cardDesc, marginBottom: 24 }}>
              Bienvenue dans le club IA de l'ENSGMM.<br/>
              Vérifiez votre email pour activer votre compte.
            </div>
            <div style={styles.terminalBox}>
              <div><span style={{ color: '#00FF87' }}>✓</span> Compte créé</div>
              <div><span style={{ color: '#00FF87' }}>→</span> Email de vérification envoyé</div>
              <div style={{ color: '#3d5268' }}>  En attente de confirmation...</div>
            </div>
            <button onClick={() => navigate('/login')} style={{ ...styles.btnPrimary, marginTop: 20 }}>
              ALLER À LA CONNEXION
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Formulaire ───────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.bgDots} />
      <div style={styles.bgGlow} />
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div style={{
        position: 'fixed', left: 0, right: 0, height: 2, pointerEvents: 'none', zIndex: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,135,0.25) 50%, transparent 100%)',
        animation: 'scan 6s linear infinite',
      }}/>

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

        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <div style={styles.cardTitle}>Créer un compte</div>
          <div style={styles.cardDesc}>Rejoignez le club IA de l'ENSGMM</div>

          {/* Steps indicator */}
          <div style={styles.steps}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  ...styles.stepDot,
                  borderColor: step > n ? '#00c468' : step === n ? '#00FF87' : '#243347',
                  color:       step > n ? '#00c468' : step === n ? '#00FF87' : '#3d5268',
                  background:  step > n ? 'rgba(0,255,135,0.1)' : '#060a0f',
                  boxShadow:   step === n ? '0 0 12px rgba(0,255,135,0.3)' : 'none',
                }}>
                  {step > n
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    : n
                  }
                </div>
                {n < 3 && <div style={{ ...styles.stepLine, background: step > n ? '#00c468' : '#1a2535' }}/>}
              </div>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div style={styles.alertError}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Étape 1 : Identité ── */}
               {step === 1 && (
        <div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>PRÉNOM *</label>
              <input style={styles.input} placeholder="Judikardo" value={form.firstName}
                autoCorrect="off" autoCapitalize="words" spellCheck="false"
                onChange={e => set('firstName', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#00c468'}
                onBlur={e => e.target.style.borderColor = '#1a2535'} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>NOM *</label>
              <input style={styles.input} placeholder="Epsilon" value={form.lastName}
                autoCorrect="off" autoCapitalize="words" spellCheck="false"
                onChange={e => set('lastName', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#00c468'}
                onBlur={e => e.target.style.borderColor = '#1a2535'} />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>EMAIL *</label>
            <input type="email" style={styles.input} placeholder="prenom.nom@gmail.com" value={form.email}
              onChange={e => set('email', e.target.value)}
              onFocus={e => e.target.style.borderColor = '#00c468'}
              onBlur={e => e.target.style.borderColor = '#1a2535'} />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>FILIÈRE *</label>
              <select style={styles.select} value={form.filiere} onChange={e => set('filiere', e.target.value)}>
                <option value="">Choisir...</option>
                <option value="GMM">GMM</option>
                <option value="GI">Prépa</option>
                <option value="GC">TP</option>
                <option value="GE">GEP</option>
                <option value="GP">Autre</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>PROMOTION *</label>
              <input type="number" style={styles.input} placeholder="2026" value={form.promo}
                onChange={e => set('promo', e.target.value)} min="2020" max="2035"
                onFocus={e => e.target.style.borderColor = '#00c468'}
                onBlur={e => e.target.style.borderColor = '#1a2535'} />
            </div>
          </div>
          <button onClick={nextStep} style={styles.btnPrimary}>SUIVANT →</button>
        </div>
      )}
                {/* ── Étape 2 : Mot de passe ── */}
          {step === 2 && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>MOT DE PASSE *</label>
                <div style={styles.inputWrap}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    style={styles.input} placeholder="8 caractères minimum"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
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
                {/* Force du mot de passe */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : '#1a2535', transition: 'background 0.3s' }}/>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: strengthColors[strength], letterSpacing: '0.06em' }}>
                      {strengthLabels[strength]}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>CONFIRMER *</label>
                <input
                  type="password" style={{
                    ...styles.input,
                    borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#FF4B6E' : '#1a2535',
                  }}
                  placeholder="Répéter le mot de passe"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#00c468'}
                  onBlur={e => e.target.style.borderColor = form.confirmPassword !== form.password ? '#FF4B6E' : '#1a2535'}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(1)} style={styles.btnGhost}>←</button>
                <button onClick={nextStep} style={{ ...styles.btnPrimary, flex: 1 }}>SUIVANT →</button>
              </div>
            </div>
          )}

          {/* ── Étape 3 : Confirmation ── */}
          {step === 3 && (
            <div>
              <div style={styles.alertInfo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Un email de vérification sera envoyé après création du compte.
              </div>

              {/* Récap */}
              <div style={styles.recapBox}>
                {[
                  ['Nom',      `${form.firstName} ${form.lastName}`],
                  ['Email',    form.email],
                  ['Filière',  form.filiere],
                  ['Promo',    form.promo],
                ].map(([label, value]) => (
                  <div key={label} style={styles.recapRow}>
                    <span style={styles.recapLabel}>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
                <div onClick={() => set('terms', !form.terms)} style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${form.terms ? '#00FF87' : '#243347'}`,
                  background: form.terms ? '#00FF87' : '#060a0f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  {form.terms && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#030507" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize: 11, color: '#6b849e', lineHeight: 1.5 }}>
                  J'accepte le règlement intérieur du club et la politique de confidentialité.
                </span>
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setStep(2)} style={styles.btnGhost}>←</button>
                <button onClick={handleRegister} disabled={loading}
                  style={{ ...styles.btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          Déjà membre ?&nbsp;
          <Link to="/login" style={styles.link}>← Se connecter</Link>
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
    <div style={{ position: 'fixed', width: 60, height: 60, opacity: 0.4, ...positions[pos] }}>
      <div style={{ position: 'absolute', width: 2, height: 30, background: '#00FF87' }} />
      <div style={{ position: 'absolute', width: 30, height: 2, background: '#00FF87' }} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030507', fontFamily: "'IBM Plex Mono', monospace", position: 'relative', overflow: 'hidden' },
  bgDots: { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #1a2535 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.5 },
  bgGlow: { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.04) 0%, transparent 70%)' },
  wrapper: { width: '100%', maxWidth: 440, padding: '20px', zIndex: 10 },
  brand: { textAlign: 'center', marginBottom: 28 },
  brandLogo: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, border: '1.5px solid #00c468', borderRadius: 8, background: 'rgba(0,255,135,0.04)', marginBottom: 14 },
  brandName: { fontFamily: "'Unbounded', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', color: '#6b849e', textTransform: 'uppercase', marginBottom: 4 },
  brandSub: { fontSize: 9, letterSpacing: '0.2em', color: '#3d5268', textTransform: 'uppercase' },
  card: { background: '#0a1018', border: '1px solid #1a2535', borderRadius: 12, padding: 32, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' },
  cardTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.3), transparent)' },
  cardTitle: { fontFamily: "'Unbounded', sans-serif", fontSize: 18, fontWeight: 700, color: '#dce8f5', letterSpacing: '-0.02em', marginBottom: 6 },
  cardDesc: { fontSize: 11, color: '#3d5268', letterSpacing: '0.05em', marginBottom: 24 },
  steps: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepDot: { width: 28, height: 28, borderRadius: '50%', border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, transition: 'all 0.3s' },
  stepLine: { width: 40, height: 1, transition: 'background 0.3s' },
  alertError: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', color: '#FF4B6E', fontSize: 11 },
  alertInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(44,123,229,0.08)', border: '1px solid rgba(44,123,229,0.2)', color: '#2C7BE5', fontSize: 11 },
  formGroup: { marginBottom: 14 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#3d5268', marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8, color: '#dce8f5', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none', transition: 'border-color 0.2s' },
  select: { width: '100%', padding: '11px 14px', background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8, color: '#dce8f5', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: 'none', cursor: 'pointer' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  pwToggle: { position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#3d5268', display: 'flex', alignItems: 'center', padding: 4 },
  recapBox: { background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  recapRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#dce8f5', padding: '5px 0', borderBottom: '1px solid #1a2535' },
  recapLabel: { color: '#3d5268', letterSpacing: '0.06em' },
  btnPrimary: { width: '100%', padding: '12px 20px', marginTop: 4, background: '#00FF87', color: '#030507', border: 'none', borderRadius: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' },
  btnGhost: { padding: '12px 16px', background: 'transparent', color: '#6b849e', border: '1px solid #1a2535', borderRadius: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, cursor: 'pointer' },
  successCircle: { width: 64, height: 64, borderRadius: '50%', border: '2px solid #00FF87', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'rgba(0,255,135,0.08)' },
  terminalBox: { background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8, padding: '14px 16px', fontSize: 11, color: '#dce8f5', letterSpacing: '0.06em', lineHeight: 2, textAlign: 'left' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: '#3d5268' },
  link: { color: '#00FF87', textDecoration: 'none' },
}
