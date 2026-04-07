import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { profileAPI, type Profile } from '../api/client'
import { useAuth } from '../context/AuthContext'

const TIER_COLORS: Record<string, string> = {
  'Soul-aligned match':   '#F59E0B',
  'Strong potential':     '#9333EA',
  'Healthy but growing':  '#22C55E',
  'Magnetic but risky':   '#EC4899',
  'Possible but unstable':'#F97316',
  'Red flag zone':        '#EF4444',
}

const DEPTH_LABELS = [
  { min: 0,  max: 20,  label: 'Surface Level',  desc: 'Just getting started' },
  { min: 21, max: 40,  label: 'Forming',         desc: 'Building your profile' },
  { min: 41, max: 60,  label: 'Reflective',      desc: 'Good emotional depth' },
  { min: 61, max: 80,  label: 'Insightful',      desc: 'Strong self-awareness' },
  { min: 81, max: 100, label: 'Luminous',         desc: 'Full emotional blueprint' },
]

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', location: '', display_name: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    profileAPI.getMe()
      .then((res) => {
        setProfile(res.data)
        setEditForm({
          bio: res.data.bio || '',
          location: res.data.location || '',
          display_name: res.data.display_name || '',
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await profileAPI.update(editForm)
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-purple-md border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const tierColor = TIER_COLORS[profile.tier || ''] || '#9333EA'
  const depthLabel = DEPTH_LABELS.find((d) => profile.depth_score >= d.min && profile.depth_score <= d.max)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] to-[#0F0F0F]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display font-semibold text-white">My Profile</h1>
        <button
          className="p-2 text-white/40 hover:text-white transition-colors"
          onClick={() => editing ? setEditing(false) : setEditing(true)}
        >
          {editing ? <X size={20} /> : <Edit2 size={18} />}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Identity card */}
        <motion.div
          className="glass-card p-6"
          style={{ borderColor: `${tierColor}25` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex gap-4 items-start">
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-display font-bold"
              style={{ background: `${tierColor}20`, color: tierColor }}
            >
              {(profile.display_name || profile.first_name || 'U')[0]}
            </div>
            <div className="flex-1">
              {editing ? (
                <input
                  className="input-field text-lg mb-1"
                  placeholder="Display name"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                />
              ) : (
                <h2 className="font-display font-bold text-white text-2xl">
                  {profile.display_name || profile.first_name}
                </h2>
              )}
              <p className="text-white/40 text-sm">{user?.email}</p>
              {profile.zodiac_sign && (
                <p className="text-white/30 text-xs mt-1">{profile.zodiac_sign} · Life path {profile.life_path_number}</p>
              )}
            </div>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Location</label>
                <input
                  className="input-field"
                  placeholder="City, State"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Bio</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="About you…"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                />
              </div>
              <button className="btn-primary w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <span className="flex items-center justify-center gap-2"><Save size={16} /> Save Changes</span>}
              </button>
            </div>
          ) : (
            profile.bio && (
              <p className="text-white/50 text-sm mt-4 leading-relaxed">{profile.bio}</p>
            )
          )}
        </motion.div>

        {/* Genesis OS scores */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-display font-semibold text-white mb-4">Genesis OS Profile</h3>

          <div className="grid grid-cols-2 gap-4">
            {profile.archetype_primary && (
              <div className="glass-card p-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Primary Archetype</div>
                <div className="text-white font-semibold font-display">{profile.archetype_primary}</div>
                {profile.archetype_secondary && (
                  <div className="text-white/40 text-xs mt-0.5">with {profile.archetype_secondary}</div>
                )}
              </div>
            )}

            {profile.shadow_pattern && (
              <div className="glass-card p-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Shadow Pattern</div>
                <div className="text-white font-semibold font-display">{profile.shadow_pattern}</div>
              </div>
            )}

            {profile.compatibility_score != null && (
              <div className="glass-card p-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">My Score</div>
                <div className="text-2xl font-display font-bold" style={{ color: tierColor }}>
                  {Math.round(profile.compatibility_score)}
                </div>
                <div className="text-xs text-white/30">/ 850</div>
              </div>
            )}

            {profile.tier && (
              <div className="glass-card p-4">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Tier</div>
                <div className="text-sm font-semibold" style={{ color: tierColor }}>{profile.tier}</div>
              </div>
            )}
          </div>

          {profile.readiness_score != null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Readiness Score</span>
                <span className="text-white/60">{Math.round(profile.readiness_score)} — {profile.readiness_forecast}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${profile.readiness_score}%`,
                    background: 'linear-gradient(90deg, #6B21A8, #EC4899)',
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Depth score */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-white">Depth Score™</h3>
              {depthLabel && (
                <p className="text-white/40 text-sm">{depthLabel.label} — {depthLabel.desc}</p>
              )}
            </div>
            <div className="text-3xl font-display font-bold text-brand-gold">{profile.depth_score}</div>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${profile.depth_score}%`,
                background: 'linear-gradient(90deg, #6B21A8, #F59E0B)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/20 mt-1">
            <span>Surface</span><span>Luminous</span>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/sanctuary" className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
            🧘 Visit Sanctuary
          </Link>
          <button
            onClick={logout}
            className="w-full py-3 text-white/30 hover:text-white/50 text-sm transition-colors text-center"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  )
}
