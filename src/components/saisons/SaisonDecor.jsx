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

const Sapin = () => (
  <svg viewBox="0 0 100 140" width="100%" aria-hidden="true">
    <rect x="43" y="116" width="14" height="20" rx="2" fill="#6b4423" />
    <polygon points="50,40 90,86 10,86" fill="#14803c" />
    <polygon points="50,22 84,66 16,66" fill="#1a9a4a" />
    <polygon points="50,6 76,46 24,46" fill="#22b85a" />
    <polygon points="50,0 54,9 63,9 56,15 59,24 50,18 41,24 44,15 37,9 46,9" fill="#f5d37a" className="saison-etoile-sapin" />
    {[[50,30,'#ff4d6d',0],[38,52,'#f5d37a',0.4],[62,56,'#5aadff',0.8],[30,78,'#ff4d6d',1.1],[52,76,'#f5d37a',0.2],[72,80,'#5aadff',0.6],[44,100,'#ff4d6d',0.9],[66,102,'#f5d37a',0.3],[24,100,'#5aadff',1.2],[80,100,'#ff4d6d',0.5]].map(([cx, cy, c, delai], i) => (
      <circle key={i} cx={cx} cy={cy} r="3.2" fill={c} className="saison-boule" style={{ animationDelay: `${delai}s` }} />
    ))}
  </svg>
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

const DECORS = { sapin: Sapin, ruban: Ruban, croissant: Croissant }

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

  const particules = useMemo(() => {
    if (!saison) return []
    const n = petitEcran ? Math.ceil(saison.nombre * 0.5) : saison.nombre
    return Array.from({ length: n }, (_, i) => ({
      gauche: alea(i, 1) * 100,
      taille: 6 + alea(i, 2) * 10,
      duree: 9 + alea(i, 3) * 11,
      delai: -alea(i, 4) * 20,
      derive: (alea(i, 5) - 0.5) * 80,
      couleur: saison.couleurs[i % saison.couleurs.length],
      opacite: 0.55 + alea(i, 6) * 0.4,
    }))
  }, [saison, petitEcran])

  if (!saison) return null
  const Decor = saison.decor ? DECORS[saison.decor] : null

  return (
    <>
      {actif && !reduit && (
        <div className={`saison-couche saison-${saison.forme}`} aria-hidden="true">
          {particules.map((p, i) => (
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
      )}

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
