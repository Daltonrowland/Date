import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/client'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [coinBalance, setCoinBalance] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    const fetchCounts = () => {
      api.get('/messages/unread-count').then(({ data }) => setUnread(data.unread_count || 0)).catch(() => {})
      api.get('/notifications/unread-count').then(({ data }) => setNotifCount(data.count || 0)).catch(() => {})
      api.get('/wallet/summary').then(({ data }) => setCoinBalance(data?.balance || 0)).catch(() => {})
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { setMenuOpen(false); setShowNotifs(false) }, [location.pathname])

  const toggleNotifs = async () => {
    if (!showNotifs) {
      try { const { data } = await api.get('/notifications'); setNotifs(data || []) } catch (_) {}
    }
    setShowNotifs(!showNotifs)
  }

  const markNotifRead = async (n) => {
    await api.patch(`/notifications/${n.id}/read`).catch(() => {})
    setNotifCount(c => Math.max(0, c - 1))
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    setShowNotifs(false)
    if (n.type === 'mutual_match' || n.type === 'knock_accepted') navigate(`/profile/${n.reference_id}`)
    else if (n.type === 'new_message') navigate('/messages')
    else if (n.type === 'knock_received') navigate('/knocks')
  }

  const handleLogout = () => { logout(); navigate('/') }
  const active = (path) => location.pathname.startsWith(path) ? 'text-purple-400' : 'text-white/50 hover:text-white/80'
  const NOTIF_ICONS = { mutual_match: '💜', new_message: '💬', knock_received: '🚪', knock_accepted: '✅' }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <Link to="/dashboard" className="font-display font-bold text-lg text-white flex-shrink-0">RS <span className="text-purple-400">✦</span></Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link to="/dashboard" className={`transition-colors ${active('/dashboard')}`}>Matches</Link>
          <Link to="/likes" className={`transition-colors ${active('/likes')}`}>Likes</Link>
          <Link to="/messages" className={`transition-colors relative ${active('/messages')}`}>
            Messages {unread > 0 && <span className="absolute -top-1 -right-3 bg-pink-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5">{unread > 9 ? '9+' : unread}</span>}
          </Link>
          <Link to="/knocks" className={`transition-colors ${active('/knocks')}`}>Knocks</Link>
          <Link to="/sanctuary" className={`transition-colors ${active('/sanctuary')}`}>Sanctuary</Link>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          {/* Coin balance */}
          <Link to="/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold hover:bg-gold-500/20 transition-colors">
            🪙 {coinBalance}
          </Link>
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={toggleNotifs} className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white relative">
              🔔 {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{notifCount > 9 ? '9+' : notifCount}</span>}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 card max-h-96 overflow-y-auto shadow-xl z-50">
                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Notifications</span>
                  <button onClick={() => { api.patch('/notifications/read-all'); setNotifCount(0); setNotifs(prev => prev.map(n => ({ ...n, read: true }))) }} className="text-purple-400 text-xs">Mark all read</button>
                </div>
                {notifs.length === 0 ? (
                  <div className="p-6 text-center text-white/30 text-xs">No notifications</div>
                ) : notifs.slice(0, 10).map(n => (
                  <button key={n.id} onClick={() => markNotifRead(n)}
                    className={`w-full text-left p-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 ${n.read ? 'opacity-50' : ''}`}>
                    <span className="text-lg flex-shrink-0">{NOTIF_ICONS[n.type] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-xs leading-relaxed">{n.message}</p>
                      <p className="text-white/20 text-xs mt-0.5">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user && (
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors ml-1">
              {user.profile_photo ? <img src={user.profile_photo} className="w-7 h-7 rounded-full object-cover" /> :
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white">{user.name?.[0]?.toUpperCase()}</div>}
              <span className="text-sm hidden lg:inline">{user.name}</span>
            </Link>
          )}
          <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">Sign out</button>
        </div>

        {/* Mobile: bell + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <button onClick={toggleNotifs} className="w-10 h-10 flex items-center justify-center text-white/50 relative">
            🔔 {notifCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{notifCount}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center text-white/60">
            {menuOpen ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>}
          </button>
        </div>
      </div>

      {/* Mobile notification dropdown */}
      {showNotifs && (
        <div className="md:hidden bg-dark-900/95 border-t border-white/5 max-h-64 overflow-y-auto">
          {notifs.length === 0 ? <div className="p-4 text-center text-white/30 text-xs">No notifications</div> :
            notifs.slice(0, 5).map(n => (
              <button key={n.id} onClick={() => markNotifRead(n)} className="w-full text-left p-3 flex items-center gap-3 border-b border-white/5">
                <span>{NOTIF_ICONS[n.type] || '📌'}</span>
                <span className="text-white/70 text-xs flex-1">{n.message}</span>
              </button>
            ))}
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-900/95 backdrop-blur-md border-t border-white/5 px-4 py-2">
          {[
            ['/dashboard', 'Matches'],
            ['/likes', 'Likes'],
            ['/messages', `Messages${unread ? ` (${unread})` : ''}`],
            ['/knocks', 'Knocks'],
            ['/sanctuary', 'Sanctuary'],
            ['/search', 'Search'],
            ['/wallet', `Wallet (${coinBalance} 🪙)`],
          ].map(([path, label]) => (
            <Link key={path} to={path} className={`block py-3 px-3 rounded-lg text-sm font-medium min-h-[44px] flex items-center ${active(path)}`}>{label}</Link>
          ))}
          {user && <Link to={`/profile/${user.id}`} className="block py-3 px-3 rounded-lg text-sm text-white/50 min-h-[44px] flex items-center">My Profile</Link>}
          <div className="border-t border-white/5 mt-1 pt-1">
            <button onClick={handleLogout} className="w-full text-left py-3 px-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg min-h-[44px]">Sign out</button>
          </div>
        </div>
      )}
    </nav>
  )
}
