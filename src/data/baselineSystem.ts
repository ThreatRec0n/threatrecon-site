/**
 * Baseline Windows-realistic content rendered alongside per-case malicious
 * artifacts. Keeps every tool densely populated regardless of case payload.
 */
import type {
  EventLogEntry,
  NetworkConnection,
  ProcessEntry,
  ScheduledTaskDef,
  UserAccountDef,
} from '../types/case.types'

export interface BaselineFile {
  name: string
  type: 'dir' | 'file'
  sizeKb?: number
  modified: string
  suspicious?: boolean
  hint?: string
}

export const BASELINE_PROCESSES: ProcessEntry[] = [
  { pid: 4, ppid: 0, name: 'System', sessionName: 'Services', sessionNum: 0, memKb: 144, user: 'SYSTEM', cpuPercent: 0.1, status: 'Running' },
  { pid: 348, ppid: 4, name: 'smss.exe', sessionName: 'Services', sessionNum: 0, memKb: 1104, user: 'SYSTEM', cpuPercent: 0.0, status: 'Running' },
  { pid: 528, ppid: 348, name: 'csrss.exe', sessionName: 'Services', sessionNum: 0, memKb: 5204, user: 'SYSTEM', cpuPercent: 0.2, status: 'Running' },
  { pid: 608, ppid: 348, name: 'wininit.exe', sessionName: 'Services', sessionNum: 0, memKb: 5048, user: 'SYSTEM', cpuPercent: 0.0, status: 'Running' },
  { pid: 680, ppid: 608, name: 'services.exe', sessionName: 'Services', sessionNum: 0, memKb: 7140, user: 'SYSTEM', cpuPercent: 0.3, status: 'Running' },
  { pid: 688, ppid: 608, name: 'lsass.exe', sessionName: 'Services', sessionNum: 0, memKb: 16448, user: 'SYSTEM', cpuPercent: 0.4, status: 'Running', services: ['Netlogon', 'SamSs'] },
  { pid: 848, ppid: 680, name: 'svchost.exe', sessionName: 'Services', sessionNum: 0, memKb: 27344, user: 'SYSTEM', cpuPercent: 0.6, status: 'Running', services: ['RpcSs'] },
  { pid: 1096, ppid: 680, name: 'svchost.exe', sessionName: 'Services', sessionNum: 0, memKb: 14820, user: 'SYSTEM', cpuPercent: 0.2, status: 'Running', services: ['Schedule'] },
  { pid: 1248, ppid: 680, name: 'svchost.exe', sessionName: 'Services', sessionNum: 0, memKb: 11240, user: 'NETWORK SERVICE', cpuPercent: 0.1, status: 'Running', services: ['TermService'] },
  { pid: 1872, ppid: 680, name: 'svchost.exe', sessionName: 'Services', sessionNum: 0, memKb: 8920, user: 'LOCAL SERVICE', cpuPercent: 0.1, status: 'Running', services: ['Dnscache'] },
  { pid: 2104, ppid: 680, name: 'spoolsv.exe', sessionName: 'Services', sessionNum: 0, memKb: 9264, user: 'SYSTEM', cpuPercent: 0.0, status: 'Running' },
  { pid: 2480, ppid: 680, name: 'MsMpEng.exe', sessionName: 'Services', sessionNum: 0, memKb: 178660, user: 'SYSTEM', cpuPercent: 1.8, status: 'Running', services: ['WinDefend'] },
  { pid: 3024, ppid: 1248, name: 'winlogon.exe', sessionName: 'Console', sessionNum: 1, memKb: 6112, user: 'SYSTEM', cpuPercent: 0.0, status: 'Running' },
  { pid: 3168, ppid: 3024, name: 'dwm.exe', sessionName: 'Console', sessionNum: 1, memKb: 41208, user: 'DWM-1', cpuPercent: 1.4, status: 'Running' },
  { pid: 3540, ppid: 3024, name: 'explorer.exe', sessionName: 'Console', sessionNum: 1, memKb: 92340, user: '__USER__', cpuPercent: 0.7, status: 'Running' },
  { pid: 4012, ppid: 3540, name: 'OneDrive.exe', sessionName: 'Console', sessionNum: 1, memKb: 65120, user: '__USER__', cpuPercent: 0.2, status: 'Running' },
  { pid: 4528, ppid: 3540, name: 'Teams.exe', sessionName: 'Console', sessionNum: 1, memKb: 187432, user: '__USER__', cpuPercent: 1.1, status: 'Running' },
  { pid: 5040, ppid: 3540, name: 'chrome.exe', sessionName: 'Console', sessionNum: 1, memKb: 412668, user: '__USER__', cpuPercent: 4.3, status: 'Running' },
  { pid: 5512, ppid: 5040, name: 'chrome.exe', sessionName: 'Console', sessionNum: 1, memKb: 142884, user: '__USER__', cpuPercent: 0.6, status: 'Running' },
  { pid: 6188, ppid: 3540, name: 'OUTLOOK.EXE', sessionName: 'Console', sessionNum: 1, memKb: 234112, user: '__USER__', cpuPercent: 0.9, status: 'Running' },
]

export function baselineProcessesFor(user: string): ProcessEntry[] {
  return BASELINE_PROCESSES.map((p) => ({
    ...p,
    user: p.user === '__USER__' ? user : p.user,
  }))
}

export const BASELINE_NETWORK: (host: string) => NetworkConnection[] = (host) => [
  { proto: 'TCP', local: '0.0.0.0:135', foreign: '0.0.0.0:0', state: 'LISTENING', pid: 848, processName: 'svchost.exe' },
  { proto: 'TCP', local: '0.0.0.0:445', foreign: '0.0.0.0:0', state: 'LISTENING', pid: 4, processName: 'System' },
  { proto: 'TCP', local: '0.0.0.0:3389', foreign: '0.0.0.0:0', state: 'LISTENING', pid: 1248, processName: 'svchost.exe' },
  { proto: 'TCP', local: `${host}:49231`, foreign: '52.96.165.34:443', state: 'ESTABLISHED', pid: 6188, processName: 'OUTLOOK.EXE' },
  { proto: 'TCP', local: `${host}:49445`, foreign: '142.250.80.46:443', state: 'ESTABLISHED', pid: 5040, processName: 'chrome.exe' },
  { proto: 'TCP', local: `${host}:49502`, foreign: '52.114.128.74:443', state: 'ESTABLISHED', pid: 4528, processName: 'Teams.exe' },
  { proto: 'TCP', local: `${host}:49612`, foreign: '13.107.6.158:443', state: 'ESTABLISHED', pid: 4012, processName: 'OneDrive.exe' },
  { proto: 'UDP', local: '0.0.0.0:5355', foreign: '*:*', state: '', pid: 1872, processName: 'svchost.exe' },
]

export function generateBaselineEvents(host: string, user: string, base = '2026-05-08T03:'): EventLogEntry[] {
  const mk = (
    i: number,
    log: EventLogEntry['log'],
    level: EventLogEntry['level'],
    source: string,
    eventId: number,
    task: string,
    description: string,
  ): EventLogEntry => ({
    id: `evt-${eventId}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    log,
    level,
    time: `${base}${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}Z`,
    source,
    eventId,
    task,
    computer: host,
    xml: `<Event xmlns='http://schemas.microsoft.com/win/2004/08/events/event'>\n  <System>\n    <Provider Name='${source}'/>\n    <EventID>${eventId}</EventID>\n    <Level>0</Level>\n    <Task>${task}</Task>\n    <TimeCreated SystemTime='${base}${String(i % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}Z'/>\n    <Computer>${host}</Computer>\n  </System>\n  <EventData>\n    <Data Name='SubjectUserName'>${user}</Data>\n    <Data Name='Description'>${description}</Data>\n  </EventData>\n</Event>`,
  })
  return [
    mk(2, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4624, 'Logon', `Logon: ${user} (Type 2)`),
    mk(5, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4672, 'Special Logon', `Special privileges assigned to ${user}`),
    mk(6, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4688, 'Process Creation', 'Process: C:\\Windows\\System32\\svchost.exe'),
    mk(7, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4688, 'Process Creation', 'Process: C:\\Windows\\System32\\spoolsv.exe'),
    mk(9, 'Security', 'Failure Audit', 'Microsoft-Windows-Security-Auditing', 4625, 'Logon', 'Failed logon: account disabled'),
    mk(11, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4624, 'Logon', `Logon: ${user} (Type 10 RDP)`),
    mk(13, 'System', 'Information', 'Service Control Manager', 7036, 'Service', 'Service "Windows Update" entered the running state'),
    mk(14, 'System', 'Information', 'Microsoft-Windows-Kernel-General', 12, 'Kernel', 'OS started'),
    mk(15, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4688, 'Process Creation', 'Process: C:\\Windows\\System32\\cmd.exe'),
    mk(17, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4698, 'Scheduled Task', 'A scheduled task was created'),
    mk(18, 'PowerShell', 'Information', 'PowerShell', 4104, 'Script Block', 'ScriptBlock: Get-Process'),
    mk(19, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4624, 'Logon', 'Logon: SYSTEM (Type 5)'),
    mk(22, 'Security', 'Failure Audit', 'Microsoft-Windows-Security-Auditing', 4625, 'Logon', 'Failed logon: bad password'),
    mk(24, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4688, 'Process Creation', 'Process: C:\\Program Files\\Google\\Chrome\\chrome.exe'),
    mk(26, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4720, 'User Mgmt', 'A user account was created'),
    mk(28, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4732, 'Group Mgmt', 'A member was added to a security-enabled local group'),
    mk(31, 'Application', 'Warning', 'Microsoft-Windows-Defender', 1116, 'Defender', 'Threat detected: Trojan:Win32/Powessere.G'),
    mk(33, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4634, 'Logoff', `Logoff: ${user}`),
    mk(35, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 4688, 'Process Creation', 'Process: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'),
    mk(38, 'PowerShell', 'Warning', 'PowerShell', 4104, 'Script Block', 'ScriptBlock: encoded base64 payload (length 4096)'),
    mk(41, 'Security', 'Success Audit', 'Microsoft-Windows-Security-Auditing', 5140, 'File Share', 'Network share accessed: \\\\FS-01\\Finance'),
    mk(44, 'System', 'Error', 'Microsoft-Windows-DistributedCOM', 10010, 'DCOM', 'The server did not register with DCOM within the required timeout.'),
  ]
}

export const BASELINE_TASKS: ScheduledTaskDef[] = [
  {
    name: '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan',
    status: 'Ready',
    triggers: 'Daily at 03:00',
    nextRun: '2026-05-09T03:00:00Z',
    lastRun: '2026-05-08T03:00:00Z',
    author: 'CORP\\svc_update',
    runAs: 'SYSTEM',
    command: '%systemroot%\\system32\\usoclient.exe StartScan',
    xml: '<Task><Triggers><CalendarTrigger><StartBoundary>2026-05-08T03:00:00</StartBoundary></CalendarTrigger></Triggers></Task>',
  },
  {
    name: '\\Microsoft\\Windows\\Defrag\\ScheduledDefrag',
    status: 'Ready',
    triggers: 'Weekly on Wednesday',
    nextRun: '2026-05-13T01:00:00Z',
    lastRun: '2026-05-06T01:00:00Z',
    author: 'Microsoft Corporation',
    runAs: 'SYSTEM',
    command: '%windir%\\system32\\defrag.exe -c -h -o',
    xml: '<Task><Triggers><CalendarTrigger><ScheduleByWeek/></CalendarTrigger></Triggers></Task>',
  },
  {
    name: '\\Microsoft\\Windows\\WindowsBackup\\Backup',
    status: 'Ready',
    triggers: 'Daily at 22:00',
    nextRun: '2026-05-08T22:00:00Z',
    lastRun: '2026-05-07T22:00:00Z',
    author: 'Microsoft Corporation',
    runAs: 'SYSTEM',
    command: '%windir%\\system32\\sdclt.exe /KICKOFFJOB',
    xml: '<Task/>',
  },
  {
    name: '\\Microsoft\\Office\\OfficeTelemetryAgentLogOn',
    status: 'Ready',
    triggers: 'At log on',
    nextRun: '',
    lastRun: '2026-05-08T08:14:00Z',
    author: 'Microsoft Corporation',
    runAs: '__USER__',
    command: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\msoia.exe"',
    xml: '<Task/>',
  },
]

export function baselineTasksFor(user: string): ScheduledTaskDef[] {
  return BASELINE_TASKS.map((t) => ({ ...t, runAs: t.runAs === '__USER__' ? user : t.runAs }))
}

export const BASELINE_USERS: UserAccountDef[] = [
  {
    name: 'Administrator',
    fullName: 'Built-in Administrator',
    description: 'Built-in account for administering the computer/domain',
    enabled: false,
    lastLogon: '2026-04-12T18:34:00Z',
    passwordAge: '178 days',
    groups: ['Administrators'],
    created: '2023-01-15T09:00:00Z',
    sid: 'S-1-5-21-111-222-333-500',
  },
  {
    name: 'Guest',
    fullName: '',
    description: 'Built-in account for guest access to the computer/domain',
    enabled: false,
    lastLogon: 'Never',
    passwordAge: 'Never',
    groups: ['Guests'],
    created: '2023-01-15T09:00:00Z',
    sid: 'S-1-5-21-111-222-333-501',
  },
  {
    name: 'DefaultAccount',
    fullName: '',
    description: 'A user account managed by the system.',
    enabled: false,
    lastLogon: 'Never',
    passwordAge: 'Never',
    groups: [],
    created: '2023-01-15T09:00:00Z',
    sid: 'S-1-5-21-111-222-333-503',
  },
]

export interface BaselineRegRow {
  hive: 'HKLM' | 'HKCU'
  key: string
  name: string
  type: 'REG_SZ' | 'REG_DWORD' | 'REG_EXPAND_SZ'
  data: string
  suspicious?: boolean
  hint?: string
}

export const BASELINE_REGISTRY_RUNS: BaselineRegRow[] = [
  {
    hive: 'HKLM',
    key: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    name: 'SecurityHealth',
    type: 'REG_EXPAND_SZ',
    data: '%windir%\\system32\\SecurityHealthSystray.exe',
  },
  {
    hive: 'HKLM',
    key: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    name: 'RTHDVCPL',
    type: 'REG_SZ',
    data: '"C:\\Program Files\\Realtek\\Audio\\HDA\\RtkNGUI64.exe" -s',
  },
  {
    hive: 'HKLM',
    key: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    name: 'IgfxTray',
    type: 'REG_SZ',
    data: 'C:\\Windows\\System32\\igfxtray.exe',
  },
  {
    hive: 'HKCU',
    key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    name: 'OneDrive',
    type: 'REG_SZ',
    data: '"C:\\Users\\__USER__\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe" /background',
  },
  {
    hive: 'HKCU',
    key: 'Software\\Microsoft\\Windows\\CurrentVersion\\Run',
    name: 'Teams',
    type: 'REG_SZ',
    data: '"C:\\Users\\__USER__\\AppData\\Local\\Microsoft\\Teams\\Update.exe" --processStart "Teams.exe" --process-start-args "--system-initiated"',
  },
]

export function baselineRunKeysFor(user: string): BaselineRegRow[] {
  return BASELINE_REGISTRY_RUNS.map((r) => ({
    ...r,
    data: r.data.replace(/__USER__/g, user),
  }))
}

export function baselineFiles(user: string, suspiciousArchive?: string): BaselineFile[] {
  const baseDate = '2026-05-07T11:14:00Z'
  return [
    { name: 'Desktop', type: 'dir', modified: '2026-05-08T08:32:00Z' },
    { name: 'Documents', type: 'dir', modified: '2026-05-07T16:21:00Z' },
    { name: 'Downloads', type: 'dir', modified: '2026-05-08T09:02:00Z' },
    { name: 'Pictures', type: 'dir', modified: '2026-05-04T13:11:00Z' },
    { name: 'AppData', type: 'dir', modified: '2026-04-22T07:00:00Z' },
    { name: '.ssh', type: 'dir', modified: '2026-03-18T19:42:00Z' },
    { name: `notes_${user}.txt`, type: 'file', sizeKb: 4, modified: baseDate },
    { name: 'Q2_forecast.xlsx', type: 'file', sizeKb: 84, modified: '2026-05-06T15:21:00Z' },
    { name: 'meeting_recording.mp4', type: 'file', sizeKb: 184_320, modified: '2026-05-05T10:01:00Z' },
    {
      name: suspiciousArchive ?? 'invoice_q2_signed.7z',
      type: 'file',
      sizeKb: 12_440,
      modified: '2026-05-08T03:09:00Z',
      suspicious: true,
      hint: 'Recent archive in user profile, no preceding signed installer event.',
    },
  ]
}
