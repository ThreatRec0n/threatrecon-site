// Shared event generation logic
function generateEvent() {
  // Intel blurbs library
  const intelBlurbs = {
    phishing: [
      'IOC: Suspicious sender domain "secure-payment-update.com" registered 3 days ago.',
      'Pattern match: Known credential harvesting template from APT28 campaigns.',
      'TTP: Email contains VBScript macro attempting to download payload from C2.',
      'Victim count: 47 users clicked link within last hour.',
      'Intel: Attacker infrastructure overlaps with previous phishing campaigns.',
    ],
    ransomware: [
      'Encryption algorithm: Salsa20 cipher detected. Associated with LockBit variant.',
      'Ransom note found: Demands 2.5 BTC to decrypt files.',
      'Propagation: Lateral movement via RDP brute force from 185.12.33.4.',
      'Backup status: Last successful backup 72 hours ago. Recovery available.',
      'Timeline: Initial access 8 hours ago via phishing email. Encryption began 2 hours ago.',
    ],
    insider: [
      'Activity anomaly: User accessed 3x normal file volume outside business hours.',
      'Access pattern: Files downloaded to personal cloud storage service.',
      'Timeline: Unusual activity spike starting 6 days ago, peaking today.',
      'Risk assessment: High-value intellectual property files accessed.',
      'Behavior analysis: Access pattern deviates significantly from baseline.',
    ],
    malware: [
      'C2 beacon: Outbound connections to 203.0.113.45 on port 443.',
      'Malware family: Emotet trojan based on network traffic analysis.',
      'Infection vector: Delivered via malicious Word document in email attachment.',
      'Persistence: Scheduled task created to maintain access.',
      'IOC: SHA256 hash matches known malware sample from VirusTotal.',
    ],
    ddos: [
      'Traffic volume: 2.4 Gbps sustained, exceeding baseline by 4000%.',
      'Source IPs: 15,000+ unique IPs from global botnet network.',
      'Target: Primary web servers (ports 80/443) experiencing service degradation.',
      'Attack duration: Ongoing for 12 minutes. Mitigation services engaged.',
      'Geographic distribution: Attacks originating from 47 countries.',
    ],
    dataBreach: [
      'Exfiltration detected: 2.3 GB of customer data transferred to external IP.',
      'Data type: Customer PII (names, emails, SSNs) confirmed in exfiltrated payload.',
      'Entry point: SQL injection vulnerability in customer portal.',
      'Affected records: Approximately 12,000 customer profiles compromised.',
      'Timeline: Breach occurred 4 days ago. Discovery via DLP alert.',
    ],
    zeroDay: [
      'Vulnerability: Unpatched remote code execution in application framework.',
      'Exploit: Weaponized proof-of-concept targeting CVE-2025-XXXX.',
      'Attack surface: Public-facing API endpoint vulnerable to code injection.',
      'Mitigation: WAF rules deployed. Patch pending vendor release.',
      'Risk level: Critical - exploit requires no authentication to execute.',
    ],
    credentialStuffing: [
      'Login attempts: 847 failed authentication attempts from 212.14.9.201.',
      'Target accounts: Employee email addresses from previous breach.',
      'Success rate: 3 successful logins from compromised credentials.',
      'TTP: Automated tool rotating through password lists from data leaks.',
      'Indicators: User-Agent strings suggest use of credential stuffing framework.',
    ],
  };

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
      intelBlurb: intelBlurbs.phishing[Math.floor(Math.random() * intelBlurbs.phishing.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ransomware',
      title: 'Ransomware Activity Detected',
      description: 'File encryption signatures detected on workstation. Immediate containment required.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Isolate affected host immediately. Do not pay ransom. Check backup status.',
      intelBlurb: intelBlurbs.ransomware[Math.floor(Math.random() * intelBlurbs.ransomware.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'insider',
      title: 'Unusual Data Access Pattern',
      description: 'Analyst account accessing files outside normal scope. Review for potential insider threat.',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Verify legitimate business need. Check user activity logs for anomalies.',
      intelBlurb: intelBlurbs.insider[Math.floor(Math.random() * intelBlurbs.insider.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'malware',
      title: 'Malware Beacon Detection',
      description: 'Outbound C2 communication detected. System may be compromised.',
      severity: 'high',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Block outbound connection. Scan affected system. Check IoCs against threat intel.',
      intelBlurb: intelBlurbs.malware[Math.floor(Math.random() * intelBlurbs.malware.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ddos',
      title: 'DDoS Attack In Progress',
      description: 'High-volume traffic spike detected. Potential distributed denial-of-service attack.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Engage DDoS mitigation service. Scale up resources if needed. Monitor bandwidth.',
      intelBlurb: intelBlurbs.ddos[Math.floor(Math.random() * intelBlurbs.ddos.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'dataBreach',
      title: 'Data Exfiltration Detected',
      description: 'Large-scale data transfer to external IP address detected. Possible breach in progress.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Immediately block outbound connections. Assess data scope. Engage incident response team.',
      intelBlurb: intelBlurbs.dataBreach[Math.floor(Math.random() * intelBlurbs.dataBreach.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'zeroDay',
      title: 'Zero-Day Exploit Attempt Detected',
      description: 'Unusual attack pattern targeting unknown vulnerability. Potential zero-day exploit.',
      severity: 'critical',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Deploy WAF rules. Isolate affected systems. Contact vendor for patch status.',
      intelBlurb: intelBlurbs.zeroDay[Math.floor(Math.random() * intelBlurbs.zeroDay.length)],
    },
    {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'credentialStuffing',
      title: 'Credential Stuffing Attack',
      description: 'High volume of failed login attempts from known breach credentials. Automated attack suspected.',
      severity: 'high',
      timestamp: new Date().toISOString(),
      mitigationHint: 'Enable MFA for affected accounts. Block source IPs. Review successful logins.',
      intelBlurb: intelBlurbs.credentialStuffing[Math.floor(Math.random() * intelBlurbs.credentialStuffing.length)],
    },
  ];

  // Randomly select an event
  return eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
}

export default async function handler(req, res) {
  // Support GET for SSE, POST for one-time event
  if (req.method === 'GET') {
    // Server-Sent Events stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Event stream started' })}\n\n`);

    // Send first event immediately
    const firstEvent = generateEvent();
    res.write(`data: ${JSON.stringify(firstEvent)}\n\n`);

    // Send events every 15-25 seconds
    const sendEvent = () => {
      try {
        const event = generateEvent();
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate event' })}\n\n`);
      }
    };

    // Initial delay before first event (if needed)
    const intervalDelay = 15000 + Math.random() * 10000; // 15-25 seconds
    const interval = setInterval(sendEvent, intervalDelay);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (error) {
        clearInterval(heartbeat);
        clearInterval(interval);
      }
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clearInterval(interval);
    });

    return;
  }

  // POST method: return single event (for compatibility)
  if (req.method === 'POST') {
    const event = generateEvent();
    res.status(200).json(event);
    return;
  }

  // Method not allowed
  res.status(405).json({ error: 'Method not allowed' });
}
