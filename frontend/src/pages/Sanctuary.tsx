import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Wind, MessageCircle, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { sanctuaryAPI } from '../api/client'

const MODULES = [
  {
    id: 'SAN_STILL',
    title: 'Stillness',
    icon: Wind,
    color: '#9333EA',
    desc: 'Use Stillness to slow the body down and create a cleaner emotional baseline before you react.',
    prompt: null,
  },
  {
    id: 'SAN_MIRROR',
    title: 'Emotional Mirror',
    icon: () => <span className="text-lg">🪞</span>,
    color: '#EC4899',
    desc: 'Use Emotional Mirror when you need words for what you are feeling and what might be underneath it.',
    prompt: 'What are you feeling right now? Describe what\'s underneath it if you can.',
  },
  {
    id: 'SAN_WHISPER',
    title: 'Whisper Window',
    icon: MessageCircle,
    color: '#F59E0B',
    desc: 'Use Whisper Window when you need to say something honestly — privately, without sending it.',
    prompt: 'What do you need to say but haven\'t yet?',
  },
  {
    id: 'SAN_GHOST',
    title: 'Ghost Mode',
    icon: EyeOff,
    color: '#6B21A8',
    desc: 'Ghost Mode gives you emotional shelter. Your visibility is reduced without losing reflection tools.',
    prompt: null,
  },
]

export default function Sanctuary() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState<Record<string, { points: number; copy: string }>>({})

  const module = MODULES.find((m) => m.id === activeModule)

  const handleSubmit = async () => {
    if (!activeModule) return
    setSubmitting(true)
    try {
      const res = await sanctuaryAPI.createSession(activeModule, reflection || undefined)
      const data = res.data
      setCompleted((prev) => ({
        ...prev,
        [activeModule]: { points: data.depth_points_awarded, copy: data.completion_copy || '' },
      }))
      toast.success(`+${data.depth_points_awarded} Depth points`)
      setReflection('')
      setActiveModule(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Session failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F]">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display font-semibold text-white">Sanctuary</h1>
          <p className="text-white/30 text-xs">Private emotional space</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Intro */}
        <motion.div
          className="glass-card p-6 mb-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(107,33,168,0.15), rgba(236,72,153,0.1))' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-3xl mb-3">🏛️</div>
          <h2 className="font-display font-bold text-white text-xl mb-2">Your Sanctuary</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            This space is private. Not shared with matches. Not visible to anyone else. Use it to slow down, reflect, and reset.
          </p>
        </motion.div>

        {/* Module grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {MODULES.map((mod, i) => {
            const isCompleted = !!completed[mod.id]
            return (
              <motion.button
                key={mod.id}
                className={`glass-card p-5 text-left relative overflow-hidden transition-all ${
                  activeModule === mod.id ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: activeModule === mod.id ? mod.color : `${mod.color}30`,
                  boxShadow: activeModule === mod.id ? `0 0 0 2px ${mod.color}` : undefined,
                }}
                onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${mod.color}20` }}
                >
                  <span style={{ color: mod.color }}>
                    {typeof mod.icon === 'function' && mod.icon.name === 'icon'
                      ? <mod.icon />
                      : <mod.icon size={18} />
                    }
                  </span>
                </div>
                <h3 className="font-display font-semibold text-white text-sm">{mod.title}</h3>
                {isCompleted && (
                  <div
                    className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: `${mod.color}20`, color: mod.color }}
                  >
                    +{completed[mod.id].points}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Active module expanded */}
        <AnimatePresence>
          {activeModule && module && (
            <motion.div
              key={activeModule}
              className="glass-card p-6"
              style={{ borderColor: `${module.color}30` }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-display font-bold text-white text-xl mb-2">{module.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-5">{module.desc}</p>

              {module.prompt && (
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-2 italic">{module.prompt}</p>
                  <textarea
                    className="input-field resize-none"
                    rows={4}
                    placeholder="Write freely — this is private…"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                  <p className="text-xs text-white/20 mt-1">Your reflection is stored privately and never shared.</p>
                </div>
              )}

              {activeModule === 'SAN_STILL' && (
                <div className="mb-5 flex flex-col items-center py-4">
                  <motion.div
                    className="w-20 h-20 rounded-full border-2 border-brand-purple/30 flex items-center justify-center"
                    animate={{
                      scale: [1, 1.15, 1],
                      borderColor: ['rgba(147,51,234,0.3)', 'rgba(147,51,234,0.7)', 'rgba(147,51,234,0.3)'],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-full bg-brand-purple/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </motion.div>
                  <p className="text-white/30 text-xs mt-4 text-center">
                    Breathe with the circle. In for 4, hold for 4, out for 4.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => { setActiveModule(null); setReflection('') }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleSubmit}
                  disabled={submitting || (!!module.prompt && reflection.length < 5)}
                  style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}cc)` }}
                >
                  {submitting ? 'Completing…' : 'Complete Session'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion messages */}
        {Object.entries(completed).map(([id, data]) => {
          const mod = MODULES.find((m) => m.id === id)
          return data.copy && mod ? (
            <motion.div
              key={id}
              className="glass-card p-4 mt-3 flex gap-3 items-start"
              style={{ borderColor: `${mod.color}25` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-lg flex-shrink-0">✓</div>
              <div>
                <div className="text-xs text-white/40 mb-1">{mod.title}</div>
                <p className="text-white/70 text-sm italic">{data.copy}</p>
              </div>
            </motion.div>
          ) : null
        })}
      </div>
    </div>
  )
}
