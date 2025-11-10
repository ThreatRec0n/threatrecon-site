import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'View top performances in timed threat hunting challenges. Compete with other analysts and track your progress on the ThreatRecon leaderboard.',
  openGraph: {
    title: 'ThreatRecon Leaderboard',
    description: 'Top performances in timed threat hunting challenges.',
    type: 'website',
  },
  robots: {
    index: false, // Leaderboard should not be indexed
    follow: false,
  },
};

