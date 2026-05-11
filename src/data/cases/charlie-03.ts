import { v4 as uuidv4 } from 'uuid'
import { INDUSTRIES } from '../industries'
import { THREAT_ACTORS } from '../threat-actors'
import { getTechnique } from '../techniques'
import type { CaseDefinition } from '../../types/case.types'
import type { Difficulty } from '../../types/player.types'


/** Case CHARLIE-03 — THE INSIDER */
export function PRESET_CHARLIE03(seed: number, difficulty: Difficulty): CaseDefinition {
  const industry = INDUSTRIES.find((i) => i.id === 'defense')!
  const actor = THREAT_ACTORS.find((a) => a.id === 'iron_mole')!
  const t1078 = getTechnique('T1078')!
  const t1560 = getTechnique('T1560.001')!
  const t1021 = getTechnique('T1021.002')!
  const t1567 = getTechnique('T1567.002')!

  const hostname = 'ENG-WS-31'
  const primaryUser = 'cleared.user'

  const c: CaseDefinition = {
    caseId: uuidv4(),
    seed,
    caseNumber: 3,
    code: 'CHARLIE-03',
    industry,
    threatActor: actor,
    attackChain: [t1078, t1560, t1021, t1567],
    entryVector: t1078,
    persistenceMechanisms: [],
    lateralMovement: [t1021],
    exfiltration: t1567,
    hidingLocations: [`C:\\Users\\${primaryUser}\\Documents\\staging.zip`],
    networkConnections: [
      {
        proto: 'TCP',
        local: '10.50.1.12:443',
        foreign: 'onedrive.live.com:443',
        state: 'ESTABLISHED',
        pid: 8812,
        processName: 'msedge.exe',
      },
    ],
    processes: [
      {
        pid: 8812,
        ppid: 4100,
        name: 'msedge.exe',
        sessionName: 'Console',
        sessionNum: 1,
        memKb: 188440,
        user: primaryUser,
        commandLine: `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`,
      },
      {
        pid: 9102,
        ppid: 8812,
        name: '7z.exe',
        sessionName: 'Console',
        sessionNum: 1,
        memKb: 9212,
        user: primaryUser,
        malicious: true,
        commandLine: `7z.exe a -tzip ${`C:\\Users\\${primaryUser}\\Documents\\staging.zip`} D:\\Share\\CUI\\*`,
      },
    ],
    registry: {},
    scheduledTasks: [],
    userAccounts: [
      {
        name: primaryUser,
        fullName: 'Cleared Employee',
        description: 'Program office',
        enabled: true,
        lastLogon: '2026-05-08T16:01:00Z',
        passwordAge: '9 days',
        groups: ['Users', 'Power Users'],
        created: '2022-02-01T11:00:00Z',
        sid: 'S-1-5-21-777-888-999-3101',
      },
    ],
    correctEradicationOrder: ['contain_archive', 'disable_account', 'review_share_acl'],
    correctHardeningSteps: [
      { id: 'h-dlp', label: 'Deploy egress DLP for CUI shares' },
      { id: 'h-jit', label: 'Implement JIT administration for shares' },
    ],
    artifacts: [
      {
        id: 'charlie-zip',
        type: 'file',
        path: `C:\\Users\\${primaryUser}\\Documents\\staging.zip`,
        label: 'Staged CUI archive',
        mitre: ['T1560.001'],
      },
    ],
    timerSeconds: difficulty === 'recruit' ? 45 * 60 : 35 * 60,
    debriefData: [
      { t: '2026-05-08T16:05:00Z', kind: 'attacker', title: 'Archive created', detail: 'Native 7-Zip usage' },
    ],
    hostname,
    primaryUser,
    severity: 'HIGH',
    initialAlert: {
      title: 'DATA STAGING ALERT',
      detail: 'Large archive operation targeting engineering share',
      time: '2026-05-08T16:06:12Z',
      host: hostname,
      user: primaryUser,
    },
    noiseLevel: 'high',
  }

  return c
}
