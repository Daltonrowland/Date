import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const ZODIAC_SYMBOLS = { aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓' }
const DATING_STATUSES = ['Talking', 'Friends', 'Dating', 'Maybe long term', 'Marriage']
const EDUCATION = ['High school', "Some college", "Bachelor's", "Master's", 'PhD', 'Trade school']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', age: '', gender: '', location: '', dating_status: '',
    bio: '', height: '', occupation: '', education: '',
    looking_for: 'Everyone', sun_sign: '', date_of_birth: '',
  })
  const [lifePath, setLifePath] = useState(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value || e.target?.textContent }))
  const setVal = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const computeLifePath = (dob) => {
    if (!dob) return null
    const digits = dob.replace(/-/g, '').split('').map(Number)
    let total = digits.reduce((a, b) => a + b, 0)
    while (total > 9 && ![11, 22, 33].includes(total)) {
      total = String(total).split('').map(Number).reduce((a, b) => a + b, 0)
    }
    return total
  }

  const handleDobChange = (e) => {
    const dob = e.target.value
    setForm(f => ({ ...f, date_of_birth: dob }))
    setLifePath(computeLifePath(dob))
  }

  const saveAndNext = async () => {
    setSaving(true)
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : undefined }
      if (step === 6) payload.onboarding_completed = true
      await api.patch('/profiles/me', payload)
      if (step === 6) {
        updateUser({ onboarding_completed: true, ...form })
        navigate('/quiz')
      } else {
        setStep(s => s + 1)
      }
    } catch (_) { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const steps = [
    // Step 0: Welcome
    () => (
      <div className="text-center py-8">
        <div className="text-6xl mb-6">✦</div>
        <h2 className="font-display text-3xl font-bold text-white mb-3">Welcome to Relationship Scores</h2>
        <p className="text-white/50 mb-8 max-w-sm mx-auto">Your unique identity in the Relationship Scores universe.</p>
        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-6">
          <span className="text-white/40 text-sm">Your RS Code</span>
          <span className="text-purple-300 text-2xl font-mono font-bold tracking-[0.3em]">{user?.rs_code || '------'}</span>
        </div>
        <p className="text-white/30 text-xs max-w-xs mx-auto">This is your private identity code used across the platform. Share it to let people find you.</p>
      </div>
    ),
    // Step 1: Basics
    () => (
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">The Basics</h2>
        <p className="text-white/40 text-sm mb-6">Tell us about yourself.</p>
        <div className="space-y-4">
          <div><label className="label">Display Name</label><input className="input min-h-[44px]" value={form.name} onChange={set('name')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Age</label><input className="input min-h-[44px]" type="number" min="18" max="99" value={form.age} onChange={set('age')} /></div>
            <div><label className="label">Gender</label>
              <select className="input min-h-[44px]" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option><option>Man</option><option>Woman</option><option>Non-binary</option><option>Other</option>
              </select>
            </div>
          </div>
          <div><label className="label">Location</label><input className="input min-h-[44px]" placeholder="City, State" value={form.location} onChange={set('location')} /></div>
          <div>
            <label className="label">Dating Status</label>
            <div className="flex flex-wrap gap-2">
              {DATING_STATUSES.map(s => (
                <button key={s} onClick={() => setVal('dating_status', s)} type="button"
                  className={`px-3 py-2 rounded-xl text-sm border transition-all min-h-[36px] ${form.dating_status === s ? 'bg-purple-600/30 border-purple-500/60 text-white' : 'bg-dark-700/40 border-white/10 text-white/40'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    // Step 2: About
    () => (
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">About You</h2>
        <p className="text-white/40 text-sm mb-6">Help matches get to know you.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[100px] resize-none text-sm" maxLength={500} value={form.bio} onChange={set('bio')} placeholder="Write something about yourself…" />
            <div className="text-white/20 text-xs text-right">{(form.bio || '').length}/500</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Height</label><input className="input min-h-[44px]" placeholder="5'10&quot;" value={form.height} onChange={set('height')} /></div>
            <div><label className="label">Occupation</label><input className="input min-h-[44px]" placeholder="Software Engineer" value={form.occupation} onChange={set('occupation')} /></div>
          </div>
          <div><label className="label">Education</label>
            <select className="input min-h-[44px]" value={form.education} onChange={set('education')}>
              <option value="">Select</option>{EDUCATION.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>
    ),
    // Step 3: Photos
    () => (
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Profile Photos</h2>
        <p className="text-white/40 text-sm mb-6">Upload at least 1 photo. You can add more later.</p>
        <div className="flex justify-center">
          <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-purple-500/40 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-600/10 transition-colors">
            <span className="text-3xl text-purple-400">📷</span>
            <span className="text-purple-400 text-xs mt-2">Upload</span>
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const canvas = document.createElement('canvas')
              canvas.width = 400; canvas.height = 400
              const img = new Image()
              img.onload = async () => {
                const ctx = canvas.getContext('2d')
                const min = Math.min(img.width, img.height)
                ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 400, 400)
                try {
                  const { data } = await api.post('/profiles/me/photo', { photo_data: canvas.toDataURL('image/jpeg', 0.85) })
                  updateUser({ profile_photo: data.profile_photo })
                  toast.success('Photo uploaded!')
                } catch (_) { toast.error('Upload failed') }
              }
              img.src = URL.createObjectURL(file)
            }} />
          </label>
        </div>
        {user?.profile_photo && <div className="flex justify-center mt-4"><img src={user.profile_photo} className="w-24 h-24 rounded-full object-cover" /></div>}
      </div>
    ),
    // Step 4: Preferences
    () => (
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Your Preferences</h2>
        <p className="text-white/40 text-sm mb-6">Who are you looking for?</p>
        <div className="space-y-4">
          <div>
            <label className="label">I'm looking for</label>
            <div className="flex flex-wrap gap-2">
              {['Everyone', 'Women', 'Men', 'Non-binary'].map(g => (
                <button key={g} onClick={() => setVal('looking_for', g)} type="button"
                  className={`px-4 py-2.5 rounded-xl text-sm border transition-all min-h-[44px] ${form.looking_for === g ? 'bg-purple-600/30 border-purple-500/60 text-white' : 'bg-dark-700/40 border-white/10 text-white/40'}`}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    // Step 5: Astrology
    () => (
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1">Cosmic Profile</h2>
        <p className="text-white/40 text-sm mb-6">For zodiac and numerology compatibility.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Sun Sign</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SIGNS.map(s => (
                <button key={s} onClick={() => setVal('sun_sign', s)} type="button"
                  className={`px-2 py-2.5 rounded-xl text-xs border transition-all min-h-[44px] flex flex-col items-center gap-0.5 ${form.sun_sign === s ? 'bg-gold-500/20 border-gold-500/50 text-gold-400' : 'bg-dark-700/40 border-white/10 text-white/40'}`}>
                  <span className="text-lg">{ZODIAC_SYMBOLS[s]}</span>
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input className="input min-h-[44px]" type="date" value={form.date_of_birth} onChange={handleDobChange}
              max={new Date(Date.now() - 18*365.25*86400000).toISOString().split('T')[0]} />
            {lifePath && (
              <motion.div className="mt-3 flex items-center gap-3 p-3 bg-gold-500/10 rounded-xl border border-gold-500/20"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-gold-400 text-2xl font-display font-bold">{lifePath}</span>
                <div><span className="text-gold-400 text-xs">Your Life Path Number</span><br/><span className="text-white/40 text-xs">Used for numerology compatibility</span></div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    ),
    // Step 6: Ready
    () => (
      <div className="text-center py-8">
        <div className="text-6xl mb-6">🧬</div>
        <h2 className="font-display text-3xl font-bold text-white mb-3">You're Ready!</h2>
        <p className="text-white/50 mb-4 max-w-sm mx-auto">Complete the 60-question Genesis OS assessment to discover your archetype, shadow type, and compatibility score.</p>
        <p className="text-white/30 text-sm mb-8">Your archetype will be revealed after the quiz.</p>
      </div>
    ),
  ]

  const STEP_TITLES = ['Welcome', 'Basics', 'About', 'Photos', 'Preferences', 'Astrology', 'Ready']

  return (
    <div className="min-h-screen bg-gradient-romantic flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEP_TITLES.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? 'linear-gradient(90deg, #6B21A8, #EC4899)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div className="text-white/20 text-xs text-center mb-4">{step + 1} of {STEP_TITLES.length} — {STEP_TITLES[step]}</div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className="card p-6 sm:p-8">{steps[step]()}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1 min-h-[44px]">← Back</button>}
          <button onClick={saveAndNext} disabled={saving} className="btn-primary flex-1 min-h-[44px]">
            {saving ? 'Saving…' : step === 6 ? '🧬 Take Compatibility Quiz →' : step === 0 ? 'Get Started →' : 'Continue →'}
          </button>
        </div>

        {step > 0 && step < 6 && (
          <button onClick={() => setStep(s => s + 1)} className="w-full text-center text-white/20 text-xs mt-3 hover:text-white/40 min-h-[44px]">
            Skip this step
          </button>
        )}
      </div>
    </div>
  )
}
