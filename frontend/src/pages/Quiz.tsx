import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { quizAPI, type QuizQuestion } from '../api/client'
import { useAuth } from '../context/AuthContext'

const DIMENSION_LABELS: Record<string, string> = {
  CommunicationHealth: 'Communication & Emotional Needs',
  ConflictRepair: 'Conflict & Repair',
  AttachmentStyle: 'Attachment Style',
  LoveLanguage: 'Love Language',
  PacingAlignment: 'Pacing & Readiness',
  Polarity: 'Polarity & Energy',
  ShadowBehavior: 'Shadow & Growth',
  Readiness: 'Relationship Readiness',
}

const PHASE_COLORS: Record<string, string> = {
  Core: '#9333EA',
  Behavioral: '#EC4899',
  Stability: '#22C55E',
  Chemistry: '#F59E0B',
}

export default function Quiz() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([quizAPI.getAllQuestions(), quizAPI.getState()])
      .then(([qRes, stateRes]) => {
        const qs: QuizQuestion[] = qRes.data
        setQuestions(qs)

        const existingAnswers: Record<string, string> = stateRes.data.answers || {}
        const intAnswers: Record<number, string> = {}
        Object.entries(existingAnswers).forEach(([k, v]) => { intAnswers[parseInt(k)] = v as string })
        setAnswers(intAnswers)

        // Resume from last unanswered
        const lastAnswered = Object.keys(intAnswers).length
        setCurrentQ(Math.min(lastAnswered, qs.length - 1))
      })
      .catch(() => toast.error('Failed to load quiz'))
      .finally(() => setLoading(false))
  }, [])

  const q = questions[currentQ]
  const progress = questions.length > 0 ? ((Object.keys(answers).length) / 60) * 100 : 0
  const allAnswered = Object.keys(answers).length >= 60

  const handleSelect = useCallback(async (letter: string) => {
    if (!q || submitting) return
    setSelected(letter)
    setSubmitting(true)

    try {
      await quizAPI.submitAnswer(q.question_number, letter)
      const newAnswers = { ...answers, [q.question_number]: letter }
      setAnswers(newAnswers)

      // Auto-advance after brief delay
      setTimeout(() => {
        if (currentQ < questions.length - 1) {
          setCurrentQ(currentQ + 1)
          setSelected(null)
        }
        setSubmitting(false)
      }, 400)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save answer')
      setSelected(null)
      setSubmitting(false)
    }
  }, [q, submitting, answers, currentQ, questions.length])

  const handleComplete = async () => {
    if (!allAnswered) {
      toast.error('Please answer all 60 questions first')
      return
    }
    setCompleting(true)
    try {
      await quizAPI.complete()
      await refresh()
      navigate('/score-reveal')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to complete quiz')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading your questions…</p>
        </div>
      </div>
    )
  }

  if (!q) return null

  const phaseColor = PHASE_COLORS[q.phase] || '#9333EA'
  const dimensionLabel = DIMENSION_LABELS[q.dimension_primary] || q.dimension_primary

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-white/5">
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #6B21A8, #EC4899)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-12 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <span className="text-white/30 text-sm">
              {Object.keys(answers).length} of 60 answered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${phaseColor}20`, color: phaseColor, border: `1px solid ${phaseColor}40` }}
            >
              {q.phase}
            </div>
            <span className="text-white/20 text-xs">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.question_number}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-card p-8 mb-6" style={{ borderColor: `${phaseColor}30` }}>
              {/* Question meta */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-white/20 text-xs uppercase tracking-widest">{dimensionLabel}</span>
              </div>

              {/* Question number + text */}
              <div className="flex gap-4 items-start">
                <span
                  className="text-2xl font-display font-bold flex-shrink-0 w-8"
                  style={{ color: phaseColor }}
                >
                  {q.question_number}
                </span>
                <p className="text-white text-xl leading-relaxed font-body">
                  {q.question_text || `Question ${q.question_number}`}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const isSelected = selected === opt.letter || (!selected && answers[q.question_number] === opt.letter)
                return (
                  <motion.button
                    key={opt.letter}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex gap-4 items-start ${
                      isSelected
                        ? 'border-brand-purple-md bg-brand-purple/20'
                        : 'border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5'
                    }`}
                    onClick={() => handleSelect(opt.letter)}
                    disabled={submitting}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-purple border-brand-purple-md text-white'
                          : 'border-white/20 text-white/40'
                      }`}
                    >
                      {opt.letter}
                    </span>
                    <span className={`text-base leading-relaxed transition-colors ${isSelected ? 'text-white' : 'text-white/70'}`}>
                      {opt.text}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentQ > 0 && (
            <button
              className="btn-ghost"
              onClick={() => { setCurrentQ(currentQ - 1); setSelected(null) }}
            >
              ← Prev
            </button>
          )}
          <div className="flex-1" />
          {currentQ < questions.length - 1 ? (
            <button
              className="btn-ghost"
              onClick={() => { setCurrentQ(currentQ + 1); setSelected(null) }}
            >
              Next →
            </button>
          ) : allAnswered ? (
            <motion.button
              className="btn-primary px-8 py-3"
              onClick={handleComplete}
              disabled={completing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {completing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating…
                </span>
              ) : '✨ Reveal My Score'}
            </motion.button>
          ) : null}
        </div>

        {/* Skip to end if all answered */}
        {allAnswered && currentQ < questions.length - 1 && (
          <div className="text-center mt-4">
            <button
              className="text-brand-gold text-sm hover:text-brand-gold-lt transition-colors"
              onClick={handleComplete}
              disabled={completing}
            >
              All answered — reveal my score →
            </button>
          </div>
        )}

        {/* Question dots preview (first 10) */}
        <div className="flex gap-1.5 flex-wrap justify-center mt-8">
          {Array.from({ length: 60 }).map((_, i) => {
            const answered = !!answers[i + 1]
            const isCurrent = i === currentQ
            return (
              <button
                key={i}
                onClick={() => { setCurrentQ(i); setSelected(null) }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent ? 'scale-150 bg-brand-purple-md' :
                  answered ? 'bg-brand-purple/60' : 'bg-white/10'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
