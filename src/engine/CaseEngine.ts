import { v4 as uuidv4 } from 'uuid'
import { INDUSTRIES } from '../data/industries'
import { THREAT_ACTORS } from '../data/threat-actors'
import { TECHNIQUES } from '../data/techniques'
import type {
  ArtifactDef,
  AttackTechniqueRef,
  CaseDefinition,
  CaseGenerationInput,
  DebriefEvent,
  NetworkConnection,
  ProcessEntry,
  RegistryValue,
  ScheduledTaskDef,
  UserAccountDef,
} from '../types/case.types'
import type { Difficulty } from '../types/player.types'
import { mulberry32, pickMany, pickOne } from '../utils/seededRandom'
import { sha256Hex } from '../utils/hashUtils'
import { VirtualFileSystem } from './VirtualFileSystem'
import { VirtualRegistry, defaultBaselineRegistry } from './VirtualRegistry'
import { plantTextFile } from './casePlant'
import { PRESET_ALPHA01 } from '../data/cases/alpha-01'
import { PRESET_BRAVO02 } from '../data/cases/bravo-02'
import { PRESET_CHARLIE03 } from '../data/cases/charlie-03'
import { PRESET_DELTA04 } from '../data/cases/delta-04'

let caseCounter = 1000

function difficultyTimer(d: Difficulty): number {
  switch (d) {
    case 'recruit':
      return 45 * 60
    case 'analyst':
      return 35 * 60
    case 'threat_hunter':
      return 25 * 60
    case 'incident_commander':
      return 15 * 60
    default:
      return 35 * 60
  }
}

function noiseForDifficulty(d: Difficulty): CaseDefinition['noiseLevel'] {
  switch (d) {
    case 'recruit':
      return 'low'
    case 'analyst':
      return 'medium'
    case 'threat_hunter':
      return 'high'
    case 'incident_commander':
      return 'maximum'
    default:
      return 'medium'
  }
}

export interface GeneratedCase {
  case: CaseDefinition
  vfs: VirtualFileSystem
  registry: VirtualRegistry
}

export class CaseEngine {
  static generate(input: CaseGenerationInput): GeneratedCase {
    const seed = input.seed ?? Math.floor(Math.random() * 1_000_000_000)
    const rng = mulberry32(seed)

    if (input.presetCase === 'alpha-01') return finalize(PRESET_ALPHA01(seed, input.difficulty), seed, input.difficulty)
    if (input.presetCase === 'bravo-02') return finalize(PRESET_BRAVO02(seed, input.difficulty), seed, input.difficulty)
    if (input.presetCase === 'charlie-03')
      return finalize(PRESET_CHARLIE03(seed, input.difficulty), seed, input.difficulty)
    if (input.presetCase === 'delta-04') return finalize(PRESET_DELTA04(seed, input.difficulty), seed, input.difficulty)

    const industry = pickOne(rng, INDUSTRIES)
    const actor = pickOne(rng, THREAT_ACTORS)

    const initialAccessPool = TECHNIQUES.filter((t) => t.phase === 'initial-access')
    const executionPool = TECHNIQUES.filter((t) => t.phase === 'execution')
    const persistencePool = TECHNIQUES.filter((t) => t.phase === 'persistence')
    const privPool = TECHNIQUES.filter((t) => t.phase === 'privilege-escalation')
    const evasionPool = TECHNIQUES.filter((t) => t.phase === 'defense-evasion')
    const credPool = TECHNIQUES.filter((t) => t.phase === 'credential-access')
    const latPool = TECHNIQUES.filter((t) => t.phase === 'lateral-movement')
    const collPool = TECHNIQUES.filter((t) => t.phase === 'collection')
    const exfilPool = TECHNIQUES.filter((t) => t.phase === 'exfiltration')

    const entryVector = pickOne(rng, initialAccessPool)
    const exec = pickMany(rng, executionPool, rng() > 0.5 ? 2 : 1)
    const persist = pickMany(rng, persistencePool, 2)
    const priv = pickMany(rng, privPool, rng() > 0.6 ? 1 : 0)
    const evasion = pickMany(rng, evasionPool, 2)
    const cred = pickMany(rng, credPool, rng() > 0.5 ? 1 : 0)
    const lateral = pickMany(rng, latPool, rng() > 0.55 ? 1 : 0)
    const coll = pickMany(rng, collPool, rng() > 0.7 ? 1 : 0)
    const exfil = pickOne(rng, exfilPool)

    const attackChain: AttackTechniqueRef[] = [
      entryVector,
      ...exec,
      ...persist,
      ...priv,
      ...evasion,
      ...cred,
      ...lateral,
      ...coll,
      exfil,
    ]

    const hostname = `WORKSTATION-${String(Math.floor(rng() * 90 + 10)).padStart(2, '0')}`
    const primaryUser = pickOne(rng, ['jsmith', 'adesai', 'mjohnson', 'klopez'])
    const c2Ip = `185.220.${Math.floor(rng() * 200 + 20)}.${Math.floor(rng() * 200 + 20)}`

    const maliciousPid = 4000 + Math.floor(rng() * 2000)
    const processes: ProcessEntry[] = []
    const legit = [
      { pid: 4, ppid: 0, name: 'System', memKb: 144 },
      { pid: 96, ppid: 4, name: 'Registry', memKb: 112 },
      { pid: 348, ppid: 4, name: 'smss.exe', memKb: 1380 },
      { pid: 432, ppid: 348, name: 'csrss.exe', memKb: 6120 },
      { pid: 504, ppid: 432, name: 'wininit.exe', memKb: 712 },
      { pid: 1096, ppid: 504, name: 'svchost.exe', memKb: 27144 },
      { pid: 1188, ppid: 504, name: 'svchost.exe', memKb: 15288 },
    ]
    legit.forEach((p, i) => {
      processes.push({
        pid: p.pid,
        ppid: p.ppid,
        name: p.name,
        sessionName: 'Services',
        sessionNum: 0,
        memKb: p.memKb + i * 3,
        user: 'SYSTEM',
        commandLine: `C:\\Windows\\System32\\${p.name}`,
        path: `C:\\Windows\\System32\\${p.name}`,
      })
    })
    processes.push({
      pid: maliciousPid,
      ppid: 1188,
      name: 'svchos.exe',
      sessionName: 'Console',
      sessionNum: 1,
      memKb: 18204,
      user: primaryUser,
      malicious: true,
      anomalies: ['Parent mismatch', 'Name near-miss vs svchost.exe'],
      commandLine: `C:\\Users\\${primaryUser}\\AppData\\Local\\Temp\\wupdate.exe`,
      path: `C:\\Users\\${primaryUser}\\AppData\\Local\\Temp\\wupdate.exe`,
    })

    const connections: NetworkConnection[] = [
      {
        proto: 'TCP',
        local: `10.0.1.${Math.floor(rng() * 200)}:${49200 + Math.floor(rng() * 400)}`,
        foreign: `${c2Ip}:4444`,
        state: 'ESTABLISHED',
        pid: maliciousPid,
        processName: 'svchos.exe',
        malicious: true,
        bytesIn: 1024 * 64,
        bytesOut: 1024 * 512,
      },
      {
        proto: 'TCP',
        local: '0.0.0.0:445',
        foreign: '0.0.0.0:0',
        state: 'LISTENING',
        pid: 4,
        processName: 'System',
      },
    ]

    const maliciousPath = `C:\\Users\\${primaryUser}\\AppData\\Local\\Temp\\wupdate.exe`

    const registry: Record<string, RegistryValue[]> = {}
    registry['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'] = [
      { name: 'WindowsUpdateHelper', type: 'REG_SZ', data: maliciousPath },
      { name: 'OneDrive', type: 'REG_SZ', data: 'C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe' },
    ]

    const scheduledTasks: ScheduledTaskDef[] = [
      {
        name: '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan Static Task',
        status: 'Ready',
        triggers: 'Daily 03:17',
        nextRun: '2026-05-09T03:17:00Z',
        lastRun: '2026-05-08T03:17:11Z',
        author: `${hostname}\\${primaryUser}`,
        runAs: 'SYSTEM',
        command: `powershell.exe -NonInteractive -WindowStyle Hidden -enc ${btoa('Invoke-C2')}`,
        xml: '<Task>...</Task>',
        malicious: true,
      },
    ]

    const userAccounts: UserAccountDef[] = [
      {
        name: primaryUser,
        fullName: 'Primary User',
        description: 'Standard user',
        enabled: true,
        lastLogon: '2026-05-08T13:22:11Z',
        passwordAge: '42 days',
        groups: ['Users'],
        created: '2024-01-12T15:10:00Z',
        sid: 'S-1-5-21-1234567890-987654321-1111111111-1208',
      },
      {
        name: 'svc_update',
        fullName: '',
        description: '',
        enabled: true,
        lastLogon: '2026-05-08T03:18:02Z',
        passwordAge: '1 days',
        groups: ['Users', 'Administrators'],
        created: '2026-05-08T03:17:02Z',
        sid: 'S-1-5-21-1234567890-987654321-1111111111-1902',
        malicious: true,
      },
    ]

    const artifacts: ArtifactDef[] = [
      {
        id: 'a-mal-file',
        type: 'file',
        path: maliciousPath,
        label: 'Masqueraded updater binary',
        mitre: ['T1036.005'],
        details: 'Suspicious path and signature mismatch',
      },
      {
        id: 'a-run-key',
        type: 'registry',
        path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\WindowsUpdateHelper',
        label: 'Run key persistence',
        mitre: ['T1547.001'],
      },
      {
        id: 'a-task',
        type: 'task',
        path: scheduledTasks[0]!.name,
        label: 'Scheduled task persistence',
        mitre: ['T1053.005'],
      },
      {
        id: 'a-user',
        type: 'user',
        path: 'svc_update',
        label: 'Unauthorized local administrator',
        mitre: ['T1136.001'],
      },
      {
        id: 'a-net',
        type: 'network',
        path: `${c2Ip}:4444`,
        label: 'C2 session',
        mitre: ['T1041'],
      },
    ]

    const debriefData: DebriefEvent[] = [
      { t: new Date().toISOString(), kind: 'attacker', title: 'Initial access', detail: `${entryVector.name}` },
      { t: new Date().toISOString(), kind: 'attacker', title: 'Payload staged', detail: maliciousPath },
      { t: new Date().toISOString(), kind: 'attacker', title: 'Persistence', detail: 'Run key + scheduled task' },
    ]

    const correctEradicationOrder = [
      'document_process',
      'hash_malware',
      'remove_run_key',
      'remove_scheduled_task',
      'disable_backdoor_user',
      'delete_malware',
    ]

    const correctHardeningSteps = [
      { id: 'h1', label: 'Block C2 egress in firewall', techniqueHint: exfil.id },
      { id: 'h2', label: 'Reset credentials for affected account', techniqueHint: entryVector.id },
      { id: 'h3', label: 'Enable MFA on administrator accounts' },
    ]

    const caseDef: CaseDefinition = {
      caseId: uuidv4(),
      seed,
      caseNumber: ++caseCounter,
      industry,
      threatActor: actor,
      attackChain,
      entryVector,
      persistenceMechanisms: persist,
      lateralMovement: lateral,
      exfiltration: exfil,
      hidingLocations: [maliciousPath, 'HKCU\\...\\Run', scheduledTasks[0]!.name],
      networkConnections: connections,
      processes,
      registry,
      scheduledTasks,
      userAccounts,
      correctEradicationOrder,
      correctHardeningSteps,
      artifacts,
      timerSeconds: difficultyTimer(input.difficulty),
      debriefData,
      hostname,
      primaryUser,
      c2Ip,
      severity: 'HIGH',
      initialAlert: {
        title: 'ANOMALOUS OUTBOUND CONNECTION',
        detail: `Outbound TCP to ${c2Ip}:4444 from PID ${maliciousPid}`,
        time: new Date().toISOString(),
        host: hostname,
        user: primaryUser,
      },
      noiseLevel: noiseForDifficulty(input.difficulty),
      recruitHints:
        input.difficulty === 'recruit'
          ? [
              'Check processes running from unusual directories.',
              'Review Event ID 4698 in the Security log.',
              `Inspect ${maliciousPath}`,
            ]
          : undefined,
      commanderExfilAtRemainingSeconds: input.difficulty === 'incident_commander' ? 600 : undefined,
    }

    return finalize(caseDef, seed, input.difficulty)
  }
}

function finalize(caseDef: CaseDefinition, seed: number, difficulty: Difficulty): GeneratedCase {
  caseDef.seed = seed
  caseDef.timerSeconds = difficultyTimer(difficulty)
  caseDef.noiseLevel = noiseForDifficulty(difficulty)
  /* event logs are generated lazily by EventViewer to avoid blocking case start */
  if (!caseDef.eventLogEntries) caseDef.eventLogEntries = []

  const vfs = new VirtualFileSystem(caseDef.primaryUser)
  const root = vfs.getRoot()
  caseDef.artifacts
    .filter((a) => a.type === 'file')
    .forEach((a) => {
      const stubBin = `MZ\x90\x00${a.id}\x00`.padEnd(2048, '\x00')
      const knownHash = sha256Hex(`${a.id}-${a.path}`)
      const malStrings = synthesizeStrings(a, caseDef.c2Ip ?? '0.0.0.0')
      plantTextFile(root, a.path, stubBin, {
        hidden: false,
        isBinary: true,
        signed: false,
        signaturePublisher: undefined,
        knownHash,
        strings: malStrings,
      })
    })

  const registry = new VirtualRegistry()
  defaultBaselineRegistry(registry, { primaryUser: caseDef.primaryUser, hostname: caseDef.hostname })
  for (const [path, values] of Object.entries(caseDef.registry)) {
    registry.setSubkey(path)
    for (const v of values) {
      registry.setValue(path, v.name, v.type, v.data)
    }
  }
  return { case: caseDef, vfs, registry }
}

function synthesizeStrings(a: ArtifactDef, c2: string): string[] {
  const base = [
    `!This program cannot be run in DOS mode.`,
    `.text`,
    `.rdata`,
    `.data`,
    `.rsrc`,
    `.reloc`,
    `KERNEL32.dll`,
    `ADVAPI32.dll`,
    `WS2_32.dll`,
    `CreateFileW`,
    `WriteFile`,
    `CloseHandle`,
    `RegSetValueExW`,
  ]
  if (a.type === 'file') {
    base.push(
      `schtasks.exe /create /tn "WindowsUpdate" /sc daily /st 03:00 /tr ${a.path}`,
      `powershell.exe -NonInteractive -WindowStyle Hidden -enc`,
      c2,
      `/upload`,
      `cmd.exe /c`,
      `${a.path}`,
    )
  }
  return base
}
