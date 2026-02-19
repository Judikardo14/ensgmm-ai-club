import { useState, useEffect } from 'react'

export default function CountdownTimer({ deadline, size = 'md' }) {
  const [time, setTime] = useState({d:0, h:0, m:0, s:0, expired:false})

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline) - new Date()
      if (diff <= 0) return setTime({expired:true, d:0,h:0,m:0,s:0})
      setTime({
        expired: false,
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const pad = n => String(n).padStart(2,'0')

  return (
    <div style={{
      display: 'inline-flex', gap: 8, alignItems: 'center',
      background: '#111', padding: '12px 16px', borderRadius: 8,
      border: '1px solid #00FF87',
    }}>
      {time.expired ? (
        <span style={{color:'#FF4B6E', fontFamily:'monospace'}}>Expiré</span>
      ) : (
        <>
          <Block val={time.d} unit="J" />
          <Sep />
          <Block val={time.h} unit="H" />
          <Sep />
          <Block val={time.m} unit="M" />
          <Sep />
          <Block val={time.s} unit="S" />
        </>
      )}
    </div>
  )
}

function Block({ val, unit }) {
  return (
    <div style={{textAlign:'center'}}>
      <div style={{
        fontSize: 24, fontWeight: 700, color: '#00FF87',
        fontFamily: 'monospace', minWidth: 40, lineHeight: 1,
      }}>
        {String(val).padStart(2,'0')}
      </div>
      <div style={{fontSize: 9, color: '#3d5268', letterSpacing:'0.15em', marginTop:2}}>
        {unit}
      </div>
    </div>
  )
}

function Sep() {
  return <span style={{color:'#00FF87', fontSize:20, fontWeight:700, opacity:0.4}}>:</span>
}