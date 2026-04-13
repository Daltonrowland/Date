import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-romantic pt-14 sm:pt-16 pb-16 px-4">
      <div className="max-w-3xl mx-auto py-8">
        <Link to="/" className="text-purple-400 text-sm hover:text-purple-300 mb-6 inline-block">← Back to app</Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account on Relationship Scores, you agree to these Terms of Service, our Privacy Policy, and all applicable laws. If you do not agree to these terms, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">2. Eligibility</h2>
            <p>You must be at least 18 years old to use Relationship Scores. By creating an account, you represent and warrant that you are at least 18 years of age and have the legal capacity to enter into this agreement.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">3. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate and complete information when creating your account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You may not create multiple accounts or use another person's identity.</li>
              <li>Your RS Code is a unique identifier assigned to you and cannot be transferred.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">4. Compatibility Scoring</h2>
            <p>Relationship Scores uses the Genesis OS compatibility engine to compute scores between users. Important disclaimers:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compatibility scores (350–850) are emotional signals based on self-reported assessment data, not guarantees of relationship success.</li>
              <li>Scores are deterministic and workbook-aligned — no AI modifies the scoring baselines.</li>
              <li>Your score does not define your worth as a person.</li>
              <li>Archetype and shadow type classifications are reflective tools, not clinical diagnoses.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">5. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harass, threaten, or abuse other users</li>
              <li>Post false, misleading, or deceptive profile information</li>
              <li>Use the App for commercial purposes or solicitation</li>
              <li>Attempt to manipulate compatibility scores or exploit the scoring system</li>
              <li>Share other users' private information, assessment data, or internal scores</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Use automated systems to interact with the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">6. In-App Currency (RS Coins)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>RS Coins are a virtual currency used within Relationship Scores.</li>
              <li>Coins can be earned through app engagement or purchased with real money.</li>
              <li>Coins have no real-world monetary value and cannot be exchanged for cash.</li>
              <li>Coins are non-transferable between users.</li>
              <li>Coins and badges never affect compatibility scores, readiness scores, rank eligibility, or matching.</li>
              <li>We reserve the right to modify coin values and earn/spend rates.</li>
              <li>Purchased coins are non-refundable except where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">7. Privacy and Calibration</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Calibration feedback you provide about conversations is private and never shown to the other user.</li>
              <li>Sanctuary reflections, emotional state entries, and personal goals are private to you.</li>
              <li>Internal risk flags and shadow severity scores are never exposed to other users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">8. Reporting and Safety</h2>
            <p>If you encounter harassment, fake profiles, or unsafe behavior, use the Report function on any profile. We review all reports and may take action including account suspension or termination. If you feel unsafe, use the Block function to immediately remove that user from your experience.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">9. Intellectual Property</h2>
            <p>The Genesis OS scoring engine, archetype system, shadow detection framework, RS Code system, and all associated intellectual property are owned by Relationship Scores. You may not copy, modify, reverse-engineer, or redistribute any part of our scoring system or technology.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">10. Termination</h2>
            <p>We may suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time through the app or by contacting us. Upon deletion, your data will be removed in accordance with our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">11. Disclaimers</h2>
            <p>Relationship Scores is provided "as is" without warranties of any kind. We do not guarantee that you will find a compatible partner, that all users are genuine, or that scores are predictive of relationship outcomes. Use the App at your own discretion.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">12. Contact</h2>
            <p>For questions about these Terms, contact us at: <strong className="text-white">legal@relationshipscores.app</strong></p>
          </section>
        </div>
      </div>
    </div>
  )
}
