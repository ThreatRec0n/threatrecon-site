export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // AI Analyst Events - Random incident injects
  const eventTemplates = [
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'phishing',
      title: 'Suspicious Email Campaign Detected',
      description: 'Multiple users reporting suspicious emails from external sender. Potential credential harvesting attempt.',
      severity: 'high',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Review email headers and sender reputation. Consider blocking sender domain.',
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ransomware',
      title: 'Ransomware Activity Detected',
      description: 'File encryption signatures detected on workstation. Immediate containment required.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Isolate affected host immediately. Do not pay ransom. Check backup status.',
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'insider',
      title: 'Unusual Data Access Pattern',
      description: 'Analyst account accessing files outside normal scope. Review for potential insider threat.',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Verify legitimate business need. Check user activity logs for anomalies.',
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'malware',
      title: 'Malware Beacon Detection',
      description: 'Outbound C2 communication detected. System may be compromised.',
      severity: 'high',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Block outbound connection. Scan affected system. Check IoCs against threat intel.',
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ddos',
      title: 'DDoS Attack In Progress',
      description: 'High-volume traffic spike detected. Potential distributed denial-of-service attack.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Engage DDoS mitigation service. Scale up resources if needed. Monitor bandwidth.',
    },
  ];

  // Randomly select an event
  const event = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

  res.status(200).json(event);
}

