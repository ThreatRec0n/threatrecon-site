// New SOC Simulation Dashboard Page

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { LearningProvider } from '@/lib/contexts/LearningContext';

// Dynamically import the heavy simulation dashboard (client-side only)
const SimulationDashboard = dynamic(() => import('@/components/soc-dashboard/SimulationDashboard'), {
  loading: () => (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
        <div className="h-64 bg-[#161b22] rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-96 bg-[#161b22] rounded"></div>
          <div className="h-96 bg-[#161b22] rounded"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false // Client-side only for interactive features
});

export default function SimulationPage() {
  return (
    <LearningProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-[#0d1117] p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
            <div className="h-64 bg-[#161b22] rounded"></div>
          </div>
        </div>
      }>
        <SimulationDashboard />
      </Suspense>
    </LearningProvider>
  );
}

