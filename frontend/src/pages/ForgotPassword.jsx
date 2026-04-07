import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setSent(true)
      if (data.reset_token) setResetToken(data.reset_token)
      toast.success('Reset instructions sent')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setResetting(true)
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword })
      toast.success('Password reset! You can now sign in.')
      setSent(false)
      setResetToken('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-romantic flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/40">{sent ? 'Enter your new password' : 'Enter your email to get a reset link'}</p>
        </div>

        <div className="card p-8">
          {!sent ? (
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="label">Reset Token</label>
                <input className="input" placeholder="Paste token here" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input className="input" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={resetting} className="btn-primary w-full">
                {resetting ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          <Link to="/login" className="text-purple-400 hover:text-purple-300">← Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
