// This page redirects to the static HTML file
// The actual game logic is in public/index.html
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/index.html';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-200">
      <p className="font-mono">Loading ThreatRecon...</p>
    </div>
  );
}
