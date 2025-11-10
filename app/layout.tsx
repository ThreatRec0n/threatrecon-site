import './styles/globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import AppHeader from '@/components/layout/AppHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlphaBanner } from '@/components/AlphaBanner';
import { Toaster } from 'sonner';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: {
    default: 'Threat Hunt Lab | Professional SIEM Training Platform',
    template: '%s | Threat Hunt Lab',
  },
  description: 'Hands-on threat hunting scenarios with realistic log analysis. Train on professional SIEM interfaces. Free, no login required. Practice threat hunting with MITRE ATT&CK techniques.',
  keywords: ['threat hunting', 'SIEM', 'SOC training', 'cybersecurity', 'MITRE ATT&CK', 'log analysis', 'security operations', 'blue team'],
  authors: [{ name: 'ThreatRecon' }],
  creator: 'ThreatRecon',
  publisher: 'ThreatRecon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://threatrecon.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://threatrecon.io',
    title: 'Threat Hunt Lab | Professional SIEM Training Platform',
    description: 'Hands-on threat hunting scenarios with realistic log analysis. Train on professional SIEM interfaces. Free, no login required.',
    siteName: 'Threat Hunt Lab',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Threat Hunt Lab - SOC Training Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Threat Hunt Lab | Professional SIEM Training Platform',
    description: 'Hands-on threat hunting scenarios with realistic log analysis. Train on professional SIEM interfaces.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#58a6ff" />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
      <body className={`min-h-screen bg-[#0d1117] text-[#c9d1d9] antialiased pt-14 ${inter.className}`}>
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
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <AlphaBanner />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </ErrorBoundary>
      </body>
    </html>
  );
}
