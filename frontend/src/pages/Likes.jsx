import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import useAuthStore from '../store/authStore'

function Spinner() {
  return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
}

function UserCard({ user, isMutual, showHeart = false }) {
  return (
    <Link to={`/profile/${user.user_id || user.id}`}>
      <motion.div className={`card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform ${isMutual ? 'border-gold-500/30 bg-gold-500/5' : ''}`}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {(user.profile_photo || user.photo_url) ? (
          <img src={user.profile_photo || user.photo_url} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm truncate">{user.name}</span>
            {isMutual && <span className="px-1.5 py-0.5 rounded text-xs bg-gold-500/20 text-gold-400 font-bold">MATCH</span>}
            {showHeart && <span className="text-purple-400">♥</span>}
          </div>
          <p className="text-white/40 text-xs">{user.age && `${user.age} · `}{user.archetype || ''}</p>
          {user.score && <p className="text-purple-300 text-xs mt-0.5">Score: {Math.round(user.score)}</p>}
        </div>
      </motion.div>
    </Link>
  )
}

export default function Likes() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState('sent')
  const [sentLikes, setSentLikes] = useState([])
  const [receivedLikes, setReceivedLikes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Get my likes (who I liked)
        const { data: myLikes } = await api.get('/likes')
        const sentIds = myLikes.map(l => l.liked_id)

        // Get who liked me
        const { data: likedMe } = await api.get('/likes/who-liked-me')
        const receivedIds = likedMe.map(l => l.user_id)

        // Get mutual
        const { data: mutuals } = await api.get('/likes/mutual')
        const mutualIds = new Set(mutuals.map(m => m.liker_id))

        // Fetch profiles for sent likes
        const sentProfiles = []
        for (const id of sentIds) {
          try {
            const { data: match } = await api.get(`/matches/${id}`)
            sentProfiles.push({ ...match, isMutual: mutualIds.has(id) || receivedIds.includes(id) })
          } catch (_) {
            try {
              const { data: prof } = await api.get(`/profiles/${id}`)
              sentProfiles.push({ ...prof, user_id: id, isMutual: mutualIds.has(id) || receivedIds.includes(id) })
            } catch (__) {}
          }
        }
        setSentLikes(sentProfiles)

        // Fetch profiles for received likes
        const recProfiles = []
        for (const id of receivedIds) {
          try {
            const { data: match } = await api.get(`/matches/${id}`)
            recProfiles.push({ ...match, isMutual: sentIds.includes(id) })
          } catch (_) {
            try {
              const { data: prof } = await api.get(`/profiles/${id}`)
              recProfiles.push({ ...prof, user_id: id, isMutual: sentIds.includes(id) })
            } catch (__) {}
          }
        }
        setReceivedLikes(recProfiles)
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">Likes</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('sent')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[40px] ${tab === 'sent' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'}`}>
            People I Like ({sentLikes.length})
          </button>
          <button onClick={() => setTab('received')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[40px] ${tab === 'received' ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/40'}`}>
            People Who Like Me ({receivedLikes.length})
          </button>
        </div>

        {loading ? <Spinner /> : (
          <div className="space-y-3">
            {tab === 'sent' && (
              sentLikes.length === 0 ? (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-3">💜</div>
                  <h3 className="font-display text-white font-semibold mb-1">No likes yet</h3>
                  <p className="text-white/40 text-sm">Like someone from the matches page to see them here.</p>
                </div>
              ) : sentLikes.map((u, i) => (
                <UserCard key={u.user_id || i} user={u} isMutual={u.isMutual} showHeart />
              ))
            )}
            {tab === 'received' && (
              receivedLikes.length === 0 ? (
                <div className="card p-8 text-center">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-display text-white font-semibold mb-1">No one has liked you yet</h3>
                  <p className="text-white/40 text-sm">Complete your profile to attract more likes.</p>
                </div>
              ) : receivedLikes.map((u, i) => (
                <UserCard key={u.user_id || i} user={u} isMutual={u.isMutual} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
