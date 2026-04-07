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
const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const DATING_STATUSES = ['', 'Talking', 'Friends', 'Dating', 'Maybe long term', 'Marriage']
const EDUCATION_LEVELS = ['', 'High school', 'Some college', 'Bachelor\'s', 'Master\'s', 'PhD', 'Trade school']

function resizeImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize; canvas.height = maxSize
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, maxSize, maxSize)
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
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const isOwn = String(userId) === String(currentUser?.id)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data: p } = await api.get(isOwn ? '/profiles/me' : `/profiles/${userId}`)
        setProfile(p)
        setForm({
          name: p.name || '', bio: p.bio || '', location: p.location || '',
          age: p.age || '', gender: p.gender || '', looking_for: p.looking_for || '',
          sun_sign: p.sun_sign || '', height: p.height || '', occupation: p.occupation || '',
          education: p.education || '', dating_status: p.dating_status || '',
          date_of_birth: p.date_of_birth || '',
        })
        if (!isOwn) {
          try { const { data: s } = await api.get(`/matches/${userId}`); setScore(s) } catch (_) {}
        }
      } finally { setLoading(false) }
    }
    fetchAll()
  }, [userId, isOwn])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/image\/(jpeg|png)/)) return toast.error('JPG or PNG only')
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5MB')
    try {
      const resized = await resizeImage(file, 400)
      const { data } = await api.post('/profiles/me/photo', { photo_data: resized })
      setProfile(data)
      updateUser({ profile_photo: data.profile_photo })
      toast.success('Photo updated!')
    } catch (_) { toast.error('Upload failed') }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : undefined }
      const { data } = await api.patch('/profiles/me', payload)
      setProfile(data)
      updateUser(data)
      setEditing(false)
      toast.success('Profile saved!')
    } catch (_) { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30 text-sm">Loading…</div>
  if (!profile) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30 text-sm">Profile not found</div>

  const photo = profile.profile_photo || profile.photo_url || ''
  const zodiacSymbol = ZODIAC_SYMBOLS[profile.sun_sign?.toLowerCase()] || ''

  // Edit form field helper
  const F = (label, key, type = 'text', opts) => (
    <div>
      <label className="text-white/40 text-xs mb-1 block">{label}</label>
      {opts ? (
        <select className="input text-sm min-h-[44px]" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
          {opts.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <div>
          <textarea className="input text-sm resize-none min-h-[80px]" maxLength={500} value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          <div className="text-white/20 text-xs text-right mt-0.5">{(form[key] || '').length}/500</div>
        </div>
      ) : (
        <input className="input text-sm min-h-[44px]" type={type} value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="text-white/30 text-sm hover:text-white/60 inline-flex items-center gap-1 mb-4 sm:mb-6 min-h-[44px]">← Back</Link>

        {/* Edit mode */}
        {isOwn && editing ? (
          <motion.div className="card p-5 sm:p-8 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-white/30 hover:text-white min-h-[44px] px-2">✕</button>
            </div>

            {/* Photo */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group flex-shrink-0">
                {photo ? <img src={photo} className="w-20 h-20 rounded-full object-cover" /> :
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">{profile.name?.[0]}</div>}
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-lg">📷
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="text-white/40 text-xs">Tap to change photo<br/>JPG or PNG, 400×400</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {F('Display Name', 'name')}
              {F('Age', 'age', 'number')}
              {F('Gender', 'gender', 'text', ['', 'Man', 'Woman', 'Non-binary', 'Other'])}
              {F('Looking for', 'looking_for', 'text', ['', 'Men', 'Women', 'Everyone'])}
              {F('Sun Sign', 'sun_sign', 'text', ['', ...SIGNS])}
              {F('Date of Birth', 'date_of_birth', 'date')}
              {F('Location', 'location')}
              {F('Height', 'height')}
              {F('Occupation', 'occupation')}
              {F('Education', 'education', 'text', EDUCATION_LEVELS)}
              {F('Dating Status', 'dating_status', 'text', DATING_STATUSES)}
            </div>
            <div className="mt-4">{F('Bio', 'bio', 'textarea')}</div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="btn-ghost flex-1 min-h-[44px]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 min-h-[44px]">
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* View mode header */}
            <motion.div className="card p-5 sm:p-8 mb-4 sm:mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative group flex-shrink-0">
                  {photo ? <img src={photo} alt={profile.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" /> :
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">{profile.name?.[0]?.toUpperCase()}</div>}
                  {isOwn && (
                    <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">📷
                      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-white">{profile.name}</h1>
                    {isOwn && (
                      <button onClick={() => setEditing(true)} className="text-purple-400 text-xs hover:text-purple-300 min-h-[32px] px-2">Edit</button>
                    )}
                  </div>
                  <p className="text-white/40 text-xs sm:text-sm">{profile.age && `${profile.age} · `}{profile.gender}{profile.location && ` · ${profile.location}`}</p>
                  {profile.rs_code && (
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-dark-700/60 border border-white/5">
                      <span className="text-white/30 text-xs">RS</span>
                      <span className="text-purple-300 text-xs font-mono font-bold tracking-wider">{profile.rs_code}</span>
                    </div>
                  )}
                  {/* Zodiac + Life Path badges */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {profile.sun_sign && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-medium">
                        {zodiacSymbol} {profile.sun_sign.charAt(0).toUpperCase() + profile.sun_sign.slice(1)}
                      </span>
                    )}
                    {profile.life_path_number && (
                      <span className="px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-medium">LP {profile.life_path_number}</span>
                    )}
                    {profile.archetype && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs">🧬 {profile.archetype}</span>
                    )}
                    {profile.shadow_type && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-600/15 border border-pink-500/15 text-pink-300/70 text-xs">{profile.shadow_type}</span>
                    )}
                  </div>
                  {/* Extra info */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-white/30 text-xs">
                    {profile.height && <span>{profile.height}</span>}
                    {profile.occupation && <span>{profile.occupation}</span>}
                    {profile.education && <span>{profile.education}</span>}
                    {profile.dating_status && <span>{profile.dating_status}</span>}
                  </div>
                </div>
              </div>
              {profile.bio && <p className="text-white/60 text-sm mt-4 sm:mt-5 leading-relaxed border-t border-white/5 pt-4 sm:pt-5 break-words">{profile.bio}</p>}
            </motion.div>

            {/* Compatibility (other user) */}
            {!isOwn && score && (
              <motion.div className="card p-5 sm:p-8 mb-4 sm:mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="font-display text-lg font-semibold text-white mb-4 sm:mb-6">Compatibility</h2>
                <div className="flex justify-center mb-4 sm:mb-6"><ScoreGauge score={score.score} tier={score.tier} animated={false} /></div>
                {score.archetype_fit_label && (
                  <div className="card p-3 sm:p-4 mb-4 bg-purple-900/20 border-purple-500/20">
                    <div className="text-white/30 text-xs uppercase tracking-widest mb-1">Archetype Pairing</div>
                    <p className="text-white/70 text-sm">{score.archetype_fit_label}</p>
                  </div>
                )}
                {score.breakdown && (
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
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
                {/* Cosmic compatibility */}
                {(score.zodiac_norm != null || score.numerology_norm != null) && (
                  <div className="border-t border-white/5 pt-3 sm:pt-4">
                    <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Cosmic Compatibility</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {score.zodiac_norm != null && (
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gold-400">Zodiac</span><span className="text-gold-300">{Math.round(score.zodiac_norm * 100)}%</span></div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${score.zodiac_norm * 100}%` }} /></div>
                        </div>
                      )}
                      {score.numerology_norm != null && (
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gold-400">Numerology</span><span className="text-gold-300">{Math.round(score.numerology_norm * 100)}%</span></div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full" style={{ width: `${score.numerology_norm * 100}%` }} /></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action buttons */}
            {!isOwn && score && (
              <motion.div className="flex gap-3 mb-4 sm:mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                {score.score >= 550 ? (
                  <button onClick={() => navigate('/messages')} className="btn-primary flex-1 min-h-[44px]">💬 Message</button>
                ) : (
                  <button onClick={async () => {
                    try { await api.post(`/knocks/${userId}`, { message: '' }); toast.success('Knock sent!') }
                    catch (err) { toast.error(err.response?.data?.detail || 'Knock failed') }
                  }} className="btn-primary flex-1 min-h-[44px]">🚪 Send Knock</button>
                )}
              </motion.div>
            )}

            {/* Own profile scores */}
            {isOwn && profile.quiz_completed && (
              <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="font-display text-lg font-semibold text-white mb-4">Genesis OS Profile</h2>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-dark-700/40 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-purple-300">{Math.round(profile.archetype_score)}</div>
                    <div className="text-white/40 text-xs mt-1">Archetype</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-dark-700/40 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-pink-300">{Math.round(profile.shadow_score)}</div>
                    <div className="text-white/40 text-xs mt-1">Shadow</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-dark-700/40 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-gold-400">{Math.round(profile.readiness_score || 0)}</div>
                    <div className="text-white/40 text-xs mt-1">Readiness</div>
                  </div>
                </div>
              </motion.div>
            )}

            {isOwn && !profile.quiz_completed && (
              <div className="card p-6 text-center"><p className="text-white/40 mb-4 text-sm">Take the quiz to see your scores.</p><Link to="/quiz" className="btn-primary text-sm min-h-[44px]">Take quiz</Link></div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
