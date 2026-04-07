import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

const LOVE_LANGUAGES = ['Words of Affirmation', 'Acts of Service', 'Receiving Gifts', 'Quality Time', 'Physical Touch']
const EMOTIONS = ['Grateful', 'Calm', 'Anxious', 'Hopeful', 'Frustrated', 'Happy', 'Drained', 'Excited']

export default function Sanctuary() {
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [newReflection, setNewReflection] = useState('')
  const [newPersonalGoal, setNewPersonalGoal] = useState('')

  const inRelationship = profile?.relationship_state === 'in_relationship'

  useEffect(() => {
    Promise.all([
      api.get('/sanctuary'),
      api.get('/profiles/me'),
    ]).then(([sRes, pRes]) => {
      setData(sRes.data)
      setForm(sRes.data)
      setProfile(pRes.data)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data: updated } = await api.patch('/sanctuary', form)
      setData(updated); setForm(updated); setEditing(false)
      toast.success('Sanctuary updated')
    } catch (_) { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const addPersonalGoal = () => {
    if (!newPersonalGoal.trim()) return
    const goals = [...(form.personal_goals || []), { text: newPersonalGoal, done: false }]
    setForm((f) => ({ ...f, personal_goals: goals }))
    setNewPersonalGoal('')
  }

  const addReflection = () => {
    if (!newReflection.trim()) return
    const reflections = [...(form.personal_reflections || []), { text: newReflection, date: new Date().toISOString().split('T')[0] }]
    setForm((f) => ({ ...f, personal_reflections: reflections }))
    setNewReflection('')
  }

  const setEmotion = (emotion) => setForm((f) => ({ ...f, emotional_state: emotion }))

  if (!data) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30 text-sm">Loading…</div>

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Sanctuary</h1>
            <p className="text-white/40 text-xs sm:text-sm mt-1">Your sacred personal space</p>
          </div>
          <button onClick={() => editing ? save() : setEditing(true)} disabled={saving}
            className="btn-primary text-sm min-h-[44px] px-4">
            {saving ? 'Saving…' : editing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Couple features locked message */}
        {!inRelationship && (
          <div className="card p-4 sm:p-5 mb-5 border-white/5 bg-dark-700/30 flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-white/50 text-sm font-medium">Couple features unlock when you enter relationship mode</p>
              <p className="text-white/25 text-xs mt-0.5">Set your relationship state to "in_relationship" in your profile</p>
            </div>
          </div>
        )}

        {/* Emotional State Tracker */}
        <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold text-white mb-3">How are you feeling?</h3>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button key={e} onClick={() => editing && setEmotion(e)}
                className={`px-3 py-2 rounded-xl text-sm border transition-all min-h-[36px] ${
                  (form.emotional_state || data.emotional_state) === e
                    ? 'bg-purple-600/30 border-purple-500/60 text-white'
                    : 'bg-dark-700/40 border-white/10 text-white/40 hover:border-white/20'
                }`}>{e}</button>
            ))}
          </div>
        </motion.div>

        {/* Personal Reflections Journal */}
        <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h3 className="font-semibold text-white mb-3">Private Reflections</h3>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {(form.personal_reflections || []).map((r, i) => (
              <div key={i} className="text-sm bg-dark-700/30 p-3 rounded-lg">
                <p className="text-white/60">{r.text}</p>
                <span className="text-white/20 text-xs">{r.date}</span>
              </div>
            ))}
            {!(form.personal_reflections || []).length && <p className="text-white/25 text-sm">No reflections yet.</p>}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input className="input text-sm flex-1 min-h-[44px]" placeholder="Write a reflection…" value={newReflection}
                onChange={(e) => setNewReflection(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addReflection()} />
              <button onClick={addReflection} className="btn-ghost text-sm px-3 min-h-[44px]">Add</button>
            </div>
          )}
        </motion.div>

        {/* Personal Goals */}
        <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold text-white mb-3">Personal Goals</h3>
          <div className="space-y-2 mb-3">
            {(form.personal_goals || []).map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <button onClick={() => editing && setForm((f) => ({
                  ...f, personal_goals: (f.personal_goals || []).map((x, j) => j === i ? { ...x, done: !x.done } : x)
                }))} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all min-w-[20px] ${g.done ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`} />
                <span className={`text-sm ${g.done ? 'text-white/30 line-through' : 'text-white/70'}`}>{g.text}</span>
              </div>
            ))}
            {!(form.personal_goals || []).length && <p className="text-white/25 text-sm">No goals yet.</p>}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input className="input text-sm flex-1 min-h-[44px]" placeholder="Add a personal goal…" value={newPersonalGoal}
                onChange={(e) => setNewPersonalGoal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPersonalGoal()} />
              <button onClick={addPersonalGoal} className="btn-ghost text-sm px-3 min-h-[44px]">Add</button>
            </div>
          )}
        </motion.div>

        {/* ── Couple features (only if in_relationship) ────────────────────── */}
        {inRelationship && (
          <>
            <div className="border-t border-white/5 my-5 sm:my-6" />
            <h2 className="text-white/60 text-xs uppercase tracking-widest mb-4">Couple Space</h2>

            {/* Couple name & anniversary */}
            <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Couple name</label>
                  {editing
                    ? <input className="input text-sm min-h-[44px]" value={form.couple_name || ''} onChange={(e) => setForm((f) => ({ ...f, couple_name: e.target.value }))} />
                    : <p className="text-white">{data.couple_name || <span className="text-white/25">Not set</span>}</p>}
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Anniversary</label>
                  {editing
                    ? <input className="input text-sm min-h-[44px]" type="date" value={form.anniversary || ''} onChange={(e) => setForm((f) => ({ ...f, anniversary: e.target.value }))} />
                    : <p className="text-white">{data.anniversary || <span className="text-white/25">Not set</span>}</p>}
                </div>
              </div>
            </motion.div>

            {/* Love language */}
            <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <label className="text-white/40 text-xs mb-2 block">Love Language</label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {LOVE_LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => setForm((f) => ({ ...f, love_language: lang }))}
                      className={`px-3 py-2 rounded-xl text-sm border transition-all min-h-[36px] ${form.love_language === lang ? 'bg-purple-600/30 border-purple-500/60 text-white' : 'bg-dark-700/40 border-white/10 text-white/40'}`}>
                      {lang}
                    </button>
                  ))}
                </div>
              ) : <p className="text-white">{data.love_language || <span className="text-white/25">Not set</span>}</p>}
            </motion.div>

            {/* Shared goals */}
            <motion.div className="card p-5 sm:p-6 mb-4 sm:mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="font-semibold text-white mb-3">Relationship Goals</h3>
              <div className="space-y-2 mb-3">
                {(form.goals || []).map((g, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button onClick={() => editing && setForm((f) => ({
                      ...f, goals: (f.goals || []).map((x, j) => j === i ? { ...x, done: !x.done } : x)
                    }))} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 min-w-[20px] ${g.done ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`} />
                    <span className={`text-sm ${g.done ? 'text-white/30 line-through' : 'text-white/70'}`}>{g.text}</span>
                  </div>
                ))}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <input className="input text-sm flex-1 min-h-[44px]" placeholder="Add a goal…" value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newGoal.trim()) { setForm((f) => ({ ...f, goals: [...(f.goals || []), { text: newGoal, done: false }] })); setNewGoal('') }}} />
                  <button onClick={() => { if (newGoal.trim()) { setForm((f) => ({ ...f, goals: [...(f.goals || []), { text: newGoal, done: false }] })); setNewGoal('') }}} className="btn-ghost text-sm px-3 min-h-[44px]">Add</button>
                </div>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div className="card p-5 sm:p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h3 className="font-semibold text-white mb-3">Private Notes</h3>
              {editing
                ? <textarea className="input min-h-[100px] resize-none text-sm" value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                : <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{data.notes || <span className="text-white/25">No notes yet.</span>}</p>}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
