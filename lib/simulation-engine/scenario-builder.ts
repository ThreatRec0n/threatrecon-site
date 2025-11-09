// Scenario story generator - builds multi-stage attack scenarios

import type { 
  ScenarioStory, 
  AttackChain, 
  AttackChainStage, 
  AttackStage,
  ScenarioTimelineEvent 
} from './types';
import { executeAttackChain } from '../attack-simulators/atomic-red-team';

// Predefined attack chain templates
const ATTACK_CHAIN_TEMPLATES: Record<string, {
  name: string;
  description: string;
  stages: Array<{ stage: AttackStage; technique: string; name: string }>;
}> = {
  'ransomware-deployment': {
    name: 'Ransomware Deployment Chain',
    description: 'Full ransomware attack from initial access to encryption',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Phishing: Spearphishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'persistence', technique: 'T1547.001', name: 'Registry Run Keys' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
      { stage: 'impact', technique: 'T1486', name: 'Data Encrypted for Impact' },
    ],
  },
  'credential-harvesting': {
    name: 'Credential Harvesting Chain',
    description: 'Steal credentials and use them for lateral movement',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Phishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'credential-access', technique: 'T1003', name: 'OS Credential Dumping' },
      { stage: 'lateral-movement', technique: 'T1021.002', name: 'SMB/Windows Admin Shares' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
    ],
  },
  'apt-persistence': {
    name: 'APT Persistence Chain',
    description: 'Advanced persistent threat establishing long-term access',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Spearphishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'persistence', technique: 'T1053.005', name: 'Scheduled Task' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'File Deletion' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
    ],
  },
};

export function generateScenarioStory(
  storyType: keyof typeof ATTACK_CHAIN_TEMPLATES,
  sessionId: string,
  options?: {
    startTime?: string;
    hostname?: string;
    username?: string;
    sourceIP?: string;
  }
): ScenarioStory {
  const template = ATTACK_CHAIN_TEMPLATES[storyType];
  if (!template) {
    throw new Error(`Unknown story type: ${storyType}`);
  }

  const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = options?.startTime || new Date().toISOString();
  
  // Build attack chain
  const attackChain: AttackChain = {
    id: `chain-${scenarioId}`,
    scenario_id: scenarioId,
    session_id: sessionId,
    name: template.name,
    description: template.description,
    stages: [],
    status: 'active',
    start_time: startTime,
  };

  // Generate timeline events
  const timeline: ScenarioTimelineEvent[] = [];
  let currentTime = new Date(startTime);

  template.stages.forEach((stageTemplate, index) => {
    // Each stage happens 2-10 minutes after the previous
    const delayMinutes = 2 + Math.random() * 8;
    currentTime = new Date(currentTime.getTime() + delayMinutes * 60000);

    const chainStage: AttackChainStage = {
      stage: stageTemplate.stage,
      technique_id: stageTemplate.technique,
      technique_name: stageTemplate.name,
      timestamp: currentTime.toISOString(),
      success: true,
      events: [], // Will be populated when events are generated
      artifacts: [],
      description: `Executed ${stageTemplate.name}`,
    };

    attackChain.stages.push(chainStage);

    // Add timeline event
    timeline.push({
      timestamp: currentTime.toISOString(),
      stage: stageTemplate.stage,
      description: `${stageTemplate.name} executed`,
      visible_to_user: index === 0 || Math.random() > 0.3, // First stage always visible, others 70% chance
      detection_triggered: Math.random() > 0.5, // 50% chance of detection
    });
  });

  // Determine difficulty based on story complexity
  const difficulty: ScenarioStory['difficulty'] = 
    template.stages.length <= 3 ? 'beginner' :
    template.stages.length <= 5 ? 'intermediate' :
    'advanced';

  return {
    id: scenarioId,
    name: template.name,
    description: template.description,
    initial_infection_vector: 'phishing', // Can be made dynamic
    attack_chains: [attackChain.id],
    timeline,
    learning_objectives: [
      `Understand ${template.name} attack flow`,
      `Identify indicators across multiple MITRE ATT&CK stages`,
      `Correlate events from different log sources`,
      `Track attack progression through timeline analysis`,
    ],
    difficulty,
  };
}

export function generateMultipleScenarios(
  count: number,
  sessionId: string,
  options?: {
    storyTypes?: Array<keyof typeof ATTACK_CHAIN_TEMPLATES>;
    parallel?: boolean; // Run scenarios in parallel vs sequential
  }
): ScenarioStory[] {
  const storyTypes = options?.storyTypes || Object.keys(ATTACK_CHAIN_TEMPLATES) as Array<keyof typeof ATTACK_CHAIN_TEMPLATES>;
  const scenarios: ScenarioStory[] = [];
  const baseTime = new Date();

  for (let i = 0; i < count; i++) {
    const storyType = storyTypes[Math.floor(Math.random() * storyTypes.length)];
    const startTime = options?.parallel 
      ? baseTime.toISOString() // All start at same time
      : new Date(baseTime.getTime() + i * 3600000).toISOString(); // 1 hour apart

    scenarios.push(
      generateScenarioStory(storyType, sessionId, { startTime })
    );
  }

  return scenarios;
}

