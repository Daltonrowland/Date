import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Quiz from './pages/Quiz'
import ScoreReveal from './pages/ScoreReveal'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Sanctuary from './pages/Sanctuary'
import ForgotPassword from './pages/ForgotPassword'
import Messages from './pages/Messages'
import Knocks from './pages/Knocks'
import VerifyEmail from './pages/VerifyEmail'
import Search from './pages/Search'
import MatchDetail from './pages/MatchDetail'
import Likes from './pages/Likes'
import Wallet from './pages/Wallet'
import Navbar from './components/Navbar'

/**
 * Enforced user flow:
 * 1. Register → /verify (if not verified)
 * 2. /verify → /onboarding (if not onboarded)
 * 3. /onboarding → /quiz (if not quiz completed)
 * 4. /quiz → /score (score reveal)
 * 5. /score → /dashboard (main app)
 */
function ProtectedRoute({ children, allowDuringFlow = false }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace />

  // Pages allowed during flow (verify, onboarding, quiz, score) skip gating
  if (allowDuringFlow) return children

  // Gate: if onboarding not completed, force to /onboarding
  if (user && user.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Gate: if quiz not completed, force to /quiz (but allow onboarding)
  if (user && user.quiz_completed === false && user.onboarding_completed !== false && location.pathname !== '/quiz') {
    return <Navigate to="/quiz" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  const token = useAuthStore((s) => s.token)

  return (
    <>
      <Toaster position="top-center"
        toastOptions={{ style: { background: '#1C1C1C', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

        {/* Flow pages — allowed during onboarding flow */}
        <Route path="/verify" element={<ProtectedRoute allowDuringFlow><VerifyEmail /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute allowDuringFlow><Onboarding /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute allowDuringFlow><Quiz /></ProtectedRoute>} />
        <Route path="/score" element={<ProtectedRoute allowDuringFlow><ScoreReveal /></ProtectedRoute>} />

        {/* Main app — gated by onboarding + quiz */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/match/:userId" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
        <Route path="/knocks" element={<ProtectedRoute><Knocks /></ProtectedRoute>} />
        <Route path="/sanctuary" element={<ProtectedRoute><Sanctuary /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
