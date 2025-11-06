// SIEM Event Types - Realistic structure

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Status = 'new' | 'in-progress' | 'escalated' | 'closed' | 'false-positive';
export type EventType = 'alert' | 'connection' | 'dns' | 'http' | 'file' | 'process';

export interface SIEMEvent {
  id: string;
  timestamp: string;
  severity: Severity;
  status: Status;
  eventType: EventType;
  source: string; // zeek, suricata, windows-event, etc.
  
  // Network
  srcIp: string;
  srcPort?: number;
  dstIp: string;
  dstPort?: number;
  protocol?: string;
  
  // Alert details
  signature?: string;
  ruleName?: string;
  category?: string;
  
  // Data
  bytesIn?: number;
  bytesOut?: number;
  packets?: number;
  
  // Additional context
  user?: string;
  hostname?: string;
  process?: string;
  command?: string;
  domain?: string;
  url?: string;
  
  // Metadata
  raw: any;
  mitreTechniques?: string[];
  tags?: string[];
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical': return 'bg-red-900/40 text-red-400 border-red-800/60';
    case 'high': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
    case 'medium': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60';
    case 'low': return 'bg-blue-900/40 text-blue-400 border-blue-800/60';
    case 'info': return 'bg-gray-700/40 text-gray-400 border-gray-600/60';
  }
}

export function getSeverityIcon(severity: Severity): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    case 'info': return '⚪';
  }
}

export function getStatusColor(status: Status): string {
  switch (status) {
    case 'new': return 'bg-blue-900/30 text-blue-400 border-blue-800/50';
    case 'in-progress': return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50';
    case 'escalated': return 'bg-orange-900/30 text-orange-400 border-orange-800/50';
    case 'closed': return 'bg-gray-700/30 text-gray-400 border-gray-600/50';
    case 'false-positive': return 'bg-green-900/30 text-green-400 border-green-800/50';
  }
}

