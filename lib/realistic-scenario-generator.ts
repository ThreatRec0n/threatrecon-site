import type { Scenario, SecurityAlert, SIEMEvent, DifficultyLevel } from './types';
import { KNOWN_MALICIOUS_IPS } from './threat-intel';

export interface GameScenario {
  scenario: Scenario;
  events: SIEMEvent[];
  maliciousIPs: string[];
}

export function generateRealisticScenario(
  baseScenario: Scenario,
  seed?: number
): GameScenario {
  const random = seed ? seededRandom(seed) : Math.random;
  
  // Determine number of malicious IPs based on difficulty
  const maliciousIPCount = 
    baseScenario.difficulty === 'beginner' ? 3 :
    baseScenario.difficulty === 'intermediate' ? 2 :
    1; // advanced
  
  // Select malicious IPs
  const maliciousIPs = shuffleArray([...KNOWN_MALICIOUS_IPS], random)
    .slice(0, maliciousIPCount);
  
  // Generate realistic events (mostly benign with a few malicious ones)
  const events = generateRealisticEvents(maliciousIPs, baseScenario.difficulty, random);
  
  // Generate alerts (mix of true positives and false positives)
  const alerts = generateRealisticAlerts(maliciousIPs, baseScenario.difficulty, random);
  
  return {
    scenario: {
      ...baseScenario,
      seed: seed || Math.floor(Math.random() * 1000000),
      alerts,
      randomizedIps: {
        malicious: maliciousIPs,
        benign: generateBenignIPs(50 + Math.floor(random() * 50), random),
      },
    },
    events,
    maliciousIPs,
  };
}

function generateRealisticEvents(
  maliciousIPs: string[],
  difficulty: DifficultyLevel,
  random: () => number
): SIEMEvent[] {
  const events: SIEMEvent[] = [];
  const totalEvents = 
    difficulty === 'beginner' ? 200 :
    difficulty === 'intermediate' ? 500 :
    1000; // advanced - more noise
  
  // Most events should be benign (info/low severity)
  const benignRatio = 0.85; // 85% benign
  const maliciousRatio = 0.10; // 10% malicious indicators
  const suspiciousRatio = 0.05; // 5% suspicious but benign (false positives)
  
  const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
  const endTime = Date.now();
  
  for (let i = 0; i < totalEvents; i++) {
    const timestamp = new Date(startTime + (random() * (endTime - startTime))).toISOString();
    const roll = random();
    
    if (roll < benignRatio) {
      // Benign event (info/low severity)
      events.push(generateBenignEvent(i, timestamp, random));
    } else if (roll < benignRatio + maliciousRatio) {
      // Malicious event (related to malicious IPs)
      const maliciousIP = maliciousIPs[Math.floor(random() * maliciousIPs.length)];
      events.push(generateMaliciousEvent(i, timestamp, maliciousIP, random));
    } else {
      // Suspicious but benign (false positive)
      events.push(generateSuspiciousBenignEvent(i, timestamp, random));
    }
  }
  
  // Sort by timestamp
  return events.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function generateBenignEvent(index: number, timestamp: string, random: () => number): SIEMEvent {
  const eventTypes = [
    { type: 'DNS Query', message: 'DNS lookup for microsoft.com' },
    { type: 'HTTP Request', message: 'GET /api/health HTTP/1.1' },
    { type: 'Connection', message: 'TCP connection established' },
    { type: 'File Access', message: 'File read: C:\\Windows\\System32\\config\\system' },
    { type: 'Process', message: 'Process started: chrome.exe' },
    { type: 'Login', message: 'User login successful' },
  ];
  
  const eventType = eventTypes[Math.floor(random() * eventTypes.length)];
  const severity = random() > 0.9 ? 'low' : 'info'; // 90% info, 10% low
  
  return {
    id: `event-${index}`,
    timestamp,
    sourceIP: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    destinationIP: generateBenignIPs(1, random)[0],
    eventType: eventType.type,
    message: eventType.message,
  };
}

function generateMaliciousEvent(
  index: number,
  timestamp: string,
  maliciousIP: string,
  random: () => number
): SIEMEvent {
  const maliciousPatterns = [
    { type: 'Connection', message: `Outbound connection to ${maliciousIP}`, severity: 'high' as const },
    { type: 'DNS Query', message: `DNS lookup for suspicious domain resolving to ${maliciousIP}`, severity: 'medium' as const },
    { type: 'HTTP Request', message: `POST request to ${maliciousIP}/api/beacon`, severity: 'high' as const },
    { type: 'File Access', message: `File written: C:\\Users\\Temp\\payload.exe (hash matches known malware)`, severity: 'critical' as const },
    { type: 'Process', message: `Suspicious process: powershell.exe -enc [base64]`, severity: 'high' as const },
  ];
  
  const pattern = maliciousPatterns[Math.floor(random() * maliciousPatterns.length)];
  
  return {
    id: `event-mal-${index}`,
    timestamp,
    sourceIP: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    destinationIP: maliciousIP,
    eventType: pattern.type,
    message: pattern.message,
  };
}

function generateSuspiciousBenignEvent(index: number, timestamp: string, random: () => number): SIEMEvent {
  const suspiciousButBenign = [
    { type: 'Connection', message: 'Outbound connection to cloud service (legitimate backup)', severity: 'low' as const },
    { type: 'Process', message: 'PowerShell execution (scheduled task - software update)', severity: 'low' as const },
    { type: 'File Access', message: 'Large file transfer (scheduled backup)', severity: 'low' as const },
  ];
  
  const pattern = suspiciousButBenign[Math.floor(random() * suspiciousButBenign.length)];
  
  return {
    id: `event-susp-${index}`,
    timestamp,
    sourceIP: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    destinationIP: generateBenignIPs(1, random)[0],
    eventType: pattern.type,
    message: pattern.message,
  };
}

function generateRealisticAlerts(
  maliciousIPs: string[],
  difficulty: DifficultyLevel,
  random: () => number
): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  
  // Number of alerts varies by difficulty
  const totalAlerts = 
    difficulty === 'beginner' ? 8 :
    difficulty === 'intermediate' ? 15 :
    25; // advanced - more noise
  
  // Ratio of true positives to false positives
  const truePositiveRatio =
    difficulty === 'beginner' ? 0.5 : // 50% true positives
    difficulty === 'intermediate' ? 0.4 : // 40% true positives
    0.3; // Advanced: 30% true positives (harder to find)
  
  const numTruePositives = Math.floor(totalAlerts * truePositiveRatio);
  const numFalsePositives = totalAlerts - numTruePositives;
  
  // Generate true positive alerts (one per malicious IP, plus some extras for beginner)
  const truePositiveCount = Math.min(numTruePositives, maliciousIPs.length + (difficulty === 'beginner' ? 1 : 0));
  
  for (let i = 0; i < truePositiveCount; i++) {
    const maliciousIP = maliciousIPs[i % maliciousIPs.length];
    alerts.push(generateTruePositiveAlert(i, maliciousIP, difficulty, random));
  }
  
  // Generate false positive alerts
  for (let i = 0; i < numFalsePositives; i++) {
    alerts.push(generateFalsePositiveAlert(i, random));
  }
  
  // Shuffle to mix them up
  return shuffleArray(alerts, random);
}

function generateTruePositiveAlert(
  index: number,
  maliciousIP: string,
  difficulty: DifficultyLevel,
  random: () => number
): SecurityAlert {
  const alertTypes = [
    {
      ruleName: 'Suspicious Outbound Connection to Known C2',
      mitreTechniques: ['T1071.001'],
      severity: 'high' as const,
      indicators: ['Connection to known malicious IP', 'Small periodic byte transfers', 'Off-hours activity'],
    },
    {
      ruleName: 'Potential Data Exfiltration',
      mitreTechniques: ['T1048'],
      severity: 'critical' as const,
      indicators: ['Large outbound transfer', 'Unusual destination IP', 'Encrypted payload'],
    },
    {
      ruleName: 'Suspicious PowerShell Execution',
      mitreTechniques: ['T1059.001'],
      severity: 'high' as const,
      indicators: ['Base64 encoded command', 'Execution from Word.exe', 'Network activity to external IP'],
    },
  ];
  
  const type = alertTypes[Math.floor(random() * alertTypes.length)];
  
  // Make it harder to find based on difficulty
  const timestampOffset = 
    difficulty === 'beginner' ? random() * 3600000 : // Within last hour
    difficulty === 'intermediate' ? random() * 86400000 : // Within last day
    random() * 604800000; // Within last week (advanced)
  
  return {
    id: `alert-tp-${index}`,
    ruleName: type.ruleName,
    ruleId: `rule-${index}`,
    severity: type.severity,
    timestamp: new Date(Date.now() - timestampOffset).toISOString(),
    status: 'new',
    classification: 'unclassified',
    correctClassification: 'true-positive',
    mitreTechniques: type.mitreTechniques,
    mitreTactics: ['Command and Control', 'Exfiltration'],
    srcIp: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    dstIp: maliciousIP,
    keyIndicators: type.indicators,
    explanation: `This is a true positive. ${type.ruleName} indicates actual malicious activity from ${maliciousIP}.`,
    isTraining: true,
    events: [],
    threatIntelMatches: [{
      type: 'ip',
      value: maliciousIP,
      source: 'AbuseIPDB',
      reputation: 'malicious',
      description: 'Known C2 server associated with ransomware operations',
    }],
  };
}

function generateFalsePositiveAlert(index: number, random: () => number): SecurityAlert {
  const falsePositiveTypes = [
    {
      ruleName: 'Suspicious PowerShell Encoding Detected',
      whyFalse: 'Legitimate software update script using encoded PowerShell for deployment',
      indicators: ['Base64 encoded PowerShell', 'Execution from scheduled task', 'Signed by vendor'],
      severity: 'medium' as const,
    },
    {
      ruleName: 'Beaconing Activity Detected',
      whyFalse: 'Legitimate monitoring tool checking in with cloud service',
      indicators: ['Periodic connections', 'Known SaaS provider', 'Expected behavior'],
      severity: 'low' as const,
    },
    {
      ruleName: 'Unusual Login Pattern',
      whyFalse: 'Employee working from different timezone',
      indicators: ['Login from new location', 'Valid credentials', 'Normal business hours in their timezone'],
      severity: 'low' as const,
    },
    {
      ruleName: 'Large Data Transfer',
      whyFalse: 'Scheduled backup to cloud storage',
      indicators: ['Large file transfer', 'Known backup service', 'Scheduled time'],
      severity: 'medium' as const,
    },
  ];
  
  const type = falsePositiveTypes[Math.floor(random() * falsePositiveTypes.length)];
  
  return {
    id: `alert-fp-${index}`,
    ruleName: type.ruleName,
    ruleId: `rule-fp-${index}`,
    severity: type.severity,
    timestamp: new Date(Date.now() - random() * 3600000).toISOString(),
    status: 'new',
    classification: 'unclassified',
    correctClassification: 'false-positive',
    mitreTechniques: [],
    mitreTactics: [],
    srcIp: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    dstIp: generateBenignIPs(1, random)[0],
    keyIndicators: type.indicators,
    explanation: `This is a false positive. ${type.whyFalse}`,
    isTraining: true,
    events: [],
  };
}

function generateBenignIPs(count: number, random: () => number): string[] {
  const ips: string[] = [];
  const commonServices = [
    '8.8.8.8', '8.8.4.4', // Google DNS
    '1.1.1.1', '1.0.0.1', // Cloudflare DNS
    '208.67.222.222', '208.67.220.220', // OpenDNS
    '13.107.42.14', '40.126.25.81', // Microsoft
    '52.167.144.188', '20.190.128.0', // Azure
    '151.101.1.140', '151.101.65.140', // Fastly
    '104.16.132.229', '104.16.133.229', // Cloudflare
  ];
  
  for (let i = 0; i < count; i++) {
    if (i < commonServices.length) {
      ips.push(commonServices[i]);
    } else {
      // Generate random public IP (not in malicious list)
      const octet1 = Math.floor(random() * 223) + 1; // 1-223
      const octet2 = Math.floor(random() * 256);
      const octet3 = Math.floor(random() * 256);
      const octet4 = Math.floor(random() * 256);
      ips.push(`${octet1}.${octet2}.${octet3}.${octet4}`);
    }
  }
  
  return ips;
}

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

