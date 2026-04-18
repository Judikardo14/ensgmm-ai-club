// src/store/judiCardoStore.js
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useJudiCardoStore = create((set, get) => ({
  messages: [],        // { role, content, timestamp }
  isOpen: false,
  isLoading: false,
  isTyping: false,

  loadHistory: async () => {
    const { data } = await supabase
      .from('judikardo_conversations')
      .select('messages')
      .single()
    if (data?.messages?.length) {
      set({ messages: data.messages.map(m => ({ ...m, timestamp: new Date() })) })
    }
  },

  toggle: () => set(s => ({ isOpen: !s.isOpen })),

  sendMessage: async (content) => {
    const userMsg = { role: 'user', content, timestamp: new Date() }
    set(s => ({ messages: [...s.messages, userMsg], isLoading: true, isTyping: true }))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const history = get().messages.slice(-10).map(({ role, content }) => ({ role, content }))

      const res = await supabase.functions.invoke('judikardo-chat', {
        body: { message: content, conversationHistory: history },
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      const botMsg = { role: 'assistant', content: res.data.reply, timestamp: new Date() }
      set(s => ({ messages: [...s.messages, botMsg], isLoading: false, isTyping: false }))
    } catch {
      set(s => ({ 
        messages: [...s.messages, { role: 'assistant', content: "Oups, j'ai un petit bug là ! Réessaie dans un instant 😅", timestamp: new Date() }],
        isLoading: false, isTyping: false
      }))
    }
  },

  clearHistory: async () => {
    await supabase.from('judikardo_conversations').delete().neq('user_id', '')
    set({ messages: [] })
  }
}))
