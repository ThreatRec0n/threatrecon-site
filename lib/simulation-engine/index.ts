// Main simulation engine orchestrator - RedHunt OS / Security Onion style SOC simulation

import type { 
  SimulatedEvent, 
  AttackChain, 
  ScenarioStory,
  GeneratedAlert
} from './types';
import type { EventGenerationContext } from './event-generator';
import { generateScenarioStory, generateMultipleScenarios } from './scenario-builder';
import { generateCorrelatedEvents } from './event-generator';
import { evaluateDetectionRules } from './detection-engine';

export interface SimulationSession {
  session_id: string;
  scenario_stories: ScenarioStory[];
  attack_chains: AttackChain[];
  events: SimulatedEvent[];
  alerts: GeneratedAlert[];
  start_time: string;
  end_time?: string;
  status: 'running' | 'completed' | 'paused';
}

export interface SimulationConfig {
  story_type?: 'ransomware-deployment' | 'credential-harvesting' | 'apt-persistence';
  difficulty?: 'grasshopper' | 'beginner' | 'intermediate' | 'advanced';
  hostname?: string;
  username?: string;
  sourceIP?: string;
  parallel_scenarios?: boolean;
  scenario_count?: number;
}

export class SimulationEngine {
  private session: SimulationSession | null = null;

  /**
   * Initialize a new simulation session
   */
  initializeSession(config: SimulationConfig = {}): SimulationSession {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const storyType = config.story_type || 'ransomware-deployment';
    const scenarioCount = config.scenario_count || 1;
    
    // Generate scenario stories
    const stories = generateMultipleScenarios(scenarioCount, sessionId, {
      storyTypes: [storyType],
      parallel: config.parallel_scenarios || false,
    });

    // Generate attack chains and events for each story
    const attackChains: AttackChain[] = [];
    const allEvents: SimulatedEvent[] = [];
    const allAlerts: GeneratedAlert[] = [];

    stories.forEach(story => {
      // For each attack chain in the story, generate events
      story.attack_chains.forEach(chainId => {
        // Find or create the attack chain
        // In a real implementation, we'd retrieve this from the story generation
        // For now, we'll create a simplified version
        
        const context: EventGenerationContext = {
          scenario_id: story.id,
          session_id: sessionId,
          hostname: config.hostname || `WIN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          username: config.username || `DOMAIN\\${Math.random().toString(36).substr(2, 8)}`,
          sourceIP: config.sourceIP || `10.0.1.${Math.floor(Math.random() * 254) + 1}`,
          attack_chain: {
            id: chainId,
            scenario_id: story.id,
            session_id: sessionId,
            name: story.name,
            description: story.description,
            stages: [], // Will be populated
            status: 'active',
            start_time: new Date().toISOString(),
          },
          shared_artifacts: {
            malicious_ips: ['185.220.101.0', '45.146.164.110'],
            malicious_domains: ['c2-malicious-domain.com', 'evil-command-control.net'],
            malicious_hashes: [],
            processes: new Map(),
          },
        };

        // Map timeline events to actual MITRE techniques based on stage
        const stageToTechnique: Record<string, string> = {
          'initial-access': 'T1566.001',
          'execution': 'T1059.001',
          'persistence': 'T1547.001',
          'command-and-control': 'T1071.001',
          'exfiltration': 'T1048',
          'credential-access': 'T1003',
          'lateral-movement': 'T1021.002',
        };

        // Generate events for each stage in the attack chain
        // We'll use the timeline to determine stages
        story.timeline.forEach((timelineEvent, index) => {
          const stage: AttackChain['stages'][0] = {
            stage: timelineEvent.stage,
            technique_id: stageToTechnique[timelineEvent.stage] || `T${Math.floor(Math.random() * 1000)}`,
            technique_name: timelineEvent.description,
            timestamp: timelineEvent.timestamp,
            success: true,
            events: [],
            artifacts: [],
            description: timelineEvent.description,
          };

          context.attack_chain.stages.push(stage);

          // Generate correlated events for this stage
          const events = generateCorrelatedEvents(context, stage);
          allEvents.push(...events);
        });

        attackChains.push(context.attack_chain);
      });
    });

    // Evaluate detection rules to generate alerts
    allAlerts.push(...evaluateDetectionRules(allEvents));

    // Create session
    this.session = {
      session_id: sessionId,
      scenario_stories: stories,
      attack_chains: attackChains,
      events: allEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      alerts: allAlerts.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      start_time: new Date().toISOString(),
      status: 'running',
    };

    return this.session;
  }

  /**
   * Get current simulation session
   */
  getSession(): SimulationSession | null {
    return this.session;
  }

  /**
   * Add benign events to the simulation (noise)
   */
  addBenignEvents(count: number): void {
    if (!this.session) return;

    // Generate benign events to add noise
    // This simulates normal network/endpoint activity
    const benignEvents: SimulatedEvent[] = [];
    const baseTime = new Date(this.session.start_time);

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(baseTime.getTime() + i * 60000).toISOString(); // 1 minute apart
      
      benignEvents.push({
        id: `benign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: Math.random() > 0.5 ? 'sysmon' : 'zeek',
        scenario_id: this.session.scenario_stories[0]?.id || 'unknown',
        session_id: this.session.session_id,
        technique_id: '',
        stage: 'execution',
        timestamp,
        details: {
          // Benign activity
          Image: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          CommandLine: 'chrome.exe',
          DestinationIp: '8.8.8.8',
          DestinationPort: '443',
        },
        related_event_ids: [],
        threat_score: 0,
      });
    }

    this.session.events.push(...benignEvents);
    this.session.events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get events filtered by criteria
   */
  getEvents(filters?: {
    source?: string;
    technique_id?: string;
    stage?: string;
    timeRange?: { start: string; end: string };
    threat_score_min?: number;
  }): SimulatedEvent[] {
    if (!this.session) return [];

    let filtered = [...this.session.events];

    if (filters?.source) {
      filtered = filtered.filter(e => e.source === filters.source);
    }

    if (filters?.technique_id) {
      filtered = filtered.filter(e => e.technique_id === filters.technique_id);
    }

    if (filters?.stage) {
      filtered = filtered.filter(e => e.stage === filters.stage);
    }

    if (filters?.timeRange) {
      filtered = filtered.filter(e => {
        const eventTime = new Date(e.timestamp).getTime();
        return eventTime >= new Date(filters.timeRange!.start).getTime() &&
               eventTime <= new Date(filters.timeRange!.end).getTime();
      });
    }

    if (filters?.threat_score_min !== undefined) {
      filtered = filtered.filter(e => (e.threat_score || 0) >= filters.threat_score_min!);
    }

    return filtered;
  }

  /**
   * Get related events (correlation)
   */
  getRelatedEvents(eventId: string): SimulatedEvent[] {
    if (!this.session) return [];

    const event = this.session.events.find(e => e.id === eventId);
    if (!event) return [];

    return this.session.events.filter(e => 
      event.related_event_ids?.includes(e.id) ||
      e.related_event_ids?.includes(event.id) ||
      e.correlation_key === event.correlation_key
    );
  }

  /**
   * Execute an Atomic Red Team technique and generate events
   */
  executeAtomicTechnique(techniqueId: string, sessionId?: string): SimulatedEvent[] {
    if (!this.session && !sessionId) {
      throw new Error('No active session');
    }

    const currentSession = this.session || null;
    if (!currentSession && sessionId) {
      // In a real implementation, we'd load the session
      throw new Error('Session not found');
    }

    // Import Atomic Red Team executor
    const { executeAtomicTest } = require('../attack-simulators/atomic-red-team');
    
    // Execute the atomic test
    const execution = executeAtomicTest(techniqueId, {
      hostname: 'WIN-TEST',
      username: 'DOMAIN\\user',
      sourceIP: '10.0.1.100',
    });

    // Convert SIEMEvent[] to SimulatedEvent[]
    // The logs from executeAtomicTest are SIEMEvent objects, we need to convert them
    const simulatedEvents: SimulatedEvent[] = execution.logs.map((log: any, index: number) => {
      // Determine source from log structure
      let source: 'sysmon' | 'zeek' | 'suricata' | 'edr' | 'cloudtrail' | 'windows-event' = 'sysmon';
      if ((log.sourceIP || log.id_orig_h) && (log.destinationIP || log.id_resp_h) && !log.EventData && !log.EventID) {
        source = 'zeek';
      } else if (log.EventData || log.EventID || log.System) {
        source = 'sysmon';
      } else if (log.eventType && log.message) {
        // Generic SIEM event
        source = log.source || 'sysmon';
      }

      // Determine stage from technique
      const stageMap: Record<string, string> = {
        'T1059.001': 'execution',
        'T1071.001': 'command-and-control',
        'T1003': 'credential-access',
        'T1021.002': 'lateral-movement',
        'T1048': 'exfiltration',
        'T1566.001': 'initial-access',
        'T1053.005': 'persistence',
        'T1083': 'discovery',
        'T1018': 'discovery',
        'T1547.001': 'persistence',
        'T1486': 'impact',
      };

      return {
        id: `atomic-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        source,
        scenario_id: currentSession?.scenario_stories[0]?.id || 'atomic-test',
        session_id: currentSession?.session_id || sessionId || 'unknown',
        technique_id: techniqueId,
        stage: stageMap[techniqueId] || 'execution',
        timestamp: new Date().toISOString(),
        details: log,
        related_event_ids: [],
        threat_score: 70, // Atomic tests are malicious by nature
        is_malicious: true,
        message: `Atomic Red Team test executed: ${techniqueId}`,
      };
    });

    // Add events to session
    if (currentSession) {
      currentSession.events.push(...simulatedEvents);
      currentSession.events.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    return simulatedEvents;
  }

  /**
   * Complete the simulation
   */
  completeSession(): void {
    if (!this.session) return;

    this.session.status = 'completed';
    this.session.end_time = new Date().toISOString();
  }
}

// Singleton instance
let engineInstance: SimulationEngine | null = null;

export function getSimulationEngine(): SimulationEngine {
  if (!engineInstance) {
    engineInstance = new SimulationEngine();
  }
  return engineInstance;
}

