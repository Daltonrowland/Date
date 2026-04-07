import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const active = (path) =>
    location.pathname === path ? 'text-purple-400' : 'text-white/50 hover:text-white/80'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/dashboard" className="font-display font-bold text-lg text-white">
          RS <span className="text-purple-400">✦</span>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/dashboard" className={`transition-colors ${active('/dashboard')}`}>Matches</Link>
          <Link to="/sanctuary" className={`transition-colors ${active('/sanctuary')}`}>Sanctuary</Link>
          {user && !user.quiz_completed && (
            <Link to="/quiz" className="text-pink-400 hover:text-pink-300 transition-colors">Take Quiz</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-white/40 text-sm hidden sm:block">
              {user.name}
            </span>
          )}
          <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-4">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
