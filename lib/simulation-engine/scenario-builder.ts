// Scenario story generator - builds multi-stage attack scenarios

import type { 
  ScenarioStory, 
  AttackChain, 
  AttackChainStage, 
  AttackStage,
  ScenarioTimelineEvent 
} from './types';
import { executeAttackChain } from '../attack-simulators/atomic-red-team';

// Predefined attack chain templates
const ATTACK_CHAIN_TEMPLATES: Record<string, {
  name: string;
  description: string;
  stages: Array<{ stage: AttackStage; technique: string; name: string }>;
}> = {
  'ransomware-deployment': {
    name: 'Ransomware Deployment Chain',
    description: 'Full ransomware attack from initial access to encryption',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Phishing: Spearphishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'persistence', technique: 'T1547.001', name: 'Registry Run Keys' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
      { stage: 'impact', technique: 'T1486', name: 'Data Encrypted for Impact' },
    ],
  },
  'credential-harvesting': {
    name: 'Credential Harvesting Chain',
    description: 'Steal credentials and use them for lateral movement',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Phishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'credential-access', technique: 'T1003', name: 'OS Credential Dumping' },
      { stage: 'lateral-movement', technique: 'T1021.002', name: 'SMB/Windows Admin Shares' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
    ],
  },
  'apt-persistence': {
    name: 'APT Persistence Chain',
    description: 'Advanced persistent threat establishing long-term access',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Spearphishing Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'persistence', technique: 'T1053.005', name: 'Scheduled Task' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'File Deletion' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
    ],
  },
  'apt29-cozy-bear': {
    name: 'APT29 (Cozy Bear) - Multi-Day Campaign',
    description: 'Simulated APT29 attack chain based on Mordor dataset patterns. Includes phishing, credential dumping, lateral movement, and data exfiltration over multiple days.',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Spearphishing Attachment (Day 1)' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'persistence', technique: 'T1053.005', name: 'Scheduled Task' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'File Deletion' },
      { stage: 'credential-access', technique: 'T1003', name: 'OS Credential Dumping (LSASS)' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
      { stage: 'discovery', technique: 'T1018', name: 'Remote System Discovery' },
      { stage: 'lateral-movement', technique: 'T1021.002', name: 'SMB/Windows Admin Shares (Day 2)' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
    ],
  },
  'ransomware-lockbit': {
    name: 'LockBit Ransomware Deployment',
    description: 'Complete LockBit-style ransomware attack from initial compromise to encryption',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Phishing Email with Malicious Attachment' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Download and Execute' },
      { stage: 'persistence', technique: 'T1547.001', name: 'Registry Run Keys' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'Indicator Removal on Host' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
      { stage: 'discovery', technique: 'T1018', name: 'Remote System Discovery' },
      { stage: 'lateral-movement', technique: 'T1021.002', name: 'SMB Lateral Movement' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'C2 Beaconing' },
      { stage: 'collection', technique: 'T1005', name: 'Data Collection' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Data Exfiltration' },
      { stage: 'impact', technique: 'T1486', name: 'Data Encrypted for Impact' },
    ],
  },
  'insider-threat': {
    name: 'Insider Threat - Data Theft',
    description: 'Simulated insider threat scenario with data exfiltration',
    stages: [
      { stage: 'initial-access', technique: 'T1078', name: 'Valid Accounts (Insider Access)' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell for Data Collection' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'collection', technique: 'T1039', name: 'Data from Network Shared Drive' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over Web Service' },
    ],
  },
  'bec-compromise': {
    name: 'Business Email Compromise (BEC)',
    description: 'Sophisticated BEC attack targeting financial transactions and executive communications',
    stages: [
      { stage: 'initial-access', technique: 'T1566.002', name: 'Spearphishing Link (Email Account Compromise)' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell for Email Access' },
      { stage: 'persistence', technique: 'T1078', name: 'Valid Accounts (Compromised Email)' },
      { stage: 'collection', technique: 'T1114', name: 'Email Collection' },
      { stage: 'collection', technique: 'T1539', name: 'Steal Web Session Cookie' },
      { stage: 'discovery', technique: 'T1087', name: 'Account Discovery' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over Web Service' },
      { stage: 'impact', technique: 'T1498', name: 'Network Denial of Service' },
    ],
  },
  'phishing-malware-dropper': {
    name: 'Phishing with Malware Dropper',
    description: 'Multi-stage phishing attack delivering malware through malicious attachments and links',
    stages: [
      { stage: 'initial-access', technique: 'T1566.001', name: 'Spearphishing Attachment' },
      { stage: 'execution', technique: 'T1204.002', name: 'User Execution (Malicious File)' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell Execution' },
      { stage: 'defense-evasion', technique: 'T1027', name: 'Obfuscated Files or Information' },
      { stage: 'persistence', technique: 'T1547.001', name: 'Registry Run Keys' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
    ],
  },
  'insider-sabotage': {
    name: 'Insider Sabotage',
    description: 'Malicious insider performing destructive actions and system sabotage',
    stages: [
      { stage: 'initial-access', technique: 'T1078', name: 'Valid Accounts (Insider Access)' },
      { stage: 'execution', technique: 'T1059.001', name: 'PowerShell for System Manipulation' },
      { stage: 'privilege-escalation', technique: 'T1078', name: 'Valid Accounts (Privileged)' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'File Deletion' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
      { stage: 'discovery', technique: 'T1018', name: 'Remote System Discovery' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'impact', technique: 'T1489', name: 'Service Stop' },
      { stage: 'impact', technique: 'T1491', name: 'Defacement' },
    ],
  },
  'cloud-misconfiguration': {
    name: 'Cloud Misconfiguration Breach',
    description: 'Attack exploiting cloud infrastructure misconfigurations and exposed services',
    stages: [
      { stage: 'initial-access', technique: 'T1078', name: 'Valid Accounts (Cloud Account)' },
      { stage: 'discovery', technique: 'T1083', name: 'Cloud Storage Discovery' },
      { stage: 'collection', technique: 'T1530', name: 'Data from Cloud Storage' },
      { stage: 'discovery', technique: 'T1526', name: 'Cloud Service Discovery' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over Web Service' },
      { stage: 'impact', technique: 'T1498', name: 'Cloud Service Denial' },
    ],
  },
  'supply-chain-compromise': {
    name: 'Supply Chain Compromise',
    description: 'Attack through compromised third-party software or vendor access',
    stages: [
      { stage: 'initial-access', technique: 'T1195', name: 'Supply Chain Compromise' },
      { stage: 'execution', technique: 'T1204.002', name: 'User Execution (Compromised Software)' },
      { stage: 'persistence', technique: 'T1547.001', name: 'Registry Run Keys' },
      { stage: 'defense-evasion', technique: 'T1070.004', name: 'File Deletion' },
      { stage: 'discovery', technique: 'T1083', name: 'File and Directory Discovery' },
      { stage: 'collection', technique: 'T1005', name: 'Data from Local System' },
      { stage: 'command-and-control', technique: 'T1071.001', name: 'Web Protocols C2' },
      { stage: 'exfiltration', technique: 'T1048', name: 'Exfiltration Over HTTP' },
    ],
  },
};

export function generateScenarioStory(
  storyType: keyof typeof ATTACK_CHAIN_TEMPLATES,
  sessionId: string,
  options?: {
    startTime?: string;
    hostname?: string;
    username?: string;
    sourceIP?: string;
  }
): ScenarioStory {
  const template = ATTACK_CHAIN_TEMPLATES[storyType];
  if (!template) {
    throw new Error(`Unknown story type: ${storyType}`);
  }

  const scenarioId = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = options?.startTime || new Date().toISOString();
  
  // Build attack chain
  const attackChain: AttackChain = {
    id: `chain-${scenarioId}`,
    scenario_id: scenarioId,
    session_id: sessionId,
    name: template.name,
    description: template.description,
    stages: [],
    status: 'active',
    start_time: startTime,
  };

  // Generate timeline events
  const timeline: ScenarioTimelineEvent[] = [];
  let currentTime = new Date(startTime);

  template.stages.forEach((stageTemplate, index) => {
    // Each stage happens 2-10 minutes after the previous
    const delayMinutes = 2 + Math.random() * 8;
    currentTime = new Date(currentTime.getTime() + delayMinutes * 60000);

    const chainStage: AttackChainStage = {
      stage: stageTemplate.stage,
      technique_id: stageTemplate.technique,
      technique_name: stageTemplate.name,
      timestamp: currentTime.toISOString(),
      success: true,
      events: [], // Will be populated when events are generated
      artifacts: [],
      description: `Executed ${stageTemplate.name}`,
    };

    attackChain.stages.push(chainStage);

    // Add timeline event
    timeline.push({
      timestamp: currentTime.toISOString(),
      stage: stageTemplate.stage,
      description: `${stageTemplate.name} executed`,
      visible_to_user: index === 0 || Math.random() > 0.3, // First stage always visible, others 70% chance
      detection_triggered: Math.random() > 0.5, // 50% chance of detection
    });
  });

  // Determine difficulty based on story complexity
  const difficulty: ScenarioStory['difficulty'] = 
    template.stages.length <= 3 ? 'beginner' :
    template.stages.length <= 5 ? 'intermediate' :
    'advanced';

  // Enhanced narratives based on scenario type
  const narratives: Record<string, {
    background: string;
    incident: string;
    yourRole: string;
  }> = {
    'apt29-cozy-bear': {
      background: 'You are a SOC analyst at a mid-sized technology company. Over the past 48 hours, your security team has noticed intermittent network anomalies and unusual system behavior. Initial automated scans revealed nothing, but your threat intelligence team has flagged potential APT29 (Cozy Bear) activity patterns in the industry.',
      incident: 'A sophisticated multi-day campaign has been detected. The attack began with a spearphishing email targeting a senior executive. The email contained a malicious attachment that, when opened, executed PowerShell commands to establish persistence and begin credential harvesting. The attacker has been active for two days, performing reconnaissance, lateral movement, and data collection. Your task is to hunt through the logs and identify all stages of this attack chain.',
      yourRole: 'Your mission is to conduct a comprehensive threat hunt to identify all malicious activity. You need to: (1) Identify the initial infection vector, (2) Track the attacker\'s progression through the network, (3) Find all compromised systems and accounts, (4) Extract IOCs (IPs, domains, hashes, PIDs), (5) Map the attack to MITRE ATT&CK techniques, and (6) Document your findings in a case report. This scenario is based on real APT29 attack patterns from the Mordor security dataset.',
    },
    'ransomware-lockbit': {
      background: 'You are a security analyst responding to a ransomware incident. The organization\'s security operations center received multiple alerts about suspicious outbound connections and file encryption activities. Initial investigation suggests this may be a LockBit ransomware deployment.',
      incident: 'A ransomware attack has been detected in progress. The attack chain began with a phishing email containing a malicious document. Once executed, the malware established persistence, performed network discovery, moved laterally to multiple systems, and began encrypting files. Your team needs to quickly identify the scope of the compromise and all indicators of compromise before the encryption completes.',
      yourRole: 'Investigate this ransomware incident end-to-end. Identify: (1) The initial infection point, (2) All systems affected, (3) The ransomware variant and its characteristics, (4) Network indicators (C2 servers, exfiltration points), (5) File hashes and process indicators, and (6) The complete attack timeline. Time is critical - document everything quickly.',
    },
    'insider-threat': {
      background: 'You are investigating a potential insider threat case. The organization\'s data loss prevention (DLP) system flagged unusual data access patterns from an employee account. The account has been accessing large volumes of sensitive files outside normal business hours.',
      incident: 'An employee with legitimate access has been systematically collecting and exfiltrating sensitive company data. The activity has been ongoing for several days, with data being transferred to external cloud storage services. This is a classic insider threat scenario where valid credentials are being abused for malicious purposes.',
      yourRole: 'Conduct an insider threat investigation. Your objectives: (1) Identify the user account and their access patterns, (2) Determine what data was accessed and exfiltrated, (3) Find evidence of data collection and transfer, (4) Map the activity timeline, (5) Identify external services used for exfiltration, and (6) Document the case for HR and legal review.',
    },
    'bec-compromise': {
      background: 'You are investigating a Business Email Compromise (BEC) incident. The finance department reported suspicious wire transfer requests from what appeared to be the CEO\'s email account. Initial checks show the emails originated from the legitimate account but contain unusual language patterns.',
      incident: 'A sophisticated BEC attack has compromised an executive email account. The attacker gained access through a spearphishing link, established persistence, and has been monitoring email communications. The attacker has been collecting sensitive financial information and attempting to initiate fraudulent wire transfers. This is a high-priority incident requiring immediate investigation.',
      yourRole: 'Investigate this BEC attack thoroughly. Your mission: (1) Identify how the email account was compromised, (2) Determine the scope of email access and data collection, (3) Find all indicators of compromise (IPs, domains, session tokens), (4) Track the attacker\'s activities and timeline, (5) Identify any fraudulent transactions or attempted transfers, and (6) Document findings for legal and financial recovery efforts.',
    },
    'phishing-malware-dropper': {
      background: 'You are responding to a malware infection that originated from a phishing email. Multiple users reported receiving suspicious emails with attachments, and several systems are showing signs of compromise. The security team has identified malicious PowerShell activity and unusual network connections.',
      incident: 'A phishing campaign delivered malware through malicious email attachments. The malware uses a multi-stage dropper that downloads additional payloads, establishes persistence, and begins data collection. The attack is actively spreading through the network, with multiple systems showing signs of infection.',
      yourRole: 'Investigate this phishing and malware dropper attack. Your objectives: (1) Identify the initial phishing email and attachment, (2) Track the malware dropper execution chain, (3) Find all infected systems, (4) Extract malware IOCs (hashes, C2 servers, file paths), (5) Map the attack to MITRE ATT&CK techniques, and (6) Provide containment recommendations.',
    },
    'insider-sabotage': {
      background: 'You are investigating a potential insider sabotage incident. Multiple critical systems have experienced unexpected outages, and security logs show suspicious activity from a privileged user account. The timing and pattern suggest intentional sabotage rather than accidental misconfiguration.',
      incident: 'A malicious insider with privileged access has been performing destructive actions across the organization\'s infrastructure. The attacker has been deleting critical files, stopping services, and attempting to cover their tracks. This is a high-severity incident requiring immediate containment and investigation.',
      yourRole: 'Conduct an insider sabotage investigation. Your mission: (1) Identify the malicious user account and their access level, (2) Determine the scope of destructive actions, (3) Find evidence of system manipulation and sabotage, (4) Track the timeline of malicious activities, (5) Identify any data exfiltration or additional malicious actions, and (6) Document findings for legal and HR proceedings.',
    },
    'cloud-misconfiguration': {
      background: 'You are investigating a cloud security breach. The organization uses multiple cloud services, and security monitoring has detected unauthorized access to cloud storage buckets. Initial investigation suggests misconfigured access controls may have exposed sensitive data.',
      incident: 'An attacker has exploited cloud infrastructure misconfigurations to gain unauthorized access to cloud storage and services. The attacker discovered exposed S3 buckets, accessed sensitive data, and may have exfiltrated information. This incident highlights the importance of proper cloud security configuration.',
      yourRole: 'Investigate this cloud misconfiguration breach. Your objectives: (1) Identify the misconfigured cloud resources, (2) Determine what data was exposed or accessed, (3) Find evidence of unauthorized access and data exfiltration, (4) Track the attacker\'s activities in cloud logs, (5) Identify all compromised cloud accounts and services, and (6) Document findings and provide remediation recommendations.',
    },
    'supply-chain-compromise': {
      background: 'You are investigating a supply chain compromise incident. The organization recently deployed a software update from a trusted vendor, and multiple systems are showing signs of compromise. Security teams suspect the vendor\'s software may have been compromised before distribution.',
      incident: 'A supply chain attack has been detected. The attacker compromised a third-party software vendor and inserted malicious code into a legitimate software update. When the organization deployed the update, the malware was installed on multiple systems, establishing persistence and beginning data collection.',
      yourRole: 'Investigate this supply chain compromise. Your mission: (1) Identify the compromised software and update version, (2) Determine the scope of systems affected, (3) Find the malware payload and its execution chain, (4) Track C2 communications and data exfiltration, (5) Extract all IOCs related to the supply chain attack, and (6) Document findings for vendor notification and incident response.',
    },
  };

  const narrative = narratives[storyType] || {
    background: `You are a SOC analyst investigating a security incident. ${template.description}`,
    incident: `A security incident has been detected. ${template.description}`,
    yourRole: `Investigate this incident and identify all malicious activity. Map findings to MITRE ATT&CK techniques and document your investigation.`,
  };

  // Enhanced learning objectives based on scenario type
  const learningObjectivesMap: Record<string, string[]> = {
    'apt29-cozy-bear': [
      'Understand APT-style multi-day attack campaigns',
      'Identify credential dumping techniques (T1003) in Windows event logs',
      'Correlate network and host logs to track lateral movement',
      'Recognize APT29 (Cozy Bear) attack patterns and TTPs',
      'Practice hunting for fileless malware and living-off-the-land techniques',
      'Map complex attack chains to MITRE ATT&CK framework',
      'Use OSINT to enrich discovered IOCs',
      'Document findings in a comprehensive incident report',
    ],
    'ransomware-lockbit': [
      'Understand ransomware deployment kill chains',
      'Identify initial access vectors (phishing, T1566.001)',
      'Detect persistence mechanisms (registry keys, scheduled tasks)',
      'Track lateral movement indicators (SMB, T1021.002)',
      'Recognize file encryption activities (T1486)',
      'Extract ransomware IOCs (C2 IPs, file hashes, process names)',
      'Practice rapid incident response under time pressure',
    ],
    'insider-threat': [
      'Understand insider threat detection methodologies',
      'Identify anomalous user behavior patterns',
      'Track data access and exfiltration activities',
      'Correlate authentication logs with data access logs',
      'Recognize legitimate account abuse (T1078)',
      'Map data exfiltration techniques (T1048)',
      'Document findings for legal and HR review',
    ],
    'bec-compromise': [
      'Understand Business Email Compromise (BEC) attack patterns',
      'Identify email account compromise indicators',
      'Track email collection and session hijacking (T1114, T1539)',
      'Recognize spearphishing link techniques (T1566.002)',
      'Map BEC attack chains to MITRE ATT&CK',
      'Investigate financial fraud indicators',
      'Document findings for legal and financial recovery',
    ],
    'phishing-malware-dropper': [
      'Understand phishing attack delivery mechanisms',
      'Identify malware dropper execution chains',
      'Track multi-stage malware deployment',
      'Recognize obfuscation techniques (T1027)',
      'Map phishing and malware techniques to MITRE ATT&CK',
      'Extract malware IOCs from logs',
      'Practice rapid malware containment procedures',
    ],
    'insider-sabotage': [
      'Understand insider sabotage detection',
      'Identify destructive system actions',
      'Track privilege escalation and abuse',
      'Recognize service manipulation (T1489, T1491)',
      'Map sabotage techniques to MITRE ATT&CK',
      'Correlate user activity with system impacts',
      'Document findings for legal proceedings',
    ],
    'cloud-misconfiguration': [
      'Understand cloud security misconfigurations',
      'Identify exposed cloud resources',
      'Track cloud storage access patterns',
      'Recognize cloud service discovery techniques (T1526)',
      'Map cloud attack techniques to MITRE ATT&CK',
      'Investigate cloud log analysis',
      'Provide cloud security remediation guidance',
    ],
    'supply-chain-compromise': [
      'Understand supply chain attack vectors',
      'Identify compromised software indicators',
      'Track supply chain compromise techniques (T1195)',
      'Recognize vendor software abuse patterns',
      'Map supply chain attacks to MITRE ATT&CK',
      'Investigate third-party software security',
      'Document findings for vendor notification',
    ],
  };

  const learningObjectives = learningObjectivesMap[storyType] || [
    `Understand ${template.name} attack flow`,
    `Identify indicators across multiple MITRE ATT&CK stages`,
    `Correlate events from different log sources`,
    `Track attack progression through timeline analysis`,
  ];

  return {
    id: scenarioId,
    name: template.name,
    description: template.description,
    initial_infection_vector: storyType.includes('insider') ? 'valid-accounts' : 'phishing',
    attack_chains: [attackChain.id],
    timeline,
    learning_objectives: learningObjectives,
    difficulty,
    narrative,
  };
}

export function generateMultipleScenarios(
  count: number,
  sessionId: string,
  options?: {
    storyTypes?: Array<keyof typeof ATTACK_CHAIN_TEMPLATES>;
    parallel?: boolean; // Run scenarios in parallel vs sequential
  }
): ScenarioStory[] {
  const storyTypes = options?.storyTypes || Object.keys(ATTACK_CHAIN_TEMPLATES) as Array<keyof typeof ATTACK_CHAIN_TEMPLATES>;
  const scenarios: ScenarioStory[] = [];
  const baseTime = new Date();

  for (let i = 0; i < count; i++) {
    const storyType = storyTypes[Math.floor(Math.random() * storyTypes.length)];
    const startTime = options?.parallel 
      ? baseTime.toISOString() // All start at same time
      : new Date(baseTime.getTime() + i * 3600000).toISOString(); // 1 hour apart

    scenarios.push(
      generateScenarioStory(storyType, sessionId, { startTime })
    );
  }

  return scenarios;
}

