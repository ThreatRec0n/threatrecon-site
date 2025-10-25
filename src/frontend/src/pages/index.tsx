import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  PlayCircle, 
  Download, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  FileText,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isStartingDrill, setIsStartingDrill] = useState(false);

  const handleStartDrill = () => {
    setIsStartingDrill(true);
    router.push('/new-drill');
  };

  const handleDownloadExampleAAR = () => {
    // This will open the scrubbed example AAR in a new tab
    window.open('/example-aar.html', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">ThreatRecon</span>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/docs" 
                className="text-slate-300 hover:text-white transition-colors"
              >
                Documentation
              </a>
              <a 
                href="/deploy" 
                className="text-slate-300 hover:text-white transition-colors"
              >
                Self-Host
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Run a live cyber breach{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              war game
            </span>{' '}
            with your team
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            Real-time injects. Executive pressure. Legal escalation.
          </p>
          
          <p className="text-lg text-slate-400 mb-12">
            Get a signed After Action Report in under an hour.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStartDrill}
              disabled={isStartingDrill}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <PlayCircle className="h-6 w-6" />
              <span>{isStartingDrill ? 'Starting...' : 'Start a Live Breach Drill'}</span>
            </button>
            
            <button
              onClick={handleDownloadExampleAAR}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>See How the Report Looks</span>
            </button>
            
            <a
              href="/example-aar.pdf.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </a>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Free • No signup required • Ready in 30 seconds
          </p>
        </div>
      </div>

      {/* Who's it for? */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Who's it for?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Security Teams</h3>
            <p className="text-slate-300">
              Prove readiness to your board. Run tabletop exercises that actually test your incident response procedures.
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Schools</h3>
            <p className="text-slate-300">
              Run graded incident drills in class. Give students hands-on experience with real-world pressure scenarios.
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Consultants</h3>
            <p className="text-slate-300">
              Deliver tabletop exercises with signed audit trails. Show clients exactly what happened and what needs fixing.
            </p>
          </div>
        </div>
      </div>

      {/* What happens in a drill? */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What happens in a drill?
        </h2>
        
        <div className="bg-slate-800 rounded-lg p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Min 03
              </div>
              <p className="text-slate-300">
                Suspicious outbound traffic detected from finance department
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Min 07
              </div>
              <p className="text-slate-300">
                Fake journalist demands comment on "rumored data breach"
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Min 12
              </div>
              <p className="text-slate-300">
                CFO receives sophisticated wire fraud attempt via email
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Min 18
              </div>
              <p className="text-slate-300">
                Regulators want answers now. Legal team needs immediate response.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What you walk away with */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          What you walk away with
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span className="text-slate-300">Signed After Action Report (PDF/JSON/Markdown)</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span className="text-slate-300">Full decision timeline with timestamps</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span className="text-slate-300">Gaps and remediation plan</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <span className="text-slate-300">Compliance alignment (NIST 800-61, SOC2, ISO 27035)</span>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scoring Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Technical Response</span>
                <span className="text-blue-400 font-semibold">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Legal & Compliance</span>
                <span className="text-green-400 font-semibold">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Executive Communication</span>
                <span className="text-yellow-400 font-semibold">78%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Business Continuity</span>
                <span className="text-purple-400 font-semibold">88%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to test your team's readiness?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join hundreds of security teams already using ThreatRecon to prepare for real incidents.
          </p>
          <button
            onClick={handleStartDrill}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 mx-auto"
          >
            <span>Start Your First Drill</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold text-white">ThreatRecon</span>
              </div>
              <p className="text-slate-400 text-sm">
                Enterprise-grade breach drill automation for security teams, schools, and consultants.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/features" className="text-slate-400 hover:text-white">Features</a></li>
                <li><a href="/scenarios" className="text-slate-400 hover:text-white">Scenario Library</a></li>
                <li><a href="/pricing" className="text-slate-400 hover:text-white">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/docs" className="text-slate-400 hover:text-white">Documentation</a></li>
                <li><a href="/deploy" className="text-slate-400 hover:text-white">Self-Host</a></li>
                <li><a href="/security" className="text-slate-400 hover:text-white">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Important</h3>
              <p className="text-slate-400 text-sm mb-2">
                Do not enter real personal data in the hosted service.
              </p>
              <a href="/deploy" className="text-blue-400 hover:text-blue-300 text-sm">
                Self-host for sensitive drills →
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2024 ThreatRecon. Built for security teams who take readiness seriously.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}