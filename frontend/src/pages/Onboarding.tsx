import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { profileAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ZODIACS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
]

const GENDERS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
]

type Step = 'basics' | 'identity' | 'about'

export default function Onboarding() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [step, setStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    seeking_gender: '',
    zodiac_sign: '',
    location: '',
    bio: '',
  })

  const steps: Step[] = ['basics', 'identity', 'about']
  const stepIndex = steps.indexOf(step)

  const handleNext = () => {
    if (step === 'basics') {
      if (!form.first_name || !form.date_of_birth) {
        toast.error('Please fill in all required fields')
        return
      }
    }
    if (step === 'identity') {
      if (!form.gender || !form.seeking_gender || !form.zodiac_sign) {
        toast.error('Please select all options')
        return
      }
    }
    const nextStep = steps[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await profileAPI.onboarding({
        first_name: form.first_name,
        last_name: form.last_name || undefined,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        seeking_gender: form.seeking_gender,
        zodiac_sign: form.zodiac_sign,
        location: form.location || undefined,
        bio: form.bio || undefined,
      })
      await refresh()
      toast.success('Profile set up! Time for your quiz.')
      navigate('/quiz')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= stepIndex ? 'linear-gradient(90deg, #6B21A8, #EC4899)' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 'basics' && (
              <div className="glass-card p-8">
                <h2 className="font-display text-3xl font-bold text-white mb-2">The Basics</h2>
                <p className="text-white/50 mb-7">Let's start with the fundamentals.</p>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2">First Name *</label>
                      <input className="input-field" placeholder="First name"
                        value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2">Last Name</label>
                      <input className="input-field" placeholder="Last name"
                        value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Date of Birth *</label>
                    <input type="date" className="input-field"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      max={new Date(Date.now() - 567648000000).toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-white/30 mt-1">Used to calculate your life path number</p>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Location</label>
                    <input className="input-field" placeholder="City, State"
                      value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>

                <button onClick={handleNext} className="btn-primary w-full mt-7">Continue →</button>
              </div>
            )}

            {step === 'identity' && (
              <div className="glass-card p-8">
                <h2 className="font-display text-3xl font-bold text-white mb-2">Your Identity</h2>
                <p className="text-white/50 mb-7">This shapes who you'll see and how you're matched.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-white/60 mb-3">I identify as *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setForm({ ...form, gender: g.value })}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            form.gender === g.value
                              ? 'bg-brand-purple/30 border-brand-purple-md text-white'
                              : 'border-white/10 text-white/50 hover:border-white/30'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-3">I'm interested in *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setForm({ ...form, seeking_gender: g.value })}
                          className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                            form.seeking_gender === g.value
                              ? 'bg-brand-pink/30 border-brand-pink text-white'
                              : 'border-white/10 text-white/50 hover:border-white/30'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-3">Your Zodiac Sign *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ZODIACS.map((z) => (
                        <button
                          key={z}
                          onClick={() => setForm({ ...form, zodiac_sign: z })}
                          className={`py-2 px-3 rounded-xl border text-sm transition-all ${
                            form.zodiac_sign === z
                              ? 'bg-brand-gold/20 border-brand-gold text-brand-gold'
                              : 'border-white/10 text-white/50 hover:border-white/30'
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-7">
                  <button onClick={() => setStep('basics')} className="btn-ghost flex-1">← Back</button>
                  <button onClick={handleNext} className="btn-primary flex-1">Continue →</button>
                </div>
              </div>
            )}

            {step === 'about' && (
              <div className="glass-card p-8">
                <h2 className="font-display text-3xl font-bold text-white mb-2">About You</h2>
                <p className="text-white/50 mb-7">Optional — helps matches understand you before they see your score.</p>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Bio</label>
                    <textarea
                      className="input-field resize-none"
                      rows={4}
                      placeholder="A few sentences about who you are and what you're looking for…"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                    <p className="text-xs text-white/30 mt-1">This is shown to your matches</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-7">
                  <button onClick={() => setStep('identity')} className="btn-ghost flex-1">← Back</button>
                  <button onClick={handleSubmit} className="btn-primary flex-1" disabled={loading}>
                    {loading ? 'Saving…' : 'Start My Quiz →'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
