// Enrich raw logs with SIEM event structure and severity

import type { SIEMEvent, Severity } from './siem-types';

function isPrivateIP(ip: string): boolean {
  if (!ip) return false;
  // RFC1918 quick check
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export function enrichEvent(raw: any, index: number): SIEMEvent {
  const id = `event-${Date.now()}-${index}`;
  
  // Hoist derived fields used across rules - null-safe defaults
  const srcIp = (raw?.src_ip ?? raw?.['id.orig_h'] ?? raw?.source ?? raw?.src ?? '') as string;
  const dstIp = (raw?.dest_ip ?? raw?.['id.resp_h'] ?? raw?.destination ?? raw?.dst ?? '') as string;
  const sbytes = Number(raw?.bytes_toserver ?? raw?.tx_bytes ?? raw?.orig_bytes ?? 0);
  const dbytes = Number(raw?.bytes_toclient ?? raw?.rx_bytes ?? raw?.resp_bytes ?? 0);
  const bytes = sbytes + dbytes;
  
  // Determine event type and severity from signature/content
  let severity: Severity = 'info';
  let eventType: SIEMEvent['eventType'] = 'connection';
  let signature = '';
  let category = '';
  
  // Suricata alerts
  if (raw?.alert?.signature) {
    signature = raw.alert.signature;
    eventType = 'alert';
    
    // Determine severity from signature
    const sig = signature.toLowerCase();
    if (sig.includes('malware') || sig.includes('trojan') || sig.includes('c2')) {
      severity = 'critical';
      category = 'Malware';
    } else if (sig.includes('scan') || sig.includes('suspicious')) {
      severity = 'high';
      category = 'Reconnaissance';
    } else if (sig.includes('policy') || sig.includes('ftp')) {
      severity = 'medium';
      category = 'Policy Violation';
    } else {
      severity = 'low';
      category = 'Information';
    }
  }
  
  // Zeek connections - look for suspicious patterns
  if (raw?.['id.orig_h'] && raw?.['id.resp_h']) {
    eventType = 'connection';
    
    // Small, periodic connections = potential beaconing
    if (sbytes > 0 && sbytes < 200) {
      // Check if external IP (not RFC 1918)
      if (dstIp && !isPrivateIP(dstIp)) {
        severity = 'high';
        category = 'Potential C2';
        signature = 'Suspicious low-byte outbound connection';
      }
    }
    
    // Large outbound = potential exfiltration
    if (sbytes > 10000) {
      if (dstIp && !isPrivateIP(dstIp)) {
        severity = 'medium';
        category = 'Potential Data Exfiltration';
        signature = 'Large outbound data transfer';
      }
    }
  }
  
  // Extract timestamp
  const timestamp = raw?.timestamp ?? raw?.ts ?? new Date().toISOString();
  
  return {
    id,
    timestamp,
    severity,
    status: 'new',
    eventType,
    source: raw?._source ?? (raw?.alert ? 'suricata' : 'zeek'),
    srcIp,
    dstIp,
    srcPort: raw?.src_port ?? raw?.['id.orig_p'],
    dstPort: raw?.dest_port ?? raw?.['id.resp_p'],
    protocol: raw?.proto ?? 'tcp',
    signature,
    ruleName: signature,
    category,
    bytesIn: dbytes,
    bytesOut: sbytes,
    raw,
    tags: [],
  };
}
