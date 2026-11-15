import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Couleur et libellé selon le statut renvoyé par la base
const COULEURS_STATUT = {
  'Retenu':          '#00FF87',
  "Liste d'attente": '#FFB020',
  "À l'étude":       '#4BA3FF',
  'Non retenu':      '#FF4B6E',
}

export default function ResultatsAICE() {
  const [courriel, setCourriel]           = useState('')
  const [quatreChiffres, setQuatreChiffres] = useState('')
  const [chargement, setChargement]       = useState(false)
  const [erreur, setErreur]               = useState('')
  const [resultat, setResultat]           = useState(null)

  const rechercher = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    setResultat(null)

    const { data, error } = await supabase.rpc('verifier_resultat_aice', {
      p_email: courriel,
      p_whatsapp4: quatreChiffres,
    })

    setChargement(false)

    if (error || !data) {
      setErreur('Une erreur est survenue. Réessaie dans un instant.')
      return
    }
    if (data.etat === 'ferme') {
      setErreur("Les résultats ne sont pas encore publiés. Reviens bientôt !")
    } else if (data.etat === 'trop_de_tentatives') {
      setErreur('Trop de tentatives. Patiente quelques minutes avant de réessayer.')
    } else if (data.etat === 'introuvable') {
      setErreur(
        "Aucune candidature trouvée avec ces informations. Vérifie l'e-mail utilisé dans le formulaire et les 4 derniers chiffres de ton numéro WhatsApp."
      )
    } else if (data.etat === 'ok') {
      setResultat(data)
    }
  }

  const couleur = resultat ? (COULEURS_STATUT[resultat.statut] || '#6b849e') : '#6b849e'

  return (
    <div style={styles.page}>
      <div style={styles.bgDots} />
      <div style={styles.bgGlow} />

      <div style={styles.wrapper}>
        <div style={styles.brand}>
          <div style={styles.brandName}>ENSGMM</div>
          <div style={styles.brandSub}>Artificial Intelligence Club · AICE</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTopLine} />
          <div style={styles.cardTitle}>Résultats de sélection</div>
          <div style={styles.cardDesc}>
            Entre l'e-mail de ta candidature et les 4 derniers chiffres de ton numéro WhatsApp.
          </div>

          {erreur && <div style={styles.alertError}>{erreur}</div>}

          <form onSubmit={rechercher}>
            <div style={styles.formGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                type="email"
                value={courriel}
                onChange={e => setCourriel(e.target.value)}
                placeholder="ton.email@gmail.com"
                required
                style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00c468')}
                onBlur={e => (e.target.style.borderColor = '#1a2535')}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>4 DERNIERS CHIFFRES DU WHATSAPP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={quatreChiffres}
                onChange={e => setQuatreChiffres(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                required
                style={styles.input}
                onFocus={e => (e.target.style.borderColor = '#00c468')}
                onBlur={e => (e.target.style.borderColor = '#1a2535')}
              />
            </div>

            <button type="submit" disabled={chargement} style={{ ...styles.btnPrimary, opacity: chargement ? 0.7 : 1 }}>
              {chargement ? 'RECHERCHE...' : 'VOIR MON RÉSULTAT'}
            </button>
          </form>

          {resultat && (
            <div style={{ ...styles.resultat, borderColor: couleur }}>
              {resultat.nom && <div style={styles.resultatNom}>{resultat.nom}</div>}
              <div style={{ ...styles.badge, color: couleur, borderColor: couleur }}>
                {resultat.statut.toUpperCase()}
              </div>
              <div style={styles.resultatMotif}>{resultat.motif}</div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          Une question ? Contacte le bureau du club.&nbsp;
          <Link to="/login" style={styles.link}>Espace membre →</Link>
        </div>
      </div>
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
  wrapper: { width: '100%', maxWidth: 440, padding: '20px', zIndex: 10 },
  brand: { textAlign: 'center', marginBottom: 28 },
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
  cardDesc: { fontSize: 11, color: '#3d5268', letterSpacing: '0.05em', marginBottom: 24, lineHeight: 1.6 },
  alertError: {
    padding: '10px 14px', borderRadius: 8, marginBottom: 20,
    background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)',
    color: '#FF4B6E', fontSize: 11, letterSpacing: '0.03em', lineHeight: 1.6,
  },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#3d5268', marginBottom: 8 },
  input: {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    background: '#060a0f', border: '1px solid #1a2535', borderRadius: 8,
    color: '#dce8f5', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
    outline: 'none', transition: 'border-color 0.2s',
  },
  btnPrimary: {
    width: '100%', padding: '12px 20px', marginTop: 8,
    background: '#00FF87', color: '#030507', border: 'none', borderRadius: 8,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
    letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s',
  },
  resultat: {
    marginTop: 24, padding: 20, borderRadius: 10,
    background: '#060a0f', border: '1px solid',
  },
  resultatNom: { fontSize: 13, color: '#dce8f5', marginBottom: 12 },
  badge: {
    display: 'inline-block', padding: '4px 10px', borderRadius: 6, border: '1px solid',
    fontSize: 10, letterSpacing: '0.15em', fontWeight: 600, marginBottom: 14,
  },
  resultatMotif: { fontSize: 12, color: '#6b849e', lineHeight: 1.7 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: '#3d5268' },
  link: { color: '#00FF87', textDecoration: 'none', letterSpacing: '0.04em' },
}
