import type { Difficulty } from './player.types'

export interface AttackTechniqueRef {
  id: string
  name: string
  tactic: string
  phase:
    | 'initial-access'
    | 'execution'
    | 'persistence'
    | 'privilege-escalation'
    | 'defense-evasion'
    | 'credential-access'
    | 'discovery'
    | 'lateral-movement'
    | 'collection'
    | 'exfiltration'
    | 'impact'
}

export interface IndustryProfile {
  id: string
  industryType: string
  companyName: string
  sensitiveData: string[]
  compliance: string[]
  employees: number
  workstations: number
  servers: number
  domainControllers: number
}

export interface ThreatActorProfile {
  id: string
  displayName: string
  sophistication: 1 | 2 | 3 | 4 | 5
  motivation: 'financial' | 'espionage' | 'disruption' | 'insider'
  counterForensics: 'none' | 'basic' | 'advanced' | 'expert'
  dwellMinutes: number
  preferredTechniques: string[]
  signatureArtifacts: string[]
}

export interface NetworkConnection {
  proto: 'TCP' | 'UDP'
  local: string
  foreign: string
  state: string
  pid: number
  processName: string
  malicious?: boolean
  bytesIn?: number
  bytesOut?: number
}

export interface ProcessEntry {
  pid: number
  ppid: number
  name: string
  sessionName: string
  sessionNum: number
  memKb: number
  user: string
  cpuMs?: number
  cpuPercent?: number
  status?: 'Running' | 'Suspended' | 'Not Responding'
  services?: string[]
  windowTitle?: string
  commandLine?: string
  malicious?: boolean
  anomalies?: string[]
  path?: string
}

export interface RegistryValue {
  name: string
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_BINARY' | 'REG_EXPAND_SZ' | 'REG_MULTI_SZ'
  data: string
}

export interface ScheduledTaskDef {
  name: string
  status: string
  triggers: string
  nextRun: string
  lastRun: string
  author: string
  runAs: string
  command: string
  xml: string
  malicious?: boolean
}

export interface UserAccountDef {
  name: string
  fullName: string
  description: string
  enabled: boolean
  lastLogon: string
  passwordAge: string
  groups: string[]
  created: string
  sid: string
  malicious?: boolean
}

export interface EventLogEntry {
  id: string
  log: 'Security' | 'System' | 'Application' | 'PowerShell'
  level: 'Information' | 'Warning' | 'Error' | 'Success Audit' | 'Failure Audit'
  time: string
  source: string
  eventId: number
  task: string
  computer: string
  xml: string
  keywords?: string[]
  malicious?: boolean
  /** Short unique summary for the table (distinct per row). */
  summary?: string
  /** Row highlight tier beyond generic level coloring. */
  riskTier?: 'critical' | 'warn' | 'info'
}

export interface ArtifactDef {
  id: string
  type: 'file' | 'registry' | 'process' | 'network' | 'log' | 'user' | 'task'
  path: string
  label: string
  mitre: string[]
  hash?: string
  details?: string
}

export interface DebriefEvent {
  t: string
  kind: 'attacker' | 'player'
  title: string
  detail: string
  artifactId?: string
  found?: boolean
}

export type EradicationActionType =
  | 'hash_file'
  | 'delete_file'
  | 'kill_process'
  | 'document_process'
  | 'export_registry'
  | 'delete_registry'
  | 'clear_logs'
  | 'disable_user'
  | 'delete_user'
  | 'delete_task'
  | 'stop_service'

export interface EradicationAction {
  type: EradicationActionType
  target?: string
  timestamp: number
}

export interface HardeningStepDef {
  id: string
  label: string
  techniqueHint?: string
  terminalPattern?: RegExp
}

export interface DebriefEventTimed extends DebriefEvent {
  /** Seconds from case start (positive). Allows timeline scrubber positioning. */
  offsetSec: number
}

export interface CaseDefinition {
  caseId: string
  seed: number
  caseNumber: number
  code?: string
  industry: IndustryProfile
  threatActor: ThreatActorProfile
  attackChain: AttackTechniqueRef[]
  entryVector: AttackTechniqueRef
  persistenceMechanisms: AttackTechniqueRef[]
  lateralMovement: AttackTechniqueRef[]
  exfiltration: AttackTechniqueRef
  hidingLocations: string[]
  eventLogEntries?: EventLogEntry[]
  networkConnections: NetworkConnection[]
  processes: ProcessEntry[]
  registry: Record<string, RegistryValue[]>
  scheduledTasks: ScheduledTaskDef[]
  userAccounts: UserAccountDef[]
  correctEradicationOrder: string[]
  correctHardeningSteps: HardeningStepDef[]
  artifacts: ArtifactDef[]
  timerSeconds: number
  debriefData: DebriefEvent[]
  hostname: string
  primaryUser: string
  c2Ip?: string
  c2Domain?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  initialAlert: {
    title: string
    detail: string
    time: string
    host: string
    user: string
  }
  noiseLevel: 'low' | 'medium' | 'high' | 'maximum'
  recruitHints?: string[]
  commanderExfilAtRemainingSeconds?: number
}

export interface CaseGenerationInput {
  difficulty: Difficulty
  seed?: number
  presetCase?: 'alpha-01' | 'bravo-02' | 'charlie-03' | 'delta-04'
}
