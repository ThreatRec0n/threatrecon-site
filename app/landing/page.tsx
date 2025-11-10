'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TutorialWalkthrough from '@/components/tutorial/TutorialWalkthrough';

export default function LandingPage() {
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);
  const [walkthroughSeen, setWalkthroughSeen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('walkthrough_seen') === 'true';
    setWalkthroughSeen(seen);
  }, []);

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
            <button
              onClick={() => setShowTutorial(true)}
              className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Start Interactive Tutorial"
            >
              🎓 Start Tutorial
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
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>MITRE ATT&CK Scenarios</li>
                <li>Realistic Log Analysis</li>
                <li>OSINT Integration</li>
                <li>Progress Tracking</li>
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

      {/* Tutorial Walkthrough */}
      <TutorialWalkthrough
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          setWalkthroughSeen(true);
        }}
        currentPage="landing"
      />
    </div>
  );
}

