import type { Scenario, SecurityAlert, SIEMEvent, DifficultyLevel } from './types';
import { KNOWN_MALICIOUS_IPS, KNOWN_MALICIOUS_DOMAINS } from './threat-intel';

export function generateRandomizedScenario(
  baseScenario: Scenario,
  seed?: number
): Scenario {
  const random = seed ? seededRandom(seed) : Math.random;
  
  // Generate random malicious IPs from threat intel
  const maliciousIps = shuffleArray([...KNOWN_MALICIOUS_IPS], random)
    .slice(0, 3 + Math.floor(random() * 3));
  
  // Generate random benign IPs
  const benignIps = generateBenignIPs(5 + Math.floor(random() * 5), random);
  
  // Generate random domains
  const maliciousDomains = shuffleArray([...KNOWN_MALICIOUS_DOMAINS], random)
    .slice(0, 2 + Math.floor(random() * 2));
  const benignDomains = generateBenignDomains(5 + Math.floor(random() * 5), random);
  
  // Randomize alert mix based on difficulty
  const alertMix = generateAlertMix(baseScenario.difficulty, random);
  
  return {
    ...baseScenario,
    seed: seed || Math.floor(Math.random() * 1000000),
    randomizedIps: {
      malicious: maliciousIps,
      benign: benignIps,
    },
    randomizedDomains: {
      malicious: maliciousDomains,
      benign: benignDomains,
    },
    alerts: alertMix,
    showFeedback: baseScenario.difficulty === 'grasshopper' || baseScenario.difficulty === 'beginner',
  };
}

function generateAlertMix(
  difficulty: DifficultyLevel,
  random: () => number
): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  
  // Number of alerts varies by difficulty
  const totalAlerts = 
    difficulty === 'grasshopper' ? 5 :
    difficulty === 'beginner' ? 5 :
    difficulty === 'intermediate' ? 8 :
    12;
  
  // Ratio of true positives to false positives
  const truePositiveRatio =
    difficulty === 'grasshopper' ? 0.8 :
    difficulty === 'beginner' ? 0.7 :
    difficulty === 'intermediate' ? 0.6 :
    0.5; // Advanced: 50/50 mix
  
  const numTruePositives = Math.floor(totalAlerts * truePositiveRatio);
  const numFalsePositives = totalAlerts - numTruePositives;
  
  // Generate true positive alerts
  for (let i = 0; i < numTruePositives; i++) {
    alerts.push(generateTruePositiveAlert(i, random));
  }
  
  // Generate false positive alerts
  for (let i = 0; i < numFalsePositives; i++) {
    alerts.push(generateFalsePositiveAlert(i, random));
  }
  
  // Shuffle to mix them up
  return shuffleArray(alerts, random);
}

function generateTruePositiveAlert(index: number, random: () => number): SecurityAlert {
  const alertTypes = [
    {
      ruleName: 'Suspicious PowerShell Encoding Detected',
      mitreTechniques: ['T1059.001'],
      severity: 'high' as const,
      indicators: ['Base64 encoded PowerShell', 'Execution from Word.exe', 'No user interaction'],
    },
    {
      ruleName: 'Beaconing Activity Detected',
      mitreTechniques: ['T1071.001'],
      severity: 'critical' as const,
      indicators: ['Periodic connections every 60s', 'Small byte counts', 'External C2 IP'],
    },
    {
      ruleName: 'Data Exfiltration Attempt',
      mitreTechniques: ['T1048'],
      severity: 'high' as const,
      indicators: ['Large outbound transfer', 'Unusual destination', 'Off-hours activity'],
    },
    {
      ruleName: 'Lateral Movement via SMB',
      mitreTechniques: ['T1021.002'],
      severity: 'medium' as const,
      indicators: ['SMB connection to multiple hosts', 'Unusual user account', 'After-hours access'],
    },
  ];
  
  const type = alertTypes[Math.floor(random() * alertTypes.length)];
  const maliciousIp = KNOWN_MALICIOUS_IPS[Math.floor(random() * KNOWN_MALICIOUS_IPS.length)];
  
  return {
    id: `alert-tp-${index}`,
    ruleName: type.ruleName,
    ruleId: `rule-${index}`,
    severity: type.severity,
    timestamp: new Date(Date.now() - Math.floor(random() * 3600000)).toISOString(),
    status: 'new',
    classification: 'unclassified',
    correctClassification: 'true-positive',
    mitreTechniques: type.mitreTechniques,
    mitreTactics: ['Execution', 'Command and Control'],
    srcIp: `10.0.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`,
    dstIp: maliciousIp,
    keyIndicators: type.indicators,
    explanation: `This is a true positive. ${type.ruleName} indicates actual malicious activity.`,
    isTraining: true,
    events: [],
    threatIntelMatches: [{
      type: 'ip',
      value: maliciousIp,
      source: 'AbuseIPDB',
      reputation: 'malicious',
      description: 'Known C2 server',
    }],
  };
}

function generateFalsePositiveAlert(index: number, random: () => number): SecurityAlert {
  const falsePositiveTypes = [
    {
      ruleName: 'Suspicious PowerShell Encoding Detected',
      whyFalse: 'Legitimate software update script using encoded PowerShell for deployment',
      indicators: ['Base64 encoded PowerShell', 'Execution from scheduled task', 'Signed by vendor'],
    },
    {
      ruleName: 'Beaconing Activity Detected',
      whyFalse: 'Legitimate monitoring tool checking in with cloud service',
      indicators: ['Periodic connections', 'Known SaaS provider', 'Expected behavior'],
    },
    {
      ruleName: 'Unusual Login Pattern',
      whyFalse: 'Employee working from different timezone',
      indicators: ['Login from new location', 'Valid credentials', 'Normal business hours in their timezone'],
    },
  ];
  
  const type = falsePositiveTypes[Math.floor(random() * falsePositiveTypes.length)];
  
  return {
    id: `alert-fp-${index}`,
    ruleName: type.ruleName,
    ruleId: `rule-fp-${index}`,
    severity: 'medium',
    timestamp: new Date(Date.now() - Math.floor(random() * 3600000)).toISOString(),
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
    '8.8.8.8', // Google DNS
    '1.1.1.1', // Cloudflare DNS
    '208.67.222.222', // OpenDNS
    '13.107.42.14', // Microsoft
    '52.167.144.188', // Azure
  ];
  
  for (let i = 0; i < count; i++) {
    if (i < commonServices.length) {
      ips.push(commonServices[i]);
    } else {
      // Generate random public IP
      ips.push(`${Math.floor(random() * 255)}.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}.${Math.floor(random() * 255)}`);
    }
  }
  
  return ips;
}

function generateBenignDomains(count: number, random: () => number): string[] {
  const domains = [
    'microsoft.com',
    'google.com',
    'amazonaws.com',
    'cloudflare.com',
    'github.com',
  ];
  
  return domains.slice(0, Math.min(count, domains.length));
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
