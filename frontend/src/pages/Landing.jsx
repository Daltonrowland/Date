import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const TIERS = [
  { score: '750–850', name: 'Soul-Aligned',     emoji: '💜', color: 'text-purple-300' },
  { score: '650–749', name: 'Deep Connection',  emoji: '💗', color: 'text-pink-300' },
  { score: '550–649', name: 'Strong Potential', emoji: '✨', color: 'text-purple-400' },
  { score: '450–549', name: 'Building Ground',  emoji: '🌱', color: 'text-green-400' },
  { score: '400–449', name: 'Friction Zone',    emoji: '⚡', color: 'text-yellow-300' },
  { score: '350–399', name: 'Red Flag Zone',    emoji: '🚩', color: 'text-red-400' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-romantic">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -left-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <span className="font-display font-bold text-xl text-white">
          Relationship <span className="text-purple-400">Scores</span>
        </span>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-32 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-purple-400 font-medium tracking-widest text-sm uppercase mb-6">
            The Compatibility System
          </p>
          <h1 className="font-display text-6xl md:text-7xl font-bold leading-tight text-white mb-6">
            Know your score<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-purple-600">
              before you fall.
            </span>
          </h1>
          <p className="text-white/55 text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            A 60-question deep-dive into your attachment style, values, love languages, and conflict patterns
            — scored on a 350 to 850 scale across six compatibility tiers.
          </p>
          <Link to="/register" className="btn-primary text-base px-10 py-4">
            Discover your compatibility →
          </Link>
        </motion.div>

        {/* Floating score pill */}
        <motion.div
          className="mt-16 inline-flex items-center gap-3 bg-dark-800/60 border border-white/10 rounded-full px-6 py-3 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="w-8 h-8 rounded-full score-gradient flex items-center justify-center text-white font-bold text-sm">
            ✦
          </div>
          <span className="text-white/70 text-sm">Your compatibility score: <span className="text-purple-300 font-semibold">792 · Soul-Aligned 💜</span></span>
        </motion.div>
      </section>

      {/* Tiers */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          className="font-display text-3xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          Six tiers of connection
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              className="card p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="text-3xl mb-2">{t.emoji}</div>
              <div className={`font-display font-semibold ${t.color} mb-1`}>{t.name}</div>
              <div className="text-white/30 text-sm">{t.score}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <h2 className="font-display text-3xl font-bold text-center text-white mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Take the quiz', body: '60 questions across attachment, values, love languages, communication, lifestyle, and conflict resolution.' },
            { step: '02', title: 'Get your score', body: 'Your compatibility score (350–850) is calculated instantly with a full category breakdown and archetype profile.' },
            { step: '03', title: 'Find your match', body: 'Browse matches ranked by compatibility and explore your Sanctuary space to deepen existing bonds.' },
          ].map((item) => (
            <div key={item.step} className="card p-6">
              <div className="text-purple-500/60 font-mono text-sm mb-3">{item.step}</div>
              <h3 className="font-display font-semibold text-white text-xl mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center px-6 pb-32">
        <div className="card max-w-xl mx-auto p-10 bg-gradient-to-br from-purple-900/30 to-pink-900/20">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to know your number?</h2>
          <p className="text-white/50 mb-8">Join thousands of people who understand their relationship patterns.</p>
          <Link to="/register" className="btn-primary">Start your compatibility journey</Link>
        </div>
      </section>
    </div>
  )
}
