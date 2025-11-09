import type { ThreatIntelMatch } from './types';

// Real malicious IPs from known threat intelligence sources
// These are actual IPs that appear in threat feeds
export const KNOWN_MALICIOUS_IPS = [
  '185.220.101.0', // Example - replace with real threat intel
  '45.146.164.110',
  '185.220.100.0',
  '185.220.102.0',
  '185.220.103.0',
  '45.146.164.111',
  '45.146.164.112',
  '185.220.104.0',
  // Add more from real threat feeds
];

export const KNOWN_MALICIOUS_DOMAINS = [
  'malicious-domain-1.com',
  'suspicious-c2.net',
  'phishing-site.org',
  // Add more
];

export const KNOWN_MALICIOUS_HASHES = [
  'a1b2c3d4e5f6...', // Example SHA256
  // Add more
];

export interface ThreatIntelLookupResult {
  matches: ThreatIntelMatch[];
  reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  confidence: number;
}

export async function lookupThreatIntel(
  type: 'ip' | 'domain' | 'hash',
  value: string
): Promise<ThreatIntelLookupResult> {
  // Simulate threat intel lookup with realistic delays
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
  
  const matches: ThreatIntelMatch[] = [];
  let reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown' = 'unknown';
  let confidence = 0;
  
  if (type === 'ip') {
    const isMalicious = KNOWN_MALICIOUS_IPS.some(ip => 
      value.startsWith(ip.split('.').slice(0, 3).join('.'))
    );
    
    if (isMalicious) {
      reputation = 'malicious';
      confidence = 85;
      matches.push({
        type: 'ip',
        value,
        source: 'AbuseIPDB',
        reputation: 'malicious',
        firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date().toISOString(),
        country: getRandomCountry(),
        asn: `AS${Math.floor(Math.random() * 100000)}`,
        description: 'IP address associated with malicious activity including botnet C2, phishing, and malware distribution',
        threatActor: 'Unknown',
      });
      
      // Simulate multiple source matches
      if (Math.random() > 0.5) {
        matches.push({
          type: 'ip',
          value,
          source: 'VirusTotal',
          reputation: 'malicious',
          description: 'Multiple security vendors flagged this IP',
        });
      }
    } else if (isPrivateIP(value)) {
      reputation = 'clean';
      confidence = 100;
    } else {
      // Random chance of suspicious
      if (Math.random() > 0.7) {
        reputation = 'suspicious';
        confidence = 45;
        matches.push({
          type: 'ip',
          value,
          source: 'OTX',
          reputation: 'suspicious',
          description: 'Low reputation score, limited historical data',
        });
      } else {
        reputation = 'clean';
        confidence = 60;
      }
    }
  } else if (type === 'domain') {
    const isMalicious = KNOWN_MALICIOUS_DOMAINS.some(d => 
      value.includes(d) || d.includes(value)
    );
    
    if (isMalicious) {
      reputation = 'malicious';
      confidence = 90;
      matches.push({
        type: 'domain',
        value,
        source: 'PhishTank',
        reputation: 'malicious',
        description: 'Domain flagged for phishing activity',
      });
    } else {
      reputation = 'clean';
      confidence = 70;
    }
  } else if (type === 'hash') {
    const isMalicious = KNOWN_MALICIOUS_HASHES.some(h => h === value);
    
    if (isMalicious) {
      reputation = 'malicious';
      confidence = 95;
      matches.push({
        type: 'hash',
        value,
        source: 'VirusTotal',
        reputation: 'malicious',
        malwareFamily: 'Trojan.Generic',
        description: 'Detected as malware by 45/67 security vendors',
      });
    } else {
      reputation = 'clean';
      confidence = 80;
    }
  }
  
  return { matches, reputation, confidence };
}

function isPrivateIP(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function getRandomCountry(): string {
  const countries = ['RU', 'CN', 'KP', 'IR', 'UA', 'TR', 'BR'];
  return countries[Math.floor(Math.random() * countries.length)];
}
