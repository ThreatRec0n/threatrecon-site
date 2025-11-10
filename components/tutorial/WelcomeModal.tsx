'use client';

import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onStartTutorial: () => void;
  onSkip: () => void;
}

export default function WelcomeModal({ isOpen, onStartTutorial, onSkip }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onSkip]);

  if (!isOpen || !mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      {/* Dimmed background */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onSkip}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative bg-[#161b22] border-2 border-[#58a6ff] rounded-xl shadow-2xl max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🎓</div>
          <h2 id="welcome-title" className="text-3xl font-bold text-[#c9d1d9] mb-4">
            Welcome to Threat Hunt Lab!
          </h2>
          <p className="text-lg text-[#8b949e] leading-relaxed">
            Ready to start your first investigation?
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#58a6ff] mb-2">What You'll Learn:</h3>
            <ul className="space-y-2 text-sm text-[#c9d1d9] text-left">
              <li>• How to read and analyze security logs</li>
              <li>• How to identify Indicators of Compromise (IOCs)</li>
              <li>• How to use OSINT tools for threat intelligence</li>
              <li>• How to map attacks to MITRE ATT&CK framework</li>
              <li>• How to finalize and report your investigation</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onStartTutorial}
              className="flex-1 px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              aria-label="Start the interactive tutorial walkthrough"
            >
              Start Tutorial
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-lg hover:border-[#58a6ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              aria-label="Skip tutorial and start investigating"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

