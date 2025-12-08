// Scenario Engine for Realistic Attack Scenarios

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  aptGroup?: string;
  duration: number; // minutes
  mitreTactics: string[];
  techniques: string[];
  timeline: ScenarioEvent[];
  learningObjectives: string[];
  successCriteria: string[];
  briefing: string;
  debriefing: string;
}

export interface ScenarioEvent {
  timestamp: Date;
  source: 'sysmon' | 'zeek' | 'suricata' | 'edr' | 'email-gateway';
  eventType: string;
  isMalicious: boolean;
  technique: string;
  stage: string;
  description: string;
  iocs: string[];
  parentEventId?: string;
}

export const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'apt28-phishing',
    name: 'APT28 Phishing Campaign',
    description: 'Russian state-sponsored actors target employee with spearphishing',
    difficulty: 'Intermediate',
    aptGroup: 'APT28 (Fancy Bear)',
    duration: 25,
    mitreTactics: ['Initial Access', 'Execution', 'Persistence', 'C2', 'Exfiltration'],
    techniques: ['T1566.001', 'T1059.001', 'T1547.001', 'T1071.001', 'T1041'],
    learningObjectives: [
      'Identify phishing email indicators',
      'Recognize PowerShell obfuscation',
      'Trace lateral movement paths',
      'Map complete attack chain'
    ],
    successCriteria: [
      'Identify initial phishing email',
      'Find malicious PowerShell execution',
      'Detect C2 communication',
      'Identify exfiltrated data'
    ],
    briefing: `INCIDENT BRIEFING
Classification: CONFIDENTIAL
Date: ${new Date().toLocaleDateString()}
Time: 09:15 AM
Priority: HIGH

SITUATION:
Multiple security alerts triggered at 09:17 AM. Initial indicators suggest potential APT28 activity targeting employee workstation WORKSTATION-42.

User "john.doe@company.com" reported receiving a suspicious email at 09:00 AM with subject "Q4 Budget Review - Urgent". Email appeared to be from CFO.

TIMELINE OF EVENTS:
09:00 AM - Suspicious email received
09:15 AM - Email opened by employee
09:17 AM - Alert: Suspicious Outlook behavior
09:20 AM - Alert: PowerShell execution with encoded command
09:25 AM - Alert: Unknown process execution from TEMP directory

YOUR MISSION:
1. Determine if this is a confirmed security incident
2. Identify all compromised systems
3. Map the complete attack chain (all MITRE techniques)
4. Tag all malicious indicators (IPs, domains, hashes, processes)
5. Recommend immediate containment actions

ASSETS AT RISK:
- 250 employee workstations
- File server FS-01 (contains financial data)
- Domain controller DC-01
- Email server MAIL-01

THREAT ACTOR PROFILE:
APT28 (Fancy Bear) - Russian state-sponsored group active since 2007.
Known for spearphishing, credential theft, and data exfiltration.
Common tools: X-Agent, Sofacy, Komplex

TIME LIMIT: 30 minutes
SLA REQUIREMENT: Critical alerts must be triaged within 15 minutes`,
    debriefing: `INCIDENT DEBRIEF
Status: CONTAINED

WHAT HAPPENED:
This was a confirmed APT28 spearphishing campaign targeting financial data.

LESSONS LEARNED:
1. Email Filtering: Sender domain was registered 2 days ago (red flag)
2. Macro Execution: Excel should not spawn PowerShell (blocking policy needed)
3. C2 Detection: Beaconing pattern was regular 60-second intervals
4. Lateral Movement: Service account used for file server access (should be monitored)

RECOMMENDED ACTIONS:
[IMMEDIATE]
- Isolate WORKSTATION-42 from network
- Reset credentials for john.doe
- Block C2 IP and domain at perimeter

[SHORT-TERM]
- Investigate file server access logs
- Review email logs for similar phishing attempts
- Update email filtering rules

[LONG-TERM]
- Implement macro blocking policy
- Deploy PowerShell logging and monitoring
- Enable DLP for financial data`,
    timeline: [
      {
        timestamp: new Date('2024-12-08T09:00:00'),
        source: 'email-gateway',
        eventType: 'email_received',
        isMalicious: true,
        technique: 'T1566.001',
        stage: 'initial-access',
        description: 'Spearphishing email received',
        iocs: ['sender@fakecfo-company.com', 'invoice_q4_review.xlsx']
      },
      {
        timestamp: new Date('2024-12-08T09:15:00'),
        source: 'edr',
        eventType: 'email_opened',
        isMalicious: true,
        technique: 'T1204.002',
        stage: 'initial-access',
        description: 'User opened malicious attachment',
        iocs: ['invoice_q4_review.xlsx', 'WORKSTATION-42']
      },
      {
        timestamp: new Date('2024-12-08T09:17:00'),
        source: 'sysmon',
        eventType: 'ProcessCreate',
        isMalicious: true,
        technique: 'T1059.001',
        stage: 'execution',
        description: 'Excel spawned PowerShell with encoded command',
        iocs: ['powershell.exe', 'EXCEL.EXE']
      },
      {
        timestamp: new Date('2024-12-08T09:20:00'),
        source: 'zeek',
        eventType: 'http_request',
        isMalicious: true,
        technique: 'T1071.001',
        stage: 'command-and-control',
        description: 'Outbound connection to C2 server',
        iocs: ['185.220.101.47', 'malicious-updates.com']
      }
    ]
  }
];

export function getScenarioById(id: string): AttackScenario | undefined {
  return ATTACK_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByDifficulty(difficulty: string): AttackScenario[] {
  return ATTACK_SCENARIOS.filter(s => s.difficulty === difficulty);
}

