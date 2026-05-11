import { v4 as uuidv4 } from 'uuid'
import { INDUSTRIES } from '../industries'
import { THREAT_ACTORS } from '../threat-actors'
import { getTechnique } from '../techniques'
import type { CaseDefinition } from '../../types/case.types'
import type { Difficulty } from '../../types/player.types'

/** Case ALPHA-01 — THE GHOST PROCESS */
export function PRESET_ALPHA01(seed: number, difficulty: Difficulty): CaseDefinition {
  const industry = INDUSTRIES.find((i) => i.id === 'healthcare')!
  const actor = THREAT_ACTORS.find((a) => a.id === 'phantom_unit')!
  const t1566 = getTechnique('T1566.001')!
  const t1059 = getTechnique('T1059.001')!
  const t1547 = getTechnique('T1547.001')!
  const t1053 = getTechnique('T1053.005')!
  const t1055 = getTechnique('T1055')!
  const t1070 = getTechnique('T1070.006')!
  const t1003 = getTechnique('T1003.001')!
  const t1550 = getTechnique('T1550.002')!
  const t1071 = getTechnique('T1071.004')!

  const hostname = 'WORKSTATION-14'
  const primaryUser = 'billing01'
  const maliciousPath = `C:\\Users\\${primaryUser}\\AppData\\Local\\Temp\\health_invoice.exe`

  const c: CaseDefinition = {
    caseId: uuidv4(),
    seed,
    caseNumber: 1,
    code: 'ALPHA-01',
    industry,
    threatActor: actor,
    attackChain: [t1566, t1059, t1547, t1053, t1055, t1070, t1003, t1550, t1071],
    entryVector: t1566,
    persistenceMechanisms: [t1547, t1053],
    lateralMovement: [t1550],
    exfiltration: t1071,
    hidingLocations: [maliciousPath, 'HKCU\\Software\\...\\Run', 'Memory-resident payload'],
    networkConnections: [
      {
        proto: 'TCP',
        local: '10.0.2.15:50112',
        foreign: '45.33.32.156:53',
        state: 'ESTABLISHED',
        pid: 5520,
        processName: 'svchost.exe',
        malicious: true,
      },
    ],
    processes: [
      {
        pid: 5520,
        ppid: 664,
        name: 'svchost.exe',
        sessionName: 'Services',
        sessionNum: 0,
        memKb: 28444,
        user: 'SYSTEM',
        malicious: true,
        anomalies: ['Unsigned module in suspicious thread context'],
        commandLine: 'C:\\Windows\\System32\\svchost.exe -k netsvcs',
      },
    ],
    registry: {
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run': [
        { name: 'EpicHelper', type: 'REG_SZ', data: maliciousPath },
      ],
    },
    scheduledTasks: [
      {
        name: '\\Microsoft\\Windows\\ExploitGuard\\RunScanCache',
        status: 'Ready',
        triggers: 'At log on',
        nextRun: '2026-05-08T13:05:00Z',
        lastRun: '2026-05-08T03:09:22Z',
        author: `${hostname}\\SYSTEM`,
        runAs: 'SYSTEM',
        command: `powershell.exe -enc ${btoa('Start-BitsTransfer')}`,
        xml: '<Task><Triggers><LogonTrigger/></Triggers></Task>',
        malicious: true,
      },
    ],
    userAccounts: [
      {
        name: primaryUser,
        fullName: 'Billing Specialist',
        description: 'Epic access',
        enabled: true,
        lastLogon: '2026-05-08T12:44:01Z',
        passwordAge: '33 days',
        groups: ['Users'],
        created: '2023-08-01T10:00:00Z',
        sid: 'S-1-5-21-111-222-333-2101',
      },
    ],
    correctEradicationOrder: ['memory_evidence', 'persistence', 'binary'],
    correctHardeningSteps: [
      { id: 'h-mfa', label: 'Enforce MFA on compromised account' },
      { id: 'h-mail', label: 'Block phishing domain egress' },
      { id: 'h-pwd', label: 'Reset compromised credentials' },
    ],
    artifacts: [
      {
        id: 'alpha-mal',
        type: 'file',
        path: maliciousPath,
        label: 'Staged healthcare invoice trojan',
        mitre: ['T1204.002'],
      },
      {
        id: 'alpha-run',
        type: 'registry',
        path: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\EpicHelper',
        label: 'Run key persistence',
        mitre: ['T1547.001'],
      },
      {
        id: 'alpha-dns',
        type: 'network',
        path: '45.33.32.156:53',
        label: 'DNS tunneling channel',
        mitre: ['T1071.004'],
      },
    ],
    timerSeconds: difficulty === 'recruit' ? 45 * 60 : 35 * 60,
    debriefData: [
      {
        t: '2026-05-08T03:09:10Z',
        kind: 'attacker',
        title: 'Macro execution',
        detail: 'Spearphishing attachment opened by billing user.',
      },
      {
        t: '2026-05-08T03:09:22Z',
        kind: 'attacker',
        title: 'Payload inject',
        detail: 'Process hollowing into svchost.exe — limited on-disk footprint.',
      },
    ],
    hostname,
    primaryUser,
    c2Ip: '45.33.32.156',
    severity: 'HIGH',
    initialAlert: {
      title: 'ANOMALOUS DNS SESSION',
      detail: 'Long-lived TCP/53 from workstation to foreign resolver',
      time: '2026-05-08T03:11:02Z',
      host: hostname,
      user: primaryUser,
    },
    noiseLevel: 'medium',
    recruitHints: [
      'Inspect processes with unusual children or unsigned modules.',
      'Correlate PowerShell script block logs with DNS timing.',
      maliciousPath,
    ],
  }

  return c
}
