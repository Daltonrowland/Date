import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { profileAPI, type Profile } from '../api/client'

const TIER_CONFIG: Record<string, { color: string; bg: string; glow: string; emoji: string; desc: string }> = {
  'Soul-aligned match': {
    color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.5)',
    emoji: '✨', desc: 'Rare, deep alignment across all emotional dimensions.',
  },
  'Strong potential': {
    color: '#9333EA', bg: 'rgba(147,51,234,0.15)', glow: 'rgba(147,51,234,0.5)',
    emoji: '💜', desc: 'Strong emotional fit with real capacity for lasting connection.',
  },
  'Healthy but growing': {
    color: '#22C55E', bg: 'rgba(34,197,94,0.15)', glow: 'rgba(34,197,94,0.5)',
    emoji: '🌿', desc: 'Solid foundation with room to grow into something deeper.',
  },
  'Magnetic but risky': {
    color: '#EC4899', bg: 'rgba(236,72,153,0.15)', glow: 'rgba(236,72,153,0.5)',
    emoji: '🔥', desc: 'High chemistry, but stability needs intentional work.',
  },
  'Possible but unstable': {
    color: '#F97316', bg: 'rgba(249,115,22,0.15)', glow: 'rgba(249,115,22,0.5)',
    emoji: '⚡', desc: 'Potential is there, but patterns need to settle first.',
  },
  'Red flag zone': {
    color: '#EF4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.5)',
    emoji: '🌋', desc: 'Significant misalignment — growth work is needed before matching.',
  },
}

const ARCHETYPE_DESCS: Record<string, string> = {
  Analyzer: 'You process emotion through logic. Deep thinker. Needs clarity before closeness.',
  Fixer: 'You love through action. Care becomes doing. Learning to receive is your edge.',
  Icebox: 'You protect through stillness. Safety comes before softness. Warmth is under the surface.',
  Performer: 'You connect through presence. Validation-seeking is the shadow. Authenticity is the work.',
  'Phantom Seeker': 'You chase what feels just out of reach. Idealism is a strength and a trap.',
  'Quiet Exit': 'You leave before it gets hard. Self-protection through disappearing.',
  'Regulated Grown-Up': 'You show up steadily. You know how to repair. Rare and valuable.',
  'Romantic Idealist': 'You love deeply and fully. Fantasy can overpromise. Grounding is the work.',
  Survivor: "You've adapted through difficulty. Resilience is your gift. Trust takes time.",
  Translator: 'You bridge emotional worlds. You understand others often more than yourself.',
}

function useCountUp(target: number, duration: number = 2500, delay: number = 800) {
  const [count, setCount] = useState(350)
  const startTime = useRef<number | null>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (target <= 350) return
    const start = 350
    const range = target - start

    const tick = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp + delay
      const elapsed = Math.max(0, timestamp - startTime.current)
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(start + range * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setCount(target)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, delay])

  return count
}

export default function ScoreReveal() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [phase, setPhase] = useState<'loading' | 'dramatic' | 'reveal' | 'details'>('loading')

  useEffect(() => {
    profileAPI.getMe()
      .then((res) => {
        setProfile(res.data)
        setTimeout(() => setPhase('dramatic'), 300)
        setTimeout(() => setPhase('reveal'), 2500)
        setTimeout(() => setPhase('details'), 5000)
      })
      .catch(() => navigate('/dashboard'))
  }, [])

  const score = profile?.compatibility_score || 0
  const displayCount = useCountUp(phase === 'reveal' || phase === 'details' ? Math.round(score) : 350, 2000, 500)
  const tier = profile?.tier || 'Healthy but growing'
  const tierConf = TIER_CONFIG[tier] || TIER_CONFIG['Healthy but growing']
  const archDesc = ARCHETYPE_DESCS[profile?.archetype_primary || ''] || ''

  const readinessBand = () => {
    const r = profile?.readiness_score || 0
    if (r >= 85) return 'Strong readiness signal'
    if (r >= 70) return 'Relationship-ready with normal growth edges'
    if (r >= 55) return 'Emerging readiness'
    if (r >= 40) return 'Needs grounding before deeper connection'
    return 'Not relationship-ready right now'
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${tierConf.glow} 0%, transparent 70%)`,
          opacity: phase === 'details' ? 0.3 : 0,
          transition: 'opacity 2s ease',
        }}
      />

      <AnimatePresence mode="wait">
        {/* Loading */}
        {phase === 'loading' && (
          <motion.div key="loading" exit={{ opacity: 0 }} className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/40">Calibrating your profile…</p>
          </motion.div>
        )}

        {/* Dramatic build */}
        {phase === 'dramatic' && (
          <motion.div
            key="dramatic"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              className="text-white/40 text-lg font-body mb-4"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Processing 60 dimensions…
            </motion.p>
            <div className="flex gap-3 justify-center">
              {['Archetype', 'Shadow', 'Polarity', 'Cosmos'].map((label, i) => (
                <motion.div
                  key={label}
                  className="text-xs text-white/30 px-3 py-1 rounded-full border border-white/10"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                >
                  {label}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Score reveal */}
        {(phase === 'reveal' || phase === 'details') && profile && (
          <motion.div
            key="reveal"
            className="w-full max-w-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Score number */}
            <motion.div
              className="relative mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
            >
              <div
                className="inline-block"
                style={{ filter: `drop-shadow(0 0 40px ${tierConf.glow})` }}
              >
                <span
                  className="score-number text-[120px] leading-none font-display font-black"
                  style={{ color: tierConf.color }}
                >
                  {displayCount}
                </span>
              </div>
              <div className="text-white/30 text-sm mt-1">out of 850</div>
            </motion.div>

            {/* Tier badge */}
            <AnimatePresence>
              {phase === 'details' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.5, delay: 0.2 }}
                  className="mb-8"
                >
                  <div
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold"
                    style={{
                      background: tierConf.bg,
                      border: `2px solid ${tierConf.color}`,
                      color: tierConf.color,
                      boxShadow: `0 0 30px ${tierConf.glow}`,
                    }}
                  >
                    <span>{tierConf.emoji}</span>
                    <span className="font-display">{tier}</span>
                  </div>
                  <p className="text-white/50 text-sm mt-3 max-w-xs mx-auto">{tierConf.desc}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Details grid */}
            <AnimatePresence>
              {phase === 'details' && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  {/* Archetype */}
                  {profile.archetype_primary && (
                    <div className="glass-card p-5 text-left">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                          style={{ background: `${tierConf.color}20` }}>🧬</div>
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Archetype</div>
                          <div className="text-white font-semibold font-display text-lg">{profile.archetype_primary}</div>
                          {profile.archetype_secondary && (
                            <div className="text-white/40 text-sm">with {profile.archetype_secondary} traits</div>
                          )}
                          {archDesc && <p className="text-white/50 text-sm mt-2 leading-relaxed">{archDesc}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scores row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Stability', value: profile.stability_avg, fmt: (v: number) => `${Math.round(v * 100)}%` },
                      { label: 'Chemistry', value: profile.chemistry_avg, fmt: (v: number) => `${Math.round(v * 100)}%` },
                      { label: 'Readiness', value: profile.readiness_score, fmt: (v: number) => `${Math.round(v)}` },
                    ].map((metric) => (
                      <div key={metric.label} className="glass-card p-4 text-center">
                        <div className="text-2xl font-display font-bold text-white mb-1">
                          {metric.value != null ? metric.fmt(metric.value) : '—'}
                        </div>
                        <div className="text-xs text-white/40 uppercase tracking-wider">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Readiness band */}
                  {profile.readiness_score != null && (
                    <div className="glass-card p-4 text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Readiness Signal</div>
                      <div className="text-white/80 text-sm">{readinessBand()}</div>
                      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #6B21A8, #EC4899)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${profile.readiness_score}%` }}
                          transition={{ duration: 1.5, delay: 0.8 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <motion.button
                    className="btn-primary w-full py-4 text-lg mt-2"
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    See My Matches →
                  </motion.button>

                  <p className="text-white/25 text-xs text-center pb-8">
                    Your score reflects current emotional patterns, not your worth.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
