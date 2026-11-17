// Calendrier des ambiances saisonnières du site.
// Chaque saison a une période (mois/jour, année qui change comprise), une forme de
// particules, une décoration et un message d'accueil. La première qui correspond gagne.

// Convertit une date en jour du calendrier hégirien (pour le Ramadan, l'Aïd, la Tabaski).
// Retourne null si le navigateur ne gère pas ce calendrier.
function jourHegire(date) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric' })
      .formatToParts(date)
    const mois = Number(parts.find(p => p.type === 'month')?.value)
    const jour = Number(parts.find(p => p.type === 'day')?.value)
    return Number.isFinite(mois) && Number.isFinite(jour) ? { mois, jour } : null
  } catch {
    return null
  }
}

// Test « du jj/mm au jj/mm » compatible avec un passage d'année (ex. 1er déc → 26 déc).
const entre = (d, [m1, j1], [m2, j2]) => {
  const x = (d.getMonth() + 1) * 100 + d.getDate()
  const a = m1 * 100 + j1, b = m2 * 100 + j2
  return a <= b ? x >= a && x <= b : x >= a || x <= b
}

// Une « couche » = un groupe de particules : forme, nombre, taille [min, max] en px,
// durée [min, max] en secondes, sens ('bas' ou 'haut'), couleurs, flou et opacité.
const couche = (forme, nombre, taille, duree, options = {}) => ({
  sens: 'bas', couleurs: ['#ffffff'], flou: 0, opacite: [0.6, 1], vent: false, ...options, forme, nombre, taille, duree,
})

export const SAISONS = [
  {
    id: 'aid',
    nom: 'Aïd',
    message: 'Aïd Moubarak à toute la communauté du Club IA.',
    couches: [
      couche('etoile', 22, [7, 14], [10, 18], { couleurs: ['#f5d37a', '#ffffff', '#ffe9a8'] }),
      couche('lanterne', 10, [20, 34], [16, 26], { sens: 'haut', couleurs: ['#f5c04a', '#ffb347'], opacite: [0.75, 1] }),
    ],
    actif: d => { const h = jourHegire(d); return !!h && ((h.mois === 10 && h.jour <= 3) || (h.mois === 12 && h.jour >= 9 && h.jour <= 12)) },
  },
  {
    id: 'ramadan',
    nom: 'Ramadan',
    message: 'Ramadan Moubarak. Bon courage aux membres qui jeûnent.',
    couches: [
      couche('etoile', 20, [6, 13], [11, 20], { couleurs: ['#f5d37a', '#cfe3ff'] }),
      couche('lanterne', 7, [20, 32], [18, 28], { sens: 'haut', couleurs: ['#f5c04a'], opacite: [0.7, 0.95] }),
    ],
    actif: d => { const h = jourHegire(d); return !!h && h.mois === 9 },
  },
  {
    id: 'noel',
    nom: 'Noël',
    message: 'Joyeux Noël de la part du Club IA de l\'ENSGMM.',
    couches: [
      // plan lointain : petits flocons lents
      couche('neige', 46, [2, 4], [14, 24], { opacite: [0.35, 0.7], vent: true }),
      // plan moyen
      couche('neige', 34, [4, 8], [9, 15], { opacite: [0.55, 0.9], vent: true }),
      // premier plan : vrais flocons, grands et légèrement flous
      couche('flocon', 14, [14, 24], [7, 12], { opacite: [0.6, 0.95], flou: 0.6, vent: true }),
      // petits sapins qui tombent et se balancent dans la neige
      couche('sapin', 9, [16, 30], [11, 18], { couleurs: ['#22b85a', '#1a9a4a', '#ffffff'], opacite: [0.75, 1], vent: true }),
    ],
    actif: d => entre(d, [12, 1], [12, 26]),
  },
  {
    id: 'nouvel-an',
    nom: 'Nouvel An',
    message: 'Bonne année ! Le Club IA vous souhaite une année riche en projets.',
    couches: [
      couche('confetti', 60, [6, 12], [7, 13], { couleurs: ['#f5d37a', '#ffffff', '#5aadff', '#00FF87', '#ff6b8f'] }),
      couche('etoile', 18, [8, 18], [8, 14], { sens: 'haut', couleurs: ['#f5d37a', '#ffffff'] }),
    ],
    actif: d => entre(d, [12, 27], [1, 4]),
  },
  {
    id: 'saint-valentin',
    nom: 'Saint-Valentin',
    message: 'Joyeuse Saint-Valentin à toute la communauté.',
    couches: [
      couche('coeur', 28, [12, 30], [9, 16], { sens: 'haut', couleurs: ['#ff6b8f', '#ff9ab5', '#ff4d6d'], opacite: [0.6, 0.95] }),
      couche('coeur', 14, [8, 14], [10, 17], { couleurs: ['#ff9ab5', '#ffc2d1'], opacite: [0.4, 0.8] }),
    ],
    actif: d => entre(d, [2, 12], [2, 14]),
  },
  {
    id: 'femmes',
    nom: 'Journée de la femme',
    message: 'Bonne Journée internationale des droits des femmes.',
    couches: [
      couche('petale', 44, [8, 18], [8, 15], { couleurs: ['#c9a2ff', '#e6d1ff', '#f5d37a'], vent: true }),
      couche('etoile', 10, [8, 14], [10, 16], { sens: 'haut', couleurs: ['#f5d37a'] }),
    ],
    actif: d => entre(d, [3, 7], [3, 9]),
  },
  {
    id: 'fete-nationale',
    nom: 'Fête nationale du Bénin',
    message: 'Bonne fête de l\'Indépendance du Bénin !',
    couches: [
      couche('confetti', 64, [6, 13], [7, 13], { couleurs: ['#008751', '#fcd116', '#e8112d'] }),
      couche('etoile', 10, [10, 18], [9, 15], { sens: 'haut', couleurs: ['#fcd116'] }),
    ],
    actif: d => entre(d, [7, 31], [8, 2]),
  },
  {
    id: 'octobre-rose',
    nom: 'Octobre Rose',
    message: 'Octobre Rose : ensemble contre le cancer du sein.',
    couches: [
      couche('petale', 46, [8, 18], [8, 15], { couleurs: ['#ff7eb6', '#ffb3d1', '#ff5aa5'], vent: true }),
      couche('ruban', 9, [16, 28], [11, 18], { couleurs: ['#ff5aa5', '#ff7eb6'], opacite: [0.7, 1], vent: true }),
    ],
    actif: d => d.getMonth() === 9,
  },
]

// Renvoie la saison à afficher. `forcee` permet de tester : ?saison=noel (ou ?saison=off).
export function saisonActive(date = new Date(), forcee = null) {
  if (forcee === 'off') return null
  if (forcee) return SAISONS.find(s => s.id === forcee) || null
  return SAISONS.find(s => s.actif(date)) || null
}
