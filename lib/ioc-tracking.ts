// Enhanced IOC Tracking System with Enrichment and Correlation

import type { ThreatIntelMatch } from './soc-alert-types';

export type IOCType = 'ip' | 'domain' | 'hash' | 'url' | 'process' | 'file' | 'registry' | 'user';
export type IOCTag = 'confirmed-threat' | 'suspicious' | 'benign' | 'investigating' | 'whitelisted';
export type IOCSource = 'alert' | 'log' | 'manual' | 'threat-intel' | 'correlation';

export interface IOC {
  id: string;
  type: IOCType;
  value: string;
  tag: IOCTag | null;
  sources: IOCSource[];
  
  // Context
  firstSeen: Date;
  lastSeen: Date;
  seenCount: number;
  affectedHosts: string[];
  affectedUsers: string[];
  
  // Threat Intelligence
  threatIntelMatches: ThreatIntelMatch[];
  threatScore: number; // 0-100
  
  // Correlation
  relatedIOCs: string[]; // IOC IDs
  relatedAlerts: string[]; // Alert IDs
  relatedEvents: string[]; // Event IDs
  
  // Investigation
  notes: IOCNote[];
  investigationStatus: 'new' | 'investigating' | 'resolved' | 'false-positive';
  assignedTo?: string;
  
  // Metadata
  confidence: number; // 0-100
  falsePositiveRate?: number; // Historical false positive rate
  tags: string[]; // Custom tags
}

export interface IOCNote {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
  type: 'investigation' | 'enrichment' | 'correlation' | 'resolution';
}

export interface IOCEnrichmentResult {
  ioc: string;
  type: IOCType;
  enrichmentData: {
    threatScore: number;
    reputation: 'malicious' | 'suspicious' | 'clean' | 'unknown';
    sources: ThreatIntelMatch[];
    geolocation?: {
      country: string;
      city?: string;
      asn?: string;
    };
    categories?: string[];
    firstSeen?: Date;
    lastSeen?: Date;
    relatedIndicators?: string[];
  };
  enrichmentTimestamp: Date;
  enrichedBy: string;
}

// Create new IOC
export function createIOC(
  type: IOCType,
  value: string,
  source: IOCSource,
  context?: {
    hostname?: string;
    username?: string;
    alertId?: string;
    eventId?: string;
  }
): IOC {
  const now = new Date();
  
  return {
    id: `ioc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    value,
    tag: null,
    sources: [source],
    firstSeen: now,
    lastSeen: now,
    seenCount: 1,
    affectedHosts: context?.hostname ? [context.hostname] : [],
    affectedUsers: context?.username ? [context.username] : [],
    threatIntelMatches: [],
    threatScore: 0,
    relatedIOCs: [],
    relatedAlerts: context?.alertId ? [context.alertId] : [],
    relatedEvents: context?.eventId ? [context.eventId] : [],
    notes: [],
    investigationStatus: 'new',
    confidence: 50,
    tags: [],
  };
}

// Update IOC when seen again
export function updateIOCSeen(
  ioc: IOC,
  context?: {
    hostname?: string;
    username?: string;
    alertId?: string;
    eventId?: string;
  }
): IOC {
  const now = new Date();
  
  return {
    ...ioc,
    lastSeen: now,
    seenCount: ioc.seenCount + 1,
    affectedHosts: [
      ...new Set([
        ...ioc.affectedHosts,
        ...(context?.hostname ? [context.hostname] : []),
      ]),
    ],
    affectedUsers: [
      ...new Set([
        ...ioc.affectedUsers,
        ...(context?.username ? [context.username] : []),
      ]),
    ],
    relatedAlerts: [
      ...new Set([
        ...ioc.relatedAlerts,
        ...(context?.alertId ? [context.alertId] : []),
      ]),
    ],
    relatedEvents: [
      ...new Set([
        ...ioc.relatedEvents,
        ...(context?.eventId ? [context.eventId] : []),
      ]),
    ],
  };
}

// Tag IOC
export function tagIOC(ioc: IOC, tag: IOCTag, author: string, note?: string): IOC {
  const noteEntry: IOCNote = {
    id: `note-${Date.now()}`,
    author,
    timestamp: new Date(),
    content: note || `Tagged as ${tag}`,
    type: 'investigation',
  };
  
  return {
    ...ioc,
    tag,
    notes: [...ioc.notes, noteEntry],
    investigationStatus: tag === 'confirmed-threat' ? 'investigating' : 
                        tag === 'benign' ? 'resolved' : 
                        ioc.investigationStatus,
  };
}

// Enrich IOC with threat intelligence
export function enrichIOC(
  ioc: IOC,
  enrichmentResult: IOCEnrichmentResult,
  author: string
): IOC {
  const noteEntry: IOCNote = {
    id: `note-${Date.now()}`,
    author,
    timestamp: new Date(),
    content: `Enriched with ${enrichmentResult.enrichmentData.sources.length} threat intel sources`,
    type: 'enrichment',
  };
  
  // Calculate threat score based on enrichment
  let threatScore = ioc.threatScore;
  const maliciousMatches = enrichmentResult.enrichmentData.sources.filter(
    s => s.reputation === 'malicious'
  ).length;
  const suspiciousMatches = enrichmentResult.enrichmentData.sources.filter(
    s => s.reputation === 'suspicious'
  ).length;
  
  if (maliciousMatches > 0) {
    threatScore = Math.min(100, 60 + maliciousMatches * 15);
  } else if (suspiciousMatches > 0) {
    threatScore = Math.min(80, 40 + suspiciousMatches * 10);
  } else if (enrichmentResult.enrichmentData.reputation === 'clean') {
    threatScore = Math.max(0, threatScore - 20);
  }
  
  // Auto-tag based on threat score
  let newTag = ioc.tag;
  if (threatScore >= 80 && !ioc.tag) {
    newTag = 'confirmed-threat';
  } else if (threatScore >= 50 && !ioc.tag) {
    newTag = 'suspicious';
  } else if (threatScore < 20 && enrichmentResult.enrichmentData.reputation === 'clean') {
    newTag = 'benign';
  }
  
  return {
    ...ioc,
    threatIntelMatches: enrichmentResult.enrichmentData.sources,
    threatScore,
    tag: newTag || ioc.tag,
    notes: [...ioc.notes, noteEntry],
    confidence: Math.min(100, ioc.confidence + 20), // Increase confidence after enrichment
  };
}

// Correlate IOCs (find relationships)
export function correlateIOCs(iocs: IOC[]): Map<string, string[]> {
  const correlations = new Map<string, string[]>();
  
  iocs.forEach(ioc => {
    const related: string[] = [];
    
    // Find IOCs seen on same hosts
    ioc.affectedHosts.forEach(host => {
      iocs.forEach(otherIOC => {
        if (otherIOC.id !== ioc.id && otherIOC.affectedHosts.includes(host)) {
          if (!related.includes(otherIOC.id)) {
            related.push(otherIOC.id);
          }
        }
      });
    });
    
    // Find IOCs seen by same users
    ioc.affectedUsers.forEach(user => {
      iocs.forEach(otherIOC => {
        if (otherIOC.id !== ioc.id && otherIOC.affectedUsers.includes(user)) {
          if (!related.includes(otherIOC.id)) {
            related.push(otherIOC.id);
          }
        }
      });
    });
    
    // Find IOCs in same alerts
    ioc.relatedAlerts.forEach(alertId => {
      iocs.forEach(otherIOC => {
        if (otherIOC.id !== ioc.id && otherIOC.relatedAlerts.includes(alertId)) {
          if (!related.includes(otherIOC.id)) {
            related.push(otherIOC.id);
          }
        }
      });
    });
    
    if (related.length > 0) {
      correlations.set(ioc.id, related);
    }
  });
  
  return correlations;
}

// Extract IOCs from events
export function extractIOCsFromEvents(events: any[]): {
  ips: string[];
  domains: string[];
  hashes: string[];
  processes: string[];
  files: string[];
} {
  const iocs = {
    ips: new Set<string>(),
    domains: new Set<string>(),
    hashes: new Set<string>(),
    processes: new Set<string>(),
    files: new Set<string>(),
  };
  
  events.forEach(event => {
    const details = event.details || {};
    
    // Extract IPs
    if (details.DestinationIp) iocs.ips.add(details.DestinationIp);
    if (details.SourceIp) iocs.ips.add(details.SourceIp);
    if (details.id_resp_h) iocs.ips.add(details.id_resp_h);
    if (details.id_orig_h) iocs.ips.add(details.id_orig_h);
    
    // Extract domains
    if (details.QueryName) iocs.domains.add(details.QueryName);
    if (details.host) iocs.domains.add(details.host);
    if (details.query) iocs.domains.add(details.query);
    
    // Extract hashes
    if (details.Hashes) {
      const hashMatch = details.Hashes.match(/SHA256=([A-Fa-f0-9]+)/);
      if (hashMatch) iocs.hashes.add(hashMatch[1]);
    }
    
    // Extract processes
    if (details.Image) iocs.processes.add(details.Image);
    if (details.ProcessName) iocs.processes.add(details.ProcessName);
    
    // Extract files
    if (details.TargetFilename) iocs.files.add(details.TargetFilename);
    if (details.Image) iocs.files.add(details.Image);
  });
  
  return {
    ips: Array.from(iocs.ips),
    domains: Array.from(iocs.domains),
    hashes: Array.from(iocs.hashes),
    processes: Array.from(iocs.processes),
    files: Array.from(iocs.files),
  };
}

// Get IOC statistics
export function getIOCStatistics(iocs: IOC[]): {
  total: number;
  byType: Record<IOCType, number>;
  byTag: Record<IOCTag, number>;
  byStatus: Record<string, number>;
  threatScoreAverage: number;
  enrichedCount: number;
} {
  const stats = {
    total: iocs.length,
    byType: {} as Record<IOCType, number>,
    byTag: {
      'confirmed-threat': 0,
      'suspicious': 0,
      'benign': 0,
      'investigating': 0,
      'whitelisted': 0,
    },
    byStatus: {
      'new': 0,
      'investigating': 0,
      'resolved': 0,
      'false-positive': 0,
    },
    threatScoreAverage: 0,
    enrichedCount: 0,
  };
  
  let totalThreatScore = 0;
  
  iocs.forEach(ioc => {
    // Count by type
    stats.byType[ioc.type] = (stats.byType[ioc.type] || 0) + 1;
    
    // Count by tag
    if (ioc.tag) {
      stats.byTag[ioc.tag] = (stats.byTag[ioc.tag] || 0) + 1;
    }
    
    // Count by status
    stats.byStatus[ioc.investigationStatus] = 
      (stats.byStatus[ioc.investigationStatus] || 0) + 1;
    
    // Threat score
    totalThreatScore += ioc.threatScore;
    
    // Enriched count
    if (ioc.threatIntelMatches.length > 0) {
      stats.enrichedCount++;
    }
  });
  
  stats.threatScoreAverage = stats.total > 0 
    ? Math.round(totalThreatScore / stats.total) 
    : 0;
  
  return stats;
}

