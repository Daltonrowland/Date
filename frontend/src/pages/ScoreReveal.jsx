import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreGauge from '../components/ScoreGauge'
import useAuthStore from '../store/authStore'

const ARCHETYPE_DESCRIPTIONS = {
  'Analyzer':           'You process emotion through logic. Deep thinker. Needs clarity before closeness.',
  'Fixer':              'You love through action. Care becomes doing. Learning to receive is your edge.',
  'Icebox':             'You protect through stillness. Safety comes before softness. Warmth is under the surface.',
  'Performer':          'You connect through presence. Validation-seeking is the shadow. Authenticity is the work.',
  'Phantom Seeker':     'You chase what feels just out of reach. Idealism is a strength and a trap.',
  'Quiet Exit':         'You leave before it gets hard. Self-protection through disappearing.',
  'Regulated Grown-Up': 'You show up steadily. You know how to repair. Rare and valuable.',
  'Romantic Idealist':  'You love deeply and fully. Fantasy can overpromise. Grounding is the work.',
  'Survivor':           "You've adapted through difficulty. Resilience is your gift. Trust takes time.",
  'Translator':         'You bridge emotional worlds. You understand others often more than yourself.',
}

const SHADOW_DESCRIPTIONS = {
  'Chameleon':      'Adaptive self-erasure and identity drift for safety or approval.',
  'Love Bomber':    'Intensity spikes that exceed stability or follow-through.',
  'Manipulator':    'Strategic guilt, leverage, and engineered emotional positioning.',
  'Scorekeeper':    'Ledger-style relating, hidden resentment, conditional giving.',
  'Self-Saboteur':  'Pre-emptive withdrawal and collapse before reality is clarified.',
  'Stonewaller':    'Punitive silence, closure refusal, emotional lockout.',
}

export default function ScoreReveal() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const [result, setResult] = useState(null)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('quiz_result')
    if (!raw) { navigate('/quiz'); return }
    const data = JSON.parse(raw)
    setResult(data)
    updateUser({ quiz_completed: true, archetype: data.archetype })

    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 3200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!result) return null

  const archetype = result.archetype || ''
  const shadow = result.shadow_type || ''

  return (
    <div className="min-h-screen bg-gradient-romantic flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="text-center relative z-10 w-full max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-purple-400/70 text-sm tracking-widest uppercase mb-8">Your Compatibility Score</p>

        {/* Score gauge */}
        <div className="flex justify-center mb-10">
          <ScoreGauge score={result.score} tier={result.tier} animated={true} />
        </div>

        {/* Archetype + Shadow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="card p-4 text-left">
              <div className="text-white/30 text-xs uppercase tracking-widest mb-1">Archetype</div>
              <div className="font-display text-lg font-semibold text-white">{archetype}</div>
              {result.archetype_secondary && (
                <div className="text-white/40 text-xs mt-0.5">with {result.archetype_secondary} traits</div>
              )}
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                {ARCHETYPE_DESCRIPTIONS[archetype] || ''}
              </p>
            </div>
            <div className="card p-4 text-left">
              <div className="text-white/30 text-xs uppercase tracking-widest mb-1">Shadow</div>
              <div className="font-display text-lg font-semibold text-pink-300">{shadow}</div>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                {SHADOW_DESCRIPTIONS[shadow] || ''}
              </p>
            </div>
          </div>

          {/* Readiness */}
          {result.readiness_score != null && (
            <div className="card p-3 mb-4 flex items-center justify-between">
              <span className="text-white/40 text-xs">Readiness</span>
              <span className="text-white/70 text-sm">{Math.round(result.readiness_score)} — {result.readiness_forecast}</span>
            </div>
          )}
        </motion.div>

        {/* Canonical breakdown — Behavioral / Stability / Chemistry / Cosmic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="card p-6 text-left mb-8"
        >
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Genesis OS Score Breakdown</h3>
          <div className="space-y-3">
            {result.breakdown && Object.entries(result.breakdown).map(([key, pct], i) => {
              const label = key.replace(/([A-Z])/g, ' $1').trim()
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">{label}</span>
                    <span className="text-white/40">{typeof pct === 'number' ? `${pct}%` : pct}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full score-gradient rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ delay: 0.1 * i, duration: 0.8 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Diagnostic numbers */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5">
            {[
              { label: 'Behavioral', value: result.behavioral_avg, fmt: (v) => `${Math.round(v * 100)}%` },
              { label: 'Stability', value: result.stability_avg, fmt: (v) => `${Math.round(v * 100)}%` },
              { label: 'Chemistry', value: result.chemistry_avg, fmt: (v) => `${Math.round(v * 100)}%` },
              { label: 'Cosmic', value: result.cosmic_overlay, fmt: (v) => `${(v * 100).toFixed(1)}%` },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-lg font-bold text-purple-300">{m.value != null ? m.fmt(m.value) : '—'}</div>
                <div className="text-white/30 text-xs mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 2 ? 1 : 0 }}
          transition={{ delay: 0.4 }}
        >
          See your matches →
        </motion.button>
      </motion.div>
    </div>
  )
}
