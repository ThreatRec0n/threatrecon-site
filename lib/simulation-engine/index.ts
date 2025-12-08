import type { Alert, SimulatedEvent, InvestigationSession } from './core-types';
import { EventFactory } from './event-factory';
import { AlertFactory } from './alert-factory';
import { randomUUID } from 'crypto';

export class SimulationEngine {
  private eventFactory = new EventFactory();
  private alertFactory = new AlertFactory();
  private currentSession: InvestigationSession | null = null;
  
  createSession(config: {
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    scenario_type: 'ransomware' | 'apt' | 'insider';
  }): InvestigationSession {
    
    const sessionId = randomUUID();
    
    // Generate minimal attack events
    const attackEvents = this.generateMinimalAttackEvents(sessionId);
    
    // Generate massive benign events
    const allEvents = this.eventFactory.generateEventSet({
      session_id: sessionId,
      difficulty: config.difficulty,
      attack_events: attackEvents
    });
    
    // Generate alerts
    const alerts = this.alertFactory.generateAlertQueue({
      session_id: sessionId,
      difficulty: config.difficulty
    });
    
    console.log(`✓ Generated ${allEvents.length} events (${attackEvents.length} malicious, ${allEvents.length - attackEvents.length} benign)`);
    console.log(`✓ Generated ${alerts.length} alerts`);
    
    this.currentSession = {
      session_id: sessionId,
      scenario_name: `${config.difficulty} ${config.scenario_type} Investigation`,
      difficulty: config.difficulty,
      alerts,
      events: allEvents,
      attack_chain: {
        stages: ['execution', 'persistence', 'command-and-control'],
        techniques: ['T1059.001', 'T1547.001', 'T1071.001']
      },
      alerts_triaged: 0,
      correct_identifications: 0,
      false_positives_flagged: 0,
      missed_threats: 0,
      started_at: new Date(),
      sla_breaches: 0,
      average_triage_time: 0,
      accuracy_percentage: 0,
      speed_score: 0,
      final_grade: 'F'
    };
    
    return this.currentSession;
  }
  
  getSession(): InvestigationSession | null {
    return this.currentSession;
  }
  
  private generateMinimalAttackEvents(sessionId: string): SimulatedEvent[] {
    const now = new Date();
    
    return [
      {
        id: randomUUID(),
        session_id: sessionId,
        source: 'sysmon',
        event_type: 'ProcessCreate',
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
        hostname: 'VICTIM-PC',
        username: 'user42',
        process_name: 'powershell.exe',
        command_line: 'powershell.exe -EncodedCommand JABjAGwAaQBlAG4A...',
        is_malicious: true,
        technique_id: 'T1059.001',
        stage: 'execution',
        threat_score: 85,
        raw_log: {
          EventID: 1,
          Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
          CommandLine: 'powershell.exe -EncodedCommand JABjAGwAaQBlAG4A...'
        }
      },
      {
        id: randomUUID(),
        session_id: sessionId,
        source: 'zeek',
        event_type: 'conn',
        timestamp: new Date(now.getTime() - 3500000).toISOString(),
        hostname: 'VICTIM-PC',
        source_ip: '10.50.12.42',
        dest_ip: '185.220.101.47',
        dest_port: 4444,
        protocol: 'tcp',
        is_malicious: true,
        technique_id: 'T1071.001',
        stage: 'command-and-control',
        threat_score: 90,
        raw_log: {
          id_orig_h: '10.50.12.42',
          id_resp_h: '185.220.101.47',
          id_resp_p: 4444,
          proto: 'tcp'
        }
      }
    ];
  }
}

let engineInstance: SimulationEngine | null = null;

export function getSimulationEngine(): SimulationEngine {
  if (!engineInstance) {
    engineInstance = new SimulationEngine();
  }
  return engineInstance;
}

export type { Alert, SimulatedEvent, InvestigationSession } from './core-types';
export { SLA_REQUIREMENTS } from './core-types';
