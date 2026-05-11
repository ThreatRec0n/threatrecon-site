import { v4 as uuidv4 } from 'uuid'
import { INDUSTRIES } from '../industries'
import { THREAT_ACTORS } from '../threat-actors'
import { getTechnique } from '../techniques'
import type { CaseDefinition } from '../../types/case.types'
import type { Difficulty } from '../../types/player.types'


/** Case BRAVO-02 — SCHEDULED FOR DISASTER */
export function PRESET_BRAVO02(seed: number, difficulty: Difficulty): CaseDefinition {
  const industry = INDUSTRIES.find((i) => i.id === 'finance')!
  const actor = THREAT_ACTORS.find((a) => a.id === 'crimson_spider')!
  const t1133 = getTechnique('T1133')!
  const t1078 = getTechnique('T1078')!
  const t1059 = getTechnique('T1059.003')!
  const t1053 = getTechnique('T1053.005')!
  const t1134 = getTechnique('T1134')!
  const t1555 = getTechnique('T1555.003')!
  const t1048 = getTechnique('T1048.003')!

  const hostname = 'TRADING-WS-07'
  const primaryUser = 'opsdesk'

  const c: CaseDefinition = {
    caseId: uuidv4(),
    seed,
    caseNumber: 2,
    code: 'BRAVO-02',
    industry,
    threatActor: actor,
    attackChain: [t1133, t1078, t1059, t1053, t1134, t1555, t1048],
    entryVector: t1133,
    persistenceMechanisms: [t1053],
    lateralMovement: [],
    exfiltration: t1048,
    hidingLocations: ['C:\\Windows\\System32\\Tasks\\Microsoft\\Windows\\UpdateOrchestrator\\'],
    networkConnections: [
      {
        proto: 'TCP',
        local: '10.10.5.2:49231',
        foreign: '185.220.101.47:4444',
        state: 'ESTABLISHED',
        pid: 4832,
        processName: 'powershell.exe',
        malicious: true,
      },
    ],
    processes: [
      {
        pid: 4832,
        ppid: 6512,
        name: 'powershell.exe',
        sessionName: 'RDP-Tcp#0',
        sessionNum: 2,
        memKb: 66210,
        user: primaryUser,
        malicious: true,
        commandLine: 'powershell.exe -nop -w hidden -c IEX(...)',
      },
    ],
    registry: {},
    scheduledTasks: [
      {
        name: '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan Static Task',
        status: 'Ready',
        triggers: 'Daily 03:17',
        nextRun: '2026-05-09T03:17:00Z',
        lastRun: '2026-05-08T03:17:11Z',
        author: `${hostname}\\SYSTEM`,
        runAs: 'SYSTEM',
        command: 'powershell.exe -NonInteractive -WindowStyle Hidden -enc AAAABBBB',
        xml: '<Task/>',
        malicious: true,
      },
    ],
    userAccounts: [
      {
        name: primaryUser,
        fullName: 'Operations Desk',
        description: '',
        enabled: true,
        lastLogon: '2026-05-08T03:22:01Z',
        passwordAge: '12 days',
        groups: ['Users'],
        created: '2023-04-18T14:10:00Z',
        sid: 'S-1-5-21-444-555-666-1201',
      },
    ],
    correctEradicationOrder: ['kill_shell', 'remove_task', 'review_browser_exfil'],
    correctHardeningSteps: [
      { id: 'h-rdp', label: 'Restrict RDP to VPN subnet + enable NLA' },
      { id: 'h-fw', label: 'Block C2 IP outbound' },
    ],
    artifacts: [
      {
        id: 'bravo-task',
        type: 'task',
        path: '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan Static Task',
        label: 'Masqueraded scheduled task',
        mitre: ['T1053.005'],
      },
      {
        id: 'bravo-c2',
        type: 'network',
        path: '185.220.101.47:4444',
        label: 'Interactive RDP-driven C2',
        mitre: ['T1048.003'],
      },
    ],
    timerSeconds: difficulty === 'recruit' ? 45 * 60 : 35 * 60,
    debriefData: [
      { t: '2026-05-08T03:15:00Z', kind: 'attacker', title: 'RDP logon', detail: 'Type 10 from foreign IP' },
    ],
    hostname,
    primaryUser,
    c2Ip: '185.220.101.47',
    severity: 'HIGH',
    initialAlert: {
      title: 'ALERT: ANOMALOUS OUTBOUND CONNECTION',
      detail: 'Outbound TCP to 185.220.101.47:4444 from PID 4832',
      time: '2026-05-08T03:22:41Z',
      host: hostname,
      user: primaryUser,
    },
    noiseLevel: 'medium',
  }

  return c
}
