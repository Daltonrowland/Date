import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import useAuthStore from '../store/authStore'
import ScoreGauge from '../components/ScoreGauge'

export default function Profile() {
  const { userId } = useParams()
  const currentUser = useAuthStore((s) => s.user)
  const [profile, setProfile] = useState(null)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)

  const isOwn = String(userId) === String(currentUser?.id)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: p } = await api.get(isOwn ? '/profiles/me' : `/profiles/${userId}`)
        setProfile(p)
        if (!isOwn) {
          try {
            const { data: s } = await api.get(`/matches/${userId}`)
            setScore(s)
          } catch (_) {}
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [userId])

  if (loading) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30">Loading…</div>
  if (!profile) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30">Profile not found</div>

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to="/dashboard" className="text-white/30 text-sm hover:text-white/60 inline-flex items-center gap-1 mb-6">
          ← Back to matches
        </Link>

        {/* Header */}
        <motion.div className="card p-8 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-5">
            <div className="relative group">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                  {profile.name?.[0]?.toUpperCase()}
                </div>
              )}
              {isOwn && (
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  📷
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return }
                    const reader = new FileReader()
                    reader.onload = async () => {
                      try {
                        const { data: updated } = await api.post('/profiles/me/photo', { photo_data: reader.result })
                        setProfile(updated)
                      } catch (_) { alert('Upload failed') }
                    }
                    reader.readAsDataURL(file)
                  }} />
                </label>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-white/40 text-sm">
                {profile.age && `${profile.age} · `}
                {profile.gender}{profile.location && ` · ${profile.location}`}
              </p>
              {profile.archetype && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs font-medium">
                  {profile.archetype}
                </span>
              )}
            </div>
          </div>

          {profile.bio && (
            <p className="text-white/60 text-sm mt-5 leading-relaxed border-t border-white/5 pt-5">{profile.bio}</p>
          )}
        </motion.div>

        {/* Compatibility score (other user) */}
        {!isOwn && score && (
          <motion.div
            className="card p-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-display text-lg font-semibold text-white mb-6">Compatibility</h2>
            <div className="flex justify-center mb-6">
              <ScoreGauge score={score.score} tier={score.tier} animated={false} />
            </div>
            {score.breakdown && (
              <div className="space-y-3">
                {Object.entries(score.breakdown).map(([cat, pct]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{cat}</span>
                      <span className="text-white/30">{pct}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full score-gradient rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Scores (own profile) */}
        {isOwn && profile.quiz_completed && (
          <motion.div className="card p-6 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <h2 className="font-display text-lg font-semibold text-white mb-4">Your scores</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-dark-700/40 rounded-xl">
                <div className="text-2xl font-bold text-purple-300">{Math.round(profile.archetype_score)}</div>
                <div className="text-white/40 text-xs mt-1">Archetype Score</div>
              </div>
              <div className="text-center p-4 bg-dark-700/40 rounded-xl">
                <div className="text-2xl font-bold text-pink-300">{Math.round(profile.shadow_score)}</div>
                <div className="text-white/40 text-xs mt-1">Shadow Score</div>
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
