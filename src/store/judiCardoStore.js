// src/store/judiCardoStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useJudiCardoStore = create(
  persist(
    (set, get) => ({
      messages: [],
      isOpen: false,
      isLoading: false,
      isTyping: false,

      toggle: () => set(s => ({ isOpen: !s.isOpen })),

     loadHistory: async () => {
    // Sur nouveau appareil : localStorage vide → charge depuis DB
    // Sur même appareil : localStorage a des messages → vérifie quand même la DB
    //                     au cas où d'autres messages existent
    const localCount = get().messages.length
  
    const { data } = await supabase
      .from('judikardo_conversations')
      .select('messages')
      .maybeSingle()
  
    if (data?.messages?.length) {
      const dbMessages = data.messages.slice(-20)
      // Prendre le plus long entre local et DB
      if (dbMessages.length >= localCount) {
        set({ messages: dbMessages })
      }
    }
  },

      sendMessage: async (content) => {
        const userMsg = { role: 'user', content }
        set(s => ({ messages: [...s.messages, userMsg], isLoading: true, isTyping: true }))
        try {
          const { data: { session } } = await supabase.auth.getSession()
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
            messages: [...s.messages, botMsg].slice(-20),
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
        set({ messages: [] })
      },
    }),
    {
      name: 'judikardo-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
