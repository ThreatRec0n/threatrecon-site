'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Read URL params on mount - avoid useSearchParams hook issues
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'signup') {
        setMode('signup');
      }
    } catch (err) {
      // Ignore errors
    }
    
    // Check if Supabase is enabled
    setSupabaseReady(isSupabaseEnabled());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!supabaseReady) {
      setMessage('Authentication is not available. Please configure Supabase environment variables.');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage('Success! Redirecting...');
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/simulation';
          }
        }, 1000);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/simulation` : undefined,
          },
        });

        if (error) throw error;

        setMessage('Check your email to confirm your account!');
      }
    } catch (error: any) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!supabaseReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#c9d1d9',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#161b22',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '16px', color: '#c9d1d9' }}>Authentication Unavailable</h1>
          <p style={{ marginBottom: '24px', color: '#8b949e' }}>
            Authentication is currently being configured. You can still use the platform without an account.
          </p>
          <button
            onClick={() => router.push('/simulation')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#58a6ff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Continue to Simulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      color: '#c9d1d9',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#161b22',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        border: '1px solid #30363d'
      }}>
        <h1 style={{ 
          marginBottom: '24px', 
          textAlign: 'center',
          color: '#c9d1d9',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h1>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #30363d'
        }}>
          <button
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'signin' ? '#58a6ff' : 'transparent',
              border: 'none',
              color: mode === 'signin' ? '#fff' : '#8b949e',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: mode === 'signin' ? '600' : '400'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'signup' ? '#58a6ff' : 'transparent',
              border: 'none',
              color: mode === 'signup' ? '#fff' : '#8b949e',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              fontWeight: mode === 'signup' ? '600' : '400'
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#30363d' : '#58a6ff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Loading...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: message.includes('error') || message.includes('Error') || message.includes('Failed') 
              ? 'rgba(248, 81, 73, 0.1)' 
              : 'rgba(56, 139, 253, 0.1)',
            border: `1px solid ${message.includes('error') || message.includes('Error') || message.includes('Failed') 
              ? 'rgba(248, 81, 73, 0.3)' 
              : 'rgba(56, 139, 253, 0.3)'}`,
            borderRadius: '6px',
            fontSize: '14px',
            color: message.includes('error') || message.includes('Error') || message.includes('Failed')
              ? '#f85149'
              : '#58a6ff'
          }}>
            {message}
          </div>
        )}

        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#8b949e',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#c9d1d9'
      }}>
        Loading...
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
