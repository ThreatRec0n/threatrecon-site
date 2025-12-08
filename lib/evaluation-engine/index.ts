// Evaluation engine - scores user investigation performance

import type { SimulatedEvent, GeneratedAlert, AttackChain } from '@/lib/simulation-engine/core-types';

export interface IOCClassification {
  ioc: string;
  type: 'ip' | 'domain' | 'hash' | 'pid';
  userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
  actualClassification: 'malicious' | 'benign';
  stage?: string;
  technique_id?: string;
}

export interface EvaluationResult {
  score: number; // 0-100
  breakdown: {
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
    trueNegatives: number;
  };
  byStage: Record<string, {
    detected: number;
    missed: number;
    falsePositives: number;
    total: number;
  }>;
  missedIOCs: Array<{
    ioc: string;
    type: string;
    stage: string;
    technique_id?: string;
    reason: string;
  }>;
  overFlaggedIOCs: Array<{
    ioc: string;
    type: string;
    userTag: string;
    reason: string;
  }>;
  allClassifications: Array<{
    ioc: string;
    type: 'ip' | 'domain' | 'hash' | 'pid';
    userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
    actualClassification: 'malicious' | 'benign';
    isCorrect: boolean;
    stage?: string;
    technique_id?: string;
  }>;
  redTeamReplay: Array<{
    timestamp: string;
    stage: string;
    technique_id: string;
    technique_name: string;
    description: string;
    iocs: string[];
    detected: boolean;
  }>;
  recommendations: string[];
}

export function evaluateInvestigation(
  userTags: Record<string, 'confirmed-threat' | 'suspicious' | 'benign'>,
  session: {
    events: SimulatedEvent[];
    attack_chains: AttackChain[];
    alerts: GeneratedAlert[];
  }
): EvaluationResult {
  // Extract ground truth IOCs from simulation
  const groundTruth = extractGroundTruthIOCs(session);
  
  // Classify user tags
  const classifications: IOCClassification[] = [];
  
  // Process user-tagged IOCs
  Object.entries(userTags).forEach(([ioc, userTag]) => {
    const truth = groundTruth.find(gt => gt.ioc === ioc);
    classifications.push({
      ioc,
      type: truth?.type || inferIOCType(ioc),
      userTag,
      actualClassification: truth ? 'malicious' : 'benign',
      stage: truth?.stage,
      technique_id: truth?.technique_id,
    });
  });
  
  // Find missed IOCs (malicious IOCs not tagged by user)
  const missedIOCs = groundTruth.filter(gt => !userTags[gt.ioc]);
  
  // Calculate metrics
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = missedIOCs.length;
  let trueNegatives = 0;
  
  classifications.forEach(c => {
    if (c.userTag === 'confirmed-threat') {
      // Confirmed threat = full credit if correct
      if (c.actualClassification === 'malicious') {
        truePositives++;
      } else {
        falsePositives++;
      }
    } else if (c.userTag === 'suspicious') {
      // Suspicious = partial credit (0.5 weight) if correct, smaller penalty if wrong
      if (c.actualClassification === 'malicious') {
        truePositives += 0.5; // Partial credit for suspicious tag
      } else {
        falsePositives += 0.3; // Smaller penalty for suspicious false positive
      }
    } else if (c.userTag === 'benign' && c.actualClassification === 'benign') {
      trueNegatives++;
    }
  });
  
  // Round to integers for display
  truePositives = Math.round(truePositives);
  falsePositives = Math.round(falsePositives);
  
  // Calculate score (weighted by impact)
  const totalMalicious = groundTruth.length;
  const totalBenign = classifications.filter(c => c.actualClassification === 'benign').length;
  
  // Weight IOCs by impact stage (critical stages worth more)
  const impactWeights: Record<string, number> = {
    'credential-access': 1.5, // Critical - credential theft
    'command-and-control': 1.3, // High - C2 established
    'exfiltration': 1.4, // Critical - data loss
    'impact': 1.5, // Critical - ransomware/deletion
    'lateral-movement': 1.2, // High - network compromise
    'initial-access': 1.0, // Base weight
    'execution': 1.0, // Base weight
    'persistence': 1.1, // Medium-high
    'defense-evasion': 1.1, // Medium-high
    'discovery': 1.0, // Base weight
    'collection': 1.0, // Base weight
  };
  
  // Calculate weighted TP rate
  let weightedTP = 0;
  let weightedTotal = 0;
  
  groundTruth.forEach(gt => {
    const weight = impactWeights[gt.stage] || 1.0;
    weightedTotal += weight;
    if (userTags[gt.ioc] === 'confirmed-threat') {
      weightedTP += weight; // Full credit
    } else if (userTags[gt.ioc] === 'suspicious') {
      weightedTP += weight * 0.5; // Partial credit
    }
  });
  
  const tpRate = weightedTotal > 0 ? (weightedTP / weightedTotal) * 100 : 0;
  const fpPenalty = totalBenign > 0 ? (falsePositives / totalBenign) * 50 : 0; // Max 50 point penalty
  const fnPenalty = totalMalicious > 0 ? (falseNegatives / totalMalicious) * 30 : 0; // Max 30 point penalty
  
  const score = Math.max(0, Math.min(100, tpRate - fpPenalty - fnPenalty));
  
  // Breakdown by stage
  const byStage: Record<string, {
    detected: number;
    missed: number;
    falsePositives: number;
    total: number;
  }> = {};
  
  groundTruth.forEach(gt => {
    const stage = gt.stage || 'unknown';
    if (!byStage[stage]) {
      byStage[stage] = { detected: 0, missed: 0, falsePositives: 0, total: 0 };
    }
    byStage[stage].total++;
    
    if (userTags[gt.ioc] === 'confirmed-threat' || userTags[gt.ioc] === 'suspicious') {
      byStage[stage].detected++;
    } else {
      byStage[stage].missed++;
    }
  });
  
  classifications.forEach(c => {
    if ((c.userTag === 'confirmed-threat' || c.userTag === 'suspicious') && c.actualClassification === 'benign') {
      const stage = c.stage || 'unknown';
      if (!byStage[stage]) {
        byStage[stage] = { detected: 0, missed: 0, falsePositives: 0, total: 0 };
      }
      byStage[stage].falsePositives++;
    }
  });
  
  // Build red team replay
  const redTeamReplay: EvaluationResult['redTeamReplay'] = [];
  session.attack_chains.forEach(chain => {
    chain.stages.forEach(stage => {
      const stageIOCs = groundTruth.filter(gt => gt.stage === stage.stage);
      const detected = stageIOCs.some(ioc => userTags[ioc.ioc] === 'confirmed-threat' || userTags[ioc.ioc] === 'suspicious');
      
      redTeamReplay.push({
        timestamp: stage.timestamp,
        stage: stage.stage,
        technique_id: stage.technique_id,
        technique_name: stage.technique_name,
        description: stage.description,
        iocs: stageIOCs.map(ioc => ioc.ioc),
        detected,
      });
    });
  });
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (falseNegatives > 0) {
    recommendations.push(`You missed ${falseNegatives} malicious IOCs. Focus on correlating events across log sources.`);
  }
  
  if (falsePositives > 0) {
    recommendations.push(`You flagged ${falsePositives} benign IOCs. Use threat intel enrichment to verify before tagging.`);
  }
  
  const missedStages = Object.entries(byStage).filter(([_, stats]) => stats.missed > 0);
  if (missedStages.length > 0) {
    recommendations.push(`Consider reviewing ${missedStages.map(([stage]) => stage.replace('-', ' ')).join(', ')} stages more carefully.`);
  }
  
  if (score >= 90) {
    recommendations.push('Excellent investigation! You demonstrated strong threat hunting skills.');
  } else if (score >= 70) {
    recommendations.push('Good work! Review missed IOCs to improve your detection rate.');
  } else {
    recommendations.push('Practice correlating events across different log sources to improve detection.');
  }
  
  return {
    score: Math.round(score),
    breakdown: {
      truePositives,
      falsePositives,
      falseNegatives,
      trueNegatives,
    },
    byStage,
    missedIOCs: missedIOCs.map(ioc => ({
      ioc: ioc.ioc,
      type: ioc.type,
      stage: ioc.stage || 'unknown',
      technique_id: ioc.technique_id,
      reason: `This ${ioc.type} was part of the ${ioc.stage} stage but was not tagged.`,
    })),
    overFlaggedIOCs: classifications
      .filter(c => (c.userTag === 'confirmed-threat' || c.userTag === 'suspicious') && c.actualClassification === 'benign')
      .map(c => ({
        ioc: c.ioc,
        type: c.type,
        userTag: c.userTag || 'unknown',
        reason: `This ${c.type} was flagged as ${c.userTag} but is actually benign.`,
      })),
    allClassifications: classifications.map(c => ({
      ioc: c.ioc,
      type: c.type,
      userTag: c.userTag,
      actualClassification: c.actualClassification,
      isCorrect: (c.userTag === 'confirmed-threat' || c.userTag === 'suspicious') 
        ? c.actualClassification === 'malicious'
        : c.userTag === 'benign' 
          ? c.actualClassification === 'benign'
          : false,
      stage: c.stage,
      technique_id: c.technique_id,
    })),
    redTeamReplay,
    recommendations,
  };
}

function extractGroundTruthIOCs(session: {
  events: SimulatedEvent[];
  attack_chains: AttackChain[];
}): Array<{
  ioc: string;
  type: 'ip' | 'domain' | 'hash' | 'pid';
  stage: string;
  technique_id?: string;
}> {
  const iocs: Array<{
    ioc: string;
    type: 'ip' | 'domain' | 'hash' | 'pid';
    stage: string;
    technique_id?: string;
  }> = [];
  
  // Extract from events (only high-threat events or events explicitly marked as malicious)
  session.events
    .filter(e => (e.threat_score || 0) >= 60 || e.details?.isMalicious === true)
    .forEach(event => {
      // Extract IPs
      if (event.network_context) {
        if (event.network_context.dest_ip && !event.network_context.dest_ip.startsWith('10.')) {
          iocs.push({
            ioc: event.network_context.dest_ip,
            type: 'ip',
            stage: event.stage,
            technique_id: event.technique_id,
          });
        }
      }
      
      // Extract domains
      if (event.details?.QueryName) {
        iocs.push({
          ioc: event.details.QueryName,
          type: 'domain',
          stage: event.stage,
          technique_id: event.technique_id,
        });
      }
      if (event.details?.host) {
        iocs.push({
          ioc: event.details.host,
          type: 'domain',
          stage: event.stage,
          technique_id: event.technique_id,
        });
      }
      
      // Extract hashes
      if (event.details?.Hashes) {
        const hashMatch = event.details.Hashes.match(/SHA256=([A-Fa-f0-9]+)/);
        if (hashMatch) {
          iocs.push({
            ioc: hashMatch[1],
            type: 'hash',
            stage: event.stage,
            technique_id: event.technique_id,
          });
        }
      }
      
      // Extract PIDs from malicious processes
      if (event.process_tree && (event.threat_score || 0) >= 80) {
        iocs.push({
          ioc: event.process_tree.process_id,
          type: 'pid',
          stage: event.stage,
          technique_id: event.technique_id,
        });
      }
    });
  
  // Deduplicate
  const seen = new Set<string>();
  return iocs.filter(ioc => {
    const key = `${ioc.type}:${ioc.ioc}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferIOCType(ioc: string): 'ip' | 'domain' | 'hash' | 'pid' {
  // IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ioc)) {
    return 'ip';
  }
  
  // Domain
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(ioc)) {
    return 'domain';
  }
  
  // Hash (SHA256)
  if (/^[A-Fa-f0-9]{64}$/.test(ioc)) {
    return 'hash';
  }
  
  // PID (numeric)
  if (/^\d+$/.test(ioc)) {
    return 'pid';
  }
  
  // Default to domain
  return 'domain';
}

