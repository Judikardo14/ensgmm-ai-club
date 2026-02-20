import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'

// Auth
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

// Layout
import PageWrapper from './components/layout/PageWrapper'

// Student pages
import Dashboard    from './pages/student/Dashboard'
import Assignments  from './pages/student/Assignments'
import Competitions from './pages/student/Competitions'
import Leaderboard  from './pages/student/Leaderboard'
import Profile      from './pages/student/Profile'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard'
import ManageAssignments from './pages/admin/ManageAssignments'
import ManageCompetitions from './pages/admin/ManageCompetitions'
import ManageUsers       from './pages/admin/ManageUsers'

// ─── Guard routes ─────────────────────────────────────────────────────────────

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#3d5268',
      fontFamily: "'IBM Plex Mono',monospace",
      fontSize: 11, letterSpacing: '0.15em', background: '#030507',
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

// Seuls les admins peuvent accéder aux routes admin
const AdminRoute = ({ children }) => {
  const { profile, loading } = useAuthStore()
  if (loading) return null
  return profile?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        {/* Ni public ni privé — accessible toujours */}
        <Route path="/reset-password" element={<ResetPassword />} />

        
        {/* ── Privé avec layout ── */}
        <Route element={<PrivateRoute><PageWrapper /></PrivateRoute>}>

          {/* Student */}
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/assignments"  element={<Assignments />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/leaderboard"  element={<Leaderboard />} />
          <Route path="/profile"      element={<Profile />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/assignments"  element={<AdminRoute><ManageAssignments /></AdminRoute>} />
          <Route path="/admin/competitions" element={<AdminRoute><ManageCompetitions /></AdminRoute>} />
          <Route path="/admin/users"        element={<AdminRoute><ManageUsers /></AdminRoute>} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
