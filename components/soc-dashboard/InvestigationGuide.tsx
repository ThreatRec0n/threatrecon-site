'use client';

import { useState } from 'react';

interface Props {
  scenarioName: string;
  attackStages: string[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function InvestigationGuide({ scenarioName, attackStages, isOpen: controlledIsOpen, onOpenChange }: Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [activeSection, setActiveSection] = useState<'overview' | 'methodology' | 'tools' | 'hints'>('overview');
  const [expandedToolCategory, setExpandedToolCategory] = useState<string | null>(null);
  const [toolSearchQuery, setToolSearchQuery] = useState('');

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

  // Organize tools by category
  const toolCategories = {
    'Network Analysis': ['Wireshark', 'Zeek', 'Network Miner', 'Security Onion'],
    'Log Analysis': ['Sysmon', 'SIEM (Splunk/ELK)', 'Windows Event Log Viewer', 'Sysinternals Suite'],
    'Threat Intelligence': ['VirusTotal', 'AbuseIPDB', 'ThreatMiner', 'Automater'],
    'Advanced Tools': ['APT-Hunter', 'Volatility', 'CyberChef'],
    'Frameworks': ['MITRE ATT&CK'],
  };

  const toolGuide = {
    'Wireshark': {
      description: 'Network protocol analyzer for examining packet captures (PCAP files). In this platform, network events are shown in Zeek logs. Essential skill for threat analysts.',
      useCase: 'Analyze network connections, identify C2 beaconing, find data exfiltration patterns. Follow TCP streams to see full conversations.',
      tip: 'Look for periodic connections, unusual ports, and large data transfers. Filter by IP address to isolate traffic from suspect hosts.',
    },
    'Network Miner': {
      description: 'Free PCAP artifact extractor that automatically extracts files, credentials, and host information from network traffic. Complements Wireshark analysis.',
      useCase: 'Extract files transferred over network, identify credentials in traffic, get quick overview of network artifacts.',
      tip: 'Use Network Miner to quickly identify suspicious file transfers or credential dumps in network traffic.',
    },
    'Sysmon': {
      description: 'System Monitor provides detailed Windows security logging. Events show process creation, network connections, file operations, and registry changes.',
      useCase: 'Track process execution chains, identify malicious binaries, detect persistence mechanisms, monitor network connections from processes.',
      tip: 'Focus on Event ID 1 (Process Create), Event ID 3 (Network Connect), Event ID 13 (Registry modifications), and Event ID 10 (Process Access).',
    },
    'Zeek': {
      description: 'Network analysis framework that generates structured logs from network traffic. Provides connection, HTTP, DNS, SSL logs for easier analysis than raw packets.',
      useCase: 'Identify C2 communications, analyze DNS queries, detect suspicious HTTP patterns, search for specific domains or IPs.',
      tip: 'Look for connections to external IPs, unusual DNS queries, and HTTP requests to unknown domains. Zeek logs make searching easier than raw PCAP.',
    },
    'Security Onion': {
      description: 'All-in-one Linux distribution for threat monitoring. Includes Zeek, Suricata, ELK stack, and analysis tools pre-configured.',
      useCase: 'Complete network security monitoring solution. Captures and analyzes network traffic with IDS/IPS capabilities.',
      tip: 'Security Onion provides a ready-to-use environment for network monitoring and threat hunting.',
    },
    'SIEM (Splunk/ELK)': {
      description: 'Security Information and Event Management systems for centralized log search and analysis. Splunk (free tier) or ELK Stack (open-source) provide fast searching across thousands of events.',
      useCase: 'Search Windows event logs, correlate events across time, identify patterns in large datasets, build dashboards for visualization.',
      tip: 'Use queries to find specific Event IDs, search for keywords, filter by time ranges, and correlate events from multiple sources.',
    },
    'Windows Event Log Viewer': {
      description: 'Built-in Windows tool or EVTX Explorer (free GUI) for inspecting raw Windows event logs outside of SIEM.',
      useCase: 'Examine Security, System, and Application logs. View detailed event properties and filter by Event ID.',
      tip: 'Event ID 4624 (successful logon), 4625 (failed logon), 4688 (process creation) are key for threat hunting.',
    },
    'Sysinternals Suite': {
      description: 'Free Microsoft tools for Windows system analysis. Includes Process Explorer, Autoruns, Procmon, and more.',
      useCase: 'Live system analysis, identify autorun entries, examine running processes, monitor registry/file changes.',
      tip: 'Autoruns shows all startup programs. Process Explorer shows process trees and loaded DLLs. Essential for host analysis.',
    },
    'VirusTotal': {
      description: 'Free threat intelligence service. Search file hashes, IPs, domains, and URLs to check reputation against 70+ antivirus engines.',
      useCase: 'Validate if a file hash is known malware, check if an IP is associated with attacks, get malware family names.',
      tip: 'Multiple AV detections indicate high confidence. Check community comments for context. No login required for basic searches.',
    },
    'AbuseIPDB': {
      description: 'IP reputation database. Check if an IP address has been reported for malicious activity by the community.',
      useCase: 'Validate external IP addresses found in network logs. Get abuse confidence scores.',
      tip: 'High abuse confidence scores indicate known malicious IPs. Free to search without account.',
    },
    'ThreatMiner': {
      description: 'Threat intelligence aggregator. Provides context on IOCs including related malware, campaigns, and infrastructure relationships.',
      useCase: 'Get comprehensive context on domains, IPs, and hashes. See relationships between indicators and threat actors.',
      tip: 'Use the graph view to see how IOCs relate to each other and known threat actors. Excellent for pivoting.',
    },
    'Automater': {
      description: 'Free Python-based OSINT tool that automates threat intelligence lookups. Aggregates data from VirusTotal, AbuseIPDB, and other sources.',
      useCase: 'Quick OSINT on IPs, URLs, and hashes. Get consolidated reports from multiple sources in one command.',
      tip: 'Run: python automater.py -h <hash> or -i <ip> to get comprehensive intel. Saves time on manual lookups.',
    },
    'APT-Hunter': {
      description: 'Open-source tool for hunting through Windows event logs with automated detection. Maps findings to MITRE ATT&CK framework.',
      useCase: 'Automatically detect APT behavior in logs, validate manual findings, learn automated hunting techniques.',
      tip: 'Run APT-Hunter on event logs to get automated suspicious activity reports. Compare with manual findings to identify gaps.',
    },
    'Volatility': {
      description: 'Free memory forensics framework for analyzing memory dumps. Identifies injected processes, dumped credentials, and malware artifacts.',
      useCase: 'Analyze memory dumps from infected systems, find fileless malware, extract credentials from memory.',
      tip: 'Advanced tool for memory analysis. Use when investigating sophisticated attacks or fileless malware.',
    },
    'CyberChef': {
      description: 'Data transformation tool. Decode Base64, hex, analyze encodings, and perform data conversions. Runs in browser.',
      useCase: 'Decode PowerShell encoded commands, analyze obfuscated strings, convert data formats, extract indicators.',
      tip: 'Many attackers use Base64 encoding. CyberChef can decode it instantly. Also useful for extracting IOCs from encoded data.',
    },
    'MITRE ATT&CK': {
      description: 'Free knowledge base of adversary tactics and techniques. Framework for understanding and categorizing attack behaviors.',
      useCase: 'Map findings to attack techniques, understand adversary methodology, communicate findings using common language.',
      tip: 'Every malicious action maps to a MITRE technique. Use ATT&CK Navigator to visualize attack chains.',
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

  return (
    <>
      {/* Floating Button - Always Visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 px-4 py-3 bg-[#58a6ff] text-white rounded-lg shadow-lg hover:bg-[#4493f8] transition-colors z-40 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:ring-offset-2 focus:ring-offset-[#0d1117]"
        aria-label="Open Investigation Guide - View 9-step methodology, tool guides, and stage-specific hints"
        title="Open Investigation Guide - View methodology, tools, and hints"
      >
        <span aria-hidden="true">📖</span>
        <span className="hidden sm:inline">Investigation Guide</span>
      </button>

      {/* Right-Side Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <div
            className="fixed right-0 top-0 h-full w-full sm:w-[600px] lg:w-[700px] bg-[#161b22] border-l border-[#30363d] shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
              <h2 id="guide-title" className="text-2xl font-bold text-[#c9d1d9]">Investigation Guide</h2>
              <button
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                }}
                className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
                aria-label="Close Investigation Guide"
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-[#30363d] mb-6" role="tablist">
                {(['overview', 'methodology', 'tools', 'hints'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSection(tab)}
                    role="tab"
                    aria-selected={activeSection === tab}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded-t ${
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
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Investigation Tools</h3>
              
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={toolSearchQuery}
                  onChange={(e) => setToolSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  aria-label="Search investigation tools"
                />
              </div>

              {/* Tool Categories */}
              <div className="space-y-3">
                {Object.entries(toolCategories).map(([category, tools]) => {
                  // Filter tools by search query
                  const filteredTools = tools.filter(tool => {
                    if (!toolSearchQuery) return true;
                    const searchLower = toolSearchQuery.toLowerCase();
                    const toolInfo = toolGuide[tool as keyof typeof toolGuide];
                    return (
                      tool.toLowerCase().includes(searchLower) ||
                      toolInfo?.description.toLowerCase().includes(searchLower) ||
                      toolInfo?.useCase.toLowerCase().includes(searchLower)
                    );
                  });

                  if (filteredTools.length === 0) return null;

                  const isExpanded = expandedToolCategory === category;

                  return (
                    <div key={category} className="border border-[#30363d] rounded bg-[#0d1117]">
                      <button
                        onClick={() => setExpandedToolCategory(isExpanded ? null : category)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161b22] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded-t"
                        aria-expanded={isExpanded}
                        aria-controls={`tool-category-${category}`}
                      >
                        <h4 className="text-md font-semibold text-[#c9d1d9]">{category}</h4>
                        <span className="text-[#8b949e]">
                          {isExpanded ? '▼' : '▶'} {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                      
                      {isExpanded && (
                        <div id={`tool-category-${category}`} className="p-4 space-y-3 border-t border-[#30363d]">
                          {filteredTools.map((tool) => {
                            const info = toolGuide[tool as keyof typeof toolGuide];
                            if (!info) return null;
                            
                            return (
                              <div key={tool} className="border border-[#30363d] rounded p-4 bg-[#161b22]">
                                <h5 className="text-sm font-semibold text-[#58a6ff] mb-2">{tool}</h5>
                                <p className="text-sm text-[#8b949e] mb-2">{info.description}</p>
                                <div className="mb-2">
                                  <span className="text-xs font-semibold text-[#8b949e]">Use Case: </span>
                                  <span className="text-sm text-[#c9d1d9]">{info.useCase}</span>
                                </div>
                                <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                                  <span className="text-xs font-semibold text-[#58a6ff]">💡 Tip: </span>
                                  <span className="text-xs text-[#8b949e]">{info.tip}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {toolSearchQuery && Object.values(toolCategories).flat().filter(tool => {
                const searchLower = toolSearchQuery.toLowerCase();
                const toolInfo = toolGuide[tool as keyof typeof toolGuide];
                return (
                  tool.toLowerCase().includes(searchLower) ||
                  toolInfo?.description.toLowerCase().includes(searchLower) ||
                  toolInfo?.useCase.toLowerCase().includes(searchLower)
                );
              }).length === 0 && (
                <div className="text-center py-8 text-[#8b949e]">
                  No tools found matching "{toolSearchQuery}"
                </div>
              )}
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
      </>
    )}
    </>
  );
}

