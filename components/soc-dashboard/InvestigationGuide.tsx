'use client';

import { useState } from 'react';

interface Props {
  scenarioName: string;
  attackStages: string[];
}

export default function InvestigationGuide({ scenarioName, attackStages }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'methodology' | 'tools' | 'hints'>('overview');

  const investigationSteps = [
    {
      step: 1,
      title: 'Review Scenario Background',
      description: 'Understand the context: what was reported, when, and by whom. This sets your investigation scope.',
      tools: ['Scenario narrative', 'Timeline panel'],
    },
    {
      step: 2,
      title: 'Examine Initial Alerts',
      description: 'Start with the alerts in your queue. These are automated detections that triggered based on suspicious patterns.',
      tools: ['Alert queue', 'Alert details'],
    },
    {
      step: 3,
      title: 'Correlate Events Across Log Sources',
      description: 'Use the Log Explorer to search for related events. Look for the same IPs, domains, processes, or users across Sysmon, Zeek, and other sources.',
      tools: ['Log Explorer', 'Event filters', 'Correlation keys'],
    },
    {
      step: 4,
      title: 'Extract Indicators of Compromise (IOCs)',
      description: 'Identify suspicious IPs, domains, file hashes, and process IDs. These are your indicators that need investigation.',
      tools: ['IOC Tagging Panel', 'Network context', 'Process trees'],
    },
    {
      step: 5,
      title: 'Enrich IOCs with Threat Intelligence',
      description: 'Use OSINT tools to check if your IOCs are known malicious. This provides context and validation.',
      tools: ['IOC Enrichment', 'VirusTotal', 'AbuseIPDB', 'ThreatMiner'],
    },
    {
      step: 6,
      title: 'Map to MITRE ATT&CK Framework',
      description: 'Identify which attack techniques you\'re seeing. This helps understand the attacker\'s methodology.',
      tools: ['MITRE ATT&CK Navigator', 'Learning Mode', 'Technique IDs'],
    },
    {
      step: 7,
      title: 'Build the Attack Timeline',
      description: 'Piece together the sequence of events. Use the Timeline Panel to see how the attack progressed through stages.',
      tools: ['Timeline Panel', 'Event timestamps', 'Attack stages'],
    },
    {
      step: 8,
      title: 'Tag and Classify IOCs',
      description: 'Mark IOCs as confirmed threats, suspicious, or benign based on your investigation. Be thorough but accurate.',
      tools: ['IOC Tagging Panel', 'Evidence workspace'],
    },
    {
      step: 9,
      title: 'Finalize Your Investigation',
      description: 'Once you\'ve tagged all IOCs and built your understanding, submit your findings for evaluation.',
      tools: ['Finalize Investigation button', 'Evaluation Report'],
    },
  ];

  const toolGuide = {
    'Wireshark': {
      description: 'Network protocol analyzer for examining packet captures (PCAP files). In this platform, network events are shown in Zeek logs.',
      useCase: 'Analyze network connections, identify C2 beaconing, find data exfiltration patterns.',
      tip: 'Look for periodic connections, unusual ports, and large data transfers.',
    },
    'Sysmon': {
      description: 'System Monitor provides detailed Windows security logging. Events show process creation, network connections, file operations.',
      useCase: 'Track process execution chains, identify malicious binaries, detect persistence mechanisms.',
      tip: 'Focus on Event ID 1 (Process Create), Event ID 3 (Network Connect), and Event ID 13 (Registry modifications).',
    },
    'Zeek': {
      description: 'Network analysis framework that generates structured logs from network traffic. Provides connection, HTTP, DNS logs.',
      useCase: 'Identify C2 communications, analyze DNS queries, detect suspicious HTTP patterns.',
      tip: 'Look for connections to external IPs, unusual DNS queries, and HTTP requests to unknown domains.',
    },
    'VirusTotal': {
      description: 'Free threat intelligence service. Search file hashes, IPs, domains, and URLs to check reputation.',
      useCase: 'Validate if a file hash is known malware, check if an IP is associated with attacks.',
      tip: 'Multiple AV detections indicate high confidence. Check community comments for context.',
    },
    'AbuseIPDB': {
      description: 'IP reputation database. Check if an IP address has been reported for malicious activity.',
      useCase: 'Validate external IP addresses found in network logs.',
      tip: 'High abuse confidence scores indicate known malicious IPs.',
    },
    'ThreatMiner': {
      description: 'Threat intelligence aggregator. Provides context on IOCs including related malware, campaigns, and infrastructure.',
      useCase: 'Get comprehensive context on domains, IPs, and hashes. See relationships between indicators.',
      tip: 'Use the graph view to see how IOCs relate to each other and known threat actors.',
    },
    'CyberChef': {
      description: 'Data transformation tool. Decode Base64, hex, analyze encodings, and perform data conversions.',
      useCase: 'Decode PowerShell encoded commands, analyze obfuscated strings, convert data formats.',
      tip: 'Many attackers use Base64 encoding. CyberChef can decode it instantly.',
    },
  };

  const hints = [
    {
      stage: 'initial-access',
      hint: 'Look for email-related events or document execution. Check for processes spawned from WINWORD.EXE or EXCEL.EXE.',
    },
    {
      stage: 'execution',
      hint: 'PowerShell with encoded commands is suspicious. Look for -EncodedCommand flags or base64 strings in command lines.',
    },
    {
      stage: 'persistence',
      hint: 'Check for scheduled tasks, registry run keys, or service installations. These allow attackers to maintain access.',
    },
    {
      stage: 'credential-access',
      hint: 'Credential dumping often involves accessing lsass.exe. Look for unusual process access to sensitive system processes.',
    },
    {
      stage: 'lateral-movement',
      hint: 'SMB connections (port 445) to other internal hosts indicate lateral movement. Check for admin share access.',
    },
    {
      stage: 'command-and-control',
      hint: 'Periodic outbound connections to external IPs suggest C2 beaconing. Look for regular intervals and small packet sizes.',
    },
    {
      stage: 'exfiltration',
      hint: 'Large outbound data transfers, especially POST requests, may indicate data exfiltration. Check bytes transferred.',
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 px-4 py-3 bg-[#58a6ff] text-white rounded-lg shadow-lg hover:bg-[#4493f8] transition-colors z-40 flex items-center gap-2"
      >
        📖 Investigation Guide
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22]">
          <h2 className="text-2xl font-bold text-[#c9d1d9]">Investigation Guide</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#30363d] mb-6">
            {(['overview', 'methodology', 'tools', 'hints'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab
                    ? 'border-[#58a6ff] text-[#58a6ff]'
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#c9d1d9] mb-2">Scenario: {scenarioName}</h3>
                <p className="text-sm text-[#8b949e]">
                  This is a hands-on threat hunting exercise. Your goal is to investigate a simulated cyber incident
                  by analyzing logs, correlating events, and identifying malicious indicators of compromise (IOCs).
                </p>
              </div>

              <div>
                <h4 className="text-md font-semibold text-[#c9d1d9] mb-2">What You'll Practice</h4>
                <ul className="text-sm text-[#8b949e] space-y-1 list-disc list-inside">
                  <li>Log analysis across multiple sources (Sysmon, Zeek, Windows Events)</li>
                  <li>Event correlation and timeline reconstruction</li>
                  <li>IOC extraction and threat intelligence enrichment</li>
                  <li>MITRE ATT&CK technique identification</li>
                  <li>Investigation methodology and reporting</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-semibold text-[#c9d1d9] mb-2">Attack Stages in This Scenario</h4>
                <div className="flex flex-wrap gap-2">
                  {attackStages.map(stage => (
                    <span key={stage} className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#58a6ff]">
                      {stage.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800/40 rounded p-4">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-[#c9d1d9]">
                  Enable Learning Mode (📘 button) to see MITRE ATT&CK explanations for each event. This helps you
                  understand what techniques you're seeing and how defenders detect them.
                </p>
              </div>
            </div>
          )}

          {/* Methodology Tab */}
          {activeSection === 'methodology' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Threat Hunting Methodology</h3>
              <div className="space-y-4">
                {investigationSteps.map(step => (
                  <div key={step.step} className="border border-[#30363d] rounded p-4 bg-[#0d1117]">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58a6ff] text-white flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-md font-semibold text-[#c9d1d9] mb-1">{step.title}</h4>
                        <p className="text-sm text-[#8b949e] mb-2">{step.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {step.tools.map(tool => (
                            <span key={tool} className="px-2 py-1 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#58a6ff]">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeSection === 'tools' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Free Tools for Threat Hunting</h3>
              <div className="space-y-3">
                {Object.entries(toolGuide).map(([tool, info]) => (
                  <div key={tool} className="border border-[#30363d] rounded p-4 bg-[#0d1117]">
                    <h4 className="text-md font-semibold text-[#c9d1d9] mb-2">{tool}</h4>
                    <p className="text-sm text-[#8b949e] mb-2">{info.description}</p>
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-[#8b949e]">Use Case: </span>
                      <span className="text-sm text-[#c9d1d9]">{info.useCase}</span>
                    </div>
                    <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                      <span className="text-xs font-semibold text-[#58a6ff]">💡 Tip: </span>
                      <span className="text-xs text-[#8b949e]">{info.tip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hints Tab */}
          {activeSection === 'hints' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Investigation Hints by Stage</h3>
              <div className="space-y-3">
                {hints.filter(h => attackStages.includes(h.stage)).map((hint, idx) => (
                  <div key={idx} className="border border-[#30363d] rounded p-4 bg-[#0d1117]">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">💡</span>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[#58a6ff] mb-1 uppercase">
                          {hint.stage.replace('-', ' ')}
                        </div>
                        <p className="text-sm text-[#c9d1d9]">{hint.hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded p-4 mt-4">
                <p className="text-sm text-[#c9d1d9]">
                  <strong className="text-yellow-400">Note:</strong> These hints are meant to guide your investigation
                  without giving away the answers. Try to find the evidence yourself first, then use hints if you're stuck.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

