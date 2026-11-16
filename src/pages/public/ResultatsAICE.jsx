import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Apparence de chaque statut renvoyé par la base
const STATUTS = {
  'Retenu':          { couleur: '#00FF87', rgb: '0,255,135',  icone: 'coche'   },
  "Liste d'attente": { couleur: '#FFC24B', rgb: '255,194,75', icone: 'horloge' },
  "À l'étude":       { couleur: '#5BB4FF', rgb: '91,180,255', icone: 'loupe'   },
  'Non retenu':      { couleur: '#FF6B8A', rgb: '255,107,138', icone: 'croix'  },
}
// Détail du barème (à garder identique à BAREME dans selection_aice.py)
const CRITERES = [
  { cle: 'pts_motivation',    etiquette: 'Motivation',     max: 35 },
  { cle: 'pts_valeur',        etiquette: 'Valeur ajoutée', max: 35 },
  { cle: 'pts_serieux',       etiquette: 'Sérieux',        max: 20 },
  { cle: 'pts_preoccupation', etiquette: 'Préoccupation',  max: 10 },
]

const STATUT_PAR_DEFAUT = { couleur: '#9fb4cc', rgb: '159,180,204', icone: 'loupe' }

const CSS = `
@keyframes aiceFlotte {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(0, 18px, 0) scale(1.06); }
}
@keyframes aiceMonte {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
@keyframes aicePulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.12); }
}
@keyframes aiceTourne { to { transform: rotate(360deg); } }
@keyframes aiceBarre {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.aice-barre { transform-origin: left center; animation: aiceBarre 0.9s cubic-bezier(.2,.7,.2,1) 0.25s both; }
.aice-entree { animation: aiceMonte 0.7s cubic-bezier(.2,.7,.2,1) both; }
.aice-champ {
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.aice-champ::placeholder { color: #4d6580; }
.aice-champ:focus {
  border-color: #00FF87 !important;
  background: #0b1622 !important;
  box-shadow: 0 0 0 3px rgba(0,255,135,.14), 0 0 26px rgba(0,255,135,.14);
}
.aice-bouton { transition: transform .15s, box-shadow .25s, filter .25s; }
.aice-bouton:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.07);
  box-shadow: 0 10px 38px rgba(0,255,135,.42), 0 0 0 1px rgba(255,255,255,.12) inset !important;
}
.aice-bouton:active:not(:disabled) { transform: none; }
.aice-lien:hover { text-shadow: 0 0 14px rgba(0,255,135,.7); }

@media (max-width: 480px) {
  .aice-carte { padding: 26px 20px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .aice-entree, .aice-barre, .aice-orbe, .aice-halo, .aice-spinner { animation: none !important; }
}
`

export default function ResultatsAICE() {
  const [courriel, setCourriel]             = useState('')
  const [quatreChiffres, setQuatreChiffres] = useState('')
  const [chargement, setChargement]         = useState(false)
  const [erreur, setErreur]                 = useState('')
  const [messageAttente, setMessageAttente] = useState('')
  const [resultat, setResultat]             = useState(null)

  // Appel avec délai maximum : sur une connexion lente, on réessaie automatiquement
  // (2 fois) au lieu de laisser le candidat recharger la page et gaspiller ses essais.
  const appelerServeur = async () => {
    const DELAI_MS = 15000
    let derniere = { data: null, error: new Error('inconnu') }
    for (let essai = 1; essai <= 3; essai++) {
      const controleur = new AbortController()
      const minuteur = setTimeout(() => controleur.abort(), DELAI_MS)
      try {
        const reponse = await supabase
          .rpc('verifier_resultat_aice', { p_email: courriel, p_whatsapp4: quatreChiffres })
          .abortSignal(controleur.signal)
        if (!reponse.error && reponse.data) return reponse
        derniere = reponse
      } catch (err) {
        derniere = { data: null, error: err }
      } finally {
        clearTimeout(minuteur)
      }
      if (essai < 3) {
        setMessageAttente('Connexion lente, nouvelle tentative en cours…')
        await new Promise(r => setTimeout(r, 1200))
      }
    }
    return derniere
  }

  const rechercher = async (e) => {
    e.preventDefault()
    if (chargement) return            // évite les doubles envois
    setChargement(true)
    setMessageAttente('')
    setErreur('')
    setResultat(null)

    const { data, error } = await appelerServeur()

    setChargement(false)
    setMessageAttente('')

    if (error || !data) {
      setErreur('Connexion trop lente ou instable. Vérifie ton réseau puis appuie à nouveau sur le bouton (inutile de recharger la page).')
      return
    }
    if (data.etat === 'ferme') {
      setErreur('Les résultats ne sont pas encore publiés. Reviens bientôt !')
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

  // On n'affiche le lien que s'il s'agit bien d'une invitation WhatsApp
  const lienWhatsapp = resultat && typeof resultat.lien_whatsapp === 'string'
    && resultat.lien_whatsapp.startsWith('https://chat.whatsapp.com/')
    ? resultat.lien_whatsapp : null

  const apparence = resultat ? (STATUTS[resultat.statut] || STATUT_PAR_DEFAUT) : null

  return (
    <div style={styles.page}>
      <style>{CSS}</style>

      {/* Fond lumineux */}
      <div style={styles.fondPoints} />
      <div className="aice-orbe" style={{ ...styles.orbe, ...styles.orbeVerte }} />
      <div className="aice-orbe" style={{ ...styles.orbe, ...styles.orbeBleue }} />

      <div style={styles.conteneur}>
        {/* Marque */}
        <div className="aice-entree" style={styles.marque}>
          <div style={styles.logo}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00FF87" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" />
              <circle cx="4" cy="18" r="2" /><circle cx="20" cy="18" r="2" />
              <line x1="12" y1="9" x2="4" y2="7" /><line x1="12" y1="9" x2="20" y2="7" />
              <line x1="12" y1="15" x2="4" y2="17" /><line x1="12" y1="15" x2="20" y2="17" />
            </svg>
          </div>
          <div style={styles.marqueNom}>ENSGMM</div>
          <div style={styles.marqueSous}>Artificial Intelligence Club</div>
        </div>

        {/* Carte */}
        <div className="aice-entree aice-carte" style={{ ...styles.carte, animationDelay: '0.08s' }}>
          <div style={styles.carteLigne} />

          <div style={styles.pastille}>
            <span style={styles.pastillePoint} /> RÉSULTATS · AICE
          </div>
          <h1 style={styles.titre}>Résultats de sélection</h1>
          <p style={styles.description}>
            Entre l'e-mail de ta candidature et les 4 derniers chiffres de ton numéro WhatsApp.
          </p>

          <div role="status" aria-live="polite">
            {erreur && (
              <div style={styles.alerte}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{erreur}</span>
              </div>
            )}
          </div>

          <form onSubmit={rechercher}>
            <div style={styles.groupe}>
              <label htmlFor="aice-courriel" style={styles.etiquette}>E-MAIL</label>
              <div style={styles.champWrap}>
                <svg style={styles.champIcone} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                </svg>
                <input
                  id="aice-courriel"
                  className="aice-champ"
                  type="email"
                  value={courriel}
                  onChange={e => setCourriel(e.target.value)}
                  placeholder="ton.email@gmail.com"
                  autoComplete="email"
                  required
                  style={styles.champ}
                />
              </div>
            </div>

            <div style={styles.groupe}>
              <label htmlFor="aice-whatsapp" style={styles.etiquette}>4 DERNIERS CHIFFRES DU WHATSAPP</label>
              <div style={styles.champWrap}>
                <svg style={styles.champIcone} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="6" y="2" width="12" height="20" rx="2.5" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                <input
                  id="aice-whatsapp"
                  className="aice-champ"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={quatreChiffres}
                  onChange={e => setQuatreChiffres(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  required
                  style={{ ...styles.champ, letterSpacing: '0.35em' }}
                />
              </div>
            </div>

            <button type="submit" disabled={chargement} className="aice-bouton" style={{ ...styles.bouton, opacity: chargement ? 0.75 : 1 }}>
              {chargement ? (
                <span style={styles.boutonContenu}>
                  <span className="aice-spinner" style={styles.spinner} /> RECHERCHE…
                </span>
              ) : (
                <span style={styles.boutonContenu}>
                  VOIR MON RÉSULTAT
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
            {chargement && messageAttente && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#6b849e', textAlign: 'center' }}>{messageAttente}</div>
            )}
          </form>

          {/* Résultat */}
          {resultat && (
            <div
              key={resultat.statut + resultat.nom}
              className="aice-entree"
              style={{
                ...styles.resultat,
                borderColor: `rgba(${apparence.rgb},0.45)`,
                background: `linear-gradient(180deg, rgba(${apparence.rgb},0.10) 0%, rgba(6,12,19,0.85) 70%)`,
                boxShadow: `0 0 60px rgba(${apparence.rgb},0.14), inset 0 1px 0 rgba(${apparence.rgb},0.25)`,
              }}
            >
              <div style={styles.iconeZone}>
                <div
                  className="aice-halo"
                  style={{
                    ...styles.halo,
                    background: `radial-gradient(circle, rgba(${apparence.rgb},0.45) 0%, transparent 68%)`,
                    animation: 'aicePulse 3.2s ease-in-out infinite',
                  }}
                />
                <div style={{
                  ...styles.iconeRond,
                  borderColor: apparence.couleur,
                  color: apparence.couleur,
                  boxShadow: `0 0 28px rgba(${apparence.rgb},0.45), inset 0 0 18px rgba(${apparence.rgb},0.15)`,
                }}>
                  <IconeStatut type={apparence.icone} />
                </div>
              </div>

              {resultat.nom && <div style={styles.resultatNom}>{resultat.nom}</div>}

              <div style={{
                ...styles.badge,
                color: apparence.couleur,
                borderColor: `rgba(${apparence.rgb},0.55)`,
                background: `rgba(${apparence.rgb},0.10)`,
              }}>
                {resultat.statut.toUpperCase()}
              </div>

              <div style={{ ...styles.separateur, background: `linear-gradient(90deg, transparent, rgba(${apparence.rgb},0.45), transparent)` }} />

              {resultat.score !== null && resultat.score !== undefined && (
                <div style={styles.scoreBloc}>
                  <div style={styles.scoreLigne}>
                    <span style={{ ...styles.scoreNombre, color: apparence.couleur, textShadow: `0 0 26px rgba(${apparence.rgb},0.55)` }}>
                      {resultat.score}
                    </span>
                    <span style={styles.scoreSur}>/ 100</span>
                  </div>
                  <div style={styles.scoreLegende}>SCORE TOTAL</div>

                  <div style={styles.criteres}>
                    {CRITERES.map(critere => {
                      const valeur = resultat[critere.cle] ?? 0
                      const part = Math.max(0, Math.min(1, valeur / critere.max))
                      return (
                        <div key={critere.cle} style={styles.critere}>
                          <div style={styles.critereTete}>
                            <span>{critere.etiquette}</span>
                            <span style={{ color: '#e6f0fb' }}>
                              {valeur}<span style={{ color: '#6c86a3' }}> / {critere.max}</span>
                            </span>
                          </div>
                          <div style={styles.barreFond}>
                            <div
                              className="aice-barre"
                              style={{
                                ...styles.barre,
                                width: `${part * 100}%`,
                                background: `linear-gradient(90deg, rgba(${apparence.rgb},0.55), ${apparence.couleur})`,
                                boxShadow: `0 0 12px rgba(${apparence.rgb},0.5)`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ ...styles.separateur, margin: '22px auto 18px', background: `linear-gradient(90deg, transparent, rgba(${apparence.rgb},0.45), transparent)` }} />
                </div>
              )}

              <p style={styles.resultatMotif}>{resultat.motif}</p>

              {lienWhatsapp && (
                <div style={styles.groupeBloc}>
                  <div style={styles.groupeTexte}>
                    Dernière étape : rejoins le groupe WhatsApp dédié à la phase suivante.
                  </div>
                  <a
                    href={lienWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aice-bouton"
                    style={styles.boutonWhatsapp}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.93 9.93 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.07-1.17.1-1.9-.12-.44-.14-1-.33-1.7-.64-3-1.3-4.95-4.33-5.1-4.53-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.8-.37h.58c.18 0 .43-.07.67.52.25.6.84 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5l-.45.52c-.15.15-.3.3-.13.6.17.3.77 1.27 1.65 2.06 1.13 1 2.08 1.32 2.38 1.47.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.07.12.07.72-.18 1.42Z"/>
                    </svg>
                    REJOINDRE LE GROUPE
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="aice-entree" style={{ ...styles.pied, animationDelay: '0.16s' }}>
          Une question ? Contacte le bureau du club.&nbsp;
          <Link to="/login" className="aice-lien" style={styles.lien}>Espace membre →</Link>
        </div>
      </div>
    </div>
  )
}

function IconeStatut({ type }) {
  const commun = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'coche') {
    return <svg {...commun}><polyline points="5 12.5 10 17.5 19 7.5" /></svg>
  }
  if (type === 'horloge') {
    return <svg {...commun}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
  }
  if (type === 'croix') {
    return <svg {...commun}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
  }
  return <svg {...commun}><circle cx="11" cy="11" r="6.5" /><line x1="16" y1="16" x2="20.5" y2="20.5" /></svg>
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse 90% 70% at 50% -10%, #0d1f1c 0%, #060c14 55%, #04070b 100%)',
    fontFamily: "'IBM Plex Mono', monospace", position: 'relative', overflow: 'hidden',
  },
  fondPoints: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(120,165,205,0.22) 1px, transparent 1px)',
    backgroundSize: '34px 34px',
    WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 38%, #000 25%, transparent 80%)',
    maskImage: 'radial-gradient(ellipse 75% 65% at 50% 38%, #000 25%, transparent 80%)',
  },
  orbe: {
    position: 'fixed', borderRadius: '50%', pointerEvents: 'none',
    filter: 'blur(90px)', animation: 'aiceFlotte 11s ease-in-out infinite',
  },
  orbeVerte: {
    width: 460, height: 460, top: -140, left: '50%', marginLeft: -230,
    background: 'rgba(0,255,135,0.20)',
  },
  orbeBleue: {
    width: 380, height: 380, bottom: -140, right: -80,
    background: 'rgba(60,150,255,0.16)', animationDelay: '-5s',
  },
  conteneur: { width: '100%', maxWidth: 450, padding: '28px 20px', zIndex: 10 },

  marque: { textAlign: 'center', marginBottom: 26 },
  logo: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 60, height: 60, borderRadius: 16, marginBottom: 14,
    border: '1px solid rgba(0,255,135,0.55)',
    background: 'linear-gradient(145deg, rgba(0,255,135,0.14), rgba(0,255,135,0.03))',
    boxShadow: '0 0 34px rgba(0,255,135,0.28), inset 0 0 16px rgba(0,255,135,0.10)',
  },
  marqueNom: {
    fontFamily: "'Unbounded', sans-serif", fontSize: 12, fontWeight: 700,
    letterSpacing: '0.3em', color: '#c3d4e6', textTransform: 'uppercase', marginBottom: 5,
  },
  marqueSous: { fontSize: 9.5, letterSpacing: '0.22em', color: '#6c86a3', textTransform: 'uppercase' },

  carte: {
    background: 'linear-gradient(180deg, rgba(19,32,47,0.92) 0%, rgba(10,18,28,0.94) 100%)',
    WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
    border: '1px solid rgba(130,170,210,0.18)', borderRadius: 18,
    padding: 34, position: 'relative', overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 0 90px rgba(0,255,135,0.08)',
  },
  carteLigne: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.75), transparent)',
  },
  pastille: {
    display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
    padding: '5px 12px', borderRadius: 999, fontSize: 9.5, letterSpacing: '0.2em',
    color: '#00FF87', background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.28)',
  },
  pastillePoint: {
    width: 6, height: 6, borderRadius: '50%', background: '#00FF87',
    boxShadow: '0 0 10px #00FF87',
  },
  titre: {
    fontFamily: "'Unbounded', sans-serif", fontSize: 22, fontWeight: 700, margin: '0 0 8px',
    color: '#f3f9ff', letterSpacing: '-0.02em', lineHeight: 1.25,
    textShadow: '0 0 28px rgba(0,255,135,0.28)',
  },
  description: { fontSize: 12, color: '#8aa3bf', lineHeight: 1.7, margin: '0 0 26px' },

  alerte: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 14px', borderRadius: 10, marginBottom: 20,
    background: 'rgba(255,107,138,0.09)', border: '1px solid rgba(255,107,138,0.32)',
    color: '#ff8da6', fontSize: 11.5, lineHeight: 1.65,
  },

  groupe: { marginBottom: 18 },
  etiquette: { display: 'block', fontSize: 10, letterSpacing: '0.16em', color: '#7f98b3', marginBottom: 9 },
  champWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  champIcone: { position: 'absolute', left: 15, color: '#5d7894', pointerEvents: 'none' },
  champ: {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px',
    background: '#08111b', border: '1px solid #24364b', borderRadius: 10,
    color: '#eef6ff', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5, outline: 'none',
  },

  bouton: {
    width: '100%', padding: '14px 20px', marginTop: 6, border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #3dffa6 0%, #00FF87 45%, #00d974 100%)',
    color: '#03110a', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, fontWeight: 600,
    letterSpacing: '0.12em', cursor: 'pointer',
    boxShadow: '0 6px 28px rgba(0,255,135,0.30), 0 0 0 1px rgba(255,255,255,0.10) inset',
  },
  boutonContenu: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(3,17,10,0.25)', borderTopColor: '#03110a',
    animation: 'aiceTourne 0.8s linear infinite',
  },

  resultat: {
    marginTop: 28, padding: '28px 22px 24px', borderRadius: 14, textAlign: 'center',
    border: '1px solid',
  },
  iconeZone: { position: 'relative', width: 84, height: 84, margin: '0 auto 14px' },
  halo: { position: 'absolute', inset: -22, borderRadius: '50%' },
  iconeRond: {
    position: 'absolute', inset: 8, borderRadius: '50%', border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,10,16,0.75)',
  },
  resultatNom: { fontSize: 15, color: '#f3f9ff', marginBottom: 12, fontWeight: 500, letterSpacing: '0.01em' },
  badge: {
    display: 'inline-block', padding: '6px 14px', borderRadius: 999, border: '1px solid',
    fontSize: 10.5, letterSpacing: '0.2em', fontWeight: 600,
  },
  separateur: { height: 1, margin: '20px auto 18px', width: '70%' },
  resultatMotif: { fontSize: 12.5, color: '#c1d2e5', lineHeight: 1.8, margin: 0 },

  scoreBloc: { margin: '4px 0 0' },
  scoreLigne: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  scoreNombre: { fontFamily: "'Unbounded', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1 },
  scoreSur: { fontSize: 14, color: '#6c86a3' },
  scoreLegende: { fontSize: 9.5, letterSpacing: '0.22em', color: '#7f98b3', margin: '8px 0 20px' },
  criteres: { display: 'grid', gap: 13, textAlign: 'left' },
  critere: {},
  critereTete: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9fb4cc', marginBottom: 6 },
  barreFond: { height: 6, borderRadius: 999, background: 'rgba(130,170,210,0.14)', overflow: 'hidden' },
  barre: { height: '100%', borderRadius: 999 },

  groupeBloc: {
    marginTop: 22, padding: '18px 16px', borderRadius: 12, textAlign: 'center',
    background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.30)',
  },
  groupeTexte: { fontSize: 12, color: '#c1d2e5', lineHeight: 1.7, marginBottom: 14 },
  boutonWhatsapp: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 10,
    background: 'linear-gradient(135deg, #3be07a 0%, #25D366 55%, #1ebe5a 100%)',
    color: '#04140a', textDecoration: 'none', fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
    boxShadow: '0 6px 26px rgba(37,211,102,0.32), 0 0 0 1px rgba(255,255,255,0.10) inset',
  },

  pied: { textAlign: 'center', marginTop: 22, fontSize: 11, color: '#6c86a3' },
  lien: { color: '#00FF87', textDecoration: 'none', letterSpacing: '0.04em', transition: 'text-shadow .2s' },
}
