import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return toast.error('Enter the 6-digit code')
    setLoading(true)
    try {
      await api.post('/auth/verify-code', { code })
      updateUser({ is_verified: true })
      toast.success('Email verified!')
      navigate('/quiz')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    try {
      await api.post('/auth/resend-code')
      toast.success('New code sent to your email')
    } catch (err) {
      toast.error('Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-romantic flex items-center justify-center px-4">
      <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-white/40 text-sm">Enter the 6-digit code sent to your email</p>
        </div>

        <form onSubmit={submit} className="card p-8">
          <input
            className="input text-center text-2xl tracking-[0.5em] font-mono"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
          />
          <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full mt-5">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={resend} disabled={resending} className="text-purple-400 hover:text-purple-300 text-sm">
            {resending ? 'Sending…' : "Didn't get a code? Resend"}
          </button>
          <p className="text-white/20 text-xs mt-3">Check your spam folder. Code expires in 24 hours.</p>
        </div>
      </motion.div>
    </div>
  )
}
