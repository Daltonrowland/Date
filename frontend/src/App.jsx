import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Quiz from './pages/Quiz'
import ScoreReveal from './pages/ScoreReveal'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Sanctuary from './pages/Sanctuary'
import ForgotPassword from './pages/ForgotPassword'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  const token = useAuthStore((s) => s.token)

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1C1C1C', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/score" element={<ProtectedRoute><ScoreReveal /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/sanctuary" element={<ProtectedRoute><Sanctuary /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
