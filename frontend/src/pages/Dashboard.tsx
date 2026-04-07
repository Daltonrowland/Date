import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Star, Zap, User, Shield, ChevronRight, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { matchesAPI, profileAPI, type Match, type Profile } from '../api/client'
import { useAuth } from '../context/AuthContext'

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  'Soul-aligned match':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  'Strong potential':     { color: '#9333EA', bg: 'rgba(147,51,234,0.1)' },
  'Healthy but growing':  { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  'Magnetic but risky':   { color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  'Possible but unstable':{ color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  'Red flag zone':        { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
}

function MatchCard({ match }: { match: Match }) {
  const tierConf = TIER_COLORS[match.tier] || TIER_COLORS['Strong potential']
  const scoreColor = tierConf.color

  return (
    <Link to={`/matches/${match.id}`}>
      <motion.div
        className="glass-card p-5 relative overflow-hidden group cursor-pointer"
        style={{ borderColor: `${scoreColor}25` }}
        whileHover={{ scale: 1.02, borderColor: `${scoreColor}50` }}
        transition={{ duration: 0.2 }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(135deg, ${scoreColor}08, transparent)` }}
        />

        <div className="relative flex gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-display font-bold"
            style={{ background: `linear-gradient(135deg, ${scoreColor}30, ${scoreColor}10)`, color: scoreColor }}
          >
            {match.user.photo_url
              ? <img src={match.user.photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              : match.user.first_name[0]
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-white text-lg leading-tight">
                  {match.user.display_name || match.user.first_name}
                </h3>
                {match.user.archetype_primary && (
                  <p className="text-white/40 text-xs mt-0.5">{match.user.archetype_primary}</p>
                )}
              </div>
              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-display font-bold" style={{ color: scoreColor }}>
                  {Math.round(match.compatibility_score)}
                </div>
                <div className="text-white/30 text-xs">/ 850</div>
              </div>
            </div>

            {/* Tier badge */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: tierConf.bg, color: tierConf.color, border: `1px solid ${tierConf.color}40` }}
              >
                {match.tier}
              </span>
              {match.user.zodiac_sign && (
                <span className="text-xs text-white/30">{match.user.zodiac_sign}</span>
              )}
              {match.is_mutual && (
                <span className="text-xs text-brand-pink flex items-center gap-1">
                  <Heart size={10} fill="currentColor" /> Mutual
                </span>
              )}
            </div>

            {/* Sub-scores */}
            {(match.stability_avg != null || match.chemistry_avg != null) && (
              <div className="flex gap-3 mt-3">
                {match.stability_avg != null && (
                  <div className="flex items-center gap-1">
                    <div className="text-xs text-white/30">Stability</div>
                    <div className="text-xs font-medium text-white/60">{Math.round(match.stability_avg * 100)}%</div>
                  </div>
                )}
                {match.chemistry_avg != null && (
                  <div className="flex items-center gap-1">
                    <div className="text-xs text-white/30">Chemistry</div>
                    <div className="text-xs font-medium text-white/60">{Math.round(match.chemistry_avg * 100)}%</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/50 transition-colors">
          <ChevronRight size={18} />
        </div>
      </motion.div>
    </Link>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState<Match[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      profileAPI.getMe(),
      matchesAPI.list(),
    ])
      .then(([pRes, mRes]) => {
        setProfile(pRes.data)
        setMatches(mRes.data)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin" />
      </div>
    )
  }

  const tierConf = TIER_COLORS[profile?.tier || ''] || TIER_COLORS['Strong potential']

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
            <span className="text-white text-xs font-bold">RS</span>
          </div>
          <span className="font-display font-semibold text-white text-sm">Relationship Scores</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/sanctuary" className="p-2 text-white/40 hover:text-white transition-colors">
            <Shield size={18} />
          </Link>
          <Link to="/profile" className="p-2 text-white/40 hover:text-white transition-colors">
            <User size={18} />
          </Link>
          <button onClick={logout} className="p-2 text-white/40 hover:text-white transition-colors text-xs">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile summary */}
        {profile && (
          <motion.div
            className="glass-card p-6 mb-6"
            style={{ borderColor: `${tierConf.color}25` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-display font-bold flex-shrink-0"
                style={{ background: `${tierConf.color}20`, color: tierConf.color }}
              >
                {(user?.first_name || 'U')[0]}
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-white text-xl">
                  Hi, {user?.first_name || 'there'}
                </h2>
                {profile.archetype_primary && (
                  <p className="text-white/50 text-sm">{profile.archetype_primary} archetype</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {profile.compatibility_score != null && (
                    <div>
                      <span className="text-2xl font-display font-bold" style={{ color: tierConf.color }}>
                        {Math.round(profile.compatibility_score)}
                      </span>
                      <span className="text-white/30 text-xs ml-1">/ 850</span>
                    </div>
                  )}
                  {profile.tier && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: tierConf.bg, color: tierConf.color, border: `1px solid ${tierConf.color}40` }}
                    >
                      {profile.tier}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Depth score bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">Depth Score</span>
                <span className="text-xs text-white/60">{profile.depth_score}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6B21A8, #F59E0B)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.depth_score}%` }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Matches */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white text-xl">Your Matches</h2>
          <span className="text-white/30 text-sm">{matches.length} found</span>
        </div>

        {matches.length === 0 ? (
          <motion.div
            className="glass-card p-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-4xl mb-4">🌌</div>
            <h3 className="font-display text-white text-xl mb-2">No matches yet</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto mb-6">
              Matches appear once other users complete their quiz. Come back soon.
            </p>
            <Link to="/sanctuary" className="btn-ghost text-sm py-2.5 px-5 inline-flex items-center gap-2">
              <Shield size={14} /> Visit Sanctuary
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Sanctuary CTA */}
        <motion.div
          className="mt-6 glass-card p-5"
          style={{ background: 'linear-gradient(135deg, rgba(107,33,168,0.1), rgba(236,72,153,0.1))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center">
              <Shield size={18} className="text-brand-purple-lt" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-white text-sm">Your Sanctuary</h3>
              <p className="text-white/40 text-xs">Stillness, mirror, whisper — private emotional space.</p>
            </div>
            <Link to="/sanctuary" className="text-brand-purple-lt hover:text-white transition-colors">
              <ChevronRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
