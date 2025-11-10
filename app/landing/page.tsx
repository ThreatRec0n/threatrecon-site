'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-14">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            The Free Threat Hunting Lab
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              for Everyone
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Practice real-world threat hunting with realistic attack scenarios. 
            No setup required, no login needed, 100% free. Train like a SOC analyst using 
            industry-standard tools and MITRE ATT&CK techniques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/simulation')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Launch Threat Hunting Simulation"
            >
              🚀 Launch Simulation
            </button>
            <Link
              href="/docs"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="View Documentation and Lab Plans"
            >
              📚 View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-white">
        <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">
          🎉 New Features
        </h3>
        <p className="text-center text-gray-600 mb-12">
          Explore our latest learning enhancements
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link
            href="/learn"
            className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-xl"
          >
            <div className="text-4xl mb-4">📚</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">OWASP Top 10 Lessons</h4>
            <p className="text-gray-600 mb-3">
              Interactive lessons on the most critical web security risks with quizzes and MITRE ATT&CK references
            </p>
            <span className="text-blue-600 font-semibold text-sm">Explore Lessons →</span>
          </Link>
          <Link
            href="/achievements"
            className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl shadow-lg border-2 border-yellow-200 hover:border-yellow-400 transition-all hover:shadow-xl"
          >
            <div className="text-4xl mb-4">🏆</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Achievement System</h4>
            <p className="text-gray-600 mb-3">
              Earn badges and track your progress across 20+ achievements. Unlock milestones as you master threat hunting
            </p>
            <span className="text-yellow-600 font-semibold text-sm">View Achievements →</span>
          </Link>
          <Link
            href="/dashboard"
            className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl shadow-lg border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl"
          >
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Progress Dashboard</h4>
            <p className="text-gray-600 mb-3">
              Visualize your learning journey with detailed analytics, strengths/weaknesses analysis, and skill tracking
            </p>
            <span className="text-green-600 font-semibold text-sm">View Dashboard →</span>
          </Link>
          <Link
            href="/simulation?tutorial=true"
            className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-xl"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Interactive Tutorial</h4>
            <p className="text-gray-600 mb-3">
              6-step guided walkthrough that teaches you how to investigate threats like a real SOC analyst
            </p>
            <span className="text-purple-600 font-semibold text-sm">Start Tutorial →</span>
          </Link>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl shadow-lg border-2 border-indigo-200">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Detailed Feedback</h4>
            <p className="text-gray-600 mb-3">
              Get comprehensive feedback after each simulation with MITRE ATT&CK technique references, OWASP Top 10 links, and learning resources
            </p>
            <span className="text-indigo-600 font-semibold text-sm">Try a Simulation →</span>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl shadow-lg border-2 border-cyan-200">
            <div className="text-4xl mb-4">🔰</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Progressive Difficulty</h4>
            <p className="text-gray-600 mb-3">
              Start with beginner scenarios and progress to expert-level APT campaigns. Filter by difficulty and track your skill growth
            </p>
            <span className="text-cyan-600 font-semibold text-sm">Choose Difficulty →</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why ThreatRecon?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🌐</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Browser-Based</h4>
            <p className="text-gray-600">
              No downloads, no VMs, no setup. Everything runs in your browser. 
              Start hunting threats in seconds.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🆓</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">100% Free</h4>
            <p className="text-gray-600">
              Completely free with no hidden costs. No subscriptions, no credit cards, 
              no accounts required to start.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Realistic Data</h4>
            <p className="text-gray-600">
              Practice with realistic attack scenarios based on real-world threats. 
              Learn MITRE ATT&CK techniques through hands-on investigation.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🛠️</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Free Tools</h4>
            <p className="text-gray-600">
              Learn to use industry-standard tools: Sysmon, Zeek, OSINT platforms, 
              and more. All integrated and ready to use.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h4>
            <p className="text-gray-600">
              Optional account sync lets you track your progress across devices. 
              Compete on leaderboards and earn skill badges.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🎓</div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Learn by Doing</h4>
            <p className="text-gray-600">
              Hands-on scenarios teach you threat hunting methodology. From beginner 
              to advanced, grow your skills at your own pace.
            </p>
          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Practice Real Attack Scenarios
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'APT29 Campaign', desc: 'Multi-day advanced persistent threat' },
              { name: 'Ransomware Attack', desc: 'LockBit-style encryption attack' },
              { name: 'Business Email Compromise', desc: 'BEC financial fraud investigation' },
              { name: 'Insider Threat', desc: 'Data exfiltration by legitimate user' },
              { name: 'Cloud Breach', desc: 'Misconfiguration exploitation' },
              { name: 'Supply Chain Attack', desc: 'Compromised vendor software' },
            ].map((scenario, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">{scenario.name}</h4>
                <p className="text-sm text-gray-600">{scenario.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h3 className="text-4xl font-bold mb-4">Ready to Start Hunting?</h3>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of security professionals learning threat hunting skills.
          </p>
          <button
            onClick={() => router.push('/simulation')}
            className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Launch Your First Investigation →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">ThreatRecon</h4>
              <p className="text-sm">
                The free threat hunting lab for students, analysts, and security professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/phoenix" className="hover:text-white transition-colors">Operation Phoenix</Link></li>
                <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                <li><Link href="/learn" className="hover:text-white transition-colors">OWASP Top 10 Lessons</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/simulation" className="hover:text-white transition-colors">MITRE ATT&CK Scenarios</Link></li>
                <li><Link href="/simulation" className="hover:text-white transition-colors">Realistic Log Analysis</Link></li>
                <li><Link href="/simulation" className="hover:text-white transition-colors">OSINT Integration</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Progress Tracking</Link></li>
                <li><Link href="/achievements" className="hover:text-white transition-colors">Achievement System</Link></li>
                <li><Link href="/learn" className="hover:text-white transition-colors">OWASP Top 10 Lessons</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">About</h4>
              <p className="text-sm">
                100% free, open-source inspired threat hunting training platform. 
                No login required to start learning.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 ThreatRecon. Built for the security community.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

