'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Privacy Policy</h1>
          <p className="text-[#8b949e] text-sm">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">1. Introduction</h2>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              ThreatRecon ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our cybersecurity training platform.
            </p>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              By using ThreatRecon, you agree to the collection and use of information 
              in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">2.1 Personal Information</h3>
            <p className="text-[#c9d1d9] mb-3">We collect the following personal information:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, username, encrypted password</li>
              <li><strong>Profile Data:</strong> Optional display name, avatar, bio</li>
              <li><strong>Authentication Data:</strong> 2FA secrets (encrypted), trusted device tokens</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">2.2 Usage Data</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Learning Progress:</strong> Simulation results, scores, completion times</li>
              <li><strong>Activity Logs:</strong> Pages visited, features used, time spent</li>
              <li><strong>Achievement Data:</strong> Unlocked badges, points earned</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">2.3 Technical Data</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Device Information:</strong> Browser type, OS, device type</li>
              <li><strong>Network Data:</strong> IP address, general location (city/country)</li>
              <li><strong>Session Data:</strong> Login times, session duration</li>
              <li><strong>Cookies:</strong> Essential authentication and preference cookies only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Provide Services:</strong> Deliver and personalize your learning experience</li>
              <li><strong>Track Progress:</strong> Monitor and display your learning achievements</li>
              <li><strong>Improve Platform:</strong> Analyze usage patterns to enhance features</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, protect accounts</li>
              <li><strong>Communication:</strong> Send important updates, security alerts</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">4. Data Security</h2>
            <p className="text-[#c9d1d9] mb-3">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Encryption:</strong> TLS/SSL for data in transit, AES-256-GCM for sensitive data at rest</li>
              <li><strong>Password Security:</strong> Bcrypt hashing with individual salts</li>
              <li><strong>2FA:</strong> Optional two-factor authentication with TOTP</li>
              <li><strong>Session Security:</strong> HttpOnly, Secure, SameSite cookies</li>
              <li><strong>Access Controls:</strong> Role-based access, principle of least privilege</li>
              <li><strong>Monitoring:</strong> Real-time security monitoring and audit logging</li>
              <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
            </ul>
            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ <strong>Important:</strong> No method of transmission over the Internet is 100% secure. 
                While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-[#c9d1d9] mb-3">We do NOT sell your personal information. We may share data only in these circumstances:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> Trusted third parties who help operate our platform (hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
              <li><strong>With Your Consent:</strong> Any other disclosure with your explicit permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">6. Your Rights (GDPR/CCPA Compliance)</h2>
            <p className="text-[#c9d1d9] mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from non-essential communications</li>
              <li><strong>Restriction:</strong> Request restriction of data processing</li>
              <li><strong>Object:</strong> Object to certain types of processing</li>
            </ul>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@threatrecon.io" className="text-[#58a6ff] hover:underline">privacy@threatrecon.io</a>. 
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">7. Data Retention</h2>
            <p className="text-[#c9d1d9] mb-3">We retain your data as follows:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Account Data:</strong> Until you delete your account, plus 30 days for backups</li>
              <li><strong>Learning Progress:</strong> Retained for your reference until account deletion</li>
              <li><strong>Audit Logs:</strong> 90 days for security purposes</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized permanently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">8. Cookies and Tracking</h2>
            <p className="text-[#c9d1d9] mb-3">We use only essential cookies:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
              <li><strong>Preference Cookies:</strong> Remember your settings (theme, language)</li>
              <li><strong>Security Cookies:</strong> Protect against CSRF attacks</li>
            </ul>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              <strong>We do NOT use:</strong> Third-party advertising cookies, social media tracking pixels, 
              or cross-site tracking technologies.
            </p>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              You can disable cookies in your browser, but this may affect functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">9. Children's Privacy</h2>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              ThreatRecon is not intended for users under 13 years of age. 
              We do not knowingly collect data from children under 13. 
              If we discover that we have collected such data, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">10. International Data Transfers</h2>
            <p className="text-[#c9d1d9] mb-3">Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions by relevant data protection authorities</li>
              <li>Your explicit consent where required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">11. Changes to This Policy</h2>
            <p className="text-[#c9d1d9] mb-3">We may update this Privacy Policy periodically. Significant changes will be notified via:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Email notification to registered users</li>
              <li>Prominent notice on the platform</li>
              <li>Updated "Last Updated" date at the top of this page</li>
            </ul>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">12. Contact Us</h2>
            <p className="text-[#c9d1d9] mb-3">For privacy-related questions or concerns:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:privacy@threatrecon.io" className="text-[#58a6ff] hover:underline">privacy@threatrecon.io</a></li>
              <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@threatrecon.io" className="text-[#58a6ff] hover:underline">dpo@threatrecon.io</a></li>
              <li><strong>Security Issues:</strong> <a href="mailto:security@threatrecon.io" className="text-[#58a6ff] hover:underline">security@threatrecon.io</a></li>
            </ul>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              We aim to respond to all inquiries within 48 hours and resolve issues within 30 days.
            </p>
          </section>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mt-8">
            <p className="text-[#c9d1d9] text-center">
              <strong>Your privacy matters to us.</strong> We're committed to transparency and protecting your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

