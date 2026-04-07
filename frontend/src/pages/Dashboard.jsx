import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import MatchCard from '../components/MatchCard'
import useAuthStore from '../store/authStore'

const TIER_ORDER = ['soul_aligned', 'deep_connection', 'strong_potential', 'building_ground', 'friction_zone', 'red_flag_zone']

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/matches').then(({ data }) => {
      setMatches(data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? matches
    : matches.filter((m) => m.tier === filter)

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Your Matches
          </h1>
          <p className="text-white/40 text-sm">
            {matches.length} {matches.length === 1 ? 'person' : 'people'} in your compatibility network
          </p>
        </div>

        {/* Quiz CTA */}
        {user && !user.quiz_completed && (
          <motion.div
            className="card p-6 mb-8 bg-gradient-to-br from-purple-900/40 to-pink-900/20 border-purple-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-display font-semibold text-white text-lg mb-2">Take the compatibility quiz</h3>
            <p className="text-white/50 text-sm mb-4">Complete the 60-question quiz to unlock your score and see matches.</p>
            <Link to="/quiz" className="btn-primary text-sm">Start quiz →</Link>
          </motion.div>
        )}

        {/* Tier filter */}
        {matches.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              All ({matches.length})
            </button>
            {TIER_ORDER.filter((t) => matches.some((m) => m.tier === t)).map((tier) => {
              const count = matches.filter((m) => m.tier === tier).length
              const label = matches.find((m) => m.tier === tier)?.tier_label || tier
              return (
                <button
                  key={tier}
                  onClick={() => setFilter(tier)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === tier ? `tier-${tier} bg-white/10` : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                >
                  {label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Match list */}
        {loading ? (
          <div className="text-white/30 text-center py-16">Loading matches…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">💫</div>
            <h3 className="font-display font-semibold text-white mb-2">No matches yet</h3>
            <p className="text-white/40 text-sm">
              {user?.quiz_completed
                ? 'Matches appear as other users complete the quiz.'
                : 'Complete the quiz to start matching.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((match, i) => (
              <MatchCard key={match.user_id} match={match} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
