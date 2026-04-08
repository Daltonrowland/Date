import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const ZODIAC_SYMBOLS = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

const TIER_STYLES = {
  soul_aligned:      'from-purple-600/20 to-purple-900/20 border-purple-500/30',
  strong_potential:   'from-purple-700/20 to-dark-800/20 border-purple-600/20',
  healthy_growing:    'from-green-900/20 to-dark-800/20 border-green-700/20',
  magnetic_risky:     'from-pink-600/20 to-pink-900/20 border-pink-500/30',
  possible_unstable:  'from-yellow-900/20 to-dark-800/20 border-yellow-700/20',
  red_flag_zone:      'from-red-900/20 to-dark-800/20 border-red-800/20',
  deep_connection:    'from-pink-600/20 to-pink-900/20 border-pink-500/30',
  building_ground:    'from-green-900/20 to-dark-800/20 border-green-700/20',
  friction_zone:      'from-yellow-900/20 to-dark-800/20 border-yellow-700/20',
}

export default function MatchCard({ match, index = 0, onLike, onPass }) {
  const [liked, setLiked] = useState(false)
  const tierStyle = TIER_STYLES[match.tier] || TIER_STYLES.strong_potential
  const pct = Math.round(match.percentage)
  const zodiacSymbol = ZODIAC_SYMBOLS[match.sun_sign?.toLowerCase()] || ''
  const photo = match.profile_photo || match.photo_url || ''

  // Swipe gesture
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const swiping = useRef(false)
  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; swiping.current = true }
  const handleTouchMove = (e) => { if (swiping.current) setSwipeX(Math.max(-100, Math.min(100, e.touches[0].clientX - startX.current))) }
  const handleTouchEnd = () => {
    swiping.current = false
    if (swipeX > 60 && onLike) doLike()
    else if (swipeX < -60 && onPass) onPass()
    setSwipeX(0)
  }

  const doLike = () => {
    if (liked) return
    setLiked(true)
    if (onLike) onLike()
  }

  // Once liked, animate out then collapse to zero height so it leaves flow
  // The parent Dashboard removes it from state after 450ms
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={liked
        ? { opacity: 0, x: -300, height: 0, marginBottom: 0, overflow: 'hidden', pointerEvents: 'none' }
        : { opacity: 1, y: 0, x: swipeX, height: 'auto' }
      }
      transition={{ duration: liked ? 0.4 : 0.3, delay: liked ? 0 : index * 0.05 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: liked ? 'none' : 'auto' }}
    >
      <div className={`card bg-gradient-to-br ${tierStyle} p-4 sm:p-5 relative ${match.i_liked ? 'ring-1 ring-purple-500/40' : ''}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar with they_liked badge */}
          <Link to={`/profile/${match.user_id}`} className="flex-shrink-0 relative">
            {photo ? (
              <img src={photo} alt={match.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-lg sm:text-xl font-bold">
                {match.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {match.they_liked && !match.i_liked && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs shadow-lg"
                title="They already like you">♥</div>
            )}
            {match.they_liked && match.i_liked && (
              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded bg-gold-500 text-dark-900 text-xs font-bold shadow-lg">MATCH</div>
            )}
          </Link>

          {/* Info */}
          <Link to={`/profile/${match.user_id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-white text-sm sm:text-base truncate">{match.name}</h3>
              {zodiacSymbol && <span className="text-gold-400 text-xs">{zodiacSymbol}</span>}
            </div>
            <p className="text-white/40 text-xs sm:text-sm">{match.age && `${match.age} · `}{match.gender || ''}</p>
            {match.archetype && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs">
                🧬 {match.archetype}
              </span>
            )}
            {match.archetype_fit_label && (
              <p className="text-white/25 text-xs mt-1 italic line-clamp-1 hidden sm:block">{match.archetype_fit_label}</p>
            )}
          </Link>

          {/* Score + actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <span className="font-display font-bold text-xl sm:text-2xl text-white">{Math.round(match.score)}</span>
              <div className={`text-xs font-semibold tier-${match.tier}`}>{pct}%</div>
            </div>
            <div className="flex gap-1.5">
              {onPass && (
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onPass) onPass() }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
                  title="Pass">✕</button>
              )}
              {onLike && !match.i_liked && !liked && (
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); doLike() }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 hover:bg-purple-500/30 transition-all"
                  title="Like">♥</button>
              )}
              {(match.i_liked || liked) && (
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 text-sm">♥</span>
              )}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full score-gradient rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }} />
        </div>
        <div className={`mt-1.5 text-xs font-medium tier-${match.tier}`}>{match.tier_label}</div>
      </div>
    </motion.div>
  )
}
