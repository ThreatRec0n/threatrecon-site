import { v4 as uuidv4 } from 'uuid'
import { INDUSTRIES } from '../industries'
import { THREAT_ACTORS } from '../threat-actors'
import { getTechnique } from '../techniques'
import type { CaseDefinition } from '../../types/case.types'
import type { Difficulty } from '../../types/player.types'


/** Case DELTA-04 — SUPPLY CHAIN */
export function PRESET_DELTA04(seed: number, difficulty: Difficulty): CaseDefinition {
  const industry = INDUSTRIES.find((i) => i.id === 'manufacturing')!
  const actor = THREAT_ACTORS.find((a) => a.id === 'void_broker')!
  const t1195 = getTechnique('T1195.002')!
  const t1574 = getTechnique('T1574.002')!
  const t1543 = getTechnique('T1543.003')!
  const t1048 = getTechnique('T1048.003')!

  const hostname = 'MES-EDGE-02'
  const primaryUser = 'mesoperator'

  const svcPath = 'C:\\Program Files\\FerroVendor\\Agent\\svc_core.exe'

  const c: CaseDefinition = {
    caseId: uuidv4(),
    seed,
    caseNumber: 4,
    code: 'DELTA-04',
    industry,
    threatActor: actor,
    attackChain: [t1195, t1574, t1543, t1048],
    entryVector: t1195,
    persistenceMechanisms: [t1543],
    lateralMovement: [],
    exfiltration: t1048,
    hidingLocations: [svcPath],
    networkConnections: [
      {
        proto: 'TCP',
        local: '10.20.5.8:0',
        foreign: '203.0.113.44:0',
        state: 'TIME_WAIT',
        pid: 1204,
        processName: 'svchost.exe',
        malicious: true,
      },
    ],
    processes: [
      {
        pid: 4021,
        ppid: 664,
        name: 'svc_core.exe',
        sessionName: 'Services',
        sessionNum: 0,
        memKb: 24112,
        user: 'SYSTEM',
        malicious: true,
        anomalies: ['Loads unexpected DLL from ProgramData'],
        commandLine: svcPath,
        path: svcPath,
      },
    ],
    registry: {
      'HKLM\\SYSTEM\\CurrentControlSet\\Services\\FerroVendorAgent': [
        { name: 'ImagePath', type: 'REG_EXPAND_SZ', data: svcPath },
        { name: 'Start', type: 'REG_DWORD', data: '2' },
      ],
    },
    scheduledTasks: [],
    userAccounts: [
      {
        name: primaryUser,
        fullName: 'MES Operator',
        description: 'OT bridge workstation',
        enabled: true,
        lastLogon: '2026-05-08T07:55:00Z',
        passwordAge: '60 days',
        groups: ['Users'],
        created: '2021-11-03T09:20:00Z',
        sid: 'S-1-5-21-1212-3434-5656-4400',
      },
    ],
    correctEradicationOrder: ['stop_service', 'remove_binary', 'invalidate_vendor_token'],
    correctHardeningSteps: [
      { id: 'h-patch', label: 'Apply vendor-signed patch bundle 2026.05' },
      { id: 'h-integrity', label: 'Enable binary integrity monitoring on agent path' },
    ],
    artifacts: [
      {
        id: 'delta-svc',
        type: 'file',
        path: svcPath,
        label: 'Trojanized vendor agent',
        mitre: ['T1195.002'],
      },
    ],
    timerSeconds: difficulty === 'recruit' ? 45 * 60 : 35 * 60,
    debriefData: [
      { t: '2026-05-08T02:40:00Z', kind: 'attacker', title: 'Update trojan', detail: 'DLL sideload via vendor service' },
    ],
    hostname,
    primaryUser,
    c2Ip: '203.0.113.44',
    severity: 'CRITICAL',
    initialAlert: {
      title: 'SERVICE ANOMALY',
      detail: 'Unexpected ICMP burst from services host',
      time: '2026-05-08T07:56:01Z',
      host: hostname,
      user: primaryUser,
    },
    noiseLevel: 'maximum',
  }

  return c
}
