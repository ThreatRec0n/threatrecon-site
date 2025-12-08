'use client';

import { useState } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';
import { getMitreTechnique } from '@/lib/mitre';

interface Props {
  event: SimulatedEvent | null;
  enabled: boolean;
}

export default function LearningMode({ event, enabled }: Props) {
  if (!enabled || !event || !event.technique_id) return null;

  const technique = getMitreTechnique(event.technique_id);

  if (!technique) return null;

  return (
    <div className="siem-card border-2 border-[#58a6ff] bg-[#0d1117] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#58a6ff]">📘 Learning Mode</h3>
        <span className="text-xs text-[#8b949e]">MITRE ATT&CK</span>
      </div>

      {/* Technique Info */}
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[#58a6ff] font-semibold">{event.technique_id}</span>
            <span className="text-sm text-[#c9d1d9]">{technique.name}</span>
          </div>
          <p className="text-xs text-[#8b949e]">{technique.tactic}</p>
        </div>

        {technique.description && (
          <div>
            <h4 className="text-xs font-semibold text-[#8b949e] mb-1">What is this technique?</h4>
            <p className="text-sm text-[#c9d1d9]">{technique.description}</p>
          </div>
        )}
      </div>

      {/* Detection Guidance */}
      <div className="pt-3 border-t border-[#30363d]">
        <h4 className="text-xs font-semibold text-[#8b949e] mb-2">How Defenders Detect This</h4>
        <p className="text-sm text-[#c9d1d9] mb-3">
          {getDetectionGuidance(event.technique_id, event.source)}
        </p>

        {/* Example Detection Queries */}
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Example Detection Queries</h4>
          <div className="space-y-2">
            {getExampleQueries(event.technique_id, event.source).map((query, idx) => (
              <div key={idx} className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                <div className="text-xs text-[#8b949e] mb-1">{query.name}</div>
                <pre className="text-xs font-mono text-[#c9d1d9] overflow-x-auto">
                  {query.query}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ATT&CK Link */}
      <div className="pt-3 border-t border-[#30363d]">
        <a
          href={`https://attack.mitre.org/techniques/${event.technique_id.replace('.', '/')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1"
        >
          View on MITRE ATT&CK →
        </a>
      </div>
    </div>
  );
}

function getDetectionGuidance(techniqueId: string, source: string): string {
  const guidance: Record<string, string> = {
    'T1566.001': 'Monitor for suspicious email attachments, macro execution, and document spawning processes. Look for WINWORD.EXE or EXCEL.EXE spawning unusual child processes.',
    'T1059.001': 'PowerShell encoded commands are a red flag. Monitor for -EncodedCommand flags, base64 encoded scripts, and PowerShell spawning from non-standard parents like Word or Excel.',
    'T1071.001': 'C2 beaconing shows periodic outbound connections to external IPs. Look for regular intervals, small packet sizes, and connections to known malicious IPs or domains.',
    'T1003': 'Credential dumping tools like Mimikatz access LSASS memory. Monitor for process access to lsass.exe, especially from non-standard processes.',
    'T1021.002': 'Lateral movement via SMB shows network connections to port 445 from internal hosts. Look for unusual admin share access patterns.',
    'T1048': 'Data exfiltration shows large outbound data transfers. Monitor for POST requests with large payloads to external IPs.',
  };

  return guidance[techniqueId] || 'This technique can be detected through log analysis and behavioral monitoring.';
}

function getExampleQueries(techniqueId: string, source: string): Array<{ name: string; query: string }> {
  const queries: Record<string, Array<{ name: string; query: string }>> = {
    'T1059.001': [
      {
        name: 'Sigma Rule: PowerShell Encoded Command',
        query: `detection:
  selection:
    Image|endswith: \\powershell.exe
    CommandLine|contains: -EncodedCommand
  condition: selection`,
      },
      {
        name: 'KQL Query (Azure Sentinel)',
        query: `SecurityEvent
| where EventID == 4688
| where ProcessCommandLine contains "-EncodedCommand"
| project TimeGenerated, Computer, ProcessCommandLine`,
      },
    ],
    'T1071.001': [
      {
        name: 'Zeek Connection Log Query',
        query: `source="zeek" sourcetype="zeek_conn"
| stats count by id_resp_h, id_resp_p
| where count > 10
| sort -count`,
      },
      {
        name: 'Sigma Rule: C2 Beaconing',
        query: `detection:
  selection:
    EventID: 3
    DestinationIp|re: ^(185\.220\.|45\.146\.)
  condition: selection`,
      },
    ],
    'T1003': [
      {
        name: 'Sysmon: Process Access to LSASS',
        query: `EventID=10
TargetImage|endswith: \\lsass.exe
GrantedAccess|re: 0x1fffff`,
      },
    ],
    'T1021.002': [
      {
        name: 'SMB Lateral Movement Detection',
        query: `source="sysmon" EventID=3
| where DestinationPort == 445
| where DestinationIp != "10.0.0.0/8"
| stats count by SourceIp, DestinationIp`,
      },
    ],
  };

  return queries[techniqueId] || [
    {
      name: 'Generic Detection Query',
      query: `source="${source}" technique_id="${techniqueId}"`,
    },
  ];
}

