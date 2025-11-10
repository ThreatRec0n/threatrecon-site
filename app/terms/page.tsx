'use client';

import Link from 'next/link';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Terms of Service</h1>
          <p className="text-[#8b949e] text-sm">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">1. Acceptance of Terms</h2>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              By accessing or using ThreatRecon ("the Platform"), you agree to be bound by these 
              Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.
            </p>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              These Terms constitute a legally binding agreement between you and ThreatRecon.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">2. Description of Service</h2>
            <p className="text-[#c9d1d9] mb-3">ThreatRecon is an interactive cybersecurity training platform providing:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Hands-on security simulations and scenarios</li>
              <li>Educational content (OWASP Top 10, MITRE ATT&CK references)</li>
              <li>Progress tracking and achievement system</li>
              <li>Community features (leaderboards, discussions)</li>
            </ul>
            <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-4 mt-4">
              <p className="text-yellow-400 text-sm">
                <strong>⚠️ ALPHA SERVICE:</strong> ThreatRecon is currently in alpha testing. 
                Features may change without notice. Service availability is not guaranteed. 
                Downtime and data loss may occur during this phase.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">3. Eligibility and Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">3.1 Age Requirement</h3>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              You must be at least 13 years old to use ThreatRecon. 
              Users under 18 should have parental consent.
            </p>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">3.2 Account Responsibilities</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of unauthorized access</li>
              <li>You are responsible for all activity under your account</li>
              <li>One account per person (no multiple accounts)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">3.3 Account Termination</h3>
            <p className="text-[#c9d1d9] mb-3">You may delete your account at any time. We may suspend or terminate your account for:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Abuse of the platform or other users</li>
              <li>Prolonged inactivity (1 year+)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">4. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">4.1 Prohibited Activities</h3>
            <p className="text-[#c9d1d9] mb-3">You agree NOT to:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Security Testing:</strong> Attempt to hack, exploit, or compromise the platform</li>
              <li><strong>Unauthorized Access:</strong> Access areas or data you don't have permission to access</li>
              <li><strong>Abuse:</strong> Harass, threaten, or harm other users</li>
              <li><strong>Spam:</strong> Send unsolicited messages or advertisements</li>
              <li><strong>Automation:</strong> Use bots, scrapers, or automated tools without permission</li>
              <li><strong>Misrepresentation:</strong> Impersonate others or misrepresent your identity</li>
              <li><strong>Illegal Activity:</strong> Use the platform for any illegal purpose</li>
              <li><strong>Disruption:</strong> Interfere with platform operation or other users' experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">5. Educational Purpose Disclaimer</h2>
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm">
                <strong>⚠️ IMPORTANT:</strong> ThreatRecon is an EDUCATIONAL TOOL ONLY.
              </p>
            </div>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Simulations are for learning purposes in a controlled environment</li>
              <li>Do NOT use techniques learned here for unauthorized security testing</li>
              <li>Do NOT apply knowledge to systems without explicit permission</li>
              <li>We are not responsible for misuse of information learned</li>
              <li>ThreatRecon does not replace professional security training or certifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">6. Limitation of Liability</h2>
            <p className="text-[#c9d1d9] mb-3">TO THE MAXIMUM EXTENT PERMITTED BY LAW, THREATRECON SHALL NOT BE LIABLE FOR:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or goodwill</li>
              <li>Service interruptions or data loss</li>
              <li>Unauthorized access to your account</li>
              <li>Errors or omissions in content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">7. Privacy and Data</h2>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              Your use of ThreatRecon is also governed by our{' '}
              <Link href="/privacy" className="text-[#58a6ff] hover:underline">Privacy Policy</Link>. 
              Please review it to understand our data practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">8. Contact Information</h2>
            <p className="text-[#c9d1d9] mb-3">For questions about these Terms:</p>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>General:</strong> <a href="mailto:legal@threatrecon.io" className="text-[#58a6ff] hover:underline">legal@threatrecon.io</a></li>
              <li><strong>Abuse:</strong> <a href="mailto:abuse@threatrecon.io" className="text-[#58a6ff] hover:underline">abuse@threatrecon.io</a></li>
              <li><strong>Support:</strong> <a href="mailto:support@threatrecon.io" className="text-[#58a6ff] hover:underline">support@threatrecon.io</a></li>
            </ul>
          </section>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mt-8">
            <p className="text-[#c9d1d9] text-center">
              <strong>By using ThreatRecon, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

