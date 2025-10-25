import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        
        {/* Performance Optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon-16x16.svg" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="ThreatRecon - Enterprise-grade breach drill automation platform for incident response training" />
        <meta name="keywords" content="cybersecurity, incident response, breach drill, training, simulation, OSINT" />
        <meta name="author" content="ThreatRecon" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="ThreatRecon - Breach Drill Automation" />
        <meta property="og:description" content="Enterprise-grade breach drill automation platform for incident response training" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://threatrecon.io" />
        <meta property="og:image" content="https://threatrecon.io/og-image.png" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ThreatRecon - Breach Drill Automation" />
        <meta name="twitter:description" content="Enterprise-grade breach drill automation platform for incident response training" />
        <meta name="twitter:image" content="https://threatrecon.io/og-image.png" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ThreatRecon",
              "description": "Enterprise-grade breach drill automation platform for incident response training",
              "url": "https://threatrecon.io",
              "applicationCategory": "SecurityApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
