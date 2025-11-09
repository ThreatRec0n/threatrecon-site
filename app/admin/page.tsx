'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Hardcoded credentials (client-side only, not a real security risk)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'An0mal0usAcess!@#',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isCompromised, setIsCompromised] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Track analytics and add red herring console logs
  useEffect(() => {
    // Log visit to analytics
    if (typeof window !== 'undefined') {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'admin_page_visit',
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail if analytics endpoint doesn't exist
      });
      
      // Red herring console logs
      console.log("Auth token: REDACTED");
      console.log(`Session ID: ${Date.now()}`);
      console.log("API endpoint: /api/v2/auth - legacy support");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot field
    if (honeypotRef.current?.value) {
      // Bot detected, silently fail
      return;
    }

    if (isLocked || isCompromised) return;

    setIsLoading(true);
    setError('');

    // Simulate server delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    // Sanitize inputs
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    // Validate credentials
    if (
      sanitizedUsername === ADMIN_CREDENTIALS.username &&
      sanitizedPassword === ADMIN_CREDENTIALS.password
    ) {
      // Correct credentials - trigger honeypot response
      setIsCompromised(true);
      
      // Log compromise event
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'admin_compromise',
          timestamp: new Date().toISOString(),
          username: sanitizedUsername,
        }),
      }).catch(() => {});

      // Disable form
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } else {
      // Failed attempt
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setError('Invalid credentials. Please try again.');

      // Log failed attempt
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'admin_failed_attempt',
          timestamp: new Date().toISOString(),
          attempt_number: newAttempts,
        }),
      }).catch(() => {});

      // Lock after 3 attempts
      if (newAttempts >= 3) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setFailedAttempts(0);
        }, 5000);
      }

      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('Password reset functionality is temporarily disabled. Please contact your system administrator.');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      {/* Red herring HTML comment */}
      {/* TODO: migrate to SSO - scheduled for Q2 2024 */}
      {/* API endpoint: /api/v2/auth - legacy support until migration */}
      
      <div className="w-full max-w-md">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#58a6ff]/20 rounded-full mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-[#c9d1d9] mb-2">
              Secure SOC Console
            </h1>
            <p className="text-sm text-[#8b949e]">
              Threat Intelligence & Operations Dashboard
            </p>
          </div>

          {/* Compromised Modal */}
          {isCompromised && (
            <div 
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="compromised-title"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  router.push('/simulation');
                }
              }}
            >
              <div className="bg-red-900/20 border-2 border-red-500 rounded-lg max-w-md w-full p-6 shadow-2xl">
                <div className="text-center">
                  <div className="text-5xl mb-4">🚨</div>
                  <h2 id="compromised-title" className="text-2xl font-bold text-red-400 mb-4">
                    Security Breach Detected
                  </h2>
                  <p className="text-[#c9d1d9] mb-6 leading-relaxed">
                    Thanks for the free penetration test. Your report is being automatically generated and sent to local law enforcement.
                  </p>
                  <div className="bg-[#0d1117] border border-red-500/50 rounded p-4 mb-4">
                    <p className="text-xs text-[#8b949e] font-mono">
                      Incident ID: {Date.now().toString(36).toUpperCase()}
                    </p>
                    <p className="text-xs text-[#8b949e] font-mono mt-2">
                      Timestamp: {new Date().toISOString()}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/simulation')}
                    className="px-6 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
                  >
                    Return to Platform
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field (invisible to humans) */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{
                position: 'absolute',
                left: '-9999px',
                opacity: 0,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLocked || isCompromised || isLoading}
                className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your username"
                required
                autoComplete="username"
                maxLength={100}
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked || isCompromised || isLoading}
                className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded border ${
                isLocked 
                  ? 'bg-red-900/20 border-red-800/40 text-red-400' 
                  : 'bg-orange-900/20 border-orange-800/40 text-orange-400'
              }`}>
                <p className="text-sm">{error}</p>
                {isLocked && (
                  <p className="text-xs mt-1">
                    Too many failed attempts. Please wait 5 seconds before trying again.
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isCompromised || isLoading}
              className={`w-full py-3 rounded font-semibold transition-colors ${
                isCompromised
                  ? 'bg-red-900/40 text-red-400 border border-red-800/60 cursor-not-allowed'
                  : isLocked
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-[#58a6ff] text-white hover:bg-[#4493f8] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]'
              }`}
            >
              {isLoading ? 'Authenticating...' : isCompromised ? 'Access Denied' : 'Sign In'}
            </button>

            {/* Forgot Password Link */}
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLocked || isCompromised}
              className="w-full text-sm text-[#58a6ff] hover:text-[#79c0ff] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded"
              aria-label="Request password reset"
            >
              Forgot Password?
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-[#30363d]">
            <p className="text-xs text-center text-[#8b949e]">
              🔒 This is a secure system. All access attempts are logged and monitored.
            </p>
          </div>
        </div>

        {/* Red herring - console logs will be added via useEffect */}
      </div>
    </div>
  );
}

