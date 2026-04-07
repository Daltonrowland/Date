import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/client'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/messages/unread-count').then(({ data }) => setUnread(data.unread_count)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/messages/unread-count').then(({ data }) => setUnread(data.unread_count)).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const active = (path) =>
    location.pathname === path ? 'text-purple-400' : 'text-white/50 hover:text-white/80'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/dashboard" className="font-display font-bold text-lg text-white">
          RS <span className="text-purple-400">✦</span>
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Link to="/dashboard" className={`transition-colors ${active('/dashboard')}`}>Matches</Link>
          <Link to="/messages" className={`transition-colors relative ${active('/messages')}`}>
            Messages
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-3 bg-pink-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          <Link to="/knocks" className={`transition-colors ${active('/knocks')}`}>Knocks</Link>
          <Link to="/sanctuary" className={`transition-colors ${active('/sanctuary')}`}>Sanctuary</Link>
          {user && !user.quiz_completed && (
            <Link to="/quiz" className="text-pink-400 hover:text-pink-300 transition-colors">Take Quiz</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm hidden sm:block">{user.name}</span>
            </Link>
          )}
          <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-4">Sign out</button>
        </div>
      </div>
    </nav>
  )
}
