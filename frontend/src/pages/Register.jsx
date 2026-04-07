import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', gender: '', looking_for: '',
    date_of_birth: '', sun_sign: '',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password || !form.age || !form.gender || !form.looking_for) {
      return toast.error('Please fill in all fields')
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        date_of_birth: form.date_of_birth || undefined,
        sun_sign: form.sun_sign || undefined,
      }
      const { data } = await api.post('/auth/register', payload)
      setAuth(data.access_token, { id: data.user_id, name: data.name, rs_code: data.rs_code, quiz_completed: false })
      toast.success(`Welcome, ${data.name}! Your RS Code: ${data.rs_code}`)
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-romantic flex items-center justify-center px-4 py-16">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Create account</h1>
          <p className="text-white/40">Begin your compatibility journey</p>
        </div>

        <form onSubmit={submit} className="card p-8 space-y-5">
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="Your name" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" min="18" max="99" placeholder="25" value={form.age} onChange={set('age')} />
            </div>
            <div>
              <label className="label">I identify as</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option>Man</option>
                <option>Woman</option>
                <option>Non-binary</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">I'm looking for</label>
            <select className="input" value={form.looking_for} onChange={set('looking_for')}>
              <option value="">Select</option>
              <option>Men</option>
              <option>Women</option>
              <option>Everyone</option>
            </select>
          </div>

          {/* Genesis OS onboarding fields */}
          <div className="border-t border-white/5 pt-5">
            <p className="text-purple-400/70 text-xs uppercase tracking-widest mb-4">Cosmic profile (optional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={form.date_of_birth} onChange={set('date_of_birth')}
                  max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]} />
                <p className="text-white/20 text-xs mt-1">For numerology life path</p>
              </div>
              <div>
                <label className="label">Sun sign</label>
                <select className="input" value={form.sun_sign} onChange={set('sun_sign')}>
                  <option value="">Select</option>
                  {SIGNS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                </select>
                <p className="text-white/20 text-xs mt-1">For zodiac alignment</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account…' : 'Create account & take quiz →'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
