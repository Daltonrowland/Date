import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

export default function Search() {
  const [rsCode, setRsCode] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const searchByCode = async () => {
    if (rsCode.length !== 6) return
    setSearching(true)
    try {
      const { data } = await api.get(`/users/lookup/${rsCode.toUpperCase()}`)
      setResults([data])
    } catch (_) {
      setResults([])
      toast.error('No user found with that RS Code')
    } finally { setSearching(false) }
  }

  const searchByName = async () => {
    if (!nameQuery.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(nameQuery)}`)
      setResults(data)
      if (!data.length) toast('No results found')
    } catch (_) { setResults([]) }
    finally { setSearching(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6">Search</h1>

        {/* RS Code search */}
        <div className="card p-5 mb-4">
          <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">RS Code Lookup</label>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm font-mono uppercase tracking-widest min-h-[44px]"
              placeholder="6-CHAR CODE" maxLength={6} value={rsCode}
              onChange={(e) => setRsCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && searchByCode()} />
            <button onClick={searchByCode} disabled={rsCode.length !== 6 || searching}
              className="btn-primary text-sm px-4 min-h-[44px]">Search</button>
          </div>
        </div>

        {/* Name search */}
        <div className="card p-5 mb-6">
          <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Name Search</label>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm min-h-[44px]" placeholder="Search by name…" value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByName()} />
            <button onClick={searchByName} disabled={!nameQuery.trim() || searching}
              className="btn-primary text-sm px-4 min-h-[44px]">Search</button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((u) => (
              <motion.div key={u.id} className="card p-4 flex items-center gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {u.profile_photo ? (
                  <img src={u.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                    {u.name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{u.name}</div>
                  <div className="text-white/30 text-xs">
                    {u.age && `${u.age} · `}{u.archetype}{u.sun_sign && ` · ${u.sun_sign}`}
                  </div>
                  <div className="text-purple-300 text-xs font-mono">{u.rs_code}</div>
                </div>
                <Link to={`/profile/${u.id}`} className="btn-primary text-xs py-2 px-3 min-h-[36px]">View</Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
