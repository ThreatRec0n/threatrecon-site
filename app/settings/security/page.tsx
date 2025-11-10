'use client';

import { useState, useEffect } from 'react';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SecuritySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSecuritySettings();
  }, []);
  
  const loadSecuritySettings = async () => {
    try {
      const res = await fetch('/api/auth/security-settings');
      const data = await res.json();
      setTwoFactorEnabled(data.twoFactorEnabled || false);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }
    
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      if (!res.ok) throw new Error();
      
      toast.success('2FA disabled');
      setTwoFactorEnabled(false);
    } catch (error) {
      toast.error('Failed to disable 2FA');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/simulation" className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors mb-4">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Security Settings</h1>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
            <p className="text-[#8b949e] mt-4">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/simulation" className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Security Settings</h1>
          <p className="text-[#8b949e]">Manage your account security and authentication settings</p>
        </div>
        
        <div className="space-y-6">
          <section className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#c9d1d9]">Two-Factor Authentication</h2>
              {twoFactorEnabled ? (
                <span className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm font-medium border border-green-800/40">
                  ✓ Enabled
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-900/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-800/40">
                  ⚠ Disabled
                </span>
              )}
            </div>
            
            {twoFactorEnabled ? (
              <div className="space-y-4">
                <p className="text-[#c9d1d9]">
                  Your account is protected with two-factor authentication.
                </p>
                <button 
                  onClick={disable2FA} 
                  className="px-4 py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors border border-red-800/40"
                >
                  Disable 2FA
                </button>
              </div>
            ) : showSetup ? (
              <TwoFactorSetup
                onComplete={() => {
                  setShowSetup(false);
                  loadSecuritySettings();
                }}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-[#8b949e]">
                  Two-factor authentication adds an extra layer of security to your account. 
                  We highly recommend enabling it.
                </p>
                <button 
                  onClick={() => setShowSetup(true)} 
                  className="px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors"
                >
                  Enable 2FA
                </button>
              </div>
            )}
          </section>
          
          <section className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Password</h2>
            <p className="text-[#8b949e] mb-4">Last changed: Never</p>
            <button 
              className="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
              disabled
            >
              Change Password (Coming Soon)
            </button>
          </section>
          
          <section className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Active Sessions</h2>
            <p className="text-[#8b949e] mb-4">View and manage devices where you're currently logged in.</p>
            <button 
              className="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
              disabled
            >
              Manage Sessions (Coming Soon)
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

