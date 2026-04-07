import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreGauge from '../components/ScoreGauge'
import useAuthStore from '../store/authStore'

const ARCHETYPE_DESCRIPTIONS = {
  'The Visionary':    'You have strong values and a clear sense of self. You lead with purpose and inspire deep connection.',
  'The Transformer':  'You carry depth — both light and shadow. Your greatest relationships forge you into something extraordinary.',
  'The Seeker':       'You are on a meaningful journey of self-discovery. Relationships are your greatest teacher.',
  'The Catalyst':     'You spark change wherever you go. Your intensity attracts deep connections and powerful growth.',
}

export default function ScoreReveal() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const [result, setResult] = useState(null)
  const [phase, setPhase] = useState(0) // 0=loading, 1=reveal, 2=breakdown

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

  return (
    <div className="min-h-screen bg-gradient-romantic flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Ambient */}
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

        {/* Gauge */}
        <div className="flex justify-center mb-10">
          <ScoreGauge score={result.score} tier={result.tier} animated={true} />
        </div>

        {/* Archetype */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-white/40 text-sm mb-1">Your archetype</div>
          <div className="font-display text-2xl font-semibold text-white">{result.archetype}</div>
          <p className="text-white/50 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            {ARCHETYPE_DESCRIPTIONS[result.archetype] || ''}
          </p>
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="card p-6 text-left mb-8"
        >
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Category breakdown</h3>
          <div className="space-y-3">
            {result.breakdown && Object.entries(result.breakdown).map(([cat, pct], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">{cat}</span>
                  <span className="text-white/40">{pct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full score-gradient rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/5">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{result.archetype_score}</div>
              <div className="text-white/40 text-xs mt-0.5">Archetype Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-300">{result.shadow_score}</div>
              <div className="text-white/40 text-xs mt-0.5">Shadow Score</div>
            </div>
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
