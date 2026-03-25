import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { formatDeadline } from '../../lib/helpers'

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Icon = {
  Plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Upload:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Users:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Clock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Bolt:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Warning:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  File:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Trophy:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17L19 7C19 9.76 17.76 12.24 16 14C14.7 15.3 13.4 16 12 16C10.6 16 9.3 15.3 8 14C6.24 12.24 5 9.76 5 7L7 4Z"/><path d="M5 7H3C3 9 4 11 6 12"/><path d="M19 7H21C21 9 20 11 18 12"/></svg>,
  ArrowLeft:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatus(comp) {
  const now = new Date()
  if (new Date(comp.start_date) > now) return 'upcoming'
  if (new Date(comp.end_date)   < now) return 'ended'
  return 'active'
}

const STATUS_MAP = {
  active:   { label: 'ACTIVE',   color: '#00FF87', bg: 'rgba(0,255,135,0.08)',   border: 'rgba(0,255,135,0.2)' },
  upcoming: { label: 'À VENIR',  color: '#2C7BE5', bg: 'rgba(44,123,229,0.08)', border: 'rgba(44,123,229,0.2)' },
  ended:    { label: 'TERMINÉE', color: '#3d5268', bg: 'rgba(61,82,104,0.15)',   border: 'rgba(61,82,104,0.3)' },
}

const METRICS = [
  { value: 'accuracy', label: 'Accuracy (classification)' },
  { value: 'f1',       label: 'F1-score macro (classification)' },
  { value: 'rmse',     label: 'RMSE (régression)' },
  { value: 'mae',      label: 'MAE (régression)' },
  { value: 'custom',   label: 'Personnalisé (notation manuelle)' },
]

const EMPTY_FORM = {
  title:         '',
  description:   '',
  category:      '',
  prize:         '',
  start_date:    '',
  end_date:      '',
  metric:        'accuracy',
  metric_column: 'label',
  auto_score:    false,
  status:        'upcoming',
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 11,
  fontFamily: "'IBM Plex Mono',monospace", outline: 'none',
  transition: 'border-color 0.15s',
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4, letterSpacing: '0.04em' }}>{hint}</div>}
    </div>
  )
}

// ─── Zone upload ground truth ─────────────────────────────────────────────────
function GroundTruthUpload({ competitionId, currentUrl, onUploaded }) {
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [drag, setDrag]       = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError('')
    const path = `${competitionId}/${Date.now()}_ground_truth.csv`
    const { error: upErr } = await supabase.storage.from('ground-truth').upload(path, file, { upsert: true })
    if (upErr) { setError(upErr.message); setLoading(false); return }
    const { data: signedData } = await supabase.storage.from('ground-truth').createSignedUrl(path, 60 * 60 * 24 * 365)
    const url = signedData?.signedUrl || path
    const { error: dbErr } = await supabase.from('competitions').update({ ground_truth_url: url }).eq('id', competitionId)
    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    onUploaded(url); setFile(null); setLoading(false)
  }

  return (
    <div>
      <div
        onDragOver={evt => { evt.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={evt => { evt.preventDefault(); setDrag(false); const f = evt.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) setFile(f) }}
        onClick={() => document.getElementById('gt-input').click()}
        style={{ border: `2px dashed ${drag ? '#00FF87' : file ? '#00c468' : currentUrl ? 'rgba(0,255,135,0.3)' : 'var(--border2)'}`, borderRadius: 10, padding: '18px 16px', textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(0,255,135,0.03)' : 'var(--bg2)', transition: 'all 0.2s' }}
      >
        <input id="gt-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={evt => setFile(evt.target.files[0])} />
        <div style={{ width: 24, height: 24, margin: '0 auto 8px', color: file ? '#00c468' : currentUrl ? '#00c468' : 'var(--text3)' }}>
          {file || currentUrl ? <Icon.Check /> : <Icon.Upload />}
        </div>
        {file ? (
          <><div style={{ fontSize: 11, color: '#00c468', marginBottom: 2 }}>{file.name}</div><div style={{ fontSize: 9, color: 'var(--text3)' }}>{(file.size / 1024).toFixed(1)} KB — Cliquer pour changer</div></>
        ) : currentUrl ? (
          <><div style={{ fontSize: 11, color: '#00c468', marginBottom: 2 }}>✓ Ground truth configuré</div><div style={{ fontSize: 9, color: 'var(--text3)' }}>Cliquer pour remplacer</div></>
        ) : (
          <><div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>Glisser le CSV des vraies réponses</div><div style={{ fontSize: 9, color: 'var(--text3)' }}>Fichier .csv uniquement</div></>
        )}
      </div>
      {error && <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '7px 12px', marginTop: 8 }}>{error}</div>}
      {file && (
        <button onClick={handleUpload} disabled={loading} style={{ width: '100%', marginTop: 10, padding: '9px 0', background: loading ? '#00c468' : '#00FF87', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>
          {loading ? 'UPLOAD EN COURS…' : 'UPLOADER →'}
        </button>
      )}
    </div>
  )
}

// ─── Modal Soumissions ────────────────────────────────────────────────────────
function SubmissionsModal({ competition, onClose }) {
  const [entries, setEntries]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [scores, setScores]       = useState({})   // { [entry_id]: string }
  const [saving, setSaving]       = useState({})   // { [entry_id]: bool }
  const [saved, setSaved]         = useState({})   // { [entry_id]: bool }
  const [toast, setToast]         = useState(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('competition_entries')
      .select('*, profiles(full_name, email)')
      .eq('competition_id', competition.id)
      .order('submitted_at', { ascending: false })
    setEntries(data || [])
    // Pré-remplir les scores existants
    const init = {}
    ;(data || []).forEach(e => { if (e.score != null) init[e.id] = String(e.score) })
    setScores(init)
    setLoading(false)
  }, [competition.id])

  useEffect(() => {
  fetchEntries()

  const ch = supabase.channel('competitions-entries-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_entries' }, () => fetchEntries())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, () => fetchEntries())
    .subscribe()

  return () => supabase.removeChannel(ch)
}, [fetchEntries])

  const handleSaveScore = async (entryId) => {
    const val = parseFloat(scores[entryId])
    if (isNaN(val) || val < 0 || val > 1) return
    setSaving(s => ({ ...s, [entryId]: true }))
    const { error } = await supabase
      .from('competition_entries')
      .update({ score: val, auto_scored: false })
      .eq('id', entryId)
    if (!error) {
      setSaved(s => ({ ...s, [entryId]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [entryId]: false })), 2000)
      // Recalculer les points du user
      const entry = entries.find(e => e.id === entryId)
      if (entry) await supabase.rpc('recalculate_points', { user_uuid: entry.user_id })
    }
    setSaving(s => ({ ...s, [entryId]: false }))
  }

  const submitted = entries.filter(e => e.submitted_at)
  const pending   = entries.filter(e => !e.submitted_at)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', animation: 'fadeUp 0.25s ease both' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Soumissions</div>
              <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>{competition.title}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 10, color: '#00FF87', background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                  {submitted.length} soumis
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
                  {pending.length} inscrit{pending.length !== 1 ? 's' : ''} sans soumission
                </span>
                <span style={{ fontSize: 10, color: '#FFB830', background: 'rgba(255,184,48,0.08)', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                  {submitted.filter(e => e.score == null).length} sans score
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14 }}><Icon.X /></div>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 11 }}>Chargement…</div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 11, letterSpacing: '0.06em' }}>
              Aucun participant inscrit pour l'instant.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Soumissions reçues */}
              {submitted.length > 0 && (
                <>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 3, height: 10, background: '#00FF87', borderRadius: 2 }}/>
                    Soumissions reçues ({submitted.length})
                  </div>
                  {submitted.map(entry => (
                    <div key={entry.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        {/* Avatar + nom */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 160 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00c468,#2C7BE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#030507', flexShrink: 0, fontFamily: "'Unbounded',sans-serif" }}>
                            {(entry.profiles?.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 2 }}>{entry.profiles?.full_name || 'Inconnu'}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)' }}>{entry.profiles?.email || ''}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>
                              Soumis le {new Date(entry.submitted_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Fichier */}
                        {entry.file_url && (
                          <a href={entry.file_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(44,123,229,0.08)', border: '1px solid rgba(44,123,229,0.2)', borderRadius: 6, color: '#2C7BE5', fontSize: 10, textDecoration: 'none', flexShrink: 0, fontFamily: "'IBM Plex Mono',monospace" }}>
                            <div style={{ width: 12, height: 12 }}><Icon.Download /></div>
                            Voir le fichier
                          </a>
                        )}

                        {/* Score */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {entry.auto_scored && entry.score != null && (
                            <span style={{ fontSize: 8, color: '#00FF87', background: 'rgba(0,255,135,0.08)', border: '1px solid rgba(0,255,135,0.2)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <div style={{ width: 8, height: 8 }}><Icon.Bolt /></div>
                              AUTO
                            </span>
                          )}
                          <input
                            type="number" min="0" max="1" step="0.0001"
                            value={scores[entry.id] ?? ''}
                            onChange={evt => setScores(s => ({ ...s, [entry.id]: evt.target.value }))}
                            placeholder="0.0000"
                            style={{ width: 80, padding: '6px 8px', background: 'var(--bg)', border: `1px solid ${entry.score != null ? 'rgba(0,255,135,0.3)' : 'var(--border)'}`, borderRadius: 6, color: entry.score != null ? '#00FF87' : 'var(--text)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", outline: 'none', textAlign: 'center' }}
                            onFocus={evt => evt.target.style.borderColor = '#243347'}
                            onBlur={evt => evt.target.style.borderColor = entry.score != null ? 'rgba(0,255,135,0.3)' : 'var(--border)'}
                          />
                          <button onClick={() => handleSaveScore(entry.id)} disabled={saving[entry.id]}
                            style={{ padding: '6px 10px', background: saved[entry.id] ? 'rgba(0,255,135,0.15)' : '#00FF87', border: saved[entry.id] ? '1px solid rgba(0,255,135,0.3)' : 'none', borderRadius: 6, cursor: saving[entry.id] ? 'wait' : 'pointer', color: saved[entry.id] ? '#00FF87' : '#030507', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: '0.06em', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                            {saving[entry.id] ? '…' : saved[entry.id] ? '✓ OK' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>

                      {/* Notes de l'étudiant */}
                      {entry.notes && (
                        <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 10, color: 'var(--text3)', lineHeight: 1.6 }}>
                          <span style={{ color: 'var(--text3)', fontSize: 9, letterSpacing: '0.08em' }}>NOTE : </span>
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Inscrits sans soumission */}
              {pending.length > 0 && (
                <>
                  <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: submitted.length > 0 ? 16 : 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 3, height: 10, background: '#3d5268', borderRadius: 2 }}/>
                    Inscrits sans soumission ({pending.length})
                  </div>
                  {pending.map(entry => (
                    <div key={entry.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>
                        {(entry.profiles?.full_name || '?').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{entry.profiles?.full_name || 'Inconnu'}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)' }}>Inscrit · Pas encore soumis</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal création / édition ─────────────────────────────────────────────────
function CompModal({ competition, onClose, onSaved }) {
  const { profile } = useAuthStore()
  const [form, setForm] = useState(competition ? {
  title:           competition.title,
  description:     competition.description || '',
  category:        competition.category    || '',
  prize:           competition.prize        || '',
  start_date:      competition.start_date?.slice(0, 16),
  end_date:        competition.end_date?.slice(0, 16),
  metric:          competition.metric        || 'accuracy',
  metric_column:   competition.metric_column || 'label',
  auto_score:      competition.auto_score    || false,
  status:          competition.status        || 'upcoming',
  max_submissions: competition.max_submissions ?? 10,   // ← ajouté
} : { ...EMPTY_FORM })
  const [savedId, setSavedId] = useState(competition?.id || null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState(1)
  const [gtUrl, setGtUrl]     = useState(competition?.ground_truth_url || null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim())  return setError('Le titre est requis.')
    if (!form.start_date)    return setError('La date de début est requise.')
    if (!form.end_date)      return setError('La date de fin est requise.')
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError('La date de fin doit être après le début.')
    setSaving(true); setError('')
    const payload = {
      title: form.title.trim(), description: form.description.trim() || null,
      category: form.category.trim() || null, prize: form.prize.trim() || null,
      start_date: new Date(form.start_date).toISOString(), end_date: new Date(form.end_date).toISOString(),
      metric: form.metric, metric_column: form.metric_column.trim() || 'label',
      auto_score: form.auto_score && form.metric !== 'custom', status: form.status, created_by: profile?.id,
      max_submissions: form.max_submissions || 10,   // ← ajouté
    }
    if (competition) {
      const { error: e } = await supabase.from('competitions').update(payload).eq('id', competition.id)
      if (e) { setError(e.message); setSaving(false); return }
      setSavedId(competition.id)
    } else {
      const { data, error: e } = await supabase.from('competitions').insert(payload).select().single()
      if (e) { setError(e.message); setSaving(false); return }
      setSavedId(data.id)
    }
    setSaving(false)
    if (form.auto_score && form.metric !== 'custom') setStep(2)
    else onSaved()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, width: '100%', maxWidth: 540, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.25s ease both', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>{competition ? 'Modifier la compétition' : 'Nouvelle compétition'}</div>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{competition?.title || 'Créer une compétition'}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14 }}><Icon.X /></div>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[['1', 'Informations'], ['2', 'Ground Truth']].map(([n, label], i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: step === i+1 ? '#00FF87' : step > i+1 ? 'rgba(0,255,135,0.2)' : 'var(--bg2)', border: `1px solid ${step >= i+1 ? '#00FF87' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: step === i+1 ? '#030507' : step > i+1 ? '#00c468' : 'var(--text3)' }}>
                  {step > i+1 ? '✓' : n}
                </div>
                <span style={{ fontSize: 9, color: step === i+1 ? 'var(--text)' : 'var(--text3)', letterSpacing: '0.06em' }}>{label}</span>
                {i === 0 && <div style={{ width: 20, height: 1, background: step > 1 ? 'rgba(0,255,135,0.3)' : 'var(--border)', marginLeft: 2 }}/>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Titre *">
                <input value={form.title} onChange={evt => set('title', evt.target.value)} placeholder="Ex : Kaggle Interne — Prédiction de Churn" style={inputStyle} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={evt => set('description', evt.target.value)} rows={3} placeholder="Objectif, consignes, dataset…" style={{ ...inputStyle, resize: 'vertical' }} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Catégorie"><input value={form.category} onChange={evt => set('category', evt.target.value)} placeholder="ML, NLP, CV…" style={inputStyle} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} /></Field>
                <Field label="Prix / Récompense"><input value={form.prize} onChange={evt => set('prize', evt.target.value)} placeholder="Ex : Certificat + mention" style={inputStyle} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Date de début *"><input type="datetime-local" value={form.start_date} onChange={evt => set('start_date', evt.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} /></Field>
                <Field label="Date de fin *"><input type="datetime-local" value={form.end_date} onChange={evt => set('end_date', evt.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} /></Field>
              </div>
                <Field label="Nb max de soumissions par participant" hint="Nombre de fichiers qu'un participant peut soumettre au total">
                <input
                  type="number" min="1" max="1000"
                  value={form.max_submissions}
                  onChange={evt => set('max_submissions', parseInt(evt.target.value) || 1)}
                  style={inputStyle}
                  onFocus={evt => evt.target.style.borderColor='#243347'}
                  onBlur={evt => evt.target.style.borderColor='var(--border)'}
                />
              </Field>
              <Field label="Statut initial">
                <select value={form.status} onChange={evt => set('status', evt.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="upcoming">À venir</option>
                  <option value="active">Active</option>
                  <option value="ended">Terminée</option>
                </select>
              </Field>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 7 }}><div style={{ width: 14, height: 14, color: '#00FF87' }}><Icon.Bolt /></div>Scoring automatique</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3 }}>Calculer le score des CSV soumis automatiquement</div>
                  </div>
                  <div onClick={() => set('auto_score', !form.auto_score)} style={{ width: 40, height: 22, borderRadius: 11, background: form.auto_score ? '#00FF87' : 'var(--border2)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: form.auto_score ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: form.auto_score ? '#030507' : '#6b849e', transition: 'left 0.2s' }}/>
                  </div>
                </div>
                {form.auto_score && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <Field label="Métrique de scoring">
                      <select value={form.metric} onChange={evt => set('metric', evt.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </Field>
                    {form.metric !== 'custom' && (
                      <Field label="Colonne cible dans le CSV" hint="Nom exact de la colonne dans le CSV étudiant ET dans le ground truth">
                        <input value={form.metric_column} onChange={evt => set('metric_column', evt.target.value)} placeholder="label" style={inputStyle} onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'} />
                      </Field>
                    )}
                    {form.metric === 'custom' && (
                      <div style={{ padding: '8px 12px', background: 'rgba(255,184,48,0.07)', border: '1px solid rgba(255,184,48,0.2)', borderRadius: 6, fontSize: 10, color: '#FFB830', lineHeight: 1.6 }}>
                        ⚠ Métrique personnalisée : notation manuelle uniquement.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {error && <div style={{ fontSize: 10, color: '#FF4B6E', background: 'rgba(255,75,110,0.08)', border: '1px solid rgba(255,75,110,0.2)', borderRadius: 6, padding: '7px 12px' }}>{error}</div>}
            </div>
          )}
          {step === 2 && savedId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: 8, fontSize: 10, color: '#00c468', lineHeight: 1.7 }}>
                ✓ Compétition enregistrée. Upload le CSV des vraies réponses pour activer le scoring automatique.
              </div>
              <Field label={`Ground Truth CSV — métrique : ${form.metric.toUpperCase()}`}>
                <GroundTruthUpload competitionId={savedId} currentUrl={gtUrl} onUploaded={url => setGtUrl(url)} />
              </Field>
              {gtUrl && (
                <div style={{ padding: '10px 14px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, color: '#00FF87' }}><Icon.Check /></div>
                  <span style={{ fontSize: 10, color: '#00c468' }}>Fichier uploadé — le scoring automatique est prêt.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {step === 2 ? (
            <>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em' }}>← Retour</button>
              <button onClick={onSaved} style={{ flex: 2, padding: '10px 0', background: '#00FF87', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>{gtUrl ? 'TERMINER →' : 'PASSER →'}</button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.08em' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', background: saving ? '#00c468' : '#00FF87', border: 'none', borderRadius: 8, cursor: saving ? 'wait' : 'pointer', color: '#030507', fontWeight: 700, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em', boxShadow: '0 0 16px rgba(0,255,135,0.2)' }}>
                {saving ? 'ENREGISTREMENT…' : form.auto_score && form.metric !== 'custom' ? 'SUIVANT →' : competition ? 'MODIFIER →' : 'CRÉER →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal confirmation suppression ──────────────────────────────────────────
function ConfirmModal({ title, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(3,5,7,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={evt => evt.target === evt.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,75,110,0.3)', borderRadius: 14, width: '100%', maxWidth: 360, padding: 26, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'fadeUp 0.2s ease both' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,75,110,0.1)', color: '#FF4B6E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 18, height: 18 }}><Icon.Warning /></div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>Supprimer cette compétition ?</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 20 }}>« {title} » et toutes ses soumissions seront définitivement supprimées.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: 'var(--text3)', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>Annuler</button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }} style={{ flex: 1, padding: '10px 0', background: '#FF4B6E', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>
            {loading ? '…' : 'SUPPRIMER'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ManageCompetitions() {
  const [competitions, setCompetitions] = useState([])
  const [entryCounts, setEntryCounts]   = useState({})
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [toast, setToast]               = useState(null)
  const [submissions, setSubmissions]   = useState(null) // competition object

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('competitions').select('*').order('start_date', { ascending: false })
    setCompetitions(data || [])
    if (data?.length) {
      const counts = {}
      await Promise.all(data.map(async c => {
        const { count } = await supabase.from('competition_entries').select('*', { count: 'exact', head: true }).eq('competition_id', c.id)
        counts[c.id] = count || 0
      }))
      setEntryCounts(counts)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDelete = async (comp) => {
    await supabase.from('competition_entries').delete().eq('competition_id', comp.id)
    await supabase.from('competitions').delete().eq('id', comp.id)
    setDeleting(null); fetchAll(); showToast('✓ Compétition supprimée.')
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const filtered = competitions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:     competitions.length,
    active:    competitions.filter(c => getStatus(c) === 'active').length,
    upcoming:  competitions.filter(c => getStatus(c) === 'upcoming').length,
    autoScore: competitions.filter(c => c.auto_score).length,
  }

  return (
    <div style={{ padding: 'clamp(16px,4vw,28px)', maxWidth: 960, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .mc-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .mc-row { display:flex; align-items:center; gap:12px; padding:13px 16px; background:var(--bg2); border:1px solid var(--border); border-radius:8px; transition:all 0.2s; flex-wrap:wrap; }
        .mc-row:hover { border-color:#243347; }
        @media(max-width:640px){ .mc-stats{ grid-template-columns:repeat(2,1fr); } .mc-header{ flex-direction:column; align-items:flex-start !important; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, background: 'rgba(0,255,135,0.12)', border: '1px solid rgba(0,255,135,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 11, color: '#00FF87', letterSpacing: '0.04em', animation: 'slideIn 0.3s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ fontSize: 9, color: '#FF4B6E', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4B6E' }}/> Admin
        </div>
        <div className="mc-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(16px,4vw,20px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Gérer les <span style={{ color: '#00FF87' }}>Compétitions</span>
          </div>
          <button onClick={() => setModal('create')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#00FF87', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#030507', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, letterSpacing: '0.08em', boxShadow: '0 0 16px rgba(0,255,135,0.2)', flexShrink: 0 }}>
            <div style={{ width: 13, height: 13 }}><Icon.Plus /></div>
            NOUVELLE COMPÉTITION
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mc-stats" style={{ marginBottom: 24, animation: 'fadeUp 0.35s 0.05s ease both' }}>
        {[
          { label: 'Total',        value: stats.total,     color: '#6b849e', bg: 'rgba(107,132,158,0.08)' },
          { label: 'Actives',      value: stats.active,    color: '#00FF87', bg: 'rgba(0,255,135,0.08)' },
          { label: 'À venir',      value: stats.upcoming,  color: '#2C7BE5', bg: 'rgba(44,123,229,0.08)' },
          { label: 'Auto-scoring', value: stats.autoScore, color: '#FFB830', bg: 'rgba(255,184,48,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 'clamp(10px,2vw,14px) clamp(12px,2.5vw,16px)' }}>
            <div style={{ fontSize: 9, background: bg, color, borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 'clamp(18px,3vw,22px)', fontWeight: 700, color: 'var(--text)' }}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: 16, animation: 'fadeUp 0.35s 0.1s ease both' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--text3)' }}><Icon.Search /></div>
        <input type="text" value={search} onChange={evt => setSearch(evt.target.value)} placeholder="Rechercher par titre ou catégorie…"
          style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={evt => evt.target.style.borderColor='#243347'} onBlur={evt => evt.target.style.borderColor='var(--border)'}
        />
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.35s 0.15s ease both' }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 70, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, opacity: 0.5 - i * 0.08 }}/>
            ))
          : filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}>Aucune compétition trouvée.</div>
          : filtered.map(comp => {
              const status = getStatus(comp)
              const s      = STATUS_MAP[status]
              const subCount = entryCounts[comp.id] ?? 0
              return (
                <div key={comp.id} className="mc-row">
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text)', letterSpacing: '0.02em' }}>{comp.title}</span>
                      <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.1em' }}>{s.label}</span>
                      {comp.auto_score && (
                        <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,255,135,0.07)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.2)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 8, height: 8 }}><Icon.Bolt /></div>AUTO
                        </span>
                      )}
                      {comp.auto_score && !comp.ground_truth_url && (
                        <span style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: 'rgba(255,184,48,0.1)', color: '#FFB830', border: '1px solid rgba(255,184,48,0.2)', letterSpacing: '0.08em' }}>⚠ Ground truth manquant</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 9, height: 9 }}><Icon.Clock /></div>
                        {formatDeadline(comp.start_date)} → {formatDeadline(comp.end_date)}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 9, height: 9 }}><Icon.Users /></div>
                        {subCount} participant{subCount !== 1 ? 's' : ''}
                      </span>
                      {comp.metric && <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.04em' }}>{comp.metric.toUpperCase()}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {/* Bouton soumissions */}
                    <button onClick={() => setSubmissions(comp)}
                      style={{ padding: '6px 11px', background: subCount > 0 ? 'rgba(0,255,135,0.07)' : 'none', border: `1px solid ${subCount > 0 ? 'rgba(0,255,135,0.2)' : 'var(--border2)'}`, borderRadius: 6, cursor: 'pointer', color: subCount > 0 ? '#00FF87' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                      onMouseEnter={evt => { evt.currentTarget.style.borderColor='#00FF87'; evt.currentTarget.style.color='#00FF87' }}
                      onMouseLeave={evt => { evt.currentTarget.style.borderColor=subCount>0?'rgba(0,255,135,0.2)':'var(--border2)'; evt.currentTarget.style.color=subCount>0?'#00FF87':'var(--text3)' }}>
                      <div style={{ width: 11, height: 11 }}><Icon.Trophy /></div>
                      Soumissions {subCount > 0 && `(${subCount})`}
                    </button>
                    <button onClick={() => setModal(comp)}
                      style={{ padding: '6px 11px', background: 'none', border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em', transition: 'all 0.15s' }}
                      onMouseEnter={evt => { evt.currentTarget.style.color='var(--text)'; evt.currentTarget.style.borderColor='#00FF87' }}
                      onMouseLeave={evt => { evt.currentTarget.style.color='var(--text3)'; evt.currentTarget.style.borderColor='var(--border2)' }}>
                      <div style={{ width: 11, height: 11 }}><Icon.Edit /></div>
                      Modifier
                    </button>
                    <button onClick={() => setDeleting(comp)}
                      style={{ padding: '6px 10px', background: 'rgba(255,75,110,0.06)', border: '1px solid rgba(255,75,110,0.15)', borderRadius: 6, cursor: 'pointer', color: '#FF4B6E', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={evt => evt.currentTarget.style.background='rgba(255,75,110,0.12)'}
                      onMouseLeave={evt => evt.currentTarget.style.background='rgba(255,75,110,0.06)'}>
                      <div style={{ width: 13, height: 13 }}><Icon.Trash /></div>
                    </button>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Modals */}
      {modal && (
        <CompModal
          competition={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll(); showToast(modal === 'create' ? '✓ Compétition créée !' : '✓ Compétition modifiée !') }}
        />
      )}
      {deleting && (
        <ConfirmModal title={deleting.title} onClose={() => setDeleting(null)} onConfirm={() => handleDelete(deleting)} />
      )}
      {submissions && (
        <SubmissionsModal competition={submissions} onClose={() => setSubmissions(null)} />
      )}
    </div>
  )
}
