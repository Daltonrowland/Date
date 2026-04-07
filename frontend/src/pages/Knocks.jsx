import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'
import useAuthStore from '../store/authStore'

export default function Knocks() {
  const user = useAuthStore((s) => s.user)
  const [knocks, setKnocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/knocks').then(({ data }) => setKnocks(data)).finally(() => setLoading(false))
  }, [])

  const respond = async (knockId, action) => {
    try {
      await api.patch(`/knocks/${knockId}`, { action })
      setKnocks((prev) => prev.map((k) => k.id === knockId ? { ...k, status: action === 'accept' ? 'accepted' : 'declined' } : k))
      toast.success(action === 'accept' ? 'Knock accepted! You can now message each other.' : 'Knock declined.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    }
  }

  const incoming = knocks.filter((k) => k.recipient_id === user?.id && k.status === 'pending')
  const outgoing = knocks.filter((k) => k.sender_id === user?.id)
  const history = knocks.filter((k) => k.recipient_id === user?.id && k.status !== 'pending')

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Knocks</h1>
        <p className="text-white/40 text-sm mb-8">Connection requests from matches below 550 compatibility</p>

        {loading ? (
          <div className="text-white/30 text-center py-16">Loading…</div>
        ) : (
          <>
            {/* Incoming */}
            {incoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Incoming Knocks</h2>
                <div className="space-y-3">
                  {incoming.map((k) => (
                    <motion.div key={k.id} className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="flex items-center gap-4">
                        {k.sender_photo ? (
                          <img src={k.sender_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-lg font-bold text-white">
                            {k.sender_name?.[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-white font-semibold">{k.sender_name}</div>
                          <div className="text-white/30 text-xs font-mono">{k.sender_rs_code}</div>
                          {k.sender_score && <div className="text-purple-300 text-xs mt-0.5">Score: {Math.round(k.sender_score)}</div>}
                          {k.message && <p className="text-white/50 text-sm mt-2 italic">"{k.message}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respond(k.id, 'decline')} className="btn-ghost text-sm py-2 px-3">Decline</button>
                          <button onClick={() => respond(k.id, 'accept')} className="btn-primary text-sm py-2 px-3">Accept</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing */}
            {outgoing.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Your Sent Knocks</h2>
                <div className="space-y-2">
                  {outgoing.map((k) => (
                    <div key={k.id} className="card p-4 flex items-center justify-between">
                      <span className="text-white text-sm">{k.sender_name || 'User'}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        k.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        k.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{k.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div>
                <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Past Knocks</h2>
                <div className="space-y-2">
                  {history.map((k) => (
                    <div key={k.id} className="card p-4 flex items-center justify-between">
                      <span className="text-white text-sm">{k.sender_name}</span>
                      <span className={`text-xs ${k.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>{k.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {knocks.length === 0 && (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">🚪</div>
                <h3 className="font-display text-white font-semibold mb-1">No knocks yet</h3>
                <p className="text-white/40 text-sm">Knocks appear when someone with a sub-550 score wants to connect.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
