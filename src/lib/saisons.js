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

export const SAISONS = [
  {
    id: 'aid',
    nom: 'Aïd',
    forme: 'etoile', couleurs: ['#f5d37a', '#ffffff', '#ffe9a8'], nombre: 16, decor: 'croissant', guirlande: false,
    message: 'Aïd Moubarak à toute la communauté du Club IA.',
    actif: d => { const h = jourHegire(d); return !!h && ((h.mois === 10 && h.jour <= 3) || (h.mois === 12 && h.jour >= 9 && h.jour <= 12)) },
  },
  {
    id: 'ramadan',
    nom: 'Ramadan',
    forme: 'etoile', couleurs: ['#f5d37a', '#cfe3ff'], nombre: 10, decor: 'croissant', guirlande: false,
    message: 'Ramadan Moubarak. Bon courage aux membres qui jeûnent.',
    actif: d => { const h = jourHegire(d); return !!h && h.mois === 9 },
  },
  {
    id: 'noel',
    nom: 'Noël',
    forme: 'neige', couleurs: ['#ffffff'], nombre: 34, decor: 'sapin', guirlande: true,
    message: 'Joyeux Noël de la part du Club IA de l\'ENSGMM.',
    actif: d => entre(d, [12, 1], [12, 26]),
  },
  {
    id: 'nouvel-an',
    nom: 'Nouvel An',
    forme: 'confetti', couleurs: ['#f5d37a', '#ffffff', '#5aadff', '#00FF87'], nombre: 28, decor: null, guirlande: true,
    message: 'Bonne année ! Le Club IA vous souhaite une année riche en projets.',
    actif: d => entre(d, [12, 27], [1, 4]),
  },
  {
    id: 'saint-valentin',
    nom: 'Saint-Valentin',
    forme: 'coeur', couleurs: ['#ff6b8f', '#ff9ab5', '#ff4d6d'], nombre: 18, decor: null, guirlande: false,
    message: 'Joyeuse Saint-Valentin à toute la communauté.',
    actif: d => entre(d, [2, 12], [2, 14]),
  },
  {
    id: 'femmes',
    nom: 'Journée de la femme',
    forme: 'petale', couleurs: ['#c9a2ff', '#f5d37a', '#e6d1ff'], nombre: 20, decor: null, guirlande: false,
    message: 'Bonne Journée internationale des droits des femmes.',
    actif: d => entre(d, [3, 7], [3, 9]),
  },
  {
    id: 'fete-nationale',
    nom: 'Fête nationale du Bénin',
    forme: 'confetti', couleurs: ['#008751', '#fcd116', '#e8112d'], nombre: 28, decor: null, guirlande: false,
    message: 'Bonne fête de l\'Indépendance du Bénin !',
    actif: d => entre(d, [7, 31], [8, 2]),
  },
  {
    id: 'octobre-rose',
    nom: 'Octobre Rose',
    forme: 'petale', couleurs: ['#ff7eb6', '#ffb3d1', '#ff5aa5'], nombre: 20, decor: 'ruban', guirlande: false,
    message: 'Octobre Rose : ensemble contre le cancer du sein.',
    actif: d => d.getMonth() === 9,
  },
]

// Renvoie la saison à afficher. `forcee` permet de tester : ?saison=noel (ou ?saison=off).
export function saisonActive(date = new Date(), forcee = null) {
  if (forcee === 'off') return null
  if (forcee) return SAISONS.find(s => s.id === forcee) || null
  return SAISONS.find(s => s.actif(date)) || null
}
