'use client';

import { useState, useEffect } from 'react';

export function AlphaBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissedBanner = localStorage.getItem('alpha_banner_dismissed');
    if (dismissedBanner === 'true') {
      setDismissed(true);
    }
  }, []);
  
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('alpha_banner_dismissed', 'true');
  };
  
  if (dismissed) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-blue-800/40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded uppercase">
              Alpha
            </span>
            <p className="text-sm text-[#c9d1d9]">
              <strong>Welcome to ThreatRecon Alpha!</strong>{' '}
              This platform is in active development. Features may change and bugs may occur.{' '}
              <a 
                href="mailto:feedback@threatrecon.io" 
                className="text-[#58a6ff] hover:underline"
              >
                Share your feedback
              </a>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

