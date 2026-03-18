// supabase/functions/score-submission/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ScoreRequest {
  competition_id: string
  entry_id:       string
  user_id:        string
  file_url:       string
}

interface ScoreDetail {
  metric:    string
  value:     number
  accuracy?: number
  f1?:       number
  rmse?:     number
  mae?:      number
  n_samples: number
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const COMPETITION_MAX_POINTS = 20

function parseCSVColumn(text: string, column: string): string[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV vide ou sans données.')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const colIdx  = headers.indexOf(column)
  if (colIdx === -1) {
    throw new Error(`Colonne "${column}" introuvable. Colonnes disponibles : ${headers.join(', ')}`)
  }
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim().replace(/"/g, ''))
    return cells[colIdx] ?? ''
  })
}

function calcAccuracy(truth: string[], preds: string[]): number {
  if (truth.length === 0) return 0
  return truth.filter((t, i) => t === preds[i]).length / truth.length
}

function calcF1Macro(truth: string[], preds: string[]): number {
  const classes = [...new Set([...truth, ...preds])]
  let totalF1 = 0
  for (const cls of classes) {
    const tp = truth.filter((t, i) => t === cls && preds[i] === cls).length
    const fp = truth.filter((t, i) => t !== cls && preds[i] === cls).length
    const fn = truth.filter((t, i) => t === cls && preds[i] !== cls).length
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall    = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    totalF1 += f1
  }
  return classes.length > 0 ? totalF1 / classes.length : 0
}

function calcRMSE(truth: string[], preds: string[]): number {
  const n = truth.length
  if (n === 0) return 0
  const mse = truth.reduce((sum, t, i) => {
    const diff = parseFloat(t) - parseFloat(preds[i])
    return sum + (isNaN(diff) ? 0 : diff * diff)
  }, 0) / n
  return Math.sqrt(mse)
}

function calcMAE(truth: string[], preds: string[]): number {
  const n = truth.length
  if (n === 0) return 0
  return truth.reduce((sum, t, i) => {
    const diff = Math.abs(parseFloat(t) - parseFloat(preds[i]))
    return sum + (isNaN(diff) ? 0 : diff)
  }, 0) / n
}

function normalizeError(error: number, truth: string[]): number {
  const nums  = truth.map(parseFloat).filter(n => !isNaN(n))
  const range = Math.max(...nums) - Math.min(...nums)
  if (range === 0) return error === 0 ? 1 : 0
  return Math.max(0, Math.min(1, 1 - error / range))
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body: ScoreRequest = await req.json()
    const { competition_id, entry_id, user_id, file_url } = body

    if (!competition_id || !entry_id || !user_id || !file_url) {
      throw new Error('Paramètres manquants : competition_id, entry_id, user_id, file_url.')
    }

    // ── 1. Récupérer la compétition ──
    const { data: comp, error: compErr } = await serviceClient
      .from('competitions')
      .select('id, metric, metric_column, ground_truth_url, auto_score')
      .eq('id', competition_id)
      .single()

    if (compErr || !comp) throw new Error('Compétition introuvable.')
    if (!comp.auto_score)       throw new Error("Le scoring automatique n'est pas activé.")
    if (!comp.ground_truth_url) throw new Error("Fichier de réponses non configuré.")

    const metric       = comp.metric        || 'accuracy'
    const targetColumn = comp.metric_column || 'label'

    // ── 2. Lire l'entrée actuelle (ancien score + submission_count) ──
    const { data: currentEntry } = await serviceClient
      .from('competition_entries')
      .select('score, submission_count')
      .eq('id', entry_id)
      .single()

    const oldScore       = currentEntry?.score        ?? null
    const submissionCount = (currentEntry?.submission_count || 0) + 1

    // ── 3. Télécharger le CSV étudiant ──
    const studentRes = await fetch(file_url)
    if (!studentRes.ok) throw new Error('Impossible de télécharger le fichier soumis.')
    const studentCSV = await studentRes.text()

    // ── 4. Télécharger le ground truth ──
    const gtPath = comp.ground_truth_url.split('/ground-truth/')[1]
    if (!gtPath) throw new Error('URL ground truth invalide.')

    const { data: gtData, error: gtErr } = await serviceClient
      .storage.from('ground-truth').download(gtPath)

    if (gtErr || !gtData) throw new Error('Impossible de charger le fichier de réponses.')
    const groundTruthCSV = await gtData.text()

    // ── 5. Parser les deux CSV ──
    const truth = parseCSVColumn(groundTruthCSV, targetColumn)
    const preds = parseCSVColumn(studentCSV,     targetColumn)

    if (truth.length !== preds.length) {
      throw new Error(`Nombre de lignes incompatible : ground truth (${truth.length}) ≠ soumission (${preds.length}).`)
    }

    // ── 6. Calculer le score ──
    let scoreNormalized = 0
    const detail: ScoreDetail = { metric, value: 0, n_samples: truth.length }

    if (metric === 'accuracy') {
      const acc = calcAccuracy(truth, preds)
      detail.accuracy = acc; detail.value = acc; scoreNormalized = acc
    } else if (metric === 'f1') {
      const f1 = calcF1Macro(truth, preds)
      detail.f1 = f1; detail.value = f1; scoreNormalized = f1
    } else if (metric === 'rmse') {
      const rmse = calcRMSE(truth, preds)
      detail.rmse = rmse; detail.value = rmse; scoreNormalized = normalizeError(rmse, truth)
    } else if (metric === 'mae') {
      const mae = calcMAE(truth, preds)
      detail.mae = mae; detail.value = mae; scoreNormalized = normalizeError(mae, truth)
    } else {
      throw new Error('Métrique "custom" : notation manuelle uniquement.')
    }

    scoreNormalized = Math.round(scoreNormalized * 10000) / 10000

    // ── 7. Mettre à jour competition_entries ──
    const { error: updateErr } = await serviceClient
      .from('competition_entries')
      .update({
        score:            scoreNormalized,
        score_detail:     detail,
        auto_scored:      true,
        submitted_at:     new Date().toISOString(),
        file_url,
        submission_count: submissionCount,
      })
      .eq('id', entry_id)
      .eq('user_id', user_id)

    if (updateErr) throw new Error(`Erreur mise à jour entry : ${updateErr.message}`)

    // ── 8. Mettre à jour total_points du profil ──
    // Logique : on retire la contribution de l'ancien score et on ajoute celle du nouveau
    // points_contribution = score * COMPETITION_MAX_POINTS
    const { data: profileData, error: profileErr } = await serviceClient
      .from('profiles')
      .select('total_points')
      .eq('id', user_id)
      .single()

    if (!profileErr && profileData) {
      const currentPoints     = profileData.total_points || 0
      const oldContribution   = oldScore !== null ? Math.round(oldScore * COMPETITION_MAX_POINTS * 100) / 100 : 0
      const newContribution   = Math.round(scoreNormalized * COMPETITION_MAX_POINTS * 100) / 100
      const updatedPoints     = Math.max(0, currentPoints - oldContribution + newContribution)

      await serviceClient
        .from('profiles')
        .update({ total_points: Math.round(updatedPoints * 100) / 100 })
        .eq('id', user_id)
    }

    // ── 9. Recalculer les rangs de toute la compétition ──
    const { data: allEntries } = await serviceClient
      .from('competition_entries')
      .select('id, score')
      .eq('competition_id', competition_id)
      .not('score', 'is', null)
      .order('score', { ascending: false })

    if (allEntries) {
      await Promise.all(allEntries.map((e, i) =>
        serviceClient
          .from('competition_entries')
          .update({ rank: i + 1 })
          .eq('id', e.id)
      ))
    }

    // ── 10. Recalculer les points via RPC (pour les autres mécaniques de points) ──
    await serviceClient.rpc('recalculate_points', { user_uuid: user_id })

    const userRank = allEntries ? allEntries.findIndex(e => e.id === entry_id) + 1 : null

    return new Response(
      JSON.stringify({
        success:          true,
        score:            scoreNormalized,
        detail,
        rank:             userRank,
        submission_count: submissionCount,
        points_earned:    Math.round(scoreNormalized * COMPETITION_MAX_POINTS * 100) / 100,
        message:          `Score : ${(scoreNormalized * 100).toFixed(2)}% → +${Math.round(scoreNormalized * COMPETITION_MAX_POINTS * 100) / 100} pts`,
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
