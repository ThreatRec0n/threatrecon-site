import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Cache-Control" content="no-store" />
        <title>ThreatRecon.io SOC Simulator</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/tone@14.8.49/build/Tone.js"></script>
        <style jsx global>{`
          .pulse-glow {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          body {
            background-color: #030712;
            color: #e5e7eb;
            font-family: system-ui, -apple-system, sans-serif;
          }
        `}</style>
      </Head>
      
      {/* Redirect to static HTML file with full game logic */}
      <div style={{ display: 'none' }}>
        <iframe 
          src="/index.html" 
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title="ThreatRecon Simulator"
        />
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          window.location.href = '/index.html';
        `
      }} />
    </>
  );
}
