'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Update mode when initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Check if Supabase is configured
      if (typeof window !== 'undefined' && 
          (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
           !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
           process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_project_url')) {
        throw new Error('User accounts are not configured. Please contact the administrator.');
      }

      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setMessage('Account created! Please check your email to verify your account.');
          // Auto-switch to login after signup
          setTimeout(() => {
            setMode('login');
            setMessage('');
          }, 3000);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) throw signInError;

        if (data.user) {
          onSuccess();
          onClose();
          // Redirect to simulation after successful login
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/simulation';
            }, 500);
          }
        }
      }
    } catch (err: any) {
      // Show clearer error messages
      if (err.message?.includes('Invalid login')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and verify your account before signing in.');
      } else if (err.message?.includes('Password')) {
        setError('Password must be at least 8 characters long.');
      } else if (err.message?.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-md w-full shadow-2xl">
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
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50"
              placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded font-semibold transition-colors bg-[#58a6ff] text-white hover:bg-[#4493f8] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {/* Mode Toggle */}
          <div className="text-center pt-4 border-t border-[#30363d]">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }}
              className="text-sm text-[#58a6ff] hover:text-[#79c0ff]"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t border-[#30363d]">
            <p className="text-xs text-center text-[#8b949e]">
              🔒 Your email is only used for account management. No personal data is collected.
              <br />
              Account is optional - you can use the platform without signing in.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

