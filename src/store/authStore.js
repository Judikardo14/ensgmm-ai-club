import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      set({ user: session.user, profile, loading: false })
    } else {
      set({ user: null, profile: null, loading: false })
    }

    let isFetchingProfile = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, loading: false })
          return
        }
        if (event === 'SIGNED_IN' && session?.user) {
          if (isFetchingProfile) return
          isFetchingProfile = true
          const profile = await fetchProfile(session.user.id)
          set({ user: session.user, profile, loading: false })
          isFetchingProfile = false
          return
        }
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          set(state => ({ user: session.user, profile: state.profile, loading: false }))
          return
        }
        if (event === 'PASSWORD_RECOVERY') return
        set({ loading: false })
      }
    )
    set({ _subscription: subscription })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    const profile = await fetchProfile(user.id)
    set({ profile })
  },
}))

async function fetchProfile(userId, retries = 8) {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      if (data.banned) {
        await supabase.auth.signOut()
        window.location.href = '/banned'
        return null
      }
      return data
    }
    const delay = 300 + i * 200
    await new Promise(r => setTimeout(r, delay))
  }
  return null
}
