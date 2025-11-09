'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to SOC Simulation Mode
    router.push('/simulation');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
        <p className="text-[#8b949e]">Loading SOC Simulation Dashboard...</p>
      </div>
    </div>
  );
}
