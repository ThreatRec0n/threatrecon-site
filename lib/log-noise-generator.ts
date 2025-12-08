// Realistic Log Noise Generator - Creates 95% noise with realistic distributions

import type { SimulatedEvent } from './simulation-engine/types';
import { generateSysmonEvent, SYSMON_EVENT_IDS } from './log-generators/sysmon-generator';
import { generateZeekConnLog, generateZeekHTTPLog, generateZeekDNSLog } from './log-generators/zeek-generator';

export interface NoiseGenerationConfig {
  totalEvents: number; // Target total events (e.g., 5000-15000)
  attackEventRatio: number; // Percentage of actual attack events (e.g., 0.03 = 3%)
  falsePositiveRatio: number; // Percentage of false positive detection hits (e.g., 0.04 = 4%)
  legitimateActivityRatio: number; // Percentage of legitimate activity (e.g., 0.06 = 6%)
  noiseRatio: number; // Percentage of pure noise (e.g., 0.87 = 87%)
  incompleteDataRatio?: number; // Percentage of incomplete/corrupted logs (e.g., 0.01 = 1%)
}

export interface EventDistribution {
  attackEvents: SimulatedEvent[];
  relatedLegitimate: SimulatedEvent[];
  unrelatedNoise: SimulatedEvent[];
  falsePositiveHits: SimulatedEvent[];
  incompleteData: SimulatedEvent[];
}

// Default realistic distribution for typical investigation
export const DEFAULT_NOISE_CONFIG: NoiseGenerationConfig = {
  totalEvents: 10000,
  attackEventRatio: 0.015, // 1.5% actual attack
  falsePositiveRatio: 0.02, // 2% false positives
  legitimateActivityRatio: 0.03, // 3% legitimate from compromised host
  noiseRatio: 0.93, // 93% pure noise
  incompleteDataRatio: 0.005, // 0.5% incomplete
};

// Generate realistic hostnames
function generateHostname(): string {
  const prefixes = ['WORKSTATION', 'LAPTOP', 'SERVER', 'DC', 'FILE', 'WEB', 'DB'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  return `${prefix}-${number}`;
}

// Generate realistic usernames
function generateUsername(): string {
  const firstNames = ['john', 'jane', 'bob', 'alice', 'charlie', 'diana', 'eve', 'frank'];
  const lastNames = ['smith', 'jones', 'williams', 'brown', 'davis', 'miller', 'wilson', 'moore'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `DOMAIN\\${firstName}.${lastName}`;
}

// Generate realistic IP addresses
function generateInternalIP(): string {
  const subnets = ['10.0', '10.50', '192.168', '172.16'];
  const subnet = subnets[Math.floor(Math.random() * subnets.length)];
  const octet3 = Math.floor(Math.random() * 255);
  const octet4 = Math.floor(Math.random() * 254) + 1;
  return `${subnet}.${octet3}.${octet4}`;
}

function generateExternalIP(): string {
  const octets = Array.from({ length: 4 }, () => Math.floor(Math.random() * 255));
  return octets.join('.');
}

// Generate legitimate activity events
function generateLegitimateActivity(count: number, hostname: string, username: string): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const sourceIP = generateInternalIP();
  
  for (let i = 0; i < count; i++) {
    const eventType = Math.random();
    
    if (eventType < 0.3) {
      // File operations
      const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, false, {
        hostname,
        username,
        sourceIP,
      });
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'sysmon',
        scenario_id: 'noise-legitimate',
        session_id: 'noise-session',
        technique_id: '',
        stage: 'discovery',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        details: sysmonEvent.EventData,
        related_event_ids: [],
        threat_score: 0,
      });
    } else if (eventType < 0.6) {
      // Network connections
      const zeekLog = generateZeekConnLog(false, { sourceIP, hostname, username });
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'zeek',
        scenario_id: 'noise-legitimate',
        session_id: 'noise-session',
        technique_id: '',
        stage: 'discovery',
        timestamp: zeekLog.ts,
        details: zeekLog,
        related_event_ids: [],
        threat_score: 0,
      });
    } else {
      // Process creation
      const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
        hostname,
        username,
        sourceIP,
      });
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: 'sysmon',
        scenario_id: 'noise-legitimate',
        session_id: 'noise-session',
        technique_id: '',
        stage: 'execution',
        timestamp: sysmonEvent.System.TimeCreated.SystemTime,
        details: sysmonEvent.EventData,
        related_event_ids: [],
        threat_score: 0,
      });
    }
  }
  
  return events;
}

// Generate unrelated noise (normal system operations)
function generateUnrelatedNoise(count: number): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  
  const noiseTypes = [
    'scheduled_task',
    'antivirus_scan',
    'backup_process',
    'software_update',
    'system_maintenance',
    'user_activity',
    'network_scan',
    'patch_management',
  ];
  
  for (let i = 0; i < count; i++) {
    const hostname = generateHostname();
    const username = generateUsername();
    const sourceIP = generateInternalIP();
    const noiseType = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 86400000).toISOString();
    
    let event: SimulatedEvent;
    
    switch (noiseType) {
      case 'scheduled_task':
      case 'backup_process':
      case 'patch_management':
        const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
          hostname,
          username: 'SYSTEM',
          sourceIP,
        });
        event = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'sysmon',
          scenario_id: 'noise-unrelated',
          session_id: 'noise-session',
          technique_id: '',
          stage: 'execution',
          timestamp: sysmonEvent.System.TimeCreated.SystemTime,
          details: sysmonEvent.EventData,
          related_event_ids: [],
          threat_score: 0,
        };
        break;
        
      case 'antivirus_scan':
      case 'software_update':
        const fileEvent = generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, false, {
          hostname,
          username: 'SYSTEM',
          sourceIP,
        });
        event = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'sysmon',
          scenario_id: 'noise-unrelated',
          session_id: 'noise-session',
          technique_id: '',
          stage: 'discovery',
          timestamp: fileEvent.System.TimeCreated.SystemTime,
          details: fileEvent.EventData,
          related_event_ids: [],
          threat_score: 0,
        };
        break;
        
      case 'user_activity':
      case 'network_scan':
      default:
        const zeekLog = generateZeekConnLog(false, { sourceIP, hostname, username });
        event = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'zeek',
          scenario_id: 'noise-unrelated',
          session_id: 'noise-session',
          technique_id: '',
          stage: 'discovery',
          timestamp: zeekLog.ts,
          details: zeekLog,
          related_event_ids: [],
          threat_score: 0,
        };
        break;
    }
    
    events.push(event);
  }
  
  return events;
}

// Generate false positive hits (events matching detection rules but benign)
function generateFalsePositiveHits(count: number): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  
  // False positives that might trigger detection rules
  const falsePositiveScenarios = [
    {
      type: 'powershell_admin',
      description: 'Legitimate admin PowerShell script',
      event: () => generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
        hostname: generateHostname(),
        username: generateUsername(),
        sourceIP: generateInternalIP(),
      }),
    },
    {
      type: 'blocked_domain',
      description: 'User tried to access blocked but legitimate domain',
      event: () => {
        const zeekLog = generateZeekHTTPLog(false, {
          sourceIP: generateInternalIP(),
          hostname: generateHostname(),
        });
        // Modify to look suspicious but be benign
        return {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: 'zeek' as const,
          scenario_id: 'noise-false-positive',
          session_id: 'noise-session',
          technique_id: '',
          stage: 'discovery' as const,
          timestamp: zeekLog.ts,
          details: zeekLog,
          related_event_ids: [],
          threat_score: 20, // Low threat score but might trigger rule
        };
      },
    },
  ];
  
  for (let i = 0; i < count; i++) {
    const scenario = falsePositiveScenarios[Math.floor(Math.random() * falsePositiveScenarios.length)];
    const event = scenario.event();
    events.push(event as SimulatedEvent);
  }
  
  return events;
}

// Generate incomplete/corrupted log entries
function generateIncompleteData(count: number): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  
  for (let i = 0; i < count; i++) {
    // Randomly truncate or corrupt event data
    const baseEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
      hostname: generateHostname(),
      username: generateUsername(),
      sourceIP: generateInternalIP(),
    });
    
    // Corrupt some fields
    const corruptedDetails: Record<string, any> = { ...baseEvent.EventData };
    const fieldsToCorrupt = Object.keys(corruptedDetails);
    const numFieldsToCorrupt = Math.floor(Math.random() * Math.min(3, fieldsToCorrupt.length));
    
    for (let j = 0; j < numFieldsToCorrupt; j++) {
      const field = fieldsToCorrupt[Math.floor(Math.random() * fieldsToCorrupt.length)];
      corruptedDetails[field] = Math.random() < 0.5 ? '' : null;
    }
    
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'sysmon',
      scenario_id: 'noise-incomplete',
      session_id: 'noise-session',
      technique_id: '',
      stage: 'execution',
      timestamp: baseEvent.System.TimeCreated.SystemTime,
      details: corruptedDetails,
      related_event_ids: [],
      threat_score: 0,
    });
  }
  
  return events;
}

// Main noise generation function
export function generateRealisticLogVolume(
  attackEvents: SimulatedEvent[],
  config: NoiseGenerationConfig = DEFAULT_NOISE_CONFIG
): SimulatedEvent[] {
  const attackEventCount = attackEvents.length;
  const totalAttackEvents = Math.floor(config.totalEvents * config.attackEventRatio);
  
  // Scale attack events if needed
  const scaledAttackEvents = attackEvents.slice(0, totalAttackEvents);
  
  // Calculate counts for each category
  const falsePositiveCount = Math.floor(config.totalEvents * config.falsePositiveRatio);
  const legitimateCount = Math.floor(config.totalEvents * config.legitimateActivityRatio);
  const noiseCount = Math.floor(config.totalEvents * config.noiseRatio);
  const incompleteCount = Math.floor(config.totalEvents * (config.incompleteDataRatio || 0));
  
  // Generate noise
  const hostname = generateHostname();
  const username = generateUsername();
  const legitimateEvents = generateLegitimateActivity(legitimateCount, hostname, username);
  const unrelatedNoise = generateUnrelatedNoise(noiseCount);
  const falsePositives = generateFalsePositiveHits(falsePositiveCount);
  const incompleteData = generateIncompleteData(incompleteCount);
  
  // Combine all events
  const allEvents = [
    ...scaledAttackEvents,
    ...legitimateEvents,
    ...unrelatedNoise,
    ...falsePositives,
    ...incompleteData,
  ];
  
  // Shuffle events to mix attack and noise
  const shuffled = allEvents.sort(() => Math.random() - 0.5);
  
  // Sort by timestamp
  return shuffled.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Generate realistic alert distribution (70% false positives)
export function generateAlertDistribution(totalAlerts: number): {
  realThreats: number;
  falsePositives: number;
} {
  const falsePositiveCount = Math.floor(totalAlerts * 0.7);
  const realThreatCount = totalAlerts - falsePositiveCount;
  
  return {
    realThreats: realThreatCount,
    falsePositives: falsePositiveCount,
  };
}


