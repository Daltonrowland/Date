import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/client'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    api.get('/messages/unread-count').then(({ data }) => setUnread(data.unread_count)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/messages/unread-count').then(({ data }) => setUnread(data.unread_count)).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  const active = (path) =>
    location.pathname === path ? 'text-purple-400' : 'text-white/50 hover:text-white/80'

  const NavLink = ({ to, children, badge }) => (
    <Link to={to} className={`transition-colors relative min-h-[44px] flex items-center ${active(to)}`}>
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-3 bg-pink-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link to="/dashboard" className="font-display font-bold text-lg text-white flex-shrink-0">
          RS <span className="text-purple-400">✦</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium">
          <NavLink to="/dashboard">Matches</NavLink>
          <NavLink to="/messages" badge={unread}>Messages</NavLink>
          <NavLink to="/knocks">Knocks</NavLink>
          <NavLink to="/sanctuary">Sanctuary</NavLink>
          {user && !user.quiz_completed && (
            <Link to="/quiz" className="text-pink-400 hover:text-pink-300 transition-colors">Take Quiz</Link>
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm">{user.name}</span>
            </Link>
          )}
          <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-3">Sign out</button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-white/60 hover:text-white">
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-900/95 backdrop-blur-md border-t border-white/5 px-4 py-3 space-y-1">
          <Link to="/dashboard" className={`block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${active('/dashboard')}`}>
            Matches
          </Link>
          <Link to="/messages" className={`block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center justify-between ${active('/messages')}`}>
            <span>Messages</span>
            {unread > 0 && <span className="bg-pink-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">{unread}</span>}
          </Link>
          <Link to="/knocks" className={`block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${active('/knocks')}`}>
            Knocks
          </Link>
          <Link to="/sanctuary" className={`block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${active('/sanctuary')}`}>
            Sanctuary
          </Link>
          {user && (
            <Link to={`/profile/${user.id}`} className="block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center text-white/50 hover:text-white/80">
              My Profile
            </Link>
          )}
          <div className="border-t border-white/5 mt-2 pt-2">
            <button onClick={handleLogout} className="w-full text-left py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] text-red-400 hover:bg-red-500/10">
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
