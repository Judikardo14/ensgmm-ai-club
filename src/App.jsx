import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PageWrapper from './components/layout/PageWrapper'
import Dashboard from './pages/student/Dashboard'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', color:'#3d5268', fontFamily:"'IBM Plex Mono',monospace",
      fontSize:'11px', letterSpacing:'0.15em', background:'#030507',
    }}>
      INITIALISATION SYSTÈME...
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// Placeholder pour les pages pas encore codées
const Soon = ({ name }) => (
  <div style={{ color:'#00FF87', fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }}>
    <span style={{color:'#3d5268'}}>→ </span>{name} — bientôt disponible
  </div>
)

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Privé — avec layout */}
        <Route element={<PrivateRoute><PageWrapper /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assignments"  element={<Soon name="Devoirs" />} />
          <Route path="/competitions" element={<Soon name="Compétitions" />} />
          <Route path="/leaderboard"  element={<Soon name="Leaderboard" />} />
          <Route path="/profile"      element={<Soon name="Profil" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}