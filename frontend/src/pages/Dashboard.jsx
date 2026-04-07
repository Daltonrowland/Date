import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import MatchCard from '../components/MatchCard'
import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState('Everyone')
  const [showSearch, setShowSearch] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState(null)

  useEffect(() => {
    const params = genderFilter && genderFilter !== 'Everyone' ? `?gender_filter=${genderFilter}` : ''
    api.get(`/matches${params}`).then(({ data }) => setMatches(data)).finally(() => setLoading(false))
  }, [genderFilter])

  useEffect(() => {
    const token = localStorage.getItem('rs_token')
    if (token) {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://date-production-5ca0.up.railway.app'
      try {
        const evtSource = new EventSource(`${baseUrl}/events/matches?token=${token}`)
        evtSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'new_match') {
              api.get('/matches').then(({ data: m }) => setMatches(m))
              toast.success(`New match: ${data.match_name} (${Math.round(data.score)})`)
            }
          } catch (_) {}
        }
        return () => evtSource.close()
      } catch (_) {}
    }
  }, [])

  const handleLike = async (userId, name) => {
    try {
      const { data } = await api.post(`/likes/${userId}`)
      setMatches(prev => prev.map(m => m.user_id === userId ? { ...m, i_liked: true, they_liked: m.they_liked || data.mutual } : m))
      if (data.mutual) {
        toast.success(`It's a match with ${name}! 💜`, { duration: 4000 })
      } else {
        toast('Liked! 💜', { icon: '💜' })
      }
    } catch (err) {
      if (err.response?.status === 400) toast('Already liked')
    }
  }

  const handlePass = (userId) => {
    setMatches(prev => prev.filter(m => m.user_id !== userId))
  }

  const handleSearch = async () => {
    if (searchCode.length !== 6) return
    try {
      const { data } = await api.get(`/users/lookup/${searchCode.toUpperCase()}`)
      setSearchResult(data)
    } catch (_) {
      setSearchResult(null)
      toast.error('No user found with that RS Code')
    }
  }

  const FILTERS = ['Everyone', 'Women', 'Men', 'Non-binary']

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">Your Matches</h1>
            <p className="text-white/40 text-xs sm:text-sm">{matches.length} people in your network</p>
          </div>
          <button onClick={() => setShowSearch(!showSearch)}
            className="w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-sm">
            <span>🔍</span><span className="hidden sm:inline">RS Code</span>
          </button>
        </div>

        {/* RS Code search modal */}
        {showSearch && (
          <motion.div className="card p-4 sm:p-5 mb-5" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm font-mono uppercase tracking-widest min-h-[44px]"
                placeholder="RS CODE" maxLength={6} value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={searchCode.length !== 6}
                className="btn-primary text-sm px-4 min-h-[44px]">Search</button>
              <button onClick={() => { setShowSearch(false); setSearchResult(null); setSearchCode('') }}
                className="text-white/30 hover:text-white px-2 min-h-[44px]">✕</button>
            </div>
            {searchResult && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                {searchResult.profile_photo ? (
                  <img src={searchResult.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-lg font-bold text-white">
                    {searchResult.name?.[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{searchResult.name}</div>
                  <div className="text-white/30 text-xs">{searchResult.archetype} · {searchResult.sun_sign}</div>
                </div>
                <Link to={`/profile/${searchResult.id}`} className="btn-primary text-xs py-2 px-3">View</Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Quiz CTA */}
        {user && !user.quiz_completed && (
          <motion.div className="card p-5 sm:p-6 mb-6 sm:mb-8 bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-purple-500/20"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-display font-semibold text-white text-base sm:text-lg mb-2">Take the compatibility quiz</h3>
            <p className="text-white/50 text-xs sm:text-sm mb-4">Complete the 60-question quiz to unlock your score and see matches.</p>
            <Link to="/quiz" className="btn-primary text-sm">Start quiz →</Link>
          </motion.div>
        )}

        {/* Gender filter */}
        <div className="flex gap-2 flex-wrap mb-4 sm:mb-6">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setGenderFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[36px] ${
                genderFilter === f ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}>{f}</button>
          ))}
        </div>

        {/* Match list */}
        {loading ? (
          <div className="text-white/30 text-center py-16 text-sm">Loading matches…</div>
        ) : matches.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <div className="text-4xl mb-4">💫</div>
            <h3 className="font-display font-semibold text-white mb-2">No matches yet</h3>
            <p className="text-white/40 text-sm">
              {user?.quiz_completed ? 'Matches appear as other users complete the quiz.' : 'Complete the quiz to start matching.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => (
              <MatchCard key={match.user_id} match={match} index={i}
                onLike={() => handleLike(match.user_id, match.name)}
                onPass={() => handlePass(match.user_id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
