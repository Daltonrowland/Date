import { Link } from 'react-router-dom'

const ZODIAC = {
  aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',
  libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓',
}

const TIER_PILL = {
  soul_aligned:      { bg: 'bg-purple-500/80', text: 'text-white', label: 'Soul-Aligned' },
  strong_potential:   { bg: 'bg-purple-600/80', text: 'text-purple-100', label: 'Strong Potential' },
  healthy_growing:    { bg: 'bg-emerald-600/80', text: 'text-emerald-100', label: 'Healthy & Growing' },
  magnetic_risky:     { bg: 'bg-pink-600/80', text: 'text-pink-100', label: 'Magnetic but Risky' },
  possible_unstable:  { bg: 'bg-amber-600/80', text: 'text-amber-100', label: 'Possible but Unstable' },
  red_flag_zone:      { bg: 'bg-red-600/80', text: 'text-red-100', label: 'Red Flag Zone' },
  deep_connection:    { bg: 'bg-pink-500/80', text: 'text-white', label: 'Deep Connection' },
  building_ground:    { bg: 'bg-emerald-600/80', text: 'text-emerald-100', label: 'Building Ground' },
  friction_zone:      { bg: 'bg-amber-600/80', text: 'text-amber-100', label: 'Friction Zone' },
}

export default function MatchCard({ match, onLike, onPass, exiting = false, onExitDone, delay = 0 }) {
  const photo = match.profile_photo || match.photo_url || ''
  const zodiac = ZODIAC[match.sun_sign?.toLowerCase()] || ''
  const tier = TIER_PILL[match.tier] || TIER_PILL.strong_potential
  const bio = (match.bio || '').slice(0, 60) + ((match.bio || '').length > 60 ? '…' : '')

  return (
    <div
      className={`match-card-wrapper ${exiting ? 'card-exit' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onTransitionEnd={(e) => {
        if (exiting && e.target === e.currentTarget && onExitDone) onExitDone(match.user_id)
      }}
    >
      <div className="match-card group">
        {/* ── Photo section (top 65%) ────────────────────────── */}
        <Link to={`/profile/${match.user_id}`} className="match-card-photo-wrap">
          {photo ? (
            <img src={photo} alt={match.name} loading="lazy"
              className="match-card-photo" />
          ) : (
            <div className="match-card-photo bg-gradient-to-br from-purple-700 to-pink-600 flex items-center justify-center">
              <span className="text-5xl font-display font-bold text-white/80">{match.name?.[0]?.toUpperCase()}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A2E] via-[#1A0A2E]/40 to-transparent pointer-events-none" />

          {/* RS Code badge — top left */}
          {match.rs_code && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur-sm border border-gold-500/30 z-10">
              <span className="text-gold-400 text-[10px] font-mono font-bold tracking-wider">{match.rs_code}</span>
            </div>
          )}

          {/* They liked you — top right, pulsing pink heart */}
          {match.they_liked && (
            <div className="absolute top-3 right-3 z-10 like-pulse">
              <div className="w-8 h-8 rounded-full bg-pink-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-pink-500/40">
                <span className="text-white text-sm">♥</span>
              </div>
            </div>
          )}

          {/* Score + tier over photo — bottom left */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="text-4xl font-display font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-none">
              {Math.round(match.score)}
            </div>
            <div className={`inline-flex mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${tier.bg} ${tier.text}`}>
              {tier.label}
            </div>
          </div>
        </Link>

        {/* ── Card body ────────────────────────────────────── */}
        <div className="p-4">
          <Link to={`/profile/${match.user_id}`} className="block mb-3">
            {/* Name + age */}
            <h3 className="font-display font-bold text-white text-base leading-tight">
              {match.name}{match.age ? <span className="text-white/50 font-normal">, {match.age}</span> : ''}
            </h3>
            {/* Location */}
            {match.location && (
              <p className="text-white/30 text-xs mt-0.5">{match.location}</p>
            )}

            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {match.archetype && (
                <span className="px-2 py-0.5 rounded-full bg-purple-600/25 border border-purple-500/25 text-purple-300 text-[10px] font-medium">
                  🧬 {match.archetype}
                </span>
              )}
              {match.shadow_type && (
                <span className="px-2 py-0.5 rounded-full bg-pink-600/15 border border-pink-500/15 text-pink-300/60 text-[10px]">
                  {match.shadow_type}
                </span>
              )}
              {zodiac && (
                <span className="text-gold-400 text-xs" title={match.sun_sign}>
                  {zodiac} <span className="text-gold-400/50 text-[10px] capitalize">{match.sun_sign}</span>
                </span>
              )}
            </div>

            {/* Bio snippet */}
            {bio && (
              <p className="text-white/25 text-xs mt-2 leading-relaxed line-clamp-2">{bio}</p>
            )}
          </Link>

          {/* ── Action buttons ──────────────────────────────── */}
          <div className="flex gap-2 relative z-10">
            {onPass && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPass() }}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                className="like-btn flex-[0_0_30%] h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm"
              >✕</button>
            )}
            {onLike && !match.i_liked && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike() }}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                className="like-btn flex-[1_1_70%] h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-400 hover:shadow-lg hover:shadow-purple-900/50 active:scale-[0.98] transition-all text-sm"
              >♥ Like</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
