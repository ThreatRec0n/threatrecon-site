// Alert Generator - Creates realistic SOC alert queue

import type { Alert } from './alert-types';
import { SLA_REQUIREMENTS } from './alert-types';

interface AlertGenerationConfig {
  session_id: string;
  scenario_type: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  true_positive_count: number;
  false_positive_count: number;
  total_count: number;
}

export class AlertGenerator {
  private ticketCounter = 1;
  
  generateAlertQueue(config: AlertGenerationConfig): Alert[] {
    const alerts: Alert[] = [];
    const today = new Date();
    const ticketPrefix = `INC-${today.getFullYear()}-`;
    
    for (let i = 0; i < config.true_positive_count; i++) {
      alerts.push(this.generateTruePositiveAlert(config, ticketPrefix));
    }
    
    for (let i = 0; i < config.false_positive_count; i++) {
      alerts.push(this.generateFalsePositiveAlert(config, ticketPrefix));
    }
    
    const benignCount = config.total_count - config.true_positive_count - config.false_positive_count;
    for (let i = 0; i < benignCount; i++) {
      alerts.push(this.generateBenignAlert(config, ticketPrefix));
    }
    
    return this.shuffleAndPrioritize(alerts);
  }
  
  private generateTruePositiveAlert(config: AlertGenerationConfig, prefix: string): Alert {
    const severity = this.selectSeverity(['Critical', 'High', 'High', 'Medium']);
    const sla = SLA_REQUIREMENTS[severity];
    const now = new Date();
    const deadline = new Date(now.getTime() + sla.investigationTime * 60 * 1000);
    
    const alertTemplates = [
      {
        title: 'Suspicious PowerShell Execution with Network Activity',
        source: 'EDR' as const,
        rule: 'PowerShell with -EncodedCommand and Outbound Connection',
        context: 'PowerShell process with encoded command initiated outbound connection to known malicious IP',
        priority: 85
      },
      {
        title: 'Multiple Failed Login Attempts - Potential Brute Force',
        source: 'SIEM' as const,
        rule: 'Failed Authentication Threshold Exceeded',
        context: '15 failed login attempts for admin account within 5 minutes',
        priority: 75
      },
      {
        title: 'Lateral Movement Detected - SMB Connection to Multiple Hosts',
        source: 'EDR' as const,
        rule: 'Unusual SMB Activity Pattern',
        context: 'Single host initiated SMB connections to 8 different systems in 10 minutes',
        priority: 90
      },
      {
        title: 'Potential Data Exfiltration - Large Outbound Transfer',
        source: 'Firewall' as const,
        rule: 'Anomalous Outbound Traffic Volume',
        context: '250MB transferred to external IP over HTTPS in single session',
        priority: 80
      },
      {
        title: 'Credential Dumping Tool Detected - Mimikatz',
        source: 'EDR' as const,
        rule: 'Known Credential Access Tool Execution',
        context: 'Process matching Mimikatz signature executed with debug privileges',
        priority: 95
      }
    ];
    
    const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
    
    return {
      id: `alert-${crypto.randomUUID()}`,
      ticket_number: `${prefix}${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: config.session_id,
      title: template.title,
      severity,
      alert_source: template.source,
      detection_rule: template.rule,
      affected_assets: [{
        hostname: `WORKSTATION-${Math.floor(Math.random() * 100)}`,
        ip: `10.50.12.${Math.floor(Math.random() * 254) + 1}`,
        user: `user${Math.floor(Math.random() * 50)}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: deadline,
      sla_remaining_seconds: sla.investigationTime * 60,
      sla_status: 'OnTime',
      priority_score: template.priority,
      containment_required: severity === 'Critical' || severity === 'High',
      related_alert_ids: [],
      related_event_ids: [],
      initial_context: template.context,
      is_true_positive: true,
      created_at: now
    };
  }
  
  private generateFalsePositiveAlert(config: AlertGenerationConfig, prefix: string): Alert {
    const severity = this.selectSeverity(['Medium', 'Low', 'Low', 'Informational']);
    const sla = SLA_REQUIREMENTS[severity];
    const now = new Date();
    const deadline = new Date(now.getTime() + sla.investigationTime * 60 * 1000);
    
    const fpTemplates = [
      {
        title: 'Outbound Connection to Suspicious Domain',
        source: 'Proxy' as const,
        rule: 'Connection to Recently Registered Domain',
        context: 'User accessed newly registered domain - likely legitimate CDN',
        priority: 40
      },
      {
        title: 'Unusual Process Execution',
        source: 'EDR' as const,
        rule: 'Rare Process Baseline Deviation',
        context: 'Process rarely seen on network - appears to be legitimate software update',
        priority: 35
      },
      {
        title: 'Port Scan Detected from Internal Host',
        source: 'IDS' as const,
        rule: 'Multiple Port Connection Attempts',
        context: 'Likely automated vulnerability scanner from security team',
        priority: 30
      }
    ];
    
    const template = fpTemplates[Math.floor(Math.random() * fpTemplates.length)];
    
    return {
      id: `alert-${crypto.randomUUID()}`,
      ticket_number: `${prefix}${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: config.session_id,
      title: template.title,
      severity,
      alert_source: template.source,
      detection_rule: template.rule,
      affected_assets: [{
        hostname: `WORKSTATION-${Math.floor(Math.random() * 100)}`,
        ip: `10.50.12.${Math.floor(Math.random() * 254) + 1}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: deadline,
      sla_remaining_seconds: sla.investigationTime * 60,
      sla_status: 'OnTime',
      priority_score: template.priority,
      containment_required: false,
      related_alert_ids: [],
      related_event_ids: [],
      initial_context: template.context,
      is_true_positive: false,
      created_at: now
    };
  }
  
  private generateBenignAlert(config: AlertGenerationConfig, prefix: string): Alert {
    const severity: Alert['severity'] = 'Informational';
    const sla = SLA_REQUIREMENTS[severity];
    const now = new Date();
    const deadline = new Date(now.getTime() + sla.investigationTime * 60 * 1000);
    
    return {
      id: `alert-${crypto.randomUUID()}`,
      ticket_number: `${prefix}${String(this.ticketCounter++).padStart(6, '0')}`,
      session_id: config.session_id,
      title: 'Scheduled Task Execution',
      severity,
      alert_source: 'SIEM',
      detection_rule: 'Scheduled Task Activity',
      affected_assets: [{
        hostname: `SERVER-${Math.floor(Math.random() * 20)}`,
        ip: `10.50.1.${Math.floor(Math.random() * 254) + 1}`
      }],
      status: 'New',
      assigned_to: 'Your Queue',
      sla_deadline: deadline,
      sla_remaining_seconds: sla.investigationTime * 60,
      sla_status: 'OnTime',
      priority_score: 10,
      containment_required: false,
      related_alert_ids: [],
      related_event_ids: [],
      initial_context: 'Routine scheduled task executed successfully',
      is_true_positive: false,
      created_at: now
    };
  }
  
  private selectSeverity<T>(options: T[]): T {
    return options[Math.floor(Math.random() * options.length)];
  }
  
  private shuffleAndPrioritize(alerts: Alert[]): Alert[] {
    const critical = alerts.filter(a => a.severity === 'Critical');
    const high = alerts.filter(a => a.severity === 'High');
    const others = alerts.filter(a => a.severity !== 'Critical' && a.severity !== 'High');
    
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const array = [...arr];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };
    
    return [
      ...shuffleArray(critical),
      ...shuffleArray(high),
      ...shuffleArray(others)
    ];
  }
}

