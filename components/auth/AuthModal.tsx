'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import { checkPasswordBreach, getBreachMessage } from '@/lib/security/hibp-checker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  mode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', mode: propMode }: Props) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(propMode || initialMode);
  
  // SSR safety: only mount portal on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update mode when initialMode or propMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(propMode || initialMode);
    }
  }, [initialMode, propMode, isOpen]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{ level: 'weak' | 'medium' | 'strong' | 'excellent'; score: number; crackTime: string } | null>(null);
  const [hibpCheckEnabled, setHibpCheckEnabled] = useState(true);
  const [hibpBreachInfo, setHibpBreachInfo] = useState<{ breached: boolean; count: number; message: string } | null>(null);
  const [checkingHibp, setCheckingHibp] = useState(false);

  // Password validation (enhanced to 12 characters minimum)
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    // Length requirement
    if (pwd.length < 12) {
      errors.push('Password must be at least 12 characters');
      return errors; // Early return for length
    }
    
    // Character requirements
    if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) errors.push('Password must contain at least one symbol');
    
    // Reject common weak passwords
    const commonPasswords = [
      'password', 'password123', 'Password123', 'Password123!',
      '12345678', '123456789', '1234567890', 'qwerty123',
      'admin123', 'welcome123', 'letmein123', 'monkey123',
      'dragon123', 'master123', 'sunshine123', 'princess123'
    ];
    
    const pwdLower = pwd.toLowerCase();
    if (commonPasswords.some(weak => pwdLower.includes(weak))) {
      errors.push('Password is too common. Please choose a more unique password.');
    }
    
    // Reject passwords with repeated characters (e.g., "aaaaaa123!")
    if (/(.)\1{4,}/.test(pwd)) {
      errors.push('Password contains too many repeated characters');
    }
    
    // Reject sequential patterns (e.g., "123456", "abcdef")
    if (/12345|23456|34567|45678|56789|67890|abcdef|bcdefg|cdefgh|defghi|efghij|fghijk|ghijkl|hijklm|ijklmn|jklmno|klmnop|lmnopq|mnopqr|nopqrs|opqrst|pqrstu|qrstuv|rstuvw|stuvwx|tuvwxy|uvwxyz/.test(pwdLower)) {
      errors.push('Password contains sequential patterns which are easy to guess');
    }
    
    // Require at least 3 different character types
    const types = [
      /[A-Z]/.test(pwd) ? 1 : 0,
      /[a-z]/.test(pwd) ? 1 : 0,
      /[0-9]/.test(pwd) ? 1 : 0,
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) ? 1 : 0
    ].reduce((a, b) => a + b, 0);
    
    if (types < 3) {
      errors.push('Password must use at least 3 different character types (uppercase, lowercase, numbers, symbols)');
    }
    
    return errors;
  };

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): { level: 'weak' | 'medium' | 'strong' | 'excellent'; score: number; crackTime: string } => {
    let score = 0;
    
    // Length scoring
    if (pwd.length >= 12) score += 2;
    else if (pwd.length >= 8) score += 1;
    if (pwd.length >= 16) score += 1;
    if (pwd.length >= 20) score += 1;
    
    // Character variety
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    // Patterns
    if (!/(.)\1{2,}/.test(pwd)) score += 1; // No repeated characters
    if (!/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(pwd)) {
      score += 1; // No sequential patterns
    }
    
    let level: 'weak' | 'medium' | 'strong' | 'excellent';
    let crackTime: string;
    
    if (score <= 3) {
      level = 'weak';
      crackTime = 'Instantly';
    } else if (score <= 5) {
      level = 'medium';
      crackTime = 'Minutes to hours';
    } else if (score <= 7) {
      level = 'strong';
      crackTime = 'Days to weeks';
    } else {
      level = 'excellent';
      crackTime = 'Years to decades';
    }
    
    return { level, score, crackTime };
  };
  
  // Guard: never open if Supabase is not enabled or not mounted
  if (!isSupabaseEnabled || !isOpen || !mounted) {
    return null;
  }
  
  // Additional safety check
  try {
    const supa = getSupabaseClient();
    if (!supa) {
      return null;
    }
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard: prevent submission if Supabase is not enabled
    if (!isSupabaseEnabled) {
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Authentication is not available');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const supa = getSupabaseClient();
        if (!supa) {
          setError('Authentication is not available');
          setLoading(false);
          return;
        }
        const { data, error: authError } = await supa.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          if (authError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (authError.message.includes('Email not confirmed')) {
            setError('Please check your email and confirm your account before signing in.');
          } else {
            setError(authError.message || 'Failed to sign in. Please try again.');
          }
          setLoading(false);
          return;
        }

        if (data?.user) {
          setMessage('Successfully signed in!');
          setTimeout(() => {
            onSuccess();
            // Redirect to simulation
            if (typeof window !== 'undefined') {
              window.location.href = '/simulation';
            }
          }, 1000);
        }
      } else {
        // Validate password for signup
        const pwdErrors = validatePassword(password);
        if (pwdErrors.length > 0) {
          setPasswordErrors(pwdErrors);
          setError('Password does not meet requirements');
          setLoading(false);
          return;
        }
        setPasswordErrors([]);

        // Check HIBP if enabled
        if (hibpCheckEnabled && hibpBreachInfo?.breached && hibpBreachInfo.count > 100) {
          setError('This password has been compromised in data breaches. Please choose a different password.');
          setLoading(false);
          return;
        }

        const supa = getSupabaseClient();
        if (!supa) {
          setError('Authentication is not available');
          setLoading(false);
          return;
        }
        const { data, error: authError } = await supa.auth.signUp({
          email,
          password,
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
            setMode('login');
          } else if (authError.message.includes('Password')) {
            setError('Password is too weak. Please use a stronger password.');
          } else {
            setError(authError.message || 'Failed to create account. Please try again.');
          }
          setLoading(false);
          return;
        }

        if (data?.user) {
          setMessage('Account created! Please check your email to confirm your account.');
          setTimeout(() => {
            setMode('login');
            setMessage('You can now sign in with your credentials.');
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-modal">
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#161b22] border border-[#30363d] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h2 id="auth-title" className="text-2xl font-bold text-[#c9d1d9]">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/40 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="p-3 bg-green-900/20 border border-green-800/40 rounded text-green-400 text-sm">
              {message}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50"
              placeholder="your.email@example.com"
              required
              autoComplete="email"
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
              onChange={async (e) => {
                const newPassword = e.target.value;
                setPassword(newPassword);
                if (mode === 'signup') {
                  setPasswordErrors(validatePassword(newPassword));
                  setPasswordStrength(calculatePasswordStrength(newPassword));
                  
                  // Check HIBP if enabled and password is long enough
                  if (hibpCheckEnabled && newPassword.length >= 8) {
                    setCheckingHibp(true);
                    try {
                      const breachResult = await checkPasswordBreach(newPassword);
                      setHibpBreachInfo({
                        ...breachResult,
                        message: getBreachMessage(breachResult.count),
                      });
                    } catch (err) {
                      console.error('HIBP check failed:', err);
                    } finally {
                      setCheckingHibp(false);
                    }
                  } else {
                    setHibpBreachInfo(null);
                  }
                }
              }}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50"
              placeholder={mode === 'signup' ? 'Password (min 12 chars, 1 uppercase, 1 number, 1 symbol)' : '••••••••'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 12 : 6}
              aria-label={mode === 'signup' ? 'Password (minimum 12 characters, must include uppercase, number, and symbol)' : 'Password'}
              aria-describedby={mode === 'signup' ? 'password-strength password-errors hibp-info' : undefined}
            />
            
            {/* Password Strength Meter */}
            {mode === 'signup' && password && (
              <div id="password-strength" className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#30363d] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength?.level === 'weak' ? 'bg-red-500 w-1/4' :
                        passwordStrength?.level === 'medium' ? 'bg-orange-500 w-1/2' :
                        passwordStrength?.level === 'strong' ? 'bg-yellow-500 w-3/4' :
                        passwordStrength?.level === 'excellent' ? 'bg-green-500 w-full' :
                        'bg-gray-500 w-0'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength?.level === 'weak' ? 'text-red-400' :
                    passwordStrength?.level === 'medium' ? 'text-orange-400' :
                    passwordStrength?.level === 'strong' ? 'text-yellow-400' :
                    passwordStrength?.level === 'excellent' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {passwordStrength?.level ? passwordStrength.level.toUpperCase() : ''}
                  </span>
                </div>
                {passwordStrength && (
                  <p className="text-xs text-[#8b949e]">
                    Estimated crack time: {passwordStrength.crackTime}
                  </p>
                )}
              </div>
            )}
            
            {/* HIBP Breach Warning */}
            {mode === 'signup' && hibpBreachInfo && hibpBreachInfo.breached && (
              <div id="hibp-info" className={`mt-2 p-2 rounded text-xs ${
                hibpBreachInfo.count > 1000 ? 'bg-red-900/20 border border-red-800/40 text-red-400' :
                hibpBreachInfo.count > 100 ? 'bg-orange-900/20 border border-orange-800/40 text-orange-400' :
                'bg-yellow-900/20 border border-yellow-800/40 text-yellow-400'
              }`} role="alert" aria-live="polite">
                {hibpBreachInfo.message}
                {hibpCheckEnabled && (
                  <button
                    type="button"
                    onClick={() => setHibpCheckEnabled(false)}
                    className="ml-2 underline hover:no-underline"
                    aria-label="Disable password breach checking"
                  >
                    (Disable check)
                  </button>
                )}
              </div>
            )}
            
            {/* HIBP Check Toggle */}
            {mode === 'signup' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hibp-toggle"
                  checked={hibpCheckEnabled}
                  onChange={(e) => {
                    setHibpCheckEnabled(e.target.checked);
                    if (!e.target.checked) {
                      setHibpBreachInfo(null);
                    }
                  }}
                  className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]"
                />
                <label htmlFor="hibp-toggle" className="text-xs text-[#8b949e] cursor-pointer">
                  Check password against breach database (Have I Been Pwned)
                </label>
                {checkingHibp && (
                  <span className="text-xs text-[#8b949e]">Checking...</span>
                )}
              </div>
            )}
            
            {mode === 'signup' && passwordErrors.length > 0 && (
              <div id="password-errors" className="text-xs text-red-400 space-y-1 mt-1" role="alert" aria-live="polite">
                {passwordErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-[#58a6ff] text-white rounded font-semibold hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2 focus:ring-offset-[#161b22]"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Toggle Mode */}
          <div className="text-center text-sm text-[#8b949e]">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }}
              className="text-[#58a6ff] hover:text-[#4493f8] underline focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded px-1"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}
