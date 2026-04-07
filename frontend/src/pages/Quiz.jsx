import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import QuizProgress from '../components/QuizProgress'

export default function Quiz() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [categories, setCategories] = useState([])
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    api.get('/quiz/questions').then(({ data }) => {
      setQuestions(data.questions)
      setCategories(data.categories)
    })
  }, [])

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gradient-romantic flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading questions…</div>
      </div>
    )
  }

  const q = questions[current]
  const answered = Object.keys(answers).length
  const categoryName = categories[q.category] || ''

  const choose = (val) => {
    setAnswers((a) => ({ ...a, [String(q.id)]: val }))
    if (current < questions.length - 1) {
      setTimeout(() => {
        setDirection(1)
        setCurrent((c) => c + 1)
      }, 220)
    }
  }

  const back = () => {
    if (current > 0) {
      setDirection(-1)
      setCurrent((c) => c - 1)
    }
  }

  const submit = async () => {
    if (answered < questions.length) {
      return toast.error(`Please answer all ${questions.length} questions. You have ${questions.length - answered} remaining.`)
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/quiz/submit', { answers })
      // Store result for ScoreReveal page
      sessionStorage.setItem('quiz_result', JSON.stringify(data))
      navigate('/score')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isLast = current === questions.length - 1
  const currentAnswer = answers[String(q.id)]

  return (
    <div className="min-h-screen bg-gradient-romantic flex flex-col items-center px-4 py-12 pt-20">
      {/* Progress */}
      <div className="w-full max-w-xl mb-8">
        <QuizProgress current={answered} total={questions.length} category={categoryName} />
      </div>

      {/* Question card */}
      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
          >
            <div className="card p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-white/20 text-sm font-mono">{current + 1}</span>
                <span className="text-white/20 text-sm">—</span>
                <span className="text-purple-400/70 text-sm">{categoryName}</span>
              </div>

              <h2 className="font-display text-xl font-semibold text-white leading-snug mb-8">
                {q.text}
              </h2>

              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const val = i + 1
                  const isSelected = currentAnswer === val
                  return (
                    <button
                      key={i}
                      onClick={() => choose(val)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-150 text-sm
                        ${isSelected
                          ? 'bg-purple-600/25 border-purple-500/60 text-white'
                          : 'bg-dark-700/40 border-white/8 text-white/60 hover:bg-dark-700/60 hover:border-white/20 hover:text-white/80'
                        }`}
                    >
                      <span className="text-white/20 mr-3 font-mono">{val}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-xl flex justify-between items-center mt-6">
        <button onClick={back} disabled={current === 0} className="btn-ghost text-sm disabled:opacity-20">
          ← Back
        </button>

        {isLast ? (
          <button
            onClick={submit}
            disabled={submitting || answered < questions.length}
            className="btn-primary text-sm"
          >
            {submitting ? 'Calculating…' : `See my score (${answered}/${questions.length})`}
          </button>
        ) : (
          <span className="text-white/20 text-sm">{questions.length - current - 1} remaining</span>
        )}
      </div>
    </div>
  )
}
