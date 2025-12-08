import type { Alert } from './core-types';
import { SLA_REQUIREMENTS } from './core-types';
import { randomUUID } from 'crypto';

export class AlertFactory {
  private ticketCounter = 100000;
  
  generateAlertQueue(config: {
    session_id: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  }): Alert[] {
    
    const alertCounts = {
      Beginner: { threats: 2, fps: 1, benign: 2 },
      Intermediate: { threats: 4, fps: 3, benign: 3 },
      Advanced: { threats: 6, fps: 5, benign: 4 }
    };
    
    const counts = alertCounts[config.difficulty];
    const alerts: Alert[] = [];
    
    for (let i = 0; i < counts.threats; i++) {
      alerts.push(this.createThreatAlert(config.session_id));
    }
    
    for (let i = 0; i < counts.fps; i++) {
      alerts.push(this.createFalsePositiveAlert(config.session_id));
    }
    
    for (let i = 0; i < counts.benign; i++) {
      alerts.push(this.createBenignAlert(config.session_id));
    }
    
    return this.shuffle(alerts);
  }
  
  private createThreatAlert(sessionId: string): Alert {
    const severities: Alert['severity'][] = ['Critical', 'High', 'High', 'Medium'];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    const templates = [
      {
        title: 'Suspicious PowerShell Execution Detected',
        rule: 'PowerShell with Encoded Command',
        description: 'PowerShell executed with -EncodedCommand flag',
        source: 'EDR' as const
      },
      {
        title: 'Potential Credential Dumping',
        rule: 'LSASS Memory Access',
        description: 'Process attempted to read LSASS memory',
        source: 'EDR' as const
      },
      {
        title: 'Lateral Movement Detected',
        rule: 'Multiple SMB Connections',
        description: 'Host initiated SMB to multiple systems',
        source: 'SIEM' as const
      }
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    const sla = SLA_REQUIREMENTS[severity];
    const now = new Date();
    
    return {
      id: randomUUID(),
      ticket_number: `INC-2024-${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: sessionId,
      title: template.title,
      severity,
      source: template.source,
      detection_rule: template.rule,
      affected_systems: [{
        hostname: `WORKSTATION-${Math.floor(Math.random() * 50)}`,
        ip: `10.50.12.${Math.floor(Math.random() * 254) + 1}`,
        user: `user${Math.floor(Math.random() * 20)}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: new Date(now.getTime() + sla.minutes * 60 * 1000),
      sla_remaining_seconds: sla.minutes * 60,
      sla_status: 'Safe',
      priority_score: severity === 'Critical' ? 90 : severity === 'High' ? 75 : 60,
      requires_containment: severity === 'Critical' || severity === 'High',
      initial_description: template.description,
      related_event_ids: [],
      is_true_threat: true,
      expected_classification: 'True Positive',
      created_at: now
    };
  }
  
  private createFalsePositiveAlert(sessionId: string): Alert {
    const now = new Date();
    const sla = SLA_REQUIREMENTS.Medium;
    
    return {
      id: randomUUID(),
      ticket_number: `INC-2024-${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: sessionId,
      title: 'Outbound Connection to New Domain',
      severity: 'Medium',
      source: 'Firewall',
      detection_rule: 'Domain Age < 30 Days',
      affected_systems: [{
        hostname: `WORKSTATION-${Math.floor(Math.random() * 50)}`,
        ip: `10.50.12.${Math.floor(Math.random() * 254) + 1}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: new Date(now.getTime() + sla.minutes * 60 * 1000),
      sla_remaining_seconds: sla.minutes * 60,
      sla_status: 'Safe',
      priority_score: 40,
      requires_containment: false,
      initial_description: 'User accessed newly registered domain',
      related_event_ids: [],
      is_true_threat: false,
      expected_classification: 'False Positive',
      created_at: now
    };
  }
  
  private createBenignAlert(sessionId: string): Alert {
    const now = new Date();
    const sla = SLA_REQUIREMENTS.Low;
    
    return {
      id: randomUUID(),
      ticket_number: `INC-2024-${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: sessionId,
      title: 'Scheduled Task Execution',
      severity: 'Low',
      source: 'SIEM',
      detection_rule: 'Scheduled Task Activity',
      affected_systems: [{
        hostname: `SERVER-${Math.floor(Math.random() * 10)}`,
        ip: `10.50.1.${Math.floor(Math.random() * 254) + 1}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: new Date(now.getTime() + sla.minutes * 60 * 1000),
      sla_remaining_seconds: sla.minutes * 60,
      sla_status: 'Safe',
      priority_score: 10,
      requires_containment: false,
      initial_description: 'Routine scheduled task executed',
      related_event_ids: [],
      is_true_threat: false,
      expected_classification: 'False Positive',
      created_at: now
    };
  }
  
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
