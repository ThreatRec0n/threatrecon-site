'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const generateSecret = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          token: verificationCode,
          backupCodes
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('2FA enabled successfully!');
      setStep('backup');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };
  
  const downloadBackupCodes = () => {
    const blob = new Blob(
      [`ThreatRecon Backup Codes - Save These Securely!\n\n${backupCodes.join('\n')}\n\nEach code can only be used once.`],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threatrecon-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };
  
  if (step === 'generate') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">Enable Two-Factor Authentication</h2>
          <p className="text-[#8b949e] mb-6">Add an extra layer of security to your account with 2FA.</p>
          <ul className="list-none space-y-2 mb-8 text-left max-w-md mx-auto">
            <li className="text-[#c9d1d9]">✓ Protect against unauthorized access</li>
            <li className="text-[#c9d1d9]">✓ Secure your learning progress</li>
            <li className="text-[#c9d1d9]">✓ Meet industry security standards</li>
          </ul>
          <button 
            onClick={generateSecret} 
            disabled={loading}
            className="px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Get Started →'}
          </button>
        </div>
      </div>
    );
  }
  
  if (step === 'verify') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4 text-center">Scan QR Code</h2>
          <p className="text-[#8b949e] mb-6 text-center">Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:</p>
          
          <div className="flex justify-center mb-6">
            <div className="bg-white p-6 rounded-lg inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrCode} 
                alt="2FA QR Code" 
                width={250} 
                height={250} 
                className="block"
              />
            </div>
          </div>
          
          <details className="mb-6">
            <summary className="cursor-pointer text-[#58a6ff] hover:text-[#79c0ff] text-sm mb-2">
              Can't scan? Enter manually
            </summary>
            <div className="flex items-center gap-2 p-3 bg-[#0d1117] rounded border border-[#30363d] mt-2">
              <code className="flex-1 font-mono text-sm text-[#c9d1d9] break-all">{secret}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  toast.success('Copied to clipboard');
                }}
                className="px-3 py-1.5 text-xs bg-[#21262d] text-[#c9d1d9] rounded hover:bg-[#30363d] transition-colors"
              >
                Copy
              </button>
            </div>
          </details>
          
          <div className="mb-6">
            <label htmlFor="2fa-code" className="block text-sm font-medium text-[#c9d1d9] mb-2">
              Enter the 6-digit code from your app:
            </label>
            <input
              id="2fa-code"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full max-w-xs mx-auto block px-4 py-3 text-2xl text-center tracking-widest font-mono border-2 border-[#30363d] rounded-lg bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
              autoFocus
            />
          </div>
          
          <div className="text-center">
            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify and Enable 2FA'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (step === 'backup') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8">
          <div className="text-6xl mb-6 text-center">✅</div>
          <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4 text-center">Save Your Backup Codes</h2>
          <div className="bg-yellow-900/20 border-l-4 border-yellow-600 p-4 mb-6 rounded">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Important:</strong> Save these backup codes in a secure location. 
              Each code can only be used once if you lose access to your authenticator.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {backupCodes.map((code, i) => (
              <code key={i} className="p-3 bg-[#0d1117] border border-[#30363d] rounded font-mono text-base font-semibold text-center text-[#c9d1d9]">
                {code}
              </code>
            ))}
          </div>
          
          <div className="flex gap-3 justify-center mb-4">
            <button 
              onClick={downloadBackupCodes} 
              className="px-6 py-3 bg-[#21262d] text-[#c9d1d9] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
            >
              📥 Download Codes
            </button>
            <button 
              onClick={onComplete} 
              className="px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors"
            >
              I've Saved My Codes →
            </button>
          </div>
          
          <p className="text-sm text-[#8b949e] text-center">
            💡 Tip: Store backup codes in a password manager or encrypted file.
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}

