import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import MatchCard from '../components/MatchCard'
import useAuthStore from '../store/authStore'

const GENDER_FILTERS = [
  { key: 'Everyone', icon: '✦' },
  { key: 'Women', icon: '♀' },
  { key: 'Men', icon: '♂' },
  { key: 'Non-binary', icon: '⚧' },
]

const TIER_FILTERS = [
  { key: '', label: 'All', color: 'white' },
  { key: 'soul_aligned', label: 'Soul-Aligned', color: '#C084FC' },
  { key: 'strong_potential', label: 'Strong Potential', color: '#A855F7' },
  { key: 'healthy_growing', label: 'Healthy & Growing', color: '#86EFAC' },
  { key: 'magnetic_risky', label: 'Magnetic but Risky', color: '#F472B6' },
  { key: 'possible_unstable', label: 'Unstable', color: '#FCD34D' },
  { key: 'red_flag_zone', label: 'Red Flag', color: '#F87171' },
]

const SORT_OPTIONS = [
  { key: 'score', label: 'Best Match' },
  { key: 'newest', label: 'Newest' },
]

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState('Everyone')
  const [tierFilter, setTierFilter] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [showSearch, setShowSearch] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())
  const [removedIds, setRemovedIds] = useState(new Set())

  useEffect(() => {
    setLoading(true)
    const params = genderFilter && genderFilter !== 'Everyone' ? `?gender_filter=${genderFilter}` : ''
    api.get(`/matches${params}&limit=100`).then(({ data }) => setMatches(data)).catch(() => {}).finally(() => setLoading(false))
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
              api.get('/matches?limit=100').then(({ data: m }) => setMatches(m))
              toast.success(`New match: ${data.match_name} (${Math.round(data.score)})`)
            }
          } catch (_) {}
        }
        return () => evtSource.close()
      } catch (_) {}
    }
  }, [])

  const handleLike = useCallback(async (userId, name) => {
    setLikedIds(prev => new Set(prev).add(userId))
    try {
      const { data } = await api.post(`/likes/${userId}`)
      if (data.mutual) {
        const match = matches.find(m => m.user_id === userId)
        toast((t) => (
          <div className="flex items-center gap-3">
            {(match?.profile_photo || match?.photo_url) && <img src={match.profile_photo || match.photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />}
            <div>
              <p className="font-semibold text-sm">It's a match with {name}! 💜</p>
              <button onClick={() => { toast.dismiss(t.id); window.location.href = `/profile/${userId}` }}
                className="text-purple-400 text-xs mt-1 hover:text-purple-300">View Match →</button>
            </div>
          </div>
        ), { duration: 6000 })
      }
    } catch (_) {}
  }, [matches])

  const handleExitDone = useCallback((userId) => {
    setRemovedIds(prev => new Set(prev).add(userId))
  }, [])

  const handlePass = useCallback((userId) => {
    setLikedIds(prev => new Set(prev).add(userId))
    setTimeout(() => setRemovedIds(prev => new Set(prev).add(userId)), 450)
  }, [])

  const handleSearch = async () => {
    if (searchCode.length !== 6) return
    try {
      const { data } = await api.get(`/users/lookup/${searchCode.toUpperCase()}`)
      setSearchResult(data)
    } catch (_) { setSearchResult(null); toast.error('No user found') }
  }

  let visibleMatches = matches.filter(m => !removedIds.has(m.user_id) && !likedIds.has(m.user_id) && !m.i_liked)
  if (tierFilter) visibleMatches = visibleMatches.filter(m => m.tier === tierFilter)

  const allLiked = matches.length > 0 && visibleMatches.length === 0 && !loading

  return (
    <div className="min-h-screen bg-gradient-romantic pt-14 sm:pt-16 pb-16" style={{ userSelect: 'none' }}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-5 sm:py-7">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Your Matches</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600/25 text-purple-300 text-xs font-bold">{visibleMatches.length}</span>
            </div>
            <p className="text-white/30 text-xs sm:text-sm mt-0.5">People compatible with your Genesis OS profile</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ cursor: 'pointer', userSelect: 'none' }}
              className="bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs px-3 py-2 outline-none focus:border-purple-500/50 hidden sm:block">
              {SORT_OPTIONS.map(s => <option key={s.key} value={s.key} className="bg-dark-900">{s.label}</option>)}
            </select>
            {/* Search */}
            <button onClick={() => setShowSearch(!showSearch)} style={{ cursor: 'pointer' }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-sm">
              🔍
            </button>
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────── */}
        {showSearch && (
          <motion.div className="card p-4 mb-5" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm font-mono uppercase tracking-widest min-h-[44px]"
                style={{ userSelect: 'text' }} placeholder="RS CODE" maxLength={6} value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <button onClick={handleSearch} disabled={searchCode.length !== 6} style={{ cursor: 'pointer' }}
                className="btn-primary text-sm px-4 min-h-[44px]">Search</button>
              <button onClick={() => { setShowSearch(false); setSearchResult(null); setSearchCode('') }}
                style={{ cursor: 'pointer' }} className="text-white/30 hover:text-white px-2 min-h-[44px]">✕</button>
            </div>
            {searchResult && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                {searchResult.profile_photo ? <img src={searchResult.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover" /> :
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-lg font-bold text-white">{searchResult.name?.[0]}</div>}
                <div className="flex-1"><div className="text-white font-semibold text-sm">{searchResult.name}</div><div className="text-white/30 text-xs">{searchResult.archetype}</div></div>
                <Link to={`/profile/${searchResult.id}`} className="btn-primary text-xs py-2 px-3">View</Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Quiz CTA ────────────────────────────────────────── */}
        {user && !user.quiz_completed && (
          <div className="card p-5 sm:p-6 mb-6 bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-purple-500/20">
            <h3 className="font-display font-semibold text-white text-base mb-2">Take the compatibility quiz</h3>
            <p className="text-white/50 text-xs sm:text-sm mb-4">60 questions to unlock your score and matches.</p>
            <Link to="/quiz" className="btn-primary text-sm">Start quiz →</Link>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {/* Gender pills — horizontal scroll on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {GENDER_FILTERS.map(f => (
              <button key={f.key} onClick={() => setGenderFilter(f.key)} style={{ cursor: 'pointer' }}
                className={`filter-pill flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap min-h-[36px] transition-all ${
                  genderFilter === f.key ? 'filter-pill-active' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                }`}>
                <span>{f.icon}</span> {f.key}
              </button>
            ))}
          </div>
          {/* Tier pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {TIER_FILTERS.map(f => (
              <button key={f.key} onClick={() => setTierFilter(f.key === tierFilter ? '' : f.key)} style={{ cursor: 'pointer' }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all border ${
                  tierFilter === f.key
                    ? 'border-current bg-current/10'
                    : 'border-white/5 bg-white/3 text-white/30 hover:bg-white/5'
                }`}
                {...(tierFilter === f.key ? { style: { color: f.color, borderColor: f.color, background: `${f.color}15`, cursor: 'pointer' } } : { style: { cursor: 'pointer' } })}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards Grid ──────────────────────────────────────── */}
        {loading ? (
          /* Skeleton loading — 4 cards in 2-col grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="match-card skeleton-card" style={{ animationDelay: `${i * 120}ms` }}>
                <div className="h-56 sm:h-64 bg-white/5 skeleton-shimmer rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-white/5 skeleton-shimmer rounded" />
                  <div className="h-3 w-1/2 bg-white/5 skeleton-shimmer rounded" />
                  <div className="flex gap-2"><div className="h-6 w-20 bg-white/5 skeleton-shimmer rounded-full" /><div className="h-6 w-16 bg-white/5 skeleton-shimmer rounded-full" /></div>
                  <div className="flex gap-2 mt-2"><div className="h-11 flex-[0_0_30%] bg-white/5 skeleton-shimmer rounded-xl" /><div className="h-11 flex-[1_1_70%] bg-white/5 skeleton-shimmer rounded-xl" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : allLiked ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💜</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">You've liked everyone!</h3>
            <p className="text-white/40 text-sm mb-6">Check your Likes page to see who liked you back.</p>
            <Link to="/likes" className="btn-primary text-sm">Go to Likes →</Link>
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No matches yet</h3>
            <p className="text-white/40 text-sm mb-6">
              {user?.quiz_completed ? 'Matches appear as other users take the quiz.' : 'Take the quiz to start matching.'}
            </p>
            {!user?.quiz_completed && <Link to="/quiz" className="btn-primary text-sm">Take quiz →</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleMatches.map((match, i) => (
              <MatchCard
                key={match.user_id}
                match={match}
                delay={i * 80}
                exiting={likedIds.has(match.user_id)}
                onExitDone={handleExitDone}
                onLike={() => handleLike(match.user_id, match.name)}
                onPass={() => handlePass(match.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
