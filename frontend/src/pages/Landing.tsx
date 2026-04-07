import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Star, Zap, Shield, ChevronRight } from 'lucide-react'

const TIER_EXAMPLES = [
  { score: 812, tier: 'Soul-aligned match', color: '#F59E0B' },
  { score: 724, tier: 'Strong potential',   color: '#9333EA' },
  { score: 671, tier: 'Healthy but growing', color: '#22C55E' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Genesis OS Scoring',
    desc: '60 psychometric questions map your emotional archetype, shadow patterns, and relational readiness on a 350–850 scale.',
  },
  {
    icon: Star,
    title: 'Cosmic Overlay',
    desc: 'Zodiac and numerology dimensions refine your compatibility score with a proprietary cosmic overlay algorithm.',
  },
  {
    icon: Shield,
    title: 'Sanctuary Space',
    desc: 'A private emotional space for stillness, mirroring, and reflection — your safety zone within the app.',
  },
  {
    icon: Heart,
    title: '6 Compatibility Tiers',
    desc: 'From Soul-aligned match to Red flag zone — your score is contextualised with depth, not just a number.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0A2E] via-[#0F0F0F] to-[#0F0F0F] font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">RS</span>
          </div>
          <span className="font-display font-semibold text-white">Relationship Scores</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-8">
            <Zap size={14} className="text-brand-gold" />
            Powered by Genesis OS™ Emotional Intelligence
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Your Compatibility<br />
            <span className="gradient-text">Score Awaits</span>
          </h1>

          <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Not just a quiz. A 60-question psychometric journey that builds your emotional blueprint — archetypes, shadow patterns, readiness, and cosmic alignment — all in one transformative number.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg py-4 px-8 flex items-center justify-center gap-2">
              Discover Your Score <ChevronRight size={18} />
            </Link>
            <Link to="/login" className="btn-ghost text-lg py-4 px-8">
              I have an account
            </Link>
          </div>
        </motion.div>

        {/* Score preview cards */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {TIER_EXAMPLES.map((ex, i) => (
            <motion.div
              key={ex.tier}
              className="glass-card px-6 py-5 flex-1 max-w-[200px] mx-auto sm:mx-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              style={{ borderColor: `${ex.color}40` }}
            >
              <div
                className="text-4xl font-display font-bold mb-1"
                style={{ color: ex.color }}
              >
                {ex.score}
              </div>
              <div className="text-xs text-white/50 uppercase tracking-wider">{ex.tier}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Built Different
          </h2>
          <p className="text-white/50 text-lg">Genesis OS processes 12 emotional dimensions to surface what other apps miss.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-pink/30 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-brand-purple-lt" />
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass-card p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(107,33,168,0.2), rgba(236,72,153,0.2))' }}>
          <div className="absolute inset-0 bg-gradient-brand opacity-5 rounded-2xl" />
          <h2 className="font-display text-4xl font-bold text-white mb-4 relative">
            Ready to Find Your Match?
          </h2>
          <p className="text-white/60 mb-8 relative">
            60 questions. Your emotional blueprint. Matches that actually make sense.
          </p>
          <Link to="/register" className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-2 relative">
            Start Your Journey <Heart size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-white/30 text-sm">
        © 2026 Relationship Scores. Powered by Genesis OS™.
        <br />
        <span className="text-xs">Scores are emotional signals, not diagnoses. Your worth is not a number.</span>
      </footer>
    </div>
  )
}
