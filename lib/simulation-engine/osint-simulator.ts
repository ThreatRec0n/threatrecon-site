// OSINT Simulator - Simulates threat intelligence API responses

interface OsintResult {
  threat_score: number;
  classification: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  details: Record<string, any>;
  sources: string[];
}

export class OsintSimulator {
  private knownMaliciousIPs = new Set<string>();
  private knownBenignIPs = new Set<string>();
  
  constructor(scenarioConfig: { malicious_ips: string[]; benign_ips: string[] }) {
    scenarioConfig.malicious_ips.forEach(ip => this.knownMaliciousIPs.add(ip));
    scenarioConfig.benign_ips.forEach(ip => this.knownBenignIPs.add(ip));
  }
  
  async virusTotalIP(ip: string): Promise<OsintResult> {
    await this.simulateLatency(800, 1500);
    
    if (this.knownMaliciousIPs.has(ip)) {
      return {
        threat_score: 85,
        classification: 'malicious',
        details: {
          positives: 42,
          total_engines: 89,
          last_analysis_stats: {
            malicious: 42,
            suspicious: 8,
            undetected: 39,
            timeout: 0
          },
          tags: ['botnet', 'c2', 'malware-distribution'],
          reputation: -15
        },
        sources: ['VirusTotal']
      };
    }
    
    if (this.knownBenignIPs.has(ip)) {
      return {
        threat_score: 5,
        classification: 'benign',
        details: {
          positives: 0,
          total_engines: 89,
          last_analysis_stats: {
            malicious: 0,
            suspicious: 0,
            undetected: 89,
            timeout: 0
          },
          reputation: 0
        },
        sources: ['VirusTotal']
      };
    }
    
    return {
      threat_score: 30,
      classification: 'unknown',
      details: {
        positives: 2,
        total_engines: 89,
        last_analysis_stats: {
          malicious: 2,
          suspicious: 3,
          undetected: 84,
          timeout: 0
        },
        reputation: -2
      },
      sources: ['VirusTotal']
    };
  }
  
  async abuseIPDB(ip: string): Promise<OsintResult> {
    await this.simulateLatency(500, 1000);
    
    if (this.knownMaliciousIPs.has(ip)) {
      return {
        threat_score: 95,
        classification: 'malicious',
        details: {
          abuseConfidenceScore: 98,
          totalReports: 156,
          numDistinctUsers: 47,
          lastReportedAt: new Date().toISOString(),
          usageType: 'Data Center/Web Hosting/Transit',
          isp: 'AS-CHOOPA',
          domain: 'choopa.com',
          countryCode: 'US',
          categories: [18, 21, 22],
        },
        sources: ['AbuseIPDB']
      };
    }
    
    return {
      threat_score: 0,
      classification: 'benign',
      details: {
        abuseConfidenceScore: 0,
        totalReports: 0,
        numDistinctUsers: 0,
        isWhitelisted: false,
        usageType: 'Corporate',
        isp: 'Microsoft Corporation',
        countryCode: 'US'
      },
      sources: ['AbuseIPDB']
    };
  }
  
  async greyNoise(ip: string): Promise<OsintResult> {
    await this.simulateLatency(600, 1200);
    
    if (this.knownMaliciousIPs.has(ip)) {
      return {
        threat_score: 80,
        classification: 'malicious',
        details: {
          seen: true,
          classification: 'malicious',
          first_seen: '2024-01-15',
          last_seen: new Date().toISOString(),
          tags: ['Mirai', 'Web Scanner', 'VPN'],
          actor: 'unknown',
          spoofable: false,
          vpn: false,
          vpn_service: '',
          metadata: {
            asn: 'AS14061',
            city: 'Columbus',
            country: 'United States',
            country_code: 'US',
            organization: 'DigitalOcean, LLC'
          }
        },
        sources: ['GreyNoise']
      };
    }
    
    return {
      threat_score: 10,
      classification: 'benign',
      details: {
        seen: true,
        classification: 'benign',
        tags: ['Microsoft', 'CDN'],
        actor: 'Microsoft Azure',
        spoofable: false,
        vpn: false
      },
      sources: ['GreyNoise']
    };
  }
  
  async whois(domain: string): Promise<OsintResult> {
    await this.simulateLatency(1000, 2000);
    
    const knownMaliciousDomains = ['c2-malicious-domain.com', 'evil-payload.net'];
    
    if (knownMaliciousDomains.includes(domain)) {
      return {
        threat_score: 70,
        classification: 'suspicious',
        details: {
          domain_name: domain,
          registrar: 'NameCheap, Inc.',
          creation_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          expiration_date: new Date(Date.now() + 358 * 24 * 60 * 60 * 1000).toISOString(),
          updated_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: ['clientTransferProhibited'],
          registrant_org: 'REDACTED FOR PRIVACY',
          registrant_country: 'PA',
          name_servers: ['ns1.privatedomains.com', 'ns2.privatedomains.com'],
          dnssec: 'unsigned',
          age_days: 7,
        },
        sources: ['WHOIS']
      };
    }
    
    return {
      threat_score: 5,
      classification: 'benign',
      details: {
        domain_name: domain,
        registrar: 'MarkMonitor, Inc.',
        creation_date: '2010-03-15T00:00:00Z',
        expiration_date: '2028-03-15T00:00:00Z',
        registrant_org: 'Google LLC',
        registrant_country: 'US',
        name_servers: ['ns1.google.com', 'ns2.google.com'],
        dnssec: 'signedDelegation',
        age_days: Math.floor((Date.now() - new Date('2010-03-15').getTime()) / (24 * 60 * 60 * 1000))
      },
      sources: ['WHOIS']
    };
  }
  
  async aggregateLookup(
    indicator: string,
    type: 'ip' | 'domain' | 'hash'
  ): Promise<{
    consensus: OsintResult;
    individual_results: Array<{ tool: string; result: OsintResult }>;
  }> {
    const results: Array<{ tool: string; result: OsintResult }> = [];
    
    if (type === 'ip') {
      const vt = await this.virusTotalIP(indicator);
      const abuse = await this.abuseIPDB(indicator);
      const grey = await this.greyNoise(indicator);
      
      results.push(
        { tool: 'VirusTotal', result: vt },
        { tool: 'AbuseIPDB', result: abuse },
        { tool: 'GreyNoise', result: grey }
      );
    } else if (type === 'domain') {
      const whoisResult = await this.whois(indicator);
      results.push({ tool: 'WHOIS', result: whoisResult });
    }
    
    const avgScore = results.reduce((sum, r) => sum + r.result.threat_score, 0) / results.length;
    const maliciousCount = results.filter(r => r.result.classification === 'malicious').length;
    
    let consensusClassification: OsintResult['classification'];
    if (maliciousCount >= 2) {
      consensusClassification = 'malicious';
    } else if (avgScore > 60) {
      consensusClassification = 'suspicious';
    } else if (avgScore < 20) {
      consensusClassification = 'benign';
    } else {
      consensusClassification = 'unknown';
    }
    
    return {
      consensus: {
        threat_score: Math.round(avgScore),
        classification: consensusClassification,
        details: {
          average_score: avgScore,
          malicious_votes: maliciousCount,
          total_sources: results.length
        },
        sources: results.map(r => r.tool)
      },
      individual_results: results
    };
  }
  
  private simulateLatency(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

