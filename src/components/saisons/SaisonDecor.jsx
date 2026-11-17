import { useEffect, useMemo, useState } from 'react'
import { saisonActive } from '../../lib/saisons'
import './saisons.css'

// Lecture / écriture protégées : le navigateur peut refuser le stockage.
const lire = (cle) => { try { return localStorage.getItem(cle) } catch { return null } }
const ecrire = (cle, valeur) => { try { localStorage.setItem(cle, valeur) } catch { /* ignoré */ } }

// Nombre pseudo-aléatoire stable (mêmes positions à chaque rendu, sans Math.random).
const alea = (i, graine) => {
  const x = Math.sin(i * 9301 + graine * 49297) * 233280
  return x - Math.floor(x)
}

function lireSaisonForcee() {
  try {
    const p = new URLSearchParams(window.location.search).get('saison')
    if (p) { sessionStorage.setItem('saison-forcee', p); return p }
    return sessionStorage.getItem('saison-forcee')
  } catch { return null }
}

// Sapin enneigé (forêt du bas de l'écran)
const Arbre = ({ hauteur, delai, nuance }) => (
  <svg viewBox="0 0 100 140" className="saison-arbre" style={{ height: hauteur, animationDelay: `${delai}s` }} aria-hidden="true">
    <rect x="44" y="118" width="12" height="22" rx="2" fill="#5a3a1e" />
    <polygon points="50,52 94,120 6,120" fill={nuance[2]} />
    <polygon points="50,28 84,86 16,86" fill={nuance[1]} />
    <polygon points="50,4 72,52 28,52" fill={nuance[0]} />
    <path d="M50 4 L72 52 L62 48 L55 54 L50 46 L45 54 L38 48 L28 52 Z" fill="#f4f8ff" opacity="0.82" />
    <path d="M30 78 L50 28 L70 78 L62 74 L55 82 L50 74 L45 82 L38 74 Z" fill="#f4f8ff" opacity="0.74" />
    <path d="M14 112 L50 52 L86 112 L74 108 L64 118 L50 106 L36 118 L26 108 Z" fill="#f4f8ff" opacity="0.7" />
  </svg>
)

const NUANCES = [['#1c9a4c', '#168a46', '#0f7a3c'], ['#17803f', '#117038', '#0c602f'], ['#23a857', '#1c9a4c', '#168a46']]

function Foret({ petitEcran }) {
  const arbres = useMemo(() => {
    const n = petitEcran ? 7 : 16
    return Array.from({ length: n }, (_, i) => ({
      gauche: (i / (n - 1)) * 100 + (alea(i, 21) - 0.5) * 4,
      hauteur: (petitEcran ? 46 : 70) + alea(i, 22) * (petitEcran ? 34 : 64),
      delai: -alea(i, 23) * 6,
      nuance: NUANCES[i % 3],
    }))
  }, [petitEcran])
  return (
    <div className="saison-foret" aria-hidden="true">
      {arbres.map((a, i) => (
        <div key={i} className="saison-foret-arbre" style={{ left: `${a.gauche}%` }}>
          <Arbre hauteur={a.hauteur} delai={a.delai} nuance={a.nuance} />
        </div>
      ))}
      <div className="saison-sol" />
    </div>
  )
}

const Fanions = ({ petitEcran }) => (
  <div className="saison-fanions" aria-hidden="true">
    {Array.from({ length: petitEcran ? 14 : 40 }, (_, i) => (
      <span key={i} style={{ '--c': ['#008751', '#fcd116', '#e8112d'][i % 3], animationDelay: `${(i % 7) * 0.25}s` }} />
    ))}
  </div>
)

const Ruban = () => (
  <svg viewBox="0 0 80 110" width="100%" aria-hidden="true">
    <path d="M40 8 C16 8 12 36 24 50 C32 60 40 66 40 66 C40 66 48 60 56 50 C68 36 64 8 40 8 Z M40 20 C30 20 28 34 34 42 L40 49 L46 42 C52 34 50 20 40 20 Z" fill="#ff5aa5" fillRule="evenodd" />
    <path d="M40 62 L22 102 L32 98 L40 78 Z" fill="#ff7eb6" />
    <path d="M40 62 L58 102 L48 98 L40 78 Z" fill="#ff5aa5" />
  </svg>
)

const Croissant = () => (
  <svg viewBox="0 0 100 100" width="100%" aria-hidden="true">
    <defs>
      <mask id="saison-masque-lune">
        <rect width="100" height="100" fill="#fff" />
        <circle cx="62" cy="40" r="34" fill="#000" />
      </mask>
    </defs>
    <circle cx="46" cy="50" r="38" fill="#f5d37a" mask="url(#saison-masque-lune)" />
    <polygon points="76,22 79,31 88,31 81,37 84,46 76,41 68,46 71,37 64,31 73,31" fill="#f5d37a" className="saison-etoile-sapin" />
  </svg>
)

const DECORS = { ruban: Ruban, croissant: Croissant }

export default function SaisonDecor() {
  const saison = useMemo(() => saisonActive(new Date(), lireSaisonForcee()), [])
  const [actif, setActif] = useState(() => lire('saison-off') !== '1')
  const [salut, setSalut] = useState(false)
  const [petitEcran] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches)
  const [reduit] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // Attribut sur <html> : permet d'adapter des styles par saison si besoin.
  useEffect(() => {
    if (!saison) return
    document.documentElement.setAttribute('data-saison', saison.id)
    return () => document.documentElement.removeAttribute('data-saison')
  }, [saison])

  // Message d'accueil : une fois par saison et par année, puis il disparaît seul.
  useEffect(() => {
    if (!saison || !actif) return
    const cle = `saison-salut-${saison.id}-${new Date().getFullYear()}`
    if (lire(cle)) return
    ecrire(cle, '1')
    const debut = setTimeout(() => setSalut(true), 0)
    const fin = setTimeout(() => setSalut(false), 9000)
    return () => { clearTimeout(debut); clearTimeout(fin) }
  }, [saison, actif])

  const couches = useMemo(() => {
    if (!saison) return []
    return saison.couches.map((c, k) => {
      const n = petitEcran ? Math.ceil(c.nombre * 0.5) : c.nombre
      const entre = (i, g, [min, max]) => min + alea(i, g + k * 13) * (max - min)
      return {
        ...c,
        particules: Array.from({ length: n }, (_, i) => ({
          gauche: alea(i, 1 + k * 13) * 100,
          taille: entre(i, 2, c.taille),
          duree: entre(i, 3, c.duree),
          delai: -alea(i, 4 + k * 13) * c.duree[1],
          derive: (alea(i, 5 + k * 13) - 0.5) * 140,
          couleur: c.couleurs[i % c.couleurs.length],
          opacite: entre(i, 6, c.opacite),
        })),
      }
    })
  }, [saison, petitEcran])

  if (!saison) return null
  const Decor = saison.decor ? DECORS[saison.decor] : null

  return (
    <>
      {actif && !reduit && couches.map((c, k) => (
        <div
          key={k}
          className={`saison-couche saison-f-${c.forme}${c.vent ? ' saison-vent' : ''}${c.sens === 'haut' ? ' saison-haut' : ''}`}
          style={c.flou ? { filter: `blur(${c.flou}px)` } : undefined}
          aria-hidden="true"
        >
          {c.particules.map((p, i) => (
            <span
              key={i}
              className="saison-particule"
              style={{
                left: `${p.gauche}%`, width: p.taille, height: p.taille,
                animationDuration: `${p.duree}s`, animationDelay: `${p.delai}s`,
                '--derive': `${p.derive}px`, '--c': p.couleur, opacity: p.opacite,
              }}
            />
          ))}
        </div>
      ))}

      {actif && saison.foret && <Foret petitEcran={petitEcran} />}
      {actif && saison.fanions && <Fanions petitEcran={petitEcran} />}

      {actif && saison.guirlande && (
        <div className="saison-guirlande" aria-hidden="true">
          {Array.from({ length: petitEcran ? 14 : 34 }, (_, i) => (
            <span key={i} style={{ '--c': ['#ff4d6d', '#f5d37a', '#22b85a', '#5aadff'][i % 4], animationDelay: `${(i % 6) * 0.3}s` }} />
          ))}
        </div>
      )}

      {actif && Decor && (
        <div className="saison-decor" aria-hidden="true"><Decor /></div>
      )}

      {actif && salut && (
        <div className="saison-salut" role="status" onClick={() => setSalut(false)}>{saison.message}</div>
      )}

      <button
        type="button"
        className="saison-bouton"
        title={actif ? "Désactiver l'ambiance saisonnière" : "Activer l'ambiance saisonnière"}
        aria-label={actif ? "Désactiver l'ambiance saisonnière" : "Activer l'ambiance saisonnière"}
        aria-pressed={actif}
        onClick={() => { const suite = !actif; setActif(suite); ecrire('saison-off', suite ? '0' : '1') }}
      >
        {actif ? '✦' : '✧'}
      </button>
    </>
  )
}
