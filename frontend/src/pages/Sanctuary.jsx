import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

const LOVE_LANGUAGES = ['Words of Affirmation', 'Acts of Service', 'Receiving Gifts', 'Quality Time', 'Physical Touch']

export default function Sanctuary() {
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [newGoal, setNewGoal] = useState('')
  const [newMilestone, setNewMilestone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/sanctuary').then(({ data: d }) => {
      setData(d)
      setForm(d)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data: updated } = await api.patch('/sanctuary', form)
      setData(updated)
      setForm(updated)
      setEditing(false)
      toast.success('Sanctuary updated')
    } catch (_) {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const addGoal = () => {
    if (!newGoal.trim()) return
    const goals = [...(form.goals || []), { text: newGoal, done: false }]
    setForm((f) => ({ ...f, goals }))
    setNewGoal('')
  }

  const toggleGoal = (i) => {
    const goals = (form.goals || []).map((g, idx) => idx === i ? { ...g, done: !g.done } : g)
    setForm((f) => ({ ...f, goals }))
  }

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    const milestones = [...(form.milestones || []), { text: newMilestone, date: new Date().toISOString().split('T')[0] }]
    setForm((f) => ({ ...f, milestones }))
    setNewMilestone('')
  }

  if (!data) return <div className="min-h-screen bg-gradient-romantic pt-24 flex items-center justify-center text-white/30">Loading…</div>

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Sanctuary</h1>
            <p className="text-white/40 text-sm mt-1">Your sacred relationship space</p>
          </div>
          <button
            onClick={() => editing ? save() : setEditing(true)}
            disabled={saving}
            className="btn-primary text-sm"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Edit'}
          </button>
        </div>

        {/* Couple name & anniversary */}
        <motion.div className="card p-6 mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Couple name</label>
              {editing
                ? <input className="input" placeholder="e.g. Alex & Jordan" value={form.couple_name || ''} onChange={(e) => setForm((f) => ({ ...f, couple_name: e.target.value }))} />
                : <p className="text-white">{data.couple_name || <span className="text-white/25">Not set</span>}</p>
              }
            </div>
            <div>
              <label className="label">Anniversary</label>
              {editing
                ? <input className="input" type="date" value={form.anniversary || ''} onChange={(e) => setForm((f) => ({ ...f, anniversary: e.target.value }))} />
                : <p className="text-white">{data.anniversary || <span className="text-white/25">Not set</span>}</p>
              }
            </div>
          </div>
        </motion.div>

        {/* Love language */}
        <motion.div className="card p-6 mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <label className="label">Primary Love Language</label>
          {editing ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {LOVE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setForm((f) => ({ ...f, love_language: lang }))}
                  className={`px-3 py-2 rounded-xl text-sm border transition-all ${form.love_language === lang ? 'bg-purple-600/30 border-purple-500/60 text-white' : 'bg-dark-700/40 border-white/10 text-white/40 hover:border-white/20'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white mt-1">{data.love_language || <span className="text-white/25">Not set</span>}</p>
          )}
        </motion.div>

        {/* Goals */}
        <motion.div className="card p-6 mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold text-white mb-4">Relationship Goals</h3>
          <div className="space-y-2 mb-4">
            {(form.goals || []).map((goal, i) => (
              <div key={i} className="flex items-center gap-3">
                <button
                  onClick={() => editing && toggleGoal(i)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${goal.done ? 'bg-purple-500 border-purple-500' : 'border-white/20'}`}
                />
                <span className={`text-sm ${goal.done ? 'text-white/30 line-through' : 'text-white/70'}`}>{goal.text}</span>
              </div>
            ))}
            {(form.goals || []).length === 0 && <p className="text-white/25 text-sm">No goals yet.</p>}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Add a relationship goal…"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              />
              <button onClick={addGoal} className="btn-ghost text-sm px-4">Add</button>
            </div>
          )}
        </motion.div>

        {/* Milestones */}
        <motion.div className="card p-6 mb-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 className="font-semibold text-white mb-4">Milestones</h3>
          <div className="space-y-2 mb-4">
            {(form.milestones || []).map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white/70">✦ {m.text}</span>
                <span className="text-white/25">{m.date}</span>
              </div>
            ))}
            {(form.milestones || []).length === 0 && <p className="text-white/25 text-sm">No milestones yet.</p>}
          </div>
          {editing && (
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Add a milestone…"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
              />
              <button onClick={addMilestone} className="btn-ghost text-sm px-4">Add</button>
            </div>
          )}
        </motion.div>

        {/* Notes */}
        <motion.div className="card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-white mb-3">Private Notes</h3>
          {editing
            ? <textarea
                className="input min-h-[120px] resize-none"
                placeholder="Your private notes…"
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            : <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                {data.notes || <span className="text-white/25">No notes yet.</span>}
              </p>
          }
        </motion.div>
      </div>
    </div>
  )
}
