// src/components/shared/JudiCardoWidget.jsx
import { useState, useEffect, useRef } from 'react'
import { useJudiCardoStore } from '../../store/judiCardoStore'

const E = 'cubic-bezier(0.4,0,0.2,1)'

export default function JudiCardoWidget() {
  const { messages, isOpen, isTyping, toggle, sendMessage, loadHistory, clearHistory } = useJudiCardoStore()
  const [input, setInput] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120)
  }, [isOpen])

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    await clearHistory()
    setConfirmClear(false)
  }

  return (
    <>
      {/* Bulle flottante */}
      <button
        onClick={toggle}
        title="Judikardo — Tuteur IA"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: isOpen ? 'var(--surface2)' : 'var(--accent)',
          border: isOpen ? '1px solid var(--border2)' : 'none',
          cursor: 'pointer',
          boxShadow: isOpen ? 'none' : '0 4px 20px rgba(0,255,135,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: `all 0.2s ${E}`,
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 998,
          width: 360, height: 530, borderRadius: 16,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          fontFamily: "'IBM Plex Mono', monospace",
          animation: `judiSlideUp 0.22s ${E}`,
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '13px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            background: 'var(--bg2)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Judikardo</div>
              <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em' }}>● TUTEUR IA · EN LIGNE</div>
            </div>

            {/* Bouton clear */}
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title={confirmClear ? 'Confirmer la suppression' : 'Effacer la conversation'}
                style={{
                  background: confirmClear ? 'rgba(255,75,110,0.12)' : 'none',
                  border: `1px solid ${confirmClear ? 'rgba(255,75,110,0.4)' : 'var(--border)'}`,
                  borderRadius: 7, padding: '4px 9px', cursor: 'pointer',
                  fontSize: 10, color: confirmClear ? '#FF4B6E' : 'var(--text3)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  transition: `all 0.15s ${E}`,
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => { if (!confirmClear) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}}
                onMouseLeave={e => { if (!confirmClear) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}}
              >
                {confirmClear ? 'Confirmer ?' : '🗑 Effacer'}
              </button>
            )}
            {confirmClear && (
              <button
                onClick={() => setConfirmClear(false)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: 'var(--text3)', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Annuler
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
            scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent',
          }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text3)', fontSize: 12, lineHeight: 1.9 }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>👋</div>
                Salut ! Je suis <span style={{ color: 'var(--accent)' }}>Judikardo</span>,<br/>
                ton tuteur IA du club.<br/>
                <span style={{ fontSize: 11 }}>Devoirs · Classement · Compétitions · IA</span>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '9px 13px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                  color: m.role === 'user' ? '#030507' : 'var(--text)',
                  fontSize: 12, lineHeight: 1.65,
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Indicateur "en train d'écrire" */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '4px 14px 14px 14px', display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)',
                      animation: `judiDot 1.1s ${i * 0.18}s ease-in-out infinite`,
                      opacity: 0.7,
                    }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, flexShrink: 0, background: 'var(--bg2)',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }}}
              placeholder="Pose ta question à Judikardo..."
              disabled={isTyping}
              style={{
                flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 9, padding: '9px 13px',
                color: 'var(--text)', fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                outline: 'none', transition: `border-color 0.15s ${E}`,
                opacity: isTyping ? 0.5 : 1,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: input.trim() && !isTyping ? 'var(--accent)' : 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                fontSize: 16, color: input.trim() && !isTyping ? '#030507' : 'var(--text3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: `all 0.15s ${E}`,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes judiSlideUp {
          from { opacity:0; transform:translateY(14px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes judiDot {
          0%,100% { transform:translateY(0); opacity:0.4; }
          50%      { transform:translateY(-4px); opacity:1; }
        }
      `}</style>
    </>
  )
}
