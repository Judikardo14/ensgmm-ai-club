import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Une erreur est survenue. Vérifiez votre email.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgDots} />
      <div style={styles.bgGlow} />
      <Corner pos="tl"/><Corner pos="tr"/><Corner pos="bl"/><Corner pos="br"/>

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
          <div style={styles.cardTopLine}/>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 15, fontWeight: 700, color: '#dce8f5', marginBottom: 10 }}>
                Email envoyé !
              </div>
              <div style={{ fontSize: 11, color: '#3d5268', lineHeight: 1.7, marginBottom: 24 }}>
                Un lien de réinitialisation a été envoyé à<br/>
                <span style={{ color: '#00FF87' }}>{email}</span>.<br/>
                Vérifiez aussi vos spams.
              </div>
              <div style={styles.terminalBox}>
                <div><span style={{ color: '#00FF87' }}>✓</span> Email envoyé</div>
                <div><span style={{ color: '#00FF87' }}>→</span> Lien valable 1 heure</div>
                <div style={{ color: '#3d5268' }}>  En attente de confirmation...</div>
              </div>
              <Link to="/login" style={{ ...styles.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 20 }}>
                ← RETOUR À LA CONNEXION
              </Link>
            </div>
          ) : (
            <>
              <div style={styles.cardTitle}>Mot de passe oublié</div>
              <div style={styles.cardDesc}>
                Entrez votre email et nous vous enverrons un lien de réinitialisation.
              </div>

              {error && (
                <div style={styles.alertError}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>EMAIL</label>
                  <div style={styles.inputWrap}>
                    <svg style={styles.inputIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>
                    </svg>
                    <input
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="votre.email@gmail.com"
                      style={styles.input}
                      onFocus={e => e.target.style.borderColor = '#00c468'}
                      onBlur={e => e.target.style.borderColor = '#1a2535'}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'ENVOI...' : 'ENVOYER LE LIEN →'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={styles.footer}>
          <Link to="/login" style={styles.link}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}

function Corner({ pos }) {
  const positions = { tl:{top:20,left:20}, tr:{top:20,right:20,transform:'scaleX(-1)'}, bl:{bottom:20,left:20,transform:'scaleY(-1)'}, br:{bottom:20,right:20,transform:'scale(-1)'} }
  return (
    <div style={{ position:'fixed', width:60, height:60, opacity:0.4, ...positions[pos] }}>
      <div style={{ position:'absolute', width:2, height:30, background:'#00FF87' }}/>
      <div style={{ position:'absolute', width:30, height:2, background:'#00FF87' }}/>
    </div>
  )
}

const styles = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#030507', fontFamily:"'IBM Plex Mono',monospace", position:'relative', overflow:'hidden' },
  bgDots: { position:'fixed', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle, #1a2535 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.5 },
  bgGlow: { position:'fixed', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,255,135,0.04) 0%, transparent 70%)' },
  wrapper: { width:'100%', maxWidth:420, padding:'20px', zIndex:10 },
  brand: { textAlign:'center', marginBottom:28 },
  brandLogo: { display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, border:'1.5px solid #00c468', borderRadius:8, background:'rgba(0,255,135,0.04)', marginBottom:14 },
  brandName: { fontFamily:"'Unbounded',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.25em', color:'#6b849e', textTransform:'uppercase', marginBottom:4 },
  brandSub: { fontSize:9, letterSpacing:'0.2em', color:'#3d5268', textTransform:'uppercase' },
  card: { background:'#0a1018', border:'1px solid #1a2535', borderRadius:12, padding:32, position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.6)' },
  cardTopLine: { position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(0,255,135,0.3),transparent)' },
  cardTitle: { fontFamily:"'Unbounded',sans-serif", fontSize:18, fontWeight:700, color:'#dce8f5', letterSpacing:'-0.02em', marginBottom:6 },
  cardDesc: { fontSize:11, color:'#3d5268', letterSpacing:'0.05em', marginBottom:24, lineHeight:1.6 },
  alertError: { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, marginBottom:20, background:'rgba(255,75,110,0.08)', border:'1px solid rgba(255,75,110,0.2)', color:'#FF4B6E', fontSize:11 },
  formGroup: { marginBottom:16 },
  label: { display:'block', fontSize:10, letterSpacing:'0.15em', color:'#3d5268', marginBottom:8 },
  inputWrap: { position:'relative', display:'flex', alignItems:'center' },
  inputIcon: { position:'absolute', left:14, color:'#3d5268', pointerEvents:'none' },
  input: { width:'100%', padding:'11px 14px 11px 40px', background:'#060a0f', border:'1px solid #1a2535', borderRadius:8, color:'#dce8f5', fontFamily:"'IBM Plex Mono',monospace", fontSize:13, outline:'none', transition:'border-color 0.2s' },
  btnPrimary: { width:'100%', padding:'12px 20px', marginTop:8, background:'#00FF87', color:'#030507', border:'none', borderRadius:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, fontWeight:600, letterSpacing:'0.1em', cursor:'pointer', transition:'all 0.2s' },
  terminalBox: { background:'#060a0f', border:'1px solid #1a2535', borderRadius:8, padding:'14px 16px', fontSize:11, color:'#dce8f5', letterSpacing:'0.06em', lineHeight:2, textAlign:'left' },
  footer: { textAlign:'center', marginTop:20, fontSize:11, color:'#3d5268' },
  link: { color:'#00FF87', textDecoration:'none' },
}