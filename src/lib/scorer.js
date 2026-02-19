// src/lib/scorer.js
//
// Helper côté frontend pour déclencher le scoring automatique
// après qu'un étudiant a uploadé son CSV.
//
// Usage dans Competitions.jsx :
//   import { autoScore } from '../../lib/scorer'
//   const result = await autoScore({ competition, entryId, userId, fileUrl })

import { supabase } from './supabase'

/**
 * Appelle la Edge Function score-submission et retourne le résultat.
 *
 * @param {Object} params
 * @param {Object} params.competition  - objet compétition (id, metric, auto_score)
 * @param {string} params.entryId      - id de la competition_entry
 * @param {string} params.userId       - id de l'utilisateur
 * @param {string} params.fileUrl      - URL publique du CSV uploadé
 *
 * @returns {{ success: boolean, score?: number, detail?: object, error?: string }}
 */
export async function autoScore({ competition, entryId, userId, fileUrl }) {
  // Si la compétition n'a pas le scoring auto activé → on skip
  if (!competition.auto_score) {
    return { success: false, error: 'Scoring automatique non activé pour cette compétition.' }
  }

  // Récupérer le token de session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { success: false, error: 'Non authentifié.' }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/score-submission`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          competition_id: competition.id,
          entry_id:       entryId,
          user_id:        userId,
          file_url:       fileUrl,
        }),
      }
    )

    const data = await res.json()
    return data

  } catch (err) {
    return { success: false, error: err.message || 'Erreur réseau.' }
  }
}

/**
 * Formate un score normalisé (0→1) en string lisible selon la métrique.
 *
 * @param {number} score    - score normalisé entre 0 et 1
 * @param {string} metric   - 'accuracy' | 'f1' | 'rmse' | 'mae'
 * @param {object} detail   - score_detail depuis Supabase
 */
export function formatScore(score, metric, detail) {
  if (score == null) return '—'

  switch (metric) {
    case 'accuracy':
      return `${(score * 100).toFixed(2)}%`
    case 'f1':
      return `F1 ${(score * 100).toFixed(2)}%`
    case 'rmse':
      return detail?.rmse != null
        ? `RMSE ${detail.rmse.toFixed(4)} (score ${(score * 100).toFixed(1)}%)`
        : `${(score * 100).toFixed(2)}%`
    case 'mae':
      return detail?.mae != null
        ? `MAE ${detail.mae.toFixed(4)} (score ${(score * 100).toFixed(1)}%)`
        : `${(score * 100).toFixed(2)}%`
    default:
      return `${(score * 100).toFixed(2)}%`
  }
}

/**
 * Vérifie si un fichier est un CSV valide (extension + taille)
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCSV(file) {
  if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'csv') {
    return { valid: false, error: 'Le scoring automatique nécessite un fichier .csv' }
  }

  const MAX_MB = 50
  if (file.size > MAX_MB * 1024 * 1024) {
    return { valid: false, error: `Fichier trop lourd (max ${MAX_MB}MB).` }
  }

  return { valid: true }
}