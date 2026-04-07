import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import ScoreGauge from '../components/ScoreGauge'

const ZODIAC_SYMBOLS = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}

function resizeImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [profile, setProfile] = useState(null)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const isOwn = String(userId) === String(currentUser?.id)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: p } = await api.get(isOwn ? '/profiles/me' : `/profiles/${userId}`)
        setProfile(p)
        if (!isOwn) {
          try { const { data: s } = await api.get(`/matches/${userId}`); setScore(s) } catch (_) {}
        }
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [userId])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
      return toast.error('Only JPG and PNG files accepted')
    }
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB')
    setUploading(true)
    try {
      const resized = await resizeImage(file, 400)
      const { data: updated } = await api.post('/profiles/me/photo', { photo_data: resized })
      setProfile(updated)
      updateUser({ profile_photo: updated.profile_photo })
      toast.success('Photo updated!')
    } catch (_) { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  if (loading) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30">Loading…</div>
  if (!profile) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30">Profile not found</div>

  const photo = profile.profile_photo || profile.photo_url || ''
  const zodiacSymbol = ZODIAC_SYMBOLS[profile.sun_sign?.toLowerCase()] || ''

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="text-white/30 text-sm hover:text-white/60 inline-flex items-center gap-1 mb-6">← Back to matches</Link>

        {/* Header */}
        <motion.div className="card p-8 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-5">
            {/* Photo with upload */}
            <div className="relative group flex-shrink-0">
              {photo ? (
                <img src={photo} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
              {isOwn && (
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? '⏳' : '📷'}
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              )}
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-white/40 text-sm">
                {profile.age && `${profile.age} · `}{profile.gender}{profile.location && ` · ${profile.location}`}
              </p>

              {/* RS Code */}
              {profile.rs_code && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-700/60 border border-white/5">
                  <span className="text-white/30 text-xs">RS</span>
                  <span className="text-purple-300 text-xs font-mono font-bold tracking-wider">{profile.rs_code}</span>
                </div>
              )}

              {/* Zodiac + Life Path badges */}
              <div className="flex items-center gap-2 mt-2">
                {profile.sun_sign && (
                  <span className="px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-medium">
                    {zodiacSymbol} {profile.sun_sign.charAt(0).toUpperCase() + profile.sun_sign.slice(1)}
                  </span>
                )}
                {profile.life_path_number && (
                  <span className="px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-medium">
                    LP {profile.life_path_number}
                  </span>
                )}
              </div>

              {/* Archetype + Shadow */}
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.archetype && (
                  <span className="px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs font-medium">
                    🧬 {profile.archetype}
                  </span>
                )}
                {profile.shadow_type && (
                  <span className="px-3 py-1 rounded-full bg-pink-600/20 border border-pink-500/20 text-pink-300 text-xs font-medium">
                    Shadow: {profile.shadow_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-white/60 text-sm mt-5 leading-relaxed border-t border-white/5 pt-5">{profile.bio}</p>
          )}
        </motion.div>

        {/* Compatibility (other user) */}
        {!isOwn && score && (
          <motion.div className="card p-8 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-lg font-semibold text-white mb-6">Compatibility</h2>
            <div className="flex justify-center mb-6">
              <ScoreGauge score={score.score} tier={score.tier} animated={false} />
            </div>

            {/* Archetype fit description */}
            {score.archetype_fit_label && (
              <div className="card p-4 mb-4 bg-purple-900/20 border-purple-500/20">
                <div className="text-white/30 text-xs uppercase tracking-widest mb-1">Archetype Pairing</div>
                <p className="text-white/70 text-sm">{score.archetype_fit_label}</p>
              </div>
            )}

            {/* Score breakdown bars */}
            {score.breakdown && (
              <div className="space-y-3 mb-5">
                {Object.entries(score.breakdown).map(([cat, pct]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{cat.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white/30">{pct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full score-gradient rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cosmic compatibility section */}
            {(score.zodiac_norm != null || score.numerology_norm != null) && (
              <div className="border-t border-white/5 pt-4">
                <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Cosmic Compatibility</h3>
                <div className="grid grid-cols-2 gap-4">
                  {score.zodiac_norm != null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gold-400">Zodiac</span>
                        <span className="text-gold-300">{Math.round(score.zodiac_norm * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${score.zodiac_norm * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {score.numerology_norm != null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gold-400">Numerology</span>
                        <span className="text-gold-300">{Math.round(score.numerology_norm * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${score.numerology_norm * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action buttons (other user) */}
        {!isOwn && score && (
          <motion.div className="flex gap-3 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {score.score >= 550 ? (
              <button onClick={() => navigate('/messages')} className="btn-primary flex-1">💬 Message</button>
            ) : (
              <button onClick={async () => {
                try {
                  await api.post(`/knocks/${userId}`, { message: '' })
                  toast.success('Knock sent!')
                } catch (err) { toast.error(err.response?.data?.detail || 'Knock failed') }
              }} className="btn-primary flex-1">🚪 Send Knock</button>
            )}
          </motion.div>
        )}

        {/* Own profile scores */}
        {isOwn && profile.quiz_completed && (
          <motion.div className="card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-lg font-semibold text-white mb-4">Your Genesis OS Profile</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-700/40 rounded-xl">
                <div className="text-2xl font-bold text-purple-300">{Math.round(profile.archetype_score)}</div>
                <div className="text-white/40 text-xs mt-1">Archetype</div>
              </div>
              <div className="text-center p-4 bg-dark-700/40 rounded-xl">
                <div className="text-2xl font-bold text-pink-300">{Math.round(profile.shadow_score)}</div>
                <div className="text-white/40 text-xs mt-1">Shadow</div>
              </div>
              <div className="text-center p-4 bg-dark-700/40 rounded-xl">
                <div className="text-2xl font-bold text-gold-400">{Math.round(profile.readiness_score || 0)}</div>
                <div className="text-white/40 text-xs mt-1">Readiness</div>
              </div>
            </div>
          </motion.div>
        )}

        {isOwn && !profile.quiz_completed && (
          <div className="card p-6 text-center">
            <p className="text-white/40 mb-4">Complete the compatibility quiz to see your scores.</p>
            <Link to="/quiz" className="btn-primary text-sm">Take the quiz</Link>
          </div>
        )}
      </div>
    </div>
  )
}
