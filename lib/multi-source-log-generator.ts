// Multi-Source Log Generator - Creates realistic logs from multiple SOC sources

import type { SimulatedEvent } from './simulation-engine/core-types';
import { generateSysmonEvent, SYSMON_EVENT_IDS } from './log-generators/sysmon-generator';
import { generateZeekConnLog, generateZeekHTTPLog, generateZeekDNSLog } from './log-generators/zeek-generator';

export type LogSourceType = 'EDR' | 'SIEM' | 'Firewall' | 'Proxy' | 'DNS' | 'Email Gateway' | 'Cloud' | 'AD';

export interface LogSource {
  name: string;
  type: LogSourceType;
  availability: number; // 0-100% uptime
  latency: number; // Delay in minutes for logs to appear
  retention: number; // Days of data available
  eventTypes: string[];
}

// Realistic log source definitions
export const LOG_SOURCES: LogSource[] = [
  // Endpoint Detection
  {
    name: 'CrowdStrike Falcon',
    type: 'EDR',
    availability: 99.5,
    latency: 0, // Real-time
    retention: 90,
    eventTypes: ['Process', 'Network', 'File', 'Registry', 'DNS'],
  },
  {
    name: 'Sysmon',
    type: 'EDR',
    availability: 98.0,
    latency: 0,
    retention: 30,
    eventTypes: ['ProcessCreate', 'NetworkConnect', 'FileCreate', 'Registry', 'ImageLoad'],
  },
  
  // Network
  {
    name: 'Palo Alto Firewall',
    type: 'Firewall',
    availability: 99.9,
    latency: 1, // 1 minute delay
    retention: 90,
    eventTypes: ['Traffic', 'Threat', 'URL', 'Application'],
  },
  {
    name: 'Zeek IDS',
    type: 'SIEM',
    availability: 95.0,
    latency: 0,
    retention: 30,
    eventTypes: ['conn', 'http', 'dns', 'ssl', 'files'],
  },
  {
    name: 'Suricata',
    type: 'SIEM',
    availability: 97.0,
    latency: 0,
    retention: 30,
    eventTypes: ['alert', 'flow', 'anomaly'],
  },
  
  // Infrastructure
  {
    name: 'Windows Event Logs',
    type: 'AD',
    availability: 99.0,
    latency: 0,
    retention: 90,
    eventTypes: ['Security', 'System', 'Application'],
  },
  {
    name: 'DNS Server Logs',
    type: 'DNS',
    availability: 99.5,
    latency: 0,
    retention: 30,
    eventTypes: ['Query', 'Response', 'Transfer'],
  },
  {
    name: 'Proxy Logs',
    type: 'Proxy',
    availability: 98.5,
    latency: 2, // 2 minute delay
    retention: 90,
    eventTypes: ['Access', 'Block', 'Authentication'],
  },
  
  // Cloud
  {
    name: 'AWS CloudTrail',
    type: 'Cloud',
    availability: 99.9,
    latency: 5, // 5 minute delay
    retention: 90,
    eventTypes: ['API', 'Console', 'Auth'],
  },
  {
    name: 'Azure AD Logs',
    type: 'Cloud',
    availability: 99.9,
    latency: 5,
    retention: 90,
    eventTypes: ['SignIn', 'Audit', 'Risk'],
  },
  
  // Email
  {
    name: 'Proofpoint',
    type: 'Email Gateway',
    availability: 99.8,
    latency: 1,
    retention: 90,
    eventTypes: ['Delivered', 'Blocked', 'Quarantine'],
  },
];

// Generate events from multiple sources with realistic correlation
export function generateMultiSourceEvents(
  baseEvents: SimulatedEvent[],
  config?: {
    includeSources?: LogSourceType[];
    simulateAvailability?: boolean;
    simulateLatency?: boolean;
  }
): SimulatedEvent[] {
  const allEvents: SimulatedEvent[] = [];
  const includedSources = config?.includeSources || LOG_SOURCES.map(s => s.type);
  
  // Group base events by correlation key
  const eventsByCorrelation = new Map<string, SimulatedEvent[]>();
  baseEvents.forEach(event => {
    const key = event.correlation_key || 'uncorrelated';
    if (!eventsByCorrelation.has(key)) {
      eventsByCorrelation.set(key, []);
    }
    eventsByCorrelation.get(key)!.push(event);
  });
  
  // Generate correlated events from multiple sources
  eventsByCorrelation.forEach((events, correlationKey) => {
    const primaryEvent = events[0];
    const timestamp = new Date(primaryEvent.timestamp);
    
    // Determine which sources should have events for this correlation
    const sourcesToGenerate = determineSourcesForEvent(primaryEvent, includedSources);
    
    sourcesToGenerate.forEach(sourceType => {
      const sourceConfig = LOG_SOURCES.find(s => s.type === sourceType);
      if (!sourceConfig) return;
      
      // Simulate availability (some sources might be down)
      if (config?.simulateAvailability && Math.random() * 100 > sourceConfig.availability) {
        return; // Source unavailable
      }
      
      // Generate events from this source
      const sourceEvents = generateEventsFromSource(
        sourceType,
        primaryEvent,
        correlationKey,
        timestamp,
        sourceConfig.latency
      );
      
      allEvents.push(...sourceEvents);
    });
  });
  
  return allEvents.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function determineSourcesForEvent(
  event: SimulatedEvent,
  includedSources: LogSourceType[]
): LogSourceType[] {
  const sources: LogSourceType[] = [];
  
  // Based on event type and stage, determine which sources would log it
  if (event.stage === 'execution' || event.stage === 'persistence') {
    if (includedSources.includes('EDR')) sources.push('EDR');
    if (includedSources.includes('AD')) sources.push('AD');
  }
  
  if (event.stage === 'command-and-control' || event.stage === 'exfiltration') {
    if (includedSources.includes('Firewall')) sources.push('Firewall');
    if (includedSources.includes('Proxy')) sources.push('Proxy');
    if (includedSources.includes('DNS')) sources.push('DNS');
    if (includedSources.includes('SIEM')) sources.push('SIEM');
  }
  
  if (event.stage === 'initial-access') {
    if (includedSources.includes('Email Gateway')) sources.push('Email Gateway');
    if (includedSources.includes('Proxy')) sources.push('Proxy');
  }
  
  if (event.stage === 'lateral-movement') {
    if (includedSources.includes('Firewall')) sources.push('Firewall');
    if (includedSources.includes('AD')) sources.push('AD');
    if (includedSources.includes('EDR')) sources.push('EDR');
  }
  
  // Always include at least one source
  if (sources.length === 0 && includedSources.length > 0) {
    sources.push(includedSources[0]);
  }
  
  return sources;
}

function generateEventsFromSource(
  sourceType: LogSourceType,
  baseEvent: SimulatedEvent,
  correlationKey: string,
  baseTimestamp: Date,
  latencyMinutes: number
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = new Date(baseTimestamp.getTime() + latencyMinutes * 60000);
  
  switch (sourceType) {
    case 'EDR':
      // Generate Sysmon-style events
      if (baseEvent.stage === 'execution') {
        const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
          hostname: baseEvent.process_tree?.hostname || 'WORKSTATION-01',
          username: baseEvent.process_tree?.user || 'DOMAIN\\user',
        });
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'sysmon',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: sysmonEvent as Record<string, any>,
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          threat_score: baseEvent.threat_score,
        });
      }
      break;
      
    case 'Firewall':
      // Generate firewall log entry
      const firewallEvent: SimulatedEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'suricata',
        scenario_id: baseEvent.scenario_id,
        session_id: baseEvent.session_id,
        technique_id: baseEvent.technique_id,
        stage: baseEvent.stage,
        timestamp: timestamp.toISOString(),
        details: {
          action: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'block' : 'allow',
          src_ip: baseEvent.network_context?.source_ip || '10.0.1.100',
          dst_ip: baseEvent.network_context?.dest_ip || '8.8.8.8',
          src_port: baseEvent.network_context?.source_port || 49152,
          dst_port: baseEvent.network_context?.dest_port || 443,
          protocol: baseEvent.network_context?.protocol || 'tcp',
          application: 'web-browsing',
          threat: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'high' : 'low',
          rule: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'Block-Suspicious-Traffic' : 'Allow',
        },
        related_event_ids: [baseEvent.id],
        correlation_key: correlationKey,
        network_context: baseEvent.network_context,
        threat_score: baseEvent.threat_score ? baseEvent.threat_score - 10 : 0,
      };
      events.push(firewallEvent);
      break;
      
    case 'Proxy':
      // Generate proxy log entry
      if (baseEvent.network_context) {
        const proxyEvent: SimulatedEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'zeek',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: {
            method: 'GET',
            url: `https://${baseEvent.network_context.dest_ip}/`,
            status: 200,
            user: baseEvent.process_tree?.user || 'DOMAIN\\user',
            category: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'Malware' : 'Unknown',
            action: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'blocked' : 'allowed',
          },
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          network_context: baseEvent.network_context,
          threat_score: baseEvent.threat_score ? baseEvent.threat_score - 5 : 0,
        };
        events.push(proxyEvent);
      }
      break;
      
    case 'DNS':
      // Generate DNS log entry
      if (baseEvent.network_context) {
        const dnsLog = generateZeekDNSLog(true, {
          sourceIP: baseEvent.network_context.source_ip,
          query: `malicious-domain-${Math.random().toString(36).substr(2, 8)}.com`,
        });
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'zeek',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: dnsLog as Record<string, any>,
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          threat_score: baseEvent.threat_score ? baseEvent.threat_score - 5 : 0,
        });
      }
      break;
      
    case 'Email Gateway':
      // Generate email gateway log
      if (baseEvent.stage === 'initial-access') {
        const emailEvent: SimulatedEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'edr',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: {
            from: `attacker@${Math.random().toString(36).substr(2, 8)}.com`,
            to: baseEvent.process_tree?.user || 'user@company.com',
            subject: 'Important Document',
            action: baseEvent.threat_score && baseEvent.threat_score > 70 ? 'quarantined' : 'delivered',
            attachment_hash: 'a1b2c3d4e5f6...',
            threat_score: baseEvent.threat_score || 0,
          },
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          threat_score: baseEvent.threat_score || 0,
        };
        events.push(emailEvent);
      }
      break;
      
    case 'AD':
      // Generate Active Directory log
      if (baseEvent.stage === 'lateral-movement' || baseEvent.stage === 'credential-access') {
        const adEvent: SimulatedEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'windows-event',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: {
            EventID: 4624, // Successful logon
            LogonType: 3, // Network logon
            AccountName: baseEvent.process_tree?.user || 'DOMAIN\\user',
            WorkstationName: baseEvent.process_tree?.hostname || 'WORKSTATION-01',
            SourceNetworkAddress: baseEvent.network_context?.source_ip || '10.0.1.100',
          },
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          threat_score: baseEvent.threat_score ? baseEvent.threat_score - 15 : 0,
        };
        events.push(adEvent);
      }
      break;
      
    case 'Cloud':
      // Generate cloud log (AWS/Azure)
      if (baseEvent.stage === 'command-and-control' || baseEvent.stage === 'exfiltration') {
        const cloudEvent: SimulatedEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'cloudtrail',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: {
            eventName: 'GetObject',
            userIdentity: {
              type: 'IAMUser',
              userName: baseEvent.process_tree?.user || 'user',
            },
            sourceIPAddress: baseEvent.network_context?.source_ip || '10.0.1.100',
            requestParameters: {
              bucketName: 'suspicious-bucket',
            },
          },
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          threat_score: baseEvent.threat_score ? baseEvent.threat_score - 10 : 0,
        };
        events.push(cloudEvent);
      }
      break;
      
    case 'SIEM':
      // Generate SIEM correlation event (Zeek/Suricata)
      if (baseEvent.network_context) {
        const zeekLog = generateZeekConnLog(true, {
          sourceIP: baseEvent.network_context.source_ip,
          destIP: baseEvent.network_context.dest_ip,
        });
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'zeek',
          scenario_id: baseEvent.scenario_id,
          session_id: baseEvent.session_id,
          technique_id: baseEvent.technique_id,
          stage: baseEvent.stage,
          timestamp: timestamp.toISOString(),
          details: zeekLog as Record<string, any>,
          related_event_ids: [baseEvent.id],
          correlation_key: correlationKey,
          network_context: baseEvent.network_context,
          threat_score: baseEvent.threat_score || 0,
        });
      }
      break;
  }
  
  return events;
}

// Get log source availability status
export function getLogSourceStatus(sourceType: LogSourceType): {
  available: boolean;
  latency: number;
  retention: number;
} {
  const source = LOG_SOURCES.find(s => s.type === sourceType);
  if (!source) {
    return { available: false, latency: 0, retention: 0 };
  }
  
  // Simulate occasional outages
  const available = Math.random() * 100 <= source.availability;
  
  return {
    available,
    latency: source.latency,
    retention: source.retention,
  };
}

// Generate log source summary for UI
export function getLogSourceSummary(events: SimulatedEvent[]): Map<LogSourceType, number> {
  const summary = new Map<LogSourceType, number>();
  
  events.forEach(event => {
    const sourceType = mapEventSourceToLogSourceType(event.source);
    if (sourceType) {
      summary.set(sourceType, (summary.get(sourceType) || 0) + 1);
    }
  });
  
  return summary;
}

function mapEventSourceToLogSourceType(eventSource: string): LogSourceType | null {
  const mapping: Record<string, LogSourceType> = {
    'sysmon': 'EDR',
    'edr': 'EDR',
    'zeek': 'SIEM',
    'suricata': 'SIEM',
    'windows-event': 'AD',
    'cloudtrail': 'Cloud',
  };
  
  return mapping[eventSource] || null;
}

