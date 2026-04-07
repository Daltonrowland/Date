import React from 'react'
import { motion } from 'framer-motion'

const TIER_COLORS = {
  soul_aligned:       { from: '#C084FC', to: '#9333EA', label: '💜 Soul-Aligned' },
  strong_potential:   { from: '#A855F7', to: '#6B21A8', label: '✨ Strong Potential' },
  healthy_growing:    { from: '#86EFAC', to: '#22C55E', label: '🌿 Healthy & Growing' },
  magnetic_risky:     { from: '#F472B6', to: '#EC4899', label: '🔥 Magnetic but Risky' },
  possible_unstable:  { from: '#FCD34D', to: '#F59E0B', label: '⚡ Possible but Unstable' },
  red_flag_zone:      { from: '#F87171', to: '#DC2626', label: '🚩 Red Flag Zone' },
  // Legacy tier keys (backward compat)
  deep_connection:    { from: '#F472B6', to: '#EC4899', label: '💗 Deep Connection' },
  building_ground:    { from: '#86EFAC', to: '#22C55E', label: '🌱 Building Ground' },
  friction_zone:      { from: '#FCD34D', to: '#F59E0B', label: '⚡ Friction Zone' },
}

export default function ScoreGauge({ score = 350, tier = 'building_ground', animated = true }) {
  const pct = Math.round(((score - 350) / 500) * 100)
  const colors = TIER_COLORS[tier] || TIER_COLORS.strong_potential

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Progress */}
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={`url(#gaugeGrad-${tier})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
          />
          <defs>
            <linearGradient id={`gaugeGrad-${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>
        </svg>

        {/* Score label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-display font-bold text-3xl text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {animated ? <AnimatedNumber target={score} /> : score}
          </motion.span>
          <span className="text-white/40 text-xs mt-0.5">/ 850</span>
        </div>
      </div>

      <motion.div
        className={`text-lg font-semibold tier-${tier}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {colors.label}
      </motion.div>
    </div>
  )
}

function AnimatedNumber({ target }) {
  const [current, setCurrent] = React.useState(350)

  React.useEffect(() => {
    const start = 350
    const duration = 1800
    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    const timer = setTimeout(() => requestAnimationFrame(tick), 400)
    return () => clearTimeout(timer)
  }, [target])

  return current
}
