import './styles/globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'Threat Hunt Lab | Professional SIEM Training Platform',
  description: 'Hands-on threat hunting scenarios with realistic log analysis. Train on professional SIEM interfaces.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* HTML Comment for View Source */}
        <script
          type="text/html"
          dangerouslySetInnerHTML={{
            __html: `<!--

██████   ██████  ███████ ███████ ███████ 
██   ██ ██    ██ ██        ███      ███  
██████  ██    ██ ███████   ███     ███   
██      ██    ██      ██  ███     ███    
██       ██████  ███████ ███████ ███████ 

Roses are red,  
Violets are blue,  
You think you see me...  
But I see you too 👀  

-->`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0d1117] text-[#c9d1d9] antialiased pt-14">
        {/* HTML Comment visible in source */}
        <div
          style={{ display: 'none' }}
          dangerouslySetInnerHTML={{
            __html: `<!--

██████   ██████  ███████ ███████ ███████ 
██   ██ ██    ██ ██        ███      ███  
██████  ██    ██ ███████   ███     ███   
██      ██    ██      ██  ███     ███    
██       ██████  ███████ ███████ ███████ 

Roses are red,  
Violets are blue,  
You think you see me...  
But I see you too 👀  

-->`,
          }}
        />
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
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
