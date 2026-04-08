import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

const EVENT_ICONS = {
  account_created: '🎉', onboarding_completed: '📋', assessment_completed: '🧬',
  profile_photo_uploaded: '📷', bio_completed: '✏️', sanctuary_session_completed: '🏛️',
  relationship_created: '💜', mutual_match: '💜', first_message_sent: '💬',
  purchase_profile_badge_frame: '🎨', purchase_rs_code_flourish: '✨',
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [badges, setBadges] = useState([])
  const [allBadges, setAllBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/wallet/summary').catch(() => ({ data: null })),
      api.get('/badges/my').catch(() => ({ data: [] })),
      api.get('/badges/all').catch(() => ({ data: [] })),
    ]).then(([wRes, bRes, aRes]) => {
      setWallet(wRes.data)
      setBadges(bRes.data || [])
      setAllBadges(aRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSpend = async (sku, cost) => {
    try {
      const { data } = await api.post(`/wallet/spend?sku=${sku}`)
      setWallet(w => w ? { ...w, balance: data.new_balance } : w)
      toast.success(`Purchased ${sku.replace(/_/g, ' ')}!`)
    } catch (err) { toast.error(err.response?.data?.detail || 'Purchase failed') }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-romantic pt-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-romantic pt-14 sm:pt-16 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white py-5">Wallet</h1>

        {/* Balance card */}
        <motion.div className="card p-6 sm:p-8 mb-6 text-center bg-gradient-to-br from-gold-500/10 to-purple-600/10 border-gold-500/20"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-gold-400 text-xs font-medium uppercase tracking-widest mb-2">RS Coins</div>
          <div className="text-gold-400 text-5xl sm:text-6xl font-display font-black">{wallet?.balance || 0}</div>
          <div className="text-white/30 text-xs mt-2">Lifetime earned: {wallet?.lifetime_earned || 0}</div>
        </motion.div>

        {/* Badges */}
        <div className="mb-6">
          <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Your Badges</h2>
          {badges.length === 0 ? (
            <div className="card p-6 text-center text-white/30 text-sm">No badges yet. Complete actions to earn them!</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {badges.map(b => (
                <motion.div key={b.badge_key} className="card p-3 text-center" title={`${b.name}: ${b.description}`}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <div className="text-white/60 text-[9px] leading-tight">{b.name}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* All badges (locked + unlocked) */}
        <div className="mb-6">
          <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">All Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allBadges.map(b => (
              <div key={b.badge_key} className={`card p-3 flex items-center gap-3 ${b.owned ? 'border-purple-500/30' : 'opacity-40'}`}>
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="text-white text-xs font-semibold">{b.name}</div>
                  <div className="text-white/30 text-[10px]">{b.description}</div>
                </div>
                {b.owned && <span className="text-green-400 text-xs ml-auto">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Earn more */}
        {wallet?.earn_events && (
          <div className="mb-6">
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Earn Coins</h2>
            <div className="card divide-y divide-white/5">
              {Object.entries(wallet.earn_events).map(([event, amount]) => (
                <div key={event} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{EVENT_ICONS[event] || '🪙'}</span>
                    <span className="text-white/60 text-xs capitalize">{event.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-gold-400 text-xs font-bold">+{amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop */}
        {wallet?.spend_skus && (
          <div className="mb-6">
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Shop</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(wallet.spend_skus).map(([sku, cost]) => (
                <div key={sku} className="card p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="text-white text-xs font-semibold capitalize mb-1">{sku.replace(/_/g, ' ')}</div>
                  <div className="text-gold-400 text-sm font-bold mb-2">{cost} coins</div>
                  <button onClick={() => handleSpend(sku, cost)} style={{ cursor: 'pointer' }}
                    className="btn-primary text-xs py-1.5 px-3 w-full"
                    disabled={!wallet || wallet.balance < cost}>
                    {wallet && wallet.balance >= cost ? 'Buy' : 'Not enough'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        {wallet?.transactions?.length > 0 && (
          <div>
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-3">Recent Activity</h2>
            <div className="card divide-y divide-white/5">
              {wallet.transactions.map(tx => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{EVENT_ICONS[tx.event] || '🪙'}</span>
                    <div>
                      <span className="text-white/60 text-xs capitalize">{(tx.event || tx.type || '').replace(/_/g, ' ')}</span>
                      <div className="text-white/20 text-[10px]">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${tx.direction === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.direction === 'credit' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
