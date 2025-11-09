'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  mode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', mode: propMode }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>(propMode || initialMode);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const { data, error: authError } = await supabase.auth.signInWithPassword({
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
        const { data, error: authError } = await supabase.auth.signUp({
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
    <div className="fixed inset-0 z-[2000]">
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
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50"
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
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
