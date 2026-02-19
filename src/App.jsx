import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PageWrapper from './components/layout/PageWrapper'
import Dashboard from './pages/student/Dashboard'
import Assignments from './pages/student/Assignments'
import Competitions from './pages/student/Competitions'
import Leaderboard from './pages/student/Leaderboard'
import Profile from './pages/student/Profile'
import AdminDashboard    from './pages/admin/AdminDashboard'
import ManageAssignments from './pages/admin/ManageAssignments'
import ManageCompetitions from './pages/admin/ManageCompetitions'
import ManageUsers       from './pages/admin/ManageUsers'

// ── Écran de chargement ──
const Loading = () => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'center',
    height:'100vh', background:'#030507',
    color:'#3d5268', fontFamily:"'IBM Plex Mono',monospace",
    fontSize:'11px', letterSpacing:'0.15em',
  }}>
    INITIALISATION SYSTÈME...
  </div>
)

// ── Route privée : doit être connecté ──
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}

// ── Route publique : redirige si déjà connecté ──
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <Loading />
  if (user) {
    // Rediriger vers la bonne interface selon le rôle
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

// ── Route admin : doit être connecté ET admin ──
const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuthStore()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Pages publiques ── */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Pages étudiant ── */}
        <Route element={<PrivateRoute><PageWrapper /></PrivateRoute>}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/assignments"  element={<Assignments />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/leaderboard"  element={<Leaderboard />} />
          <Route path="/profile"      element={<Profile />} />
        </Route>

        {/* ── Pages admin (protégées) ── */}
        <Route element={<AdminRoute><PageWrapper /></AdminRoute>}>
          <Route path="/admin"               element={<AdminDashboard />} />
          <Route path="/admin/assignments"   element={<ManageAssignments />} />
          <Route path="/admin/competitions"  element={<ManageCompetitions />} />
          <Route path="/admin/users"         element={<ManageUsers />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}