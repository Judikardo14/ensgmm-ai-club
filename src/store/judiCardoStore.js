// src/store/judiCardoStore.js
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useJudiCardoStore = create((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  isTyping: false,
  historyLoaded: false,

  toggle: () => set(s => ({ isOpen: !s.isOpen })),

  loadHistory: async () => {
  if (get().historyLoaded) return
  const { data } = await supabase
    .from('judikardo_conversations')
    .select('messages')
    .maybeSingle()  // ← ne plante pas si vide

  if (data?.messages?.length) {
    // Garder seulement les 10 derniers échanges (20 messages)
    const last20 = data.messages.slice(-20)
    set({ messages: last20, historyLoaded: true })
  } else {
    set({ historyLoaded: true })
  }
},

  sendMessage: async (content) => {
  const userMsg = { role: 'user', content }
  set(s => ({ messages: [...s.messages, userMsg], isLoading: true, isTyping: true }))

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // On envoie uniquement role+content à la fonction (pas de timestamp)
    const history = get().messages
      .slice(-20)
      .map(({ role, content }) => ({ role, content }))

    const { data, error } = await supabase.functions.invoke('judikardo-chat', {
      body: { message: content, conversationHistory: history },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    const botMsg = { role: 'assistant', content: data.reply }

    set(s => ({
      messages: [...s.messages, botMsg].slice(-20), // max 20 en mémoire
      isLoading: false,
      isTyping: false,
    }))
  } catch (err) {
    console.error('Judikardo error:', err)
    set(s => ({
      messages: [...s.messages, {
        role: 'assistant',
        content: "Oups, j'ai un petit bug là ! Réessaie dans un instant 😅"
      }],
      isLoading: false,
      isTyping: false,
    }))
  }
},

  clearHistory: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.functions.invoke('judikardo-chat', {
        body: { action: 'clear' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } catch (err) {
      console.error('Clear error:', err)
    }
    set({ messages: [], historyLoaded: false })
  },
}))
