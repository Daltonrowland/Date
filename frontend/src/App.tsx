import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Quiz from './pages/Quiz'
import ScoreReveal from './pages/ScoreReveal'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MatchDetail from './pages/MatchDetail'
import Sanctuary from './pages/Sanctuary'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function QuizGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />
  if (user.quiz_completed) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm font-body">Loading…</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { token, user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/login"    element={token ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />

      <Route path="/quiz" element={
        <ProtectedRoute><Quiz /></ProtectedRoute>
      } />

      <Route path="/score-reveal" element={
        <ProtectedRoute><ScoreReveal /></ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />

      <Route path="/matches/:id" element={
        <ProtectedRoute><MatchDetail /></ProtectedRoute>
      } />

      <Route path="/sanctuary" element={
        <ProtectedRoute><Sanctuary /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
