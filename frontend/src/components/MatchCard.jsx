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
  // Legacy
  deep_connection:    'from-pink-600/20 to-pink-900/20 border-pink-500/30',
  building_ground:    'from-green-900/20 to-dark-800/20 border-green-700/20',
  friction_zone:      'from-yellow-900/20 to-dark-800/20 border-yellow-700/20',
}

export default function MatchCard({ match, index = 0 }) {
  const tierStyle = TIER_STYLES[match.tier] || TIER_STYLES.strong_potential
  const pct = Math.round(match.percentage)
  const zodiacSymbol = ZODIAC_SYMBOLS[match.sun_sign?.toLowerCase()] || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link to={`/profile/${match.user_id}`}>
        <div className={`card bg-gradient-to-br ${tierStyle} p-5 hover:scale-[1.02] transition-transform duration-200 cursor-pointer`}>
          <div className="flex items-start justify-between gap-4">
            {/* Avatar */}
            {match.profile_photo || match.photo_url ? (
              <img src={match.profile_photo || match.photo_url} alt={match.name}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {match.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white truncate">{match.name}</h3>
                {zodiacSymbol && <span className="text-gold-400 text-sm" title={match.sun_sign}>{zodiacSymbol}</span>}
              </div>
              <p className="text-white/40 text-sm">
                {match.age && `${match.age} · `}{match.gender || ''}
              </p>

              {/* Archetype badge */}
              {match.archetype && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs">
                    🧬 {match.archetype}
                  </span>
                  {match.shadow_type && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-600/15 border border-pink-500/15 text-pink-300/70 text-xs">
                      {match.shadow_type}
                    </span>
                  )}
                </div>
              )}

              {/* Archetype fit label */}
              {match.archetype_fit_label && (
                <p className="text-white/30 text-xs mt-1.5 italic line-clamp-1">{match.archetype_fit_label}</p>
              )}
            </div>

            {/* Score */}
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-display font-bold text-2xl text-white">{Math.round(match.score)}</span>
              <span className={`text-xs font-semibold tier-${match.tier}`}>{pct}%</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full score-gradient rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: index * 0.07 + 0.3, duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          <div className={`mt-2 text-xs font-medium tier-${match.tier}`}>
            {match.tier_label}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
