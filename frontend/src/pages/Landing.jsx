import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const TIERS = [
  { score: '750–850', name: 'Soul-Aligned', emoji: '💜', color: 'text-purple-300', bg: 'from-purple-600/20 to-purple-900/20 border-purple-500/30' },
  { score: '650–749', name: 'Strong Potential', emoji: '✨', color: 'text-purple-400', bg: 'from-purple-700/20 to-dark-800/20 border-purple-600/20' },
  { score: '550–649', name: 'Healthy & Growing', emoji: '🌿', color: 'text-green-400', bg: 'from-green-900/20 to-dark-800/20 border-green-700/20' },
  { score: '450–549', name: 'Magnetic but Risky', emoji: '🔥', color: 'text-pink-300', bg: 'from-pink-600/20 to-pink-900/20 border-pink-500/30' },
  { score: '400–449', name: 'Possible but Unstable', emoji: '⚡', color: 'text-yellow-300', bg: 'from-yellow-900/20 to-dark-800/20 border-yellow-700/20' },
  { score: '350–399', name: 'Red Flag Zone', emoji: '🚩', color: 'text-red-400', bg: 'from-red-900/20 to-dark-800/20 border-red-800/20' },
]

const FEATURES = [
  { icon: '🧬', title: 'RS Code Identity', desc: 'Every user gets a unique 6-character RS Code — your private identity across the platform.' },
  { icon: '⚡', title: 'Genesis OS Scoring', desc: '48,205 pre-computed answer pairs power a 350–850 compatibility score across 13 dimensions.' },
  { icon: '🚪', title: 'The Knock System', desc: "Scores below 550 require a Knock before messaging — protecting both people's emotional bandwidth." },
  { icon: '🏛️', title: 'Sanctuary Mode', desc: 'A private emotional space for reflection, goal-setting, and relationship tools when you are ready.' },
]

const TESTIMONIALS = [
  { name: 'Priya M.', age: 28, text: "The score breakdown actually explained why my last three relationships failed. I've never felt so understood by an app.", tier: 'Soul-Aligned' },
  { name: 'Marcus J.', age: 32, text: "The Knock system changed everything. No more wasted conversations with people who aren't ready for what I want.", tier: 'Strong Potential' },
  { name: 'Sofia R.', age: 29, text: "My archetype profile was scary accurate. The Sanctuary tools helped me process things I'd been avoiding for years.", tier: 'Healthy & Growing' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-romantic">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -left-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 max-w-6xl mx-auto">
        <span className="font-display font-bold text-lg sm:text-xl text-white">
          Relationship <span className="text-purple-400">Scores</span>
        </span>
        <div className="flex gap-2 sm:gap-3">
          <Link to="/login" className="btn-ghost text-xs sm:text-sm py-2 px-3 sm:px-4">Sign in</Link>
          <Link to="/register" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="text-purple-400 font-medium tracking-widest text-xs sm:text-sm uppercase mb-4 sm:mb-6">Powered by Genesis OS™</p>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-tight text-white mb-4 sm:mb-6">
            Know your score<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-purple-600">before you fall.</span>
          </h1>
          <p className="text-white/50 text-base sm:text-xl leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-10">
            A 60-question psychometric deep-dive into attachment, values, communication, and chemistry — scored on a 350 to 850 scale with 10 archetypes and 6 shadow types.
          </p>
          <Link to="/register" className="btn-primary text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-4 inline-block">
            Discover your compatibility →
          </Link>
        </motion.div>

        {/* Score preview */}
        <motion.div className="mt-10 sm:mt-16 inline-flex items-center gap-3 bg-dark-800/60 border border-white/10 rounded-full px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
          <div className="w-8 h-8 rounded-full score-gradient flex items-center justify-center text-white font-bold text-sm">✦</div>
          <span className="text-white/70 text-xs sm:text-sm">Your compatibility score: <span className="text-purple-300 font-semibold">792 · Soul-Aligned 💜</span></span>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-white mb-8 sm:mb-12"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          Built different
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="card p-5 sm:p-6"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-white text-base sm:text-lg mb-1">{f.title}</h3>
              <p className="text-white/40 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-white mb-8 sm:mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { step: '01', title: 'Create your profile', body: 'Sign up, get your RS Code, and set up your cosmic profile with zodiac and numerology.' },
            { step: '02', title: 'Take the assessment', body: '60 questions across 13 dimensions — archetypes, shadows, polarity, readiness, and more.' },
            { step: '03', title: 'Discover matches', body: 'Browse compatibility scores, like profiles, send Knocks, and start meaningful conversations.' },
          ].map((item) => (
            <div key={item.step} className="card p-5 sm:p-6">
              <div className="text-purple-500/60 font-mono text-sm mb-3">{item.step}</div>
              <h3 className="font-display font-semibold text-white text-base sm:text-xl mb-2">{item.title}</h3>
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-white mb-8 sm:mb-12">Six tiers of connection</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {TIERS.map((t, i) => (
            <motion.div key={t.name} className={`card bg-gradient-to-br ${t.bg} p-4 sm:p-5 text-center`}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <div className="text-2xl sm:text-3xl mb-2">{t.emoji}</div>
              <div className={`font-display font-semibold ${t.color} text-xs sm:text-sm mb-1`}>{t.name}</div>
              <div className="text-white/30 text-xs">{t.score}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center text-white mb-8 sm:mb-12">What people are saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-5 sm:p-6">
              <p className="text-white/60 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">{t.name}, {t.age}</div>
                  <div className="text-purple-400 text-xs">{t.tier}</div>
                </div>
                <div className="text-yellow-400 text-xs">★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center px-4 sm:px-6 pb-16 sm:pb-32">
        <div className="card max-w-xl mx-auto p-8 sm:p-10 bg-gradient-to-br from-purple-900/30 to-pink-900/20">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to know your number?</h2>
          <p className="text-white/50 text-sm mb-6 sm:mb-8">Join thousands discovering their relationship patterns through science and self-awareness.</p>
          <Link to="/register" className="btn-primary text-sm sm:text-base px-8">Start your journey →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-4 sm:px-6 py-6 sm:py-8 text-center">
        <p className="text-white/20 text-xs">© 2026 Relationship Scores. Powered by Genesis OS™. Scoring is deterministic and workbook-aligned.</p>
      </footer>
    </div>
  )
}
