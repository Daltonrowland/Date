import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-romantic pt-14 sm:pt-16 pb-16 px-4">
      <div className="max-w-3xl mx-auto py-8">
        <Link to="/" className="text-purple-400 text-sm hover:text-purple-300 mb-6 inline-block">← Back to app</Link>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-8">Last updated: April 2026</p>

        <div className="prose-dark space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">1. Introduction</h2>
            <p>Relationship Scores ("we," "our," or "the App") is a compatibility-focused dating platform powered by the Genesis OS emotional intelligence engine. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our services.</p>
            <p>By creating an account or using Relationship Scores, you agree to the collection and use of information as described in this policy.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">2. Information We Collect</h2>
            <h3 className="text-white/80 font-semibold mt-3 mb-1">Account Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address (for account authentication and communication)</li>
              <li>Display name, age, gender, and dating preferences</li>
              <li>Date of birth (used to calculate numerology life path number)</li>
              <li>Zodiac sun sign (used for cosmic compatibility overlay)</li>
              <li>Location (city and state, entered manually — we do not track GPS)</li>
              <li>Profile photos (stored as base64 encoded data)</li>
              <li>Bio, occupation, education, height, and dating status</li>
            </ul>

            <h3 className="text-white/80 font-semibold mt-3 mb-1">Assessment Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responses to 60 compatibility assessment questions (50 core + 10 shadow)</li>
              <li>Archetype and shadow type classifications derived from your answers</li>
              <li>Compatibility scores computed between you and other users</li>
              <li>Readiness scores and forecast signals</li>
            </ul>

            <h3 className="text-white/80 font-semibold mt-3 mb-1">Activity Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Messages sent and received between matched users</li>
              <li>Likes, knocks, and match interactions</li>
              <li>Calibration feedback responses (private, never shown to other users)</li>
              <li>Sanctuary reflections, goals, and emotional state entries</li>
              <li>Last active timestamp</li>
            </ul>

            <h3 className="text-white/80 font-semibold mt-3 mb-1">Payment Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Coin purchase transactions (processed securely through Stripe)</li>
              <li>We never store credit card numbers — all payment processing is handled by Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Compatibility Scoring:</strong> Your assessment answers are processed through the Genesis OS deterministic scoring engine to compute compatibility scores with other users. Scoring is workbook-aligned and never uses AI to mutate baselines.</li>
              <li><strong>Matching:</strong> Your preferences (gender, looking for) are used to filter which profiles appear in your matches.</li>
              <li><strong>Communication:</strong> Your messages are stored to enable conversations between matched users.</li>
              <li><strong>Profile Display:</strong> Your name, photos, bio, archetype, and zodiac information are visible to other users in match results.</li>
              <li><strong>Economy System:</strong> Coin balances and badge awards are tracked for in-app engagement features. Coins and badges never affect compatibility scores or match ranking.</li>
              <li><strong>Safety:</strong> Reports and blocks are stored to protect user safety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">4. Data Storage and Security</h2>
            <p>Your data is stored in a PostgreSQL database hosted on Railway.app with encrypted connections (TLS/SSL). All data in transit between your device and our servers is encrypted via HTTPS. Passwords are hashed using bcrypt and never stored in plain text. JWT tokens are used for authentication with configurable expiration.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">5. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only in these limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Other Users:</strong> Your public profile information (name, photos, bio, archetype, zodiac) is visible to other users you are matched with. Compatibility scores are shown to both users in a match pair.</li>
              <li><strong>Payment Processor:</strong> Stripe processes payments and receives only the information necessary to complete transactions.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect the safety of our users.</li>
            </ul>
            <p className="mt-2"><strong>We never share:</strong> Your assessment answers, shadow type details, calibration feedback, Sanctuary reflections, or internal risk flags with other users or third parties.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">6. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access:</strong> You can view all your personal data through your profile page and Sanctuary.</li>
              <li><strong>Correction:</strong> You can update your profile information at any time through the edit profile page.</li>
              <li><strong>Deletion:</strong> You can request complete deletion of your account and all associated data by contacting us at privacy@relationshipscores.app. We will process deletion requests within 30 days.</li>
              <li><strong>Data Export:</strong> You can request a copy of your data by contacting us.</li>
              <li><strong>Opt-out:</strong> You can disable push notifications through your device settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">7. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes (such as resolving disputes or enforcing our terms).</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">8. Children's Privacy</h2>
            <p>Relationship Scores is intended for users aged 18 and older. We do not knowingly collect personal information from anyone under 18. If we discover that a user is under 18, we will delete their account immediately.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-display font-semibold mb-2">10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or your personal data, contact us at:</p>
            <p className="mt-2">
              <strong className="text-white">Relationship Scores</strong><br />
              Email: privacy@relationshipscores.app<br />
              Website: https://date-production-5ca0.up.railway.app
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
