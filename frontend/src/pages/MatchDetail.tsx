import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ArrowLeft, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { matchesAPI, type Match } from '../api/client'

const TIER_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  'Soul-aligned match':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', emoji: '✨' },
  'Strong potential':     { color: '#9333EA', bg: 'rgba(147,51,234,0.15)', emoji: '💜' },
  'Healthy but growing':  { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', emoji: '🌿' },
  'Magnetic but risky':   { color: '#EC4899', bg: 'rgba(236,72,153,0.15)', emoji: '🔥' },
  'Possible but unstable':{ color: '#F97316', bg: 'rgba(249,115,22,0.15)', emoji: '⚡' },
  'Red flag zone':        { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', emoji: '🌋' },
}

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (!id) return
    matchesAPI.get(id)
      .then((res) => setMatch(res.data))
      .catch(() => { toast.error('Match not found'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async (liked: boolean) => {
    if (!match || liking) return
    setLiking(true)
    try {
      const res = await matchesAPI.like(match.id, liked)
      if (res.data.is_mutual) {
        toast.success("It's mutual! 🎉")
      } else {
        toast.success(liked ? 'Liked!' : 'Passed')
      }
      setMatch({ ...match, is_mutual: res.data.is_mutual })
    } catch {
      toast.error('Action failed')
    } finally {
      setLiking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!match) return null

  const tierConf = TIER_CONFIG[match.tier] || TIER_CONFIG['Strong potential']

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/40">{label}</span>
        <span className="text-white/60">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${tierConf.color}80, ${tierConf.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-semibold text-white">Match Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Profile header */}
        <motion.div
          className="glass-card p-6"
          style={{ borderColor: `${tierConf.color}30` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 20% 20%, ${tierConf.color}10, transparent 60%)` }}
          />

          <div className="flex gap-4 items-start relative">
            <div
              className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl font-display font-bold"
              style={{ background: `${tierConf.color}20`, color: tierConf.color }}
            >
              {match.user.photo_url
                ? <img src={match.user.photo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                : match.user.first_name[0]
              }
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-white">
                {match.user.display_name || match.user.first_name}
              </h2>
              {match.user.archetype_primary && (
                <p className="text-white/50 text-sm">{match.user.archetype_primary}</p>
              )}
              {match.user.zodiac_sign && (
                <p className="text-white/30 text-xs mt-0.5">{match.user.zodiac_sign}</p>
              )}
            </div>
          </div>

          {match.user.bio && (
            <p className="text-white/60 text-sm mt-4 leading-relaxed relative">{match.user.bio}</p>
          )}
        </motion.div>

        {/* Compatibility score */}
        <motion.div
          className="glass-card p-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-6xl font-display font-black mb-2" style={{ color: tierConf.color }}>
            {Math.round(match.compatibility_score)}
          </div>
          <div className="text-white/30 text-sm mb-4">Compatibility Score</div>

          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: tierConf.bg, color: tierConf.color, border: `1px solid ${tierConf.color}50` }}
          >
            {tierConf.emoji} {match.tier}
          </div>

          {match.archetype_fit_note && (
            <p className="text-white/40 text-xs mt-3">{match.archetype_fit_note}</p>
          )}
        </motion.div>

        {/* Score breakdown */}
        <motion.div
          className="glass-card p-6 space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-display font-semibold text-white">Score Breakdown</h3>
          {match.stability_avg != null && <ScoreBar label="Emotional Stability" value={match.stability_avg} />}
          {match.chemistry_avg != null && <ScoreBar label="Chemistry & Polarity" value={match.chemistry_avg} />}
          {match.core_norm != null && <ScoreBar label="Core Alignment" value={match.core_norm} />}
          {match.zodiac_norm != null && <ScoreBar label="Zodiac Compatibility" value={match.zodiac_norm} />}
          {match.numerology_norm != null && <ScoreBar label="Numerology Alignment" value={match.numerology_norm} />}
        </motion.div>

        {/* Drivers */}
        {match.top_drivers?.positive && match.top_drivers.positive.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
              <Star size={16} className="text-brand-gold" /> Strength Signals
            </h3>
            <div className="space-y-2">
              {match.top_drivers.positive.slice(0, 3).map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold flex-shrink-0" />
                  Question {d.question_number} — alignment score {(d.pair_norm_0_1 * 100).toFixed(0)}%
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {!match.is_mutual && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              className="flex-1 btn-ghost py-4 flex items-center justify-center gap-2"
              onClick={() => handleLike(false)}
              disabled={liking}
            >
              Pass
            </button>
            <button
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
              onClick={() => handleLike(true)}
              disabled={liking}
            >
              <Heart size={18} fill="currentColor" /> Like
            </button>
          </motion.div>
        )}

        {match.is_mutual && (
          <motion.div
            className="glass-card p-5 text-center"
            style={{ borderColor: '#EC489940', background: 'rgba(236,72,153,0.05)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Heart size={24} className="text-brand-pink mx-auto mb-2" fill="currentColor" />
            <p className="text-brand-pink font-semibold">Mutual Match</p>
            <p className="text-white/40 text-sm mt-1">You both expressed interest.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
