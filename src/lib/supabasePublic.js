import { createClient } from '@supabase/supabase-js'

// Client dédié aux pages publiques (résultats AICE) : il n'utilise ni ne rafraîchit
// aucune session stockée dans le navigateur. Ainsi, un ancien compte connecté ou une
// session expirée ne peut pas bloquer l'appel, surtout sur réseau lent.
export const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'aice-public-sans-session',
    },
  }
)
