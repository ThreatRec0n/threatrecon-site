// Detection rule engine - evaluates events against detection rules and generates alerts

import type { SimulatedEvent, DetectionRule, GeneratedAlert } from './types';

// Predefined detection rules (like Sigma rules)
export const DETECTION_RULES: DetectionRule[] = [
  {
    id: 'rule-ps-encoded',
    name: 'Suspicious PowerShell Encoded Command',
    query: 'source:sysmon AND process_name:powershell.exe AND command_line:*EncodedCommand*',
    mitre_techniques: ['T1059.001'],
    severity: 'high',
    enabled: true,
  },
  {
    id: 'rule-c2-beaconing',
    name: 'C2 Beaconing Detected',
    query: 'source:zeek AND dest_ip:185.220.101.0 OR dest_ip:45.146.164.110',
    mitre_techniques: ['T1071.001'],
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'rule-credential-dumping',
    name: 'Potential Credential Dumping',
    query: 'source:sysmon AND process_name:mimikatz.exe OR process_name:procdump.exe',
    mitre_techniques: ['T1003'],
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'rule-lateral-movement',
    name: 'SMB Lateral Movement Attempt',
    query: 'source:sysmon AND dest_port:445 AND protocol:tcp',
    mitre_techniques: ['T1021.002'],
    severity: 'high',
    enabled: true,
  },
  {
    id: 'rule-large-exfil',
    name: 'Large Data Exfiltration',
    query: 'source:zeek AND bytes_sent:>50000 AND method:POST',
    mitre_techniques: ['T1048'],
    severity: 'high',
    enabled: true,
  },
  {
    id: 'rule-suspicious-dns',
    name: 'Suspicious DNS Query',
    query: 'source:zeek AND query:*malicious* OR query:*evil* OR query:*c2*',
    mitre_techniques: ['T1071.001'],
    severity: 'medium',
    enabled: true,
  },
];

export function evaluateDetectionRules(
  events: SimulatedEvent[],
  rules: DetectionRule[] = DETECTION_RULES
): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];
  const enabledRules = rules.filter(r => r.enabled);

  for (const rule of enabledRules) {
    const matchingEvents = events.filter(event => matchesRule(event, rule));
    
    if (matchingEvents.length > 0) {
      // Check threshold
      const threshold = rule.threshold || 1;
      if (matchingEvents.length >= threshold) {
        alerts.push(createAlert(rule, matchingEvents));
      }
    }
  }

  return alerts;
}

function matchesRule(event: SimulatedEvent, rule: DetectionRule): boolean {
  // Simple query matching (in production, use proper query parser)
  const query = rule.query.toLowerCase();
  
  // Check source
  if (query.includes('source:') && !query.includes(`source:${event.source}`)) {
    return false;
  }

  // Check process name
  if (query.includes('process_name:')) {
    const processName = query.match(/process_name:([^\s]+)/)?.[1];
    if (processName && event.details?.Image && !event.details.Image.toLowerCase().includes(processName.replace('*', ''))) {
      return false;
    }
  }

  // Check command line
  if (query.includes('command_line:')) {
    const cmdPattern = query.match(/command_line:\*([^\*]+)\*/)?.[1];
    if (cmdPattern && event.details?.CommandLine && !event.details.CommandLine.toLowerCase().includes(cmdPattern)) {
      return false;
    }
  }

  // Check destination IP
  if (query.includes('dest_ip:')) {
    const destIPs = query.match(/dest_ip:([^\s]+)/g)?.map(m => m.split(':')[1]);
    if (destIPs) {
      const eventDestIP = event.network_context?.dest_ip || event.details?.DestinationIp;
      if (!destIPs.some(ip => eventDestIP?.includes(ip))) {
        return false;
      }
    }
  }

  // Check destination port
  if (query.includes('dest_port:')) {
    const port = parseInt(query.match(/dest_port:(\d+)/)?.[1] || '0');
    const eventPort = event.network_context?.dest_port || event.details?.DestinationPort;
    if (eventPort !== port) {
      return false;
    }
  }

  // Check bytes sent
  if (query.includes('bytes_sent:>')) {
    const threshold = parseInt(query.match(/bytes_sent:>(\d+)/)?.[1] || '0');
    const bytesSent = event.network_context?.bytes_sent || 0;
    if (bytesSent <= threshold) {
      return false;
    }
  }

  // Check MITRE technique match
  if (rule.mitre_techniques.length > 0 && event.technique_id) {
    if (!rule.mitre_techniques.includes(event.technique_id)) {
      return false;
    }
  }

  return true;
}

function createAlert(rule: DetectionRule, events: SimulatedEvent[]): GeneratedAlert {
  const primaryEvent = events[0];
  
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    rule_id: rule.id,
    rule_name: rule.name,
    severity: rule.severity,
    timestamp: primaryEvent.timestamp,
    events: events.map(e => e.id),
    technique_id: primaryEvent.technique_id || '',
    stage: primaryEvent.stage,
    context: {
      event_count: events.length,
      sources: [...new Set(events.map(e => e.source))],
      hosts: [...new Set(events.map(e => e.details?.Computer || e.details?.id_orig_h || 'unknown'))],
    },
    threat_score: Math.max(...events.map(e => e.threat_score || 0)),
  };
}

