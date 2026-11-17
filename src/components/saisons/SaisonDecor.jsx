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
