'use client';

import Link from 'next/link';

export default function SecurityPolicy() {
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
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Security Policy</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Our Commitment to Security</h2>
            <p className="text-[#c9d1d9] mb-4 leading-relaxed">
              As a cybersecurity training platform, security isn't just our mission—it's our foundation. 
              We implement industry-leading security practices to protect your data and privacy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Responsible Disclosure Policy</h2>
            <p className="text-[#c9d1d9] mb-3">We welcome security researchers to help us maintain the security of ThreatRecon. If you discover a security vulnerability, please:</p>
            <ol className="list-decimal list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>
                <strong>Report privately:</strong> Email{' '}
                <a href="mailto:security@threatrecon.io" className="text-[#58a6ff] hover:underline">security@threatrecon.io</a> 
                {' '}with details
              </li>
              <li><strong>Allow time to fix:</strong> Give us 90 days to address the issue</li>
              <li><strong>Act in good faith:</strong> Don't exploit the vulnerability or access user data</li>
              <li><strong>No public disclosure:</strong> Don't share the vulnerability publicly before we patch it</li>
            </ol>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">What to Include in Your Report</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Detailed description of the vulnerability</li>
              <li>Steps to reproduce</li>
              <li>Potential impact assessment</li>
              <li>Suggested remediation (if applicable)</li>
              <li>Your contact information</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">Our Response</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Acknowledgment:</strong> Within 48 hours</li>
              <li><strong>Status Update:</strong> Within 7 days</li>
              <li><strong>Resolution:</strong> Based on severity (critical: 7 days, high: 30 days, medium: 60 days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Security Measures</h2>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">Authentication & Access Control</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Bcrypt password hashing (cost factor 12)</li>
              <li>TOTP-based two-factor authentication</li>
              <li>Account lockout after 5 failed attempts</li>
              <li>Password breach checking (Have I Been Pwned)</li>
              <li>Strong password requirements (12+ chars, mixed case, numbers, symbols)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">Data Protection</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>TLS 1.3 encryption for all data in transit</li>
              <li>AES-256-GCM encryption for sensitive data at rest</li>
              <li>Encrypted database backups</li>
              <li>Principle of least privilege access</li>
              <li>Regular security audits</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-3 mt-6">Application Security</h3>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li>Content Security Policy (CSP) headers</li>
              <li>HTTP Strict Transport Security (HSTS)</li>
              <li>X-Frame-Options protection against clickjacking</li>
              <li>CSRF token protection</li>
              <li>Rate limiting on all endpoints</li>
              <li>Input validation and output encoding</li>
              <li>SQL injection prevention (parameterized queries)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Contact</h2>
            <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
              <li><strong>Security Issues:</strong> <a href="mailto:security@threatrecon.io" className="text-[#58a6ff] hover:underline">security@threatrecon.io</a></li>
              <li><strong>PGP Key:</strong> Available upon request</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

