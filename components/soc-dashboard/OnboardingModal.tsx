'use client';

import { useEffect, useState } from 'react';

interface Props {
  onOpenGuide: () => void;
  onStart: () => void;
}

export default function OnboardingModal({ onOpenGuide, onStart }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome modal
    if (typeof window !== 'undefined') {
      const welcomeSeen = localStorage.getItem('threatrecon_welcome_seen');
      if (!welcomeSeen) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('threatrecon_welcome_seen', 'true');
    }
    setIsOpen(false);
    onStart();
  };

  const handleOpenGuide = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('threatrecon_welcome_seen', 'true');
    }
    setIsOpen(false);
    onOpenGuide();
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('threatrecon_welcome_seen', 'true');
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h2 id="onboarding-title" className="text-2xl font-bold text-[#c9d1d9]">
            Welcome to the Free Threat Hunting Lab
          </h2>
          <button
            onClick={handleClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
            aria-label="Close welcome modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-[#c9d1d9] leading-relaxed">
            This is a comprehensive, hands-on threat hunting platform designed to train security analysts
            using realistic attack scenarios and professional SOC workflows. Everything is free and requires no login.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#0d1117] rounded border border-[#30363d]">
              <span className="text-2xl">🧪</span>
              <div>
                <h3 className="font-semibold text-[#c9d1d9] mb-1">Investigate Realistic Cyber Attacks</h3>
                <p className="text-sm text-[#8b949e]">
                  Analyze multi-stage attack chains using free tools like Wireshark, Sysmon, Zeek, and OSINT resources.
                  Correlate events across multiple log sources to piece together the attack timeline.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#0d1117] rounded border border-[#30363d]">
              <span className="text-2xl">🎓</span>
              <div>
                <h3 className="font-semibold text-[#c9d1d9] mb-1">Learn MITRE ATT&CK Techniques</h3>
                <p className="text-sm text-[#8b949e]">
                  Every attack is mapped to the MITRE ATT&CK framework. Enable Learning Mode to see technique
                  explanations, detection guidance, and example queries for each event you encounter.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#0d1117] rounded border border-[#30363d]">
              <span className="text-2xl">🛠</span>
              <div>
                <h3 className="font-semibold text-[#c9d1d9] mb-1">Tag IOCs, Write Rules, Finalize Investigations</h3>
                <p className="text-sm text-[#8b949e]">
                  Extract and tag indicators of compromise, enrich them with threat intelligence, write detection rules
                  (Sigma, YARA, KQL), and submit your investigation for comprehensive evaluation and feedback.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800/40 rounded p-4">
            <p className="text-sm text-[#c9d1d9]">
              <strong className="text-blue-400">💡 Tip:</strong> Click the <strong>📖 Investigation Guide</strong> button
              (bottom-right) anytime for step-by-step methodology, tool guides, and investigation hints.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#30363d] flex items-center justify-between gap-4">
          <button
            onClick={handleOpenGuide}
            className="px-4 py-2 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            Open Investigation Guide
          </button>
          <button
            onClick={handleStart}
            className="px-6 py-2 rounded text-sm font-semibold transition-colors bg-[#58a6ff] text-white hover:bg-[#4493f8] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            Start Investigating
          </button>
        </div>
      </div>
    </div>
  );
}

