// src/components/shared/JudiCardoWidget.jsx
import { useState, useEffect, useRef } from 'react'
import { useJudiCardoStore } from '../../store/judiCardoStore'

export default function JudiCardoWidget() {
  const { messages, isOpen, isTyping, toggle, sendMessage, loadHistory } = useJudiCardoStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { loadHistory() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <>
      {/* Bulle flottante */}
      <button onClick={toggle} style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 999,
        width: 54, height: 54, borderRadius: '50%',
        background: isOpen ? '#3d5268' : 'var(--accent)',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, transition: 'all 0.2s ease',
        color: '#030507',
      }}>
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 998,
          width: 360, height: 520, borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 50px rgba(0,0,0,0.6)',
          fontFamily: "'IBM Plex Mono', monospace",
          animation: 'slideUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,255,135,0.15)', border: '1px solid rgba(0,255,135,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Judikardo</div>
              <div style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em' }}>● EN LIGNE</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 12, lineHeight: 1.8 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>👋</div>
                Salut ! Je suis <span style={{ color: 'var(--accent)' }}>Judikardo</span>, ton tuteur IA.<br/>
                Pose-moi tes questions sur les devoirs, le classement, les compétitions...
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '9px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                  color: m.role === 'user' ? '#030507' : 'var(--text)',
                  fontSize: 12, lineHeight: 1.6,
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: 5, padding: '9px 13px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', width: 'fit-content' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text3)', animation: `bounce 1s ${i * 0.2}s infinite` }}/>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pose ta question..."
              style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 13px', color: 'var(--text)', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace', outline: 'none" }}
            />
            <button onClick={handleSend} style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent)', border: 'none', cursor: 'pointer', fontSize: 16, color: '#030507', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </>
  )
}
