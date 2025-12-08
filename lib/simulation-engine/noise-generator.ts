// Massive Noise Event Generator - Creates 95%+ noise for realistic SOC training

import type { SimulatedEvent } from './types';
import { generateSysmonEvent, SYSMON_EVENT_IDS } from '../log-generators/sysmon-generator';
import { generateZeekConnLog, generateZeekDNSLog, generateZeekHTTPLog } from '../log-generators/zeek-generator';

interface NoiseGenerationConfig {
  scenario_id: string;
  session_id: string;
  attack_events: SimulatedEvent[];
  target_total: number;
  time_range: { start: Date; end: Date };
  affected_hosts: string[];
  network_subnet: string;
}

export class NoiseEventGenerator {
  generateNoiseEvents(config: NoiseGenerationConfig): SimulatedEvent[] {
    const noiseCount = config.target_total - config.attack_events.length;
    const events: SimulatedEvent[] = [];
    
    const timeSpanMs = config.time_range.end.getTime() - config.time_range.start.getTime();
    const avgTimeBetweenEvents = timeSpanMs / noiseCount;
    
    for (let i = 0; i < noiseCount; i++) {
      const rand = Math.random();
      const timestamp = new Date(
        config.time_range.start.getTime() + (avgTimeBetweenEvents * i) + 
        (Math.random() * avgTimeBetweenEvents * 0.5)
      );
      
      let event: SimulatedEvent;
      
      if (rand < 0.30) {
        event = this.generateNormalProcess(config, timestamp);
      } else if (rand < 0.55) {
        event = this.generateWebBrowsing(config, timestamp);
      } else if (rand < 0.70) {
        event = this.generateFileOperation(config, timestamp);
      } else if (rand < 0.80) {
        event = this.generateSystemUpdate(config, timestamp);
      } else if (rand < 0.85) {
        event = this.generateSecurityScan(config, timestamp);
      } else if (rand < 0.90) {
        event = this.generateScheduledTask(config, timestamp);
      } else {
        event = this.generateDNSQuery(config, timestamp);
      }
      
      events.push(event);
    }
    
    return events;
  }
  
  private generateNormalProcess(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const benignProcesses = [
      { name: 'chrome.exe', cmdline: 'chrome.exe --type=renderer' },
      { name: 'outlook.exe', cmdline: 'outlook.exe /recycle' },
      { name: 'teams.exe', cmdline: 'teams.exe --type=gpu-process' },
      { name: 'excel.exe', cmdline: 'EXCEL.EXE /automation' },
      { name: 'notepad.exe', cmdline: 'notepad.exe' },
      { name: 'explorer.exe', cmdline: 'C:\\Windows\\Explorer.EXE' },
      { name: 'svchost.exe', cmdline: 'svchost.exe -k NetworkService' },
    ];
    
    const process = benignProcesses[Math.floor(Math.random() * benignProcesses.length)];
    const host = config.affected_hosts[Math.floor(Math.random() * config.affected_hosts.length)];
    
    const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
      hostname: host,
      username: `user${Math.floor(Math.random() * 20)}`,
      processName: process.name,
      commandLine: process.cmdline,
      parentProcess: 'explorer.exe'
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'sysmon',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: sysmonEvent as Record<string, any>,
      related_event_ids: [],
      threat_score: 0,
      process_tree: {
        process_id: sysmonEvent.EventData.ProcessId,
        process_name: process.name,
        command_line: process.cmdline,
        children: [],
        timestamp: timestamp.toISOString(),
        user: sysmonEvent.EventData.User,
        hostname: host
      }
    };
  }
  
  private generateWebBrowsing(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const legitimateDomains = [
      'www.google.com', 'www.microsoft.com', 'github.com', 'stackoverflow.com',
      'docs.python.org', 'www.linkedin.com', 'mail.google.com', 'calendar.google.com',
      'teams.microsoft.com', 'www.amazon.com', 'www.cloudflare.com'
    ];
    
    const domain = legitimateDomains[Math.floor(Math.random() * legitimateDomains.length)];
    const sourceIP = `${config.network_subnet}.${Math.floor(Math.random() * 254) + 1}`;
    
    const httpLog = generateZeekHTTPLog(false, {
      sourceIP,
      host: domain,
      method: 'GET',
      uri: '/'
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'zeek',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: httpLog as Record<string, any>,
      related_event_ids: [],
      threat_score: 0,
      network_context: {
        source_ip: sourceIP,
        dest_ip: this.resolveIP(domain),
        source_port: httpLog.id_orig_p,
        dest_port: 443,
        protocol: 'tcp',
        bytes_sent: httpLog.request_body_len,
        bytes_received: httpLog.response_body_len,
        duration: 1,
        related_connections: []
      }
    };
  }
  
  private generateFileOperation(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const fileOps = [
      'C:\\Users\\user1\\Documents\\report.docx',
      'C:\\Users\\user2\\Downloads\\install.msi',
      'C:\\Program Files\\Application\\data.db',
      'C:\\Windows\\Temp\\update.tmp',
      'C:\\Users\\user3\\Pictures\\photo.jpg'
    ];
    
    const filepath = fileOps[Math.floor(Math.random() * fileOps.length)];
    const host = config.affected_hosts[Math.floor(Math.random() * config.affected_hosts.length)];
    
    const fileEvent = generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, false, {
      hostname: host,
      username: `user${Math.floor(Math.random() * 20)}`,
      filename: filepath
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'sysmon',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: fileEvent as Record<string, any>,
      related_event_ids: [],
      threat_score: 0
    };
  }
  
  private generateSystemUpdate(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const updateProcesses = [
      'MicrosoftEdgeUpdate.exe',
      'WindowsUpdate.exe',
      'GoogleUpdate.exe',
      'AdobeARM.exe'
    ];
    
    const process = updateProcesses[Math.floor(Math.random() * updateProcesses.length)];
    const host = config.affected_hosts[Math.floor(Math.random() * config.affected_hosts.length)];
    
    const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
      hostname: host,
      username: 'SYSTEM',
      processName: process,
      commandLine: `${process} /silent`,
      parentProcess: 'services.exe'
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'sysmon',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: sysmonEvent as Record<string, any>,
      related_event_ids: [],
      threat_score: 0
    };
  }
  
  private generateSecurityScan(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const scannerIP = `${config.network_subnet}.250`;
    const targetIP = `${config.network_subnet}.${Math.floor(Math.random() * 254) + 1}`;
    
    const connLog = generateZeekConnLog(false, {
      sourceIP: scannerIP,
      destIP: targetIP,
      destPort: Math.floor(Math.random() * 65535)
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'zeek',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: connLog as Record<string, any>,
      related_event_ids: [],
      threat_score: 0
    };
  }
  
  private generateScheduledTask(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const host = config.affected_hosts[Math.floor(Math.random() * config.affected_hosts.length)];
    
    const sysmonEvent = generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, false, {
      hostname: host,
      username: 'SYSTEM',
      processName: 'taskeng.exe',
      commandLine: `taskeng.exe {${crypto.randomUUID()}}`,
      parentProcess: 'services.exe'
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'sysmon',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: sysmonEvent as Record<string, any>,
      related_event_ids: [],
      threat_score: 0
    };
  }
  
  private generateDNSQuery(config: NoiseGenerationConfig, timestamp: Date): SimulatedEvent {
    const domains = [
      'api.github.com',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'ajax.googleapis.com',
      'www.googleapis.com',
      'update.microsoft.com',
      's3.amazonaws.com'
    ];
    
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const sourceIP = `${config.network_subnet}.${Math.floor(Math.random() * 254) + 1}`;
    
    const dnsLog = generateZeekDNSLog(false, {
      sourceIP,
      query: domain
    });
    
    return {
      id: `noise-${crypto.randomUUID()}`,
      source: 'zeek',
      scenario_id: config.scenario_id,
      session_id: config.session_id,
      stage: 'noise',
      timestamp: timestamp.toISOString(),
      details: dnsLog as Record<string, any>,
      related_event_ids: [],
      threat_score: 0
    };
  }
  
  private resolveIP(domain: string): string {
    const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `104.${(hash % 256)}.${((hash * 7) % 256)}.${((hash * 13) % 256)}`;
  }
}

