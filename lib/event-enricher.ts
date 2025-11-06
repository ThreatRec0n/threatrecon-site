// Enrich raw logs with SIEM event structure and severity

import type { SIEMEvent, Severity } from './siem-types';

export function enrichEvent(raw: any, index: number): SIEMEvent {
  const id = `event-${Date.now()}-${index}`;
  
  // Determine event type and severity from signature/content
  let severity: Severity = 'info';
  let eventType: SIEMEvent['eventType'] = 'connection';
  let signature = '';
  let category = '';
  
  // Suricata alerts
  if (raw.alert?.signature) {
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
  if (raw['id.orig_h'] && raw['id.resp_h']) {
    eventType = 'connection';
    
    // Small, periodic connections = potential beaconing
    const bytes = Number(raw.orig_bytes) || 0;
    if (bytes > 0 && bytes < 200) {
      // Check if external IP (not RFC 1918)
      const dstIp = raw['id.resp_h'];
      if (!isPrivateIP(dstIp)) {
        severity = 'high';
        category = 'Potential C2';
        signature = 'Suspicious low-byte outbound connection';
      }
    }
    
    // Large outbound = potential exfiltration
    if (bytes > 10000) {
      if (!isPrivateIP(dstIp)) {
        severity = 'medium';
        category = 'Potential Data Exfiltration';
        signature = 'Large outbound data transfer';
      }
    }
  }
  
  // Extract network info
  const srcIp = raw.src_ip || raw['id.orig_h'] || '';
  const dstIp = raw.dest_ip || raw['id.resp_h'] || '';
  const timestamp = raw.timestamp || raw.ts || new Date().toISOString();
  
  return {
    id,
    timestamp,
    severity,
    status: 'new',
    eventType,
    source: raw._source || (raw.alert ? 'suricata' : 'zeek'),
    srcIp,
    dstIp,
    srcPort: raw.src_port || raw['id.orig_p'],
    dstPort: raw.dest_port || raw['id.resp_p'],
    protocol: raw.proto || 'tcp',
    signature,
    ruleName: signature,
    category,
    bytesIn: raw.bytes_toclient || raw.resp_bytes || 0,
    bytesOut: raw.bytes_toserver || raw.orig_bytes || 0,
    raw,
    tags: [],
  };
}

function isPrivateIP(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  
  // RFC 1918 private ranges
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

