import './styles/globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Threat Hunt Lab | Professional SIEM Training Platform',
  description: 'Hands-on threat hunting scenarios with realistic log analysis. Train on professional SIEM interfaces.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d1117] text-[#c9d1d9] antialiased">
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="h-14 border-b border-[#30363d] bg-[#161b22] flex items-center px-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-sm text-[#8b949e]">Threat Hunt Lab</span>
              <span className="text-xs text-[#484f58]">|</span>
              <span className="text-xs text-[#8b949e]">Professional SIEM Training</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-[#0d1117]">
            <div className="max-w-[1920px] mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
