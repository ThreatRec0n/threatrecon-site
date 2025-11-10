import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SOC Simulation Dashboard',
  description: 'Interactive SOC simulation environment for threat hunting practice. Analyze logs, tag IOCs, investigate attacks, and complete realistic cybersecurity scenarios.',
  openGraph: {
    title: 'SOC Simulation Dashboard',
    description: 'Interactive SOC simulation environment for threat hunting practice.',
    type: 'website',
  },
  robots: {
    index: false, // Simulation dashboard should not be indexed
    follow: false,
  },
};

