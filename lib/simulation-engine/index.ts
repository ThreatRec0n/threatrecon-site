import type { Alert, SimulatedEvent, InvestigationSession } from './core-types';
import { EventFactory } from './event-factory';
import { AlertFactory } from './alert-factory';
import { generateCorrelatedEvents } from './event-generator';
import type { EventGenerationContext } from './event-generator';

export class SimulationEngine {
  private eventFactory = new EventFactory();
  private alertFactory = new AlertFactory();
  private currentSession: InvestigationSession | null = null;
  
  /**
   * Generate complete investigation session
   */
  createSession(config: {
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    scenario_type: 'ransomware' | 'apt' | 'insider';
  }): InvestigationSession {
    
    const sessionId = crypto.randomUUID();
    
    // Generate attack events (use existing logic)
    const attackEvents = this.generateAttackEvents(sessionId, config.scenario_type);
    
    // Generate MASSIVE volume of benign events
    const allEvents = this.eventFactory.generateEventSet({
      session_id: sessionId,
      difficulty: config.difficulty,
      attack_events: attackEvents
    });
    
    // Generate realistic alert queue
    const alerts = this.alertFactory.generateAlertQueue({
      session_id: sessionId,
      difficulty: config.difficulty,
      attack_event_count: attackEvents.length
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
        stages: [...new Set(attackEvents.map(e => e.stage).filter(Boolean) as string[])],
        techniques: [...new Set(attackEvents.map(e => e.technique_id).filter(Boolean) as string[])]
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
  
  private generateAttackEvents(sessionId: string, scenarioType: string): SimulatedEvent[] {
    const context: EventGenerationContext = {
      scenario_id: sessionId,
      session_id: sessionId,
      hostname: 'VICTIM-PC',
      username: 'user42',
      sourceIP: '10.50.12.42',
      attack_chain: {
        id: crypto.randomUUID(),
        scenario_id: sessionId,
        session_id: sessionId,
        name: scenarioType,
        description: '',
        stages: [],
        status: 'active',
        start_time: new Date().toISOString()
      },
      shared_artifacts: {
        malicious_ips: ['185.220.101.47'],
        malicious_domains: ['evil-c2.com'],
        malicious_hashes: [],
        processes: new Map()
      }
    };
    
    const rawEvents = generateCorrelatedEvents(context, {
      stage: 'execution',
      technique_id: 'T1059.001',
      timestamp: new Date().toISOString(),
      events: []
    });
    
    return rawEvents.map(event => ({
      id: event.id,
      session_id: sessionId,
      source: event.source as any,
      event_type: 'attack',
      timestamp: event.timestamp,
      hostname: 'VICTIM-PC',
      username: 'user42',
      process_name: event.details?.Image || event.details?.ProcessName,
      command_line: event.details?.CommandLine,
      source_ip: event.network_context?.source_ip,
      dest_ip: event.network_context?.dest_ip,
      dest_port: event.network_context?.dest_port,
      protocol: event.network_context?.protocol,
      is_malicious: true,
      technique_id: event.technique_id,
      stage: event.stage,
      threat_score: event.threat_score || 80,
      raw_log: event.details || {}
    }));
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
