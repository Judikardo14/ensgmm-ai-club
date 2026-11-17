import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'
import ResultatsAICE  from './pages/public/ResultatsAICE'
import SaisonDecor    from './components/saisons/SaisonDecor'

// Auth
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

// Layout
import PageWrapper from './components/layout/PageWrapper'

// Student pages
const Dashboard = lazy(() => import('./pages/student/Dashboard'))
const Assignments = lazy(() => import('./pages/student/Assignments'))
const Competitions = lazy(() => import('./pages/student/Competitions'))
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'))
const Profile = lazy(() => import('./pages/student/Profile'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageAssignments = lazy(() => import('./pages/admin/ManageAssignments'))
const ManageCompetitions = lazy(() => import('./pages/admin/ManageCompetitions'))
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'))

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

//Bannissement 
function BannedPage() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#030507', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 32, color: '#FF4B6E' }}>⊘</div>
      <div style={{ fontFamily: "'Unbounded',sans-serif", fontSize: 16, color: '#dce8f5' }}>
        Accès suspendu
      </div>
      <div style={{ fontSize: 11, color: '#3d5268', maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>
        Ton compte a été suspendu. Contacte un administrateur.
      </div>
    </div>
  )
}
// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <SaisonDecor />
      <Suspense fallback={null}>
      <Routes>

        <Route path="/banned" element={<BannedPage />} />
        
        {/* ── Public ── */}
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        {/* Ni public ni privé — accessible toujours */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Résultats de sélection AICE : page publique, sans connexion */}
        <Route path="/aice-resultats" element={<ResultatsAICE />} />

        
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
      </Suspense>
    </BrowserRouter>
  )
}

console.log(
  '%c ENSGMM AI CLUB ',
  'background: #00FF87; color: #030507; font-family: monospace; font-size: 14px; font-weight: 900; padding: 4px 12px; border-radius: 4px;'
)
console.log(
  '%c Built by Judicael Karol DOBOEVI · Febuary 2026 ',
  'color: #3d5268; font-family: monospace; font-size: 10px; letter-spacing: 0.1em;'
)
