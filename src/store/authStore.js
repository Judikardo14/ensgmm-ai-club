import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  // ─── Initialisation ────────────────────────────────────────────────────────
  init: async () => {
    // 1. Session existante au chargement
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: session.user, profile, loading: false })
    } else {
      set({ user: null, profile: null, loading: false })
    }

    // 2. Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Déconnexion explicite (logout ou signOut après inscription)
          set({ user: null, profile: null, loading: false })
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id)
          set({ user: session.user, profile, loading: false })
          return
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token rafraîchi silencieusement — on ne refetch pas le profil
          const { profile } = get()
          set({ user: session.user, profile, loading: false })
          return
        }

        // Cas par défaut — toujours sortir du loading
        set({ loading: false })
      }
    )

    set({ _subscription: subscription })
  },

  // ─── Déconnexion ───────────────────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  // ─── Rafraîchir le profil (après modification) ─────────────────────────────
  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    const profile = await fetchProfile(user.id)
    set({ profile })
  },
}))

// ─── Helper : fetch profil avec retry robuste ─────────────────────────────────
// Le trigger crée le profil après insertion dans auth.users.
// On retente jusqu'à 8 fois avec délai croissant.
// Si après tout ça le profil n'existe toujours pas, on le crée manuellement.
async function fetchProfile(userId, retries = 8) {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) return data

    // Délai croissant : 300ms, 500ms, 700ms, 900ms...
    const delay = 300 + i * 200
    await new Promise(r => setTimeout(r, delay))
  }

  // Dernier recours : créer le profil manuellement si le trigger a échoué
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) return null

  const fallbackProfile = {
    id:           userId,
    full_name:    user.user_metadata?.full_name || user.email?.split('@')[0] || 'Membre',
    email:        user.email,
    role:         'student',
    total_points: 0,
  }

  const { data: created } = await supabase
    .from('profiles')
    .upsert(fallbackProfile)
    .select()
    .single()

  return created || fallbackProfile
}
