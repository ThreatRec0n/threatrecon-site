import type { Alert } from '@/lib/simulation-engine/core-types';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';

export type IOCTag = 'threat' | 'suspicious' | 'benign' | 'unclassified';

export interface IOCResult {
  ioc: string;
  type: 'ip' | 'domain' | 'hash' | 'process';
  userTag: IOCTag;
  correctTag: 'threat' | 'suspicious' | 'benign';
  explanation: string;
  mitreTechnique?: string;
}

export interface ScoreBreakdown {
  correctThreats: number; // +10 each
  correctBenign: number; // +5 each
  correctSuspicious: number; // +7 each
  missedThreats: number; // -15 each
  falsePositives: number; // -5 each
  slaBreaches: number; // -10 each
  speedBonus: number; // +0 to +20
  accuracyBonus: number; // +0 to +10
}

export interface EvaluationResult {
  score: number; // 0-100
  maxScore: number;
  accuracy: number; // percentage
  timeTaken: number; // seconds
  slaBreaches: number;
  correctlyIdentified: IOCResult[];
  missedThreats: IOCResult[];
  falsePositives: IOCResult[];
  suggestions: string[];
  mitreTechniques: string[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ScoreBreakdown;
}

// Ground truth IOCs extracted from events
interface GroundTruthIOC {
  ioc: string;
  type: 'ip' | 'domain' | 'hash' | 'process';
  correctTag: 'threat' | 'suspicious' | 'benign';
  mitreTechnique?: string;
  explanation: string;
}

function extractGroundTruthIOCs(events: SimulatedEvent[]): GroundTruthIOC[] {
  const iocs: GroundTruthIOC[] = [];
  const seen = new Set<string>();

  events.forEach(event => {
    // Only extract from malicious events (threat_score >= 60)
    if ((event.threat_score || 0) < 60) return;

    // Extract IPs
    if (event.network_context?.dest_ip && !event.network_context.dest_ip.startsWith('10.')) {
      const ip = event.network_context.dest_ip;
      if (!seen.has(`ip:${ip}`)) {
        seen.add(`ip:${ip}`);
        iocs.push({
          ioc: ip,
          type: 'ip',
          correctTag: event.threat_score >= 80 ? 'threat' : 'suspicious',
          mitreTechnique: event.technique_id,
          explanation: `This IP (${ip}) was a known C2 server used in the ${event.stage} stage. You should have tagged it as a threat because it's associated with malicious activity.`
        });
      }
    }

    // Extract domains
    if (event.details?.QueryName) {
      const domain = event.details.QueryName;
      if (!seen.has(`domain:${domain}`)) {
        seen.add(`domain:${domain}`);
        iocs.push({
          ioc: domain,
          type: 'domain',
          correctTag: event.threat_score >= 80 ? 'threat' : 'suspicious',
          mitreTechnique: event.technique_id,
          explanation: `This domain (${domain}) hosted the malware payload or was used for C2 communication.`
        });
      }
    }

    if (event.details?.host && !event.details.host.includes('microsoft.com') && !event.details.host.includes('google.com')) {
      const domain = event.details.host;
      if (!seen.has(`domain:${domain}`)) {
        seen.add(`domain:${domain}`);
        iocs.push({
          ioc: domain,
          type: 'domain',
          correctTag: event.threat_score >= 80 ? 'threat' : 'suspicious',
          mitreTechnique: event.technique_id,
          explanation: `This domain was contacted during the attack chain.`
        });
      }
    }

    // Extract hashes
    if (event.details?.Hashes) {
      const hashMatch = event.details.Hashes.match(/SHA256=([A-Fa-f0-9]+)/);
      if (hashMatch) {
        const hash = hashMatch[1];
        if (!seen.has(`hash:${hash}`)) {
          seen.add(`hash:${hash}`);
          iocs.push({
            ioc: hash,
            type: 'hash',
            correctTag: 'threat',
            mitreTechnique: event.technique_id,
            explanation: `This file hash belongs to malicious software used in the attack.`
          });
        }
      }
    }

    // Extract process names from high-threat events
    if (event.process_tree && event.threat_score >= 80) {
      const processName = event.process_tree.process_name;
      if (processName && !seen.has(`process:${processName}`)) {
        seen.add(`process:${processName}`);
        iocs.push({
          ioc: processName,
          type: 'process',
          correctTag: 'threat',
          mitreTechnique: event.technique_id,
          explanation: `This process (${processName}) is a known malicious tool or was used maliciously.`
        });
      }
    }
  });

  // Add benign IOCs (common legitimate domains/IPs)
  const benignIOCs: GroundTruthIOC[] = [
    {
      ioc: 'docs.microsoft.com',
      type: 'domain',
      correctTag: 'benign',
      explanation: 'This is a legitimate Microsoft domain commonly accessed in enterprise environments. Marking legitimate infrastructure as malicious can cause unnecessary alarm.'
    },
    {
      ioc: 'update.microsoft.com',
      type: 'domain',
      correctTag: 'benign',
      explanation: 'This is Microsoft\'s update server. It\'s normal for Windows systems to contact this domain.'
    },
    {
      ioc: 'fonts.googleapis.com',
      type: 'domain',
      correctTag: 'benign',
      explanation: 'This is Google\'s font service, commonly used by legitimate websites.'
    }
  ];

  return [...iocs, ...benignIOCs];
}

export function evaluateInvestigation(
  alerts: Alert[],
  userIOCTags: Map<string, IOCTag>,
  timeTaken: number,
  events: SimulatedEvent[]
): EvaluationResult {
  const groundTruth = extractGroundTruthIOCs(events);
  
  const correctlyIdentified: IOCResult[] = [];
  const missedThreats: IOCResult[] = [];
  const falsePositives: IOCResult[] = [];

  const breakdown: ScoreBreakdown = {
    correctThreats: 0,
    correctBenign: 0,
    correctSuspicious: 0,
    missedThreats: 0,
    falsePositives: 0,
    slaBreaches: 0,
    speedBonus: 0,
    accuracyBonus: 0
  };

  // Check each ground truth IOC
  groundTruth.forEach(truth => {
    const userTag = userIOCTags.get(truth.ioc) || 'unclassified';

    if (truth.correctTag === 'threat') {
      if (userTag === 'threat') {
        breakdown.correctThreats++;
        correctlyIdentified.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: 'threat',
          correctTag: 'threat',
          explanation: `Good catch! ${truth.explanation}`,
          mitreTechnique: truth.mitreTechnique
        });
      } else if (userTag === 'suspicious') {
        breakdown.correctSuspicious++;
        correctlyIdentified.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: 'suspicious',
          correctTag: 'threat',
          explanation: `You correctly identified this as suspicious. ${truth.explanation}`,
          mitreTechnique: truth.mitreTechnique
        });
      } else {
        breakdown.missedThreats++;
        missedThreats.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: 'unclassified',
          correctTag: 'threat',
          explanation: truth.explanation,
          mitreTechnique: truth.mitreTechnique
        });
      }
    } else if (truth.correctTag === 'benign') {
      if (userTag === 'benign') {
        breakdown.correctBenign++;
        correctlyIdentified.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: 'benign',
          correctTag: 'benign',
          explanation: `Correct! ${truth.explanation}`,
          mitreTechnique: truth.mitreTechnique
        });
      } else if (userTag === 'threat' || userTag === 'suspicious') {
        breakdown.falsePositives++;
        falsePositives.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: userTag,
          correctTag: 'benign',
          explanation: truth.explanation,
          mitreTechnique: truth.mitreTechnique
        });
      }
    } else if (truth.correctTag === 'suspicious') {
      if (userTag === 'suspicious' || userTag === 'threat') {
        breakdown.correctSuspicious++;
        correctlyIdentified.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: userTag,
          correctTag: 'suspicious',
          explanation: truth.explanation,
          mitreTechnique: truth.mitreTechnique
        });
      } else {
        breakdown.missedThreats++;
        missedThreats.push({
          ioc: truth.ioc,
          type: truth.type,
          userTag: 'unclassified',
          correctTag: 'suspicious',
          explanation: truth.explanation,
          mitreTechnique: truth.mitreTechnique
        });
      }
    }
  });

  // Check for false positives (user tagged something not in ground truth as threat)
  userIOCTags.forEach((tag, ioc) => {
    if (tag === 'threat' || tag === 'suspicious') {
      const found = groundTruth.find(gt => gt.ioc === ioc);
      if (!found) {
        // Check if it's a legitimate domain/IP
        if (ioc.includes('microsoft.com') || ioc.includes('google.com') || ioc.includes('github.com')) {
          breakdown.falsePositives++;
          falsePositives.push({
            ioc,
            type: inferIOCType(ioc),
            userTag: tag,
            correctTag: 'benign',
            explanation: `${ioc} is a legitimate domain commonly seen in enterprise environments.`,
            mitreTechnique: undefined
          });
        }
      }
    }
  });

  // Calculate SLA breaches
  alerts.forEach(alert => {
    if (alert.sla_status === 'Breached') {
      breakdown.slaBreaches++;
    }
  });

  // Calculate speed bonus (complete 20% faster than expected = +20 points)
  const expectedTime = alerts.length * 300; // 5 minutes per alert average
  if (timeTaken < expectedTime * 0.8) {
    breakdown.speedBonus = 20;
  } else if (timeTaken < expectedTime * 0.9) {
    breakdown.speedBonus = 10;
  }

  // Calculate accuracy bonus (95%+ accuracy = +10 points)
  const totalIOCs = groundTruth.length;
  const correctCount = breakdown.correctThreats + breakdown.correctBenign + breakdown.correctSuspicious;
  const accuracy = totalIOCs > 0 ? (correctCount / totalIOCs) * 100 : 0;
  if (accuracy >= 95) {
    breakdown.accuracyBonus = 10;
  } else if (accuracy >= 90) {
    breakdown.accuracyBonus = 5;
  }

  // Calculate total score
  const baseScore = 
    (breakdown.correctThreats * 10) +
    (breakdown.correctBenign * 5) +
    (breakdown.correctSuspicious * 7) -
    (breakdown.missedThreats * 15) -
    (breakdown.falsePositives * 5) -
    (breakdown.slaBreaches * 10) +
    breakdown.speedBonus +
    breakdown.accuracyBonus;

  const maxScore = (groundTruth.filter(gt => gt.correctTag === 'threat').length * 10) +
                   (groundTruth.filter(gt => gt.correctTag === 'benign').length * 5) +
                   (groundTruth.filter(gt => gt.correctTag === 'suspicious').length * 7) +
                   20 + 10; // Max speed + accuracy bonus

  const normalizedScore = Math.max(0, Math.min(100, (baseScore / maxScore) * 100));

  // Determine grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  if (normalizedScore >= 95) grade = 'A+';
  else if (normalizedScore >= 90) grade = 'A';
  else if (normalizedScore >= 80) grade = 'B';
  else if (normalizedScore >= 70) grade = 'C';
  else if (normalizedScore >= 60) grade = 'D';
  else grade = 'F';

  // Generate suggestions
  const suggestions: string[] = [];
  if (breakdown.missedThreats > 0) {
    suggestions.push(`You missed ${breakdown.missedThreats} threat IOCs. Focus on correlating events across log sources to identify malicious activity.`);
  }
  if (breakdown.falsePositives > 0) {
    suggestions.push(`You flagged ${breakdown.falsePositives} benign IOCs as threats. Use threat intelligence enrichment to verify before tagging.`);
  }
  if (breakdown.slaBreaches > 0) {
    suggestions.push(`You breached ${breakdown.slaBreaches} SLA deadline(s). Prioritize Critical and High severity alerts first.`);
  }
  if (normalizedScore >= 90) {
    suggestions.push('Excellent investigation! You demonstrated strong threat hunting skills.');
  } else if (normalizedScore >= 70) {
    suggestions.push('Good work! Review missed IOCs to improve your detection rate.');
  } else {
    suggestions.push('Practice correlating events across different log sources to improve detection.');
  }

  // Extract MITRE techniques
  const mitreTechniques = Array.from(new Set(
    groundTruth
      .filter(gt => gt.mitreTechnique)
      .map(gt => gt.mitreTechnique!)
  ));

  return {
    score: Math.round(normalizedScore),
    maxScore: 100,
    accuracy: Math.round(accuracy),
    timeTaken,
    slaBreaches: breakdown.slaBreaches,
    correctlyIdentified,
    missedThreats,
    falsePositives,
    suggestions,
    mitreTechniques,
    grade,
    breakdown
  };
}

function inferIOCType(ioc: string): 'ip' | 'domain' | 'hash' | 'process' {
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ioc)) return 'ip';
  if (/^[A-Fa-f0-9]{64}$/.test(ioc)) return 'hash';
  if (/^\d+$/.test(ioc)) return 'process';
  return 'domain';
}

