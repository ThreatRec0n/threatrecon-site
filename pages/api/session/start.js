export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock session start data
  const sessionData = {
    rank: "Trainee",
    xp: 0,
    incidentsHandled: 0,
    avgContainmentTime: 0,
    difficultyTier: "Trainee",
    activeIncidents: 23,
    intelFeed: [
      "ShadowCobra ransomware exploiting CVE-2025-1182.",
      "Credential stuffing from 212.14.9.201.",
      "APT29 lateral movement via LOLBins.",
    ],
    sessionId: `session-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  res.status(200).json(sessionData);
}

