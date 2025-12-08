import type { SimulatedEvent } from './core-types';

export class EventFactory {
  /**
   * Generate realistic event volume: 95% noise, 5% attack
   */
  generateEventSet(config: {
    session_id: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    attack_events: SimulatedEvent[];
  }): SimulatedEvent[] {
    
    const targetTotal = 
      config.difficulty === 'Beginner' ? 500 :
      config.difficulty === 'Intermediate' ? 3000 : 8000;
    
    const noiseCount = targetTotal - config.attack_events.length;
    const noiseEvents: SimulatedEvent[] = [];
    
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = new Date();
    const timeSpan = endTime.getTime() - startTime.getTime();
    
    for (let i = 0; i < noiseCount; i++) {
      const timestamp = new Date(
        startTime.getTime() + (timeSpan * i / noiseCount) + 
        (Math.random() * 60000)
      );
      
      const eventType = Math.random();
      
      if (eventType < 0.35) {
        noiseEvents.push(this.generateNormalProcess(config.session_id, timestamp));
      } else if (eventType < 0.60) {
        noiseEvents.push(this.generateWebTraffic(config.session_id, timestamp));
      } else if (eventType < 0.80) {
        noiseEvents.push(this.generateFileActivity(config.session_id, timestamp));
      } else {
        noiseEvents.push(this.generateSystemUpdate(config.session_id, timestamp));
      }
    }
    
    const allEvents = [...config.attack_events, ...noiseEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return allEvents;
  }
  
  private generateNormalProcess(sessionId: string, timestamp: Date): SimulatedEvent {
    const processes = [
      { name: 'chrome.exe', cmd: 'chrome.exe --type=renderer' },
      { name: 'outlook.exe', cmd: 'outlook.exe' },
      { name: 'teams.exe', cmd: 'teams.exe --type=gpu-process' },
      { name: 'excel.exe', cmd: 'EXCEL.EXE' }
    ];
    
    const proc = processes[Math.floor(Math.random() * processes.length)];
    
    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      source: 'sysmon',
      event_type: 'ProcessCreate',
      timestamp: timestamp.toISOString(),
      hostname: `WORKSTATION-${Math.floor(Math.random() * 50)}`,
      username: `user${Math.floor(Math.random() * 20)}`,
      process_name: proc.name,
      command_line: proc.cmd,
      is_malicious: false,
      threat_score: 0,
      raw_log: {
        EventID: 1,
        Image: `C:\\Program Files\\${proc.name}`,
        CommandLine: proc.cmd,
        ParentImage: 'C:\\Windows\\explorer.exe'
      }
    };
  }
  
  private generateWebTraffic(sessionId: string, timestamp: Date): SimulatedEvent {
    const domains = [
      'www.google.com',
      'github.com',
      'stackoverflow.com',
      'docs.microsoft.com'
    ];
    
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      source: 'zeek',
      event_type: 'http',
      timestamp: timestamp.toISOString(),
      hostname: `WORKSTATION-${Math.floor(Math.random() * 50)}`,
      source_ip: `10.50.12.${Math.floor(Math.random() * 254) + 1}`,
      dest_ip: '142.250.80.46',
      dest_port: 443,
      protocol: 'tcp',
      is_malicious: false,
      threat_score: 0,
      raw_log: {
        host: domain,
        method: 'GET',
        uri: '/',
        status_code: 200
      }
    };
  }
  
  private generateFileActivity(sessionId: string, timestamp: Date): SimulatedEvent {
    const files = [
      'C:\\Users\\john\\Documents\\report.docx',
      'C:\\Users\\sarah\\Downloads\\installer.msi',
      'C:\\Windows\\Temp\\update.tmp'
    ];
    
    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      source: 'sysmon',
      event_type: 'FileCreate',
      timestamp: timestamp.toISOString(),
      hostname: `WORKSTATION-${Math.floor(Math.random() * 50)}`,
      username: `user${Math.floor(Math.random() * 20)}`,
      is_malicious: false,
      threat_score: 0,
      raw_log: {
        EventID: 11,
        TargetFilename: files[Math.floor(Math.random() * files.length)]
      }
    };
  }
  
  private generateSystemUpdate(sessionId: string, timestamp: Date): SimulatedEvent {
    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      source: 'sysmon',
      event_type: 'ProcessCreate',
      timestamp: timestamp.toISOString(),
      hostname: `SERVER-${Math.floor(Math.random() * 10)}`,
      username: 'SYSTEM',
      process_name: 'WindowsUpdate.exe',
      command_line: 'WindowsUpdate.exe /silent',
      is_malicious: false,
      threat_score: 0,
      raw_log: {
        EventID: 1,
        Image: 'C:\\Windows\\System32\\WindowsUpdate.exe',
        User: 'NT AUTHORITY\\SYSTEM'
      }
    };
  }
}

