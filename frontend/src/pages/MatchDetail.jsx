import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import ScoreGauge from '../components/ScoreGauge'

const ZODIAC_SYMBOLS = { aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓' }

export default function MatchDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [match, setMatch] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/matches/${userId}`).catch(() => ({ data: null })),
      api.get(`/profiles/${userId}`).catch(() => ({ data: null })),
    ]).then(([mRes, pRes]) => {
      setMatch(mRes.data)
      setProfile(pRes.data)
    }).finally(() => setLoading(false))
  }, [userId])

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/likes/${userId}`)
      if (data.mutual) toast.success("It's a match! 💜", { duration: 4000 })
      else toast('Liked! 💜', { icon: '💜' })
    } catch (err) { toast(err.response?.data?.detail || 'Already liked') }
  }

  const handleReport = async (reason) => {
    try {
      await api.post(`/reports/${userId}`, { reason })
      toast.success('Report submitted. Thank you.')
      setShowReport(false)
    } catch (_) { toast.error('Report failed') }
  }

  const handleBlock = async () => {
    if (!confirm('Block this user? They will be removed from your matches.')) return
    try {
      await api.post(`/blocks/${userId}`)
      toast.success('User blocked')
      navigate('/dashboard')
    } catch (err) { toast.error(err.response?.data?.detail || 'Block failed') }
  }

  if (loading) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30 text-sm">Loading…</div>
  if (!match || !profile) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30 text-sm">Match not found</div>

  const photo = profile.profile_photo || profile.photo_url || ''
  const zodiac = ZODIAC_SYMBOLS[profile.sun_sign?.toLowerCase()] || ''
  const isActive = profile.last_active && (Date.now() - new Date(profile.last_active).getTime()) < 15 * 60 * 1000

  return (
    <div className="min-h-screen bg-gradient-romantic pt-14 sm:pt-16 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="text-white/30 text-sm hover:text-white/60 inline-flex items-center min-h-[44px] mb-3">← Matches</Link>

        {/* Hero */}
        <motion.div className="card p-6 sm:p-8 mb-4 text-center relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="relative inline-block mb-4">
              {photo ? <img src={photo} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover mx-auto border-4 border-purple-500/30" /> :
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-5xl font-bold text-white mx-auto">{profile.name?.[0]}</div>}
              {isActive && <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-dark-800" />}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{profile.name}{profile.age ? `, ${profile.age}` : ''}</h1>
            {profile.location && <p className="text-white/40 text-sm mt-1">{profile.location}</p>}

            <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
              {profile.rs_code && <span className="px-2.5 py-1 rounded-lg bg-dark-700/60 border border-white/5 text-purple-300 text-xs font-mono font-bold">RS {profile.rs_code}</span>}
              {profile.sun_sign && <span className="px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs">{zodiac} {profile.sun_sign}</span>}
              {profile.life_path_number && <span className="px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs">LP {profile.life_path_number}</span>}
              {profile.archetype && <span className="px-2.5 py-1 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs">🧬 {profile.archetype}</span>}
              {profile.shadow_type && <span className="px-2.5 py-1 rounded-full bg-pink-600/15 border border-pink-500/15 text-pink-300/70 text-xs">{profile.shadow_type}</span>}
            </div>

            {/* Score gauge */}
            <div className="mt-6"><ScoreGauge score={match.score} tier={match.tier} animated={false} /></div>
          </div>
        </motion.div>

        {/* Bio */}
        {profile.bio && (
          <motion.div className="card p-5 sm:p-6 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <p className="text-white/60 text-sm leading-relaxed break-words">{profile.bio}</p>
          </motion.div>
        )}

        {/* Score Breakdown */}
        {match.breakdown && (
          <motion.div className="card p-5 sm:p-6 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h3 className="text-white/60 text-xs uppercase tracking-widest mb-4">Compatibility Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(match.breakdown).map(([key, pct], i) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-white/30">{typeof pct === 'number' ? `${pct}%` : pct}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full score-gradient rounded-full" initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ delay: 0.1 * i, duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Archetype pairing */}
        {match.archetype_fit_label && (
          <motion.div className="card p-5 sm:p-6 mb-4 bg-purple-900/20 border-purple-500/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-white/30 text-xs uppercase tracking-widest mb-2">Archetype Pairing</h3>
            <p className="text-white/70 text-sm leading-relaxed">{match.archetype_fit_label}</p>
          </motion.div>
        )}

        {/* Cosmic section */}
        {(match.zodiac_norm != null || match.numerology_norm != null) && (
          <motion.div className="card p-5 sm:p-6 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Cosmic Compatibility</h3>
            <div className="grid grid-cols-2 gap-4">
              {match.zodiac_norm != null && (
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gold-400">Zodiac</span><span className="text-gold-300">{Math.round(match.zodiac_norm * 100)}%</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${match.zodiac_norm * 100}%` }} /></div>
                </div>
              )}
              {match.numerology_norm != null && (
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gold-400">Numerology</span><span className="text-gold-300">{Math.round(match.numerology_norm * 100)}%</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${match.numerology_norm * 100}%` }} /></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="flex gap-3 mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button onClick={handleLike} className="btn-primary flex-1 min-h-[48px] text-sm">♥ Like</button>
          {match.score >= 550 ? (
            <button onClick={() => navigate('/messages')} className="btn-ghost flex-1 min-h-[48px] text-sm">💬 Message</button>
          ) : (
            <button onClick={async () => { try { await api.post(`/knocks/${userId}`); toast.success('Knock sent!') } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }}}
              className="btn-ghost flex-1 min-h-[48px] text-sm">🚪 Knock</button>
          )}
        </motion.div>

        {/* Report/Block */}
        <div className="flex gap-2 justify-center">
          <button onClick={() => setShowReport(!showReport)} className="text-white/20 text-xs hover:text-white/40 min-h-[44px]">Report</button>
          <span className="text-white/10">·</span>
          <button onClick={handleBlock} className="text-white/20 text-xs hover:text-red-400 min-h-[44px]">Block</button>
        </div>

        {showReport && (
          <motion.div className="card p-5 mt-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h4 className="text-white text-sm font-semibold mb-3">Report this profile</h4>
            <div className="space-y-2">
              {['Fake profile', 'Inappropriate content', 'Harassment', 'Spam', 'Other'].map(r => (
                <button key={r} onClick={() => handleReport(r)}
                  className="w-full text-left p-3 rounded-lg bg-dark-700/40 text-white/60 text-sm hover:bg-dark-700/60 min-h-[44px]">{r}</button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
