// MITRE ATT&CK attack chain definitions and progression tracking

import type { MitreTechnique } from './mitre';

export type AttackStage = 
  | 'reconnaissance'
  | 'resource-development'
  | 'initial-access'
  | 'execution'
  | 'persistence'
  | 'privilege-escalation'
  | 'defense-evasion'
  | 'credential-access'
  | 'discovery'
  | 'lateral-movement'
  | 'collection'
  | 'command-and-control'
  | 'exfiltration'
  | 'impact';

export interface AttackChainStep {
  stage: AttackStage;
  technique: string; // MITRE technique ID
  timestamp: string;
  description: string;
  indicators: string[];
  logs: string[]; // Log IDs that show this step
  alerts: string[]; // Alert IDs related to this step
}

export interface AttackChain {
  id: string;
  name: string;
  description: string;
  threatActor?: string;
  steps: AttackChainStep[];
  startTime: string;
  endTime?: string;
  detectedAt?: string;
  containedAt?: string;
}

export const ATTACK_STAGE_ORDER: AttackStage[] = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
];

export function getStageNumber(stage: AttackStage): number {
  return ATTACK_STAGE_ORDER.indexOf(stage);
}

export function getNextStage(stage: AttackStage): AttackStage | null {
  const index = ATTACK_STAGE_ORDER.indexOf(stage);
  return index < ATTACK_STAGE_ORDER.length - 1 ? ATTACK_STAGE_ORDER[index + 1] : null;
}

export function getPreviousStage(stage: AttackStage): AttackStage | null {
  const index = ATTACK_STAGE_ORDER.indexOf(stage);
  return index > 0 ? ATTACK_STAGE_ORDER[index - 1] : null;
}

export function createAttackChain(
  name: string,
  description: string,
  threatActor?: string
): AttackChain {
  return {
    id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    threatActor,
    steps: [],
    startTime: new Date().toISOString(),
  };
}

export function addStepToChain(
  chain: AttackChain,
  stage: AttackStage,
  technique: string,
  description: string,
  indicators: string[] = [],
  logs: string[] = [],
  alerts: string[] = []
): AttackChain {
  const step: AttackChainStep = {
    stage,
    technique,
    timestamp: new Date().toISOString(),
    description,
    indicators,
    logs,
    alerts,
  };

  return {
    ...chain,
    steps: [...chain.steps, step],
    updatedAt: new Date().toISOString(),
  };
}

export function getChainProgress(chain: AttackChain): {
  currentStage: AttackStage | null;
  progress: number;
  stagesCompleted: number;
  totalStages: number;
} {
  if (chain.steps.length === 0) {
    return {
      currentStage: null,
      progress: 0,
      stagesCompleted: 0,
      totalStages: ATTACK_STAGE_ORDER.length,
    };
  }

  const lastStep = chain.steps[chain.steps.length - 1];
  const stageIndex = ATTACK_STAGE_ORDER.indexOf(lastStep.stage);
  const progress = ((stageIndex + 1) / ATTACK_STAGE_ORDER.length) * 100;

  return {
    currentStage: lastStep.stage,
    progress,
    stagesCompleted: stageIndex + 1,
    totalStages: ATTACK_STAGE_ORDER.length,
  };
}

// Common attack chain templates
export const ATTACK_CHAIN_TEMPLATES: Record<string, Partial<AttackChain>> = {
  'ransomware-basic': {
    name: 'Basic Ransomware Attack Chain',
    description: 'A typical ransomware attack from initial access to encryption',
    steps: [
      {
        stage: 'initial-access',
        technique: 'T1566.001',
        timestamp: '',
        description: 'Phishing email with malicious attachment',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'execution',
        technique: 'T1059.001',
        timestamp: '',
        description: 'PowerShell execution from Word document',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'command-and-control',
        technique: 'T1071.001',
        timestamp: '',
        description: 'C2 beaconing to external IP',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'exfiltration',
        technique: 'T1048',
        timestamp: '',
        description: 'Data exfiltration before encryption',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'impact',
        technique: 'T1486',
        timestamp: '',
        description: 'Ransomware deployment and encryption',
        indicators: [],
        logs: [],
        alerts: [],
      },
    ],
  },
  'apt-lateral-movement': {
    name: 'APT Lateral Movement Chain',
    description: 'Advanced persistent threat with lateral movement',
    steps: [
      {
        stage: 'initial-access',
        technique: 'T1078',
        timestamp: '',
        description: 'Valid account compromise',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'discovery',
        technique: 'T1018',
        timestamp: '',
        description: 'Network service scanning',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'lateral-movement',
        technique: 'T1021.002',
        timestamp: '',
        description: 'SMB lateral movement',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'collection',
        technique: 'T1005',
        timestamp: '',
        description: 'Data collection from local system',
        indicators: [],
        logs: [],
        alerts: [],
      },
      {
        stage: 'exfiltration',
        technique: 'T1041',
        timestamp: '',
        description: 'Exfiltration over C2 channel',
        indicators: [],
        logs: [],
        alerts: [],
      },
    ],
  },
};

