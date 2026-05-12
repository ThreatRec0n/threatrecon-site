import type { CaseContent } from './caseData.types';

export const CASE_004_ID = 'case-004';

export const case004Content: CaseContent = {
  definition: {
    id: CASE_004_ID,
    numberLabel: 'CASE-004',
    companyName: 'Apex Manufacturing Corp',
    caseType: 'SABOTAGE',
    tagline: 'THE SABOTEUR',
    descriptionOneLine:
      'Production halted after corrupted deployment — insurer suspects deliberate rollback masked as automation.',
    difficultyEstimateMinutes: { BEGINNER: 38, INTERMEDIATE: 62, HARD: 95 },
    guiltyEmployeeId: 'emp-derek-simmons',
    correctMotive: 'GRIEVANCE',
    correctIncidentType: 'malicious',
    briefing: {
      letterheadCompany: 'Apex Manufacturing Corp — Legal Response Unit',
      letterDate: 'May 10, 2026',
      classificationStamp: 'CONFIDENTIAL',
      incidentSummary:
        'SCADA-adjacent historians flatlined — insurer cites probable insider rollback.',
      stolenOrDamaged:
        '$2M downtime — corrupted recipe DB + falsified automation audit trail.',
      discoveryTimeline:
        'May 8 outage wave — IR snapshots preserved jump boxes.',
      taskStatement:
        'Determine whether credential misuse and log tampering indicate sabotage.',
    },
    employeeIds: [
      'emp-derek-simmons',
      'emp-maria-gonzalez',
      'emp-kevin-park',
      'emp-sandra-thorn',
      'emp-frank-okafor',
      'emp-lily-chen',
    ],
    scoringEvidenceIds: [
      'c004-deploy-rollback',
      'c004-cred-kevin-ip-mismatch',
      'c004-badge-ot-floor',
      'c004-prefetch-remote-desktop',
      'c004-access-prod-console',
      'c004-safety-writeup',
      'c004-slack-termination-rumor',
      'c004-email-hr-casefile',
      'c004-printer-safety-poster',
      'c004-browser-helpdesk',
      'c004-net-vpn-supp',
      'c004-usb-sterile',
      'c004-log-gap-recovery',
      'c004-calendar-hr',
      'c004-antiforensic-time',
    ],
    debrief: {
      fullStory:
        'Derek Simmons faced termination after a serious safety write-up. Shoulder-surfing Kevin Park’s console passphrase let him pivot during a storm-induced maintenance window. He issued a rollback framed as automated remediation, then truncated orchestrator logs to mimic tooling glitch. Badge data shows OT floor presence overlapping precise orchestration IDs tied to Kevin’s account — from Derek’s terminal.',
      techniques: [
        {
          title: 'CREDENTIAL MISUSE ON SHARED CONSOLES',
          whatTheyDid:
            'Operated privileged deployment plane using peer credentials.',
          howItWorks:
            'Shared jump hosts collapse attribution unless keystroke + IP correlation applied.',
          artifacts:
            'RDP cache, lateral auth events, mismatched IP geography.',
          howInvestigatorsFind:
            'Cross-reference interactive sessions with physical presence telemetry.',
          exampleCommands: ['query concurrent_sessions --all-users'],
          realTools: 'Velociraptor, CrowdStrike, Azure AD sign-in logs.',
        },
      ],
      keyTakeaways: [
        'Break-glass credentials need MFA binding per operator.',
        'Log gaps following outages demand carving, not trust.',
      ],
      behavioralIndicators: [
        'Pending HR disciplinary timeline.',
        'OT engineer unusually inside IT VLAN.',
      ],
      whatToDoDifferentlyGeneric:
        'Treat rollback commits like criminal evidence — immutable CI/CD attestations required.',
    },
  },
  summaryKeyTerms: [
    'rollback',
    'deployment',
    'credential',
    'safety',
    'termination',
    'derek',
    'kevin',
    'log',
    'ot',
  ],
  employees: {
    'emp-derek-simmons': {
      id: 'emp-derek-simmons',
      avatarId: 'AVATAR_M1',
      fullName: 'Derek Simmons',
      employeeIdLabel: 'EMP-8801',
      title: 'OT Systems Engineer',
      department: 'Plant Operations',
      yearsAtCompany: 8,
      managerName: 'Maria Gonzalez',
      accessLevel: 'Level 3 (OT consoles)',
      lastBadgeIn: '2026-05-07 21:44',
      performanceSnippet:
        '★★☆☆☆ — Safety incident review pending — attitude flagged.',
      notes:
        'Rumored termination letter circulating — disputes findings aggressively.',
      workstationId: 'WS-OT-12',
      email: 'derek.simmons@apex-mfg.internal',
      hiddenMotiveCategory: 'GRIEVANCE',
    },
    'emp-maria-gonzalez': {
      id: 'emp-maria-gonzalez',
      avatarId: 'AVATAR_F2',
      fullName: 'Maria Gonzalez',
      employeeIdLabel: 'EMP-4402',
      title: 'Plant Manager',
      department: 'Operations',
      yearsAtCompany: 14,
      managerName: 'VP Manufacturing',
      accessLevel: 'Level 4',
      lastBadgeIn: '2026-05-07 18:02',
      performanceSnippet: '★★★★★ — Runs tight CAPA process.',
      notes: 'Escalated Derek case file to HR — cooperative witness.',
      workstationId: 'WS-MFG-01',
      email: 'maria.gonzalez@apex-mfg.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-kevin-park': {
      id: 'emp-kevin-park',
      avatarId: 'AVATAR_M3',
      fullName: 'Kevin Park',
      employeeIdLabel: 'EMP-7712',
      title: 'IT Infrastructure Lead',
      department: 'Corporate IT',
      yearsAtCompany: 10,
      managerName: 'CIO',
      accessLevel: 'Level 5 (Deployment plane)',
      lastBadgeIn: '2026-05-07 17:30',
      performanceSnippet: '★★★★★ — Keeps golden pipelines humming.',
      notes:
        'Victim of credential borrowing — sessions originate from OT VLAN unexpectedly.',
      workstationId: 'WS-IT-CORE',
      email: 'kevin.park@apex-mfg.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-sandra-thorn': {
      id: 'emp-sandra-thorn',
      avatarId: 'AVATAR_F1',
      fullName: 'Sandra Thorn',
      employeeIdLabel: 'EMP-5519',
      title: 'Quality Control Supervisor',
      department: 'QA',
      yearsAtCompany: 11,
      managerName: 'Maria Gonzalez',
      accessLevel: 'Level 2',
      lastBadgeIn: '2026-05-07 16:40',
      performanceSnippet: '★★★★☆ — Detailed inspection logs.',
      notes: 'No privileged deployment rights.',
      workstationId: 'WS-QA-03',
      email: 'sandra.thorn@apex-mfg.internal',
      hiddenMotiveCategory: 'GRIEVANCE',
    },
    'emp-frank-okafor': {
      id: 'emp-frank-okafor',
      avatarId: 'AVATAR_M4',
      fullName: 'Frank Okafor',
      employeeIdLabel: 'EMP-6630',
      title: 'Shift Supervisor',
      department: 'Operations',
      yearsAtCompany: 16,
      managerName: 'Maria Gonzalez',
      accessLevel: 'Level 2',
      lastBadgeIn: '2026-05-07 22:01',
      performanceSnippet: '★★★★★ — Keeps crews aligned.',
      notes: 'Night shift presence routine.',
      workstationId: 'WS-SHIFT-02',
      email: 'frank.okafor@apex-mfg.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-lily-chen': {
      id: 'emp-lily-chen',
      avatarId: 'AVATAR_F4',
      fullName: 'Lily Chen',
      employeeIdLabel: 'EMP-9901',
      title: 'Network Administrator',
      department: 'IT',
      yearsAtCompany: 6,
      managerName: 'Kevin Park',
      accessLevel: 'Level 4',
      lastBadgeIn: '2026-05-07 19:11',
      performanceSnippet: '★★★★☆ — Aggressive change velocity.',
      notes: 'Maintains VPN concentrators — logs intact.',
      workstationId: 'WS-NET-04',
      email: 'lily.chen@apex-mfg.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
  },
  evidenceItems: [
    {
      id: 'c004-deploy-rollback',
      source: 'access',
      category: 'ACCESS',
      title: 'Orchestrator rollback issued under kevin.park principal',
      description:
        'Source IP maps to Derek’s OT jack — inconsistent.',
      locationHint: 'Deployment audit API export',
      commandHint: 'query access_logs --resource="prod-deploy"',
      isKey: true,
    },
    {
      id: 'c004-cred-kevin-ip-mismatch',
      source: 'network',
      category: 'NETWORK',
      title: 'Session correlation — Kevin account from OT VLAN IP',
      description:
        'Simultaneous badge-in shows Derek at terminal.',
      locationHint: 'Network + Badge cross reference',
      commandHint: 'badge_records --cross-reference --network-logs --date="2026-05-07"',
      isKey: true,
    },
    {
      id: 'c004-badge-ot-floor',
      source: 'badge',
      category: 'BADGE',
      title: 'Derek badged onto OT mezzanine during rollback minute',
      description:
        'Tight temporal alignment.',
      locationHint: 'Badge Records',
      commandHint: 'badge_records --user="derek.simmons"',
      isKey: true,
    },
    {
      id: 'c004-prefetch-remote-desktop',
      source: 'workstation',
      category: 'ACCESS',
      title: 'Prefetch — mstsc.exe toward IT jump host',
      description:
        'From Derek workstation prior to incident.',
      locationHint: 'WS-OT-12 terminal',
      commandHint: 'prefetch detail MSTSC.EXE',
      isKey: true,
    },
    {
      id: 'c004-access-prod-console',
      source: 'access',
      category: 'ACCESS',
      title: 'Interactive console flag — bypassed CI gate',
      description:
        'Manual `--force` parameter unsupported by automation.',
      locationHint: 'Access Logs',
      commandHint: 'query access_logs --unusual-hours --all-users',
      isKey: true,
    },
    {
      id: 'c004-safety-writeup',
      source: 'email',
      category: 'EMAIL',
      title: 'HR safety escalation thread',
      description:
        'Documents grievance catalyst.',
      locationHint: 'Email → HR mailbox',
      commandHint: 'grep "safety" email_logs --user="hr@apex-mfg.internal"',
      isKey: true,
    },
    {
      id: 'c004-slack-termination-rumor',
      source: 'messages',
      category: 'MESSAGE',
      title: 'Shop floor rumor channel references Derek discipline',
      description:
        'Behavioral corroboration.',
      locationHint: '#random',
      commandHint: 'search_messages --keyword="termination"',
      isKey: true,
    },
    {
      id: 'c004-email-hr-casefile',
      source: 'email',
      category: 'EMAIL',
      title: 'Formal casefile attachment scheduling meeting May 9',
      description:
        'Explains timing pressure.',
      locationHint: 'Email → derek.simmons',
      commandHint: 'query email_logs --has-attachment --user="derek.simmons"',
      isKey: true,
    },
    {
      id: 'c004-printer-safety-poster',
      source: 'printer',
      category: 'PRINTER',
      title: 'Reprint safety bulletin — excessive copies',
      description:
        'Anger indicator — minor but contextual.',
      locationHint: 'Printer Logs',
      commandHint: 'printer_logs --user="derek.simmons"',
      isKey: true,
    },
    {
      id: 'c004-browser-helpdesk',
      source: 'browser',
      category: 'NETWORK',
      title: 'Repeated searches for bypassing CI gates',
      description:
        'Shows intent research.',
      locationHint: 'Browser history',
      commandHint: 'browser_history --site-contains="stackoverflow"',
      isKey: true,
    },
    {
      id: 'c004-net-vpn-supp',
      source: 'network',
      category: 'NETWORK',
      title: 'VPN logs nominal — attack stayed LAN-side',
      description:
        'Insider threat confirmation bias breaker.',
      locationHint: 'Network Logs',
      commandHint: 'netstat -an --timestamp',
      isKey: true,
    },
    {
      id: 'c004-usb-sterile',
      source: 'usb',
      category: 'USB',
      title: 'USB sterile — logical sabotage only',
      description:
        'Supports malware-less theory.',
      locationHint: 'USB History',
      commandHint: 'usbview --workstation="WS-OT-12"',
      isKey: true,
    },
    {
      id: 'c004-log-gap-recovery',
      source: 'recovery',
      category: 'FILE',
      title: 'Recovered truncated orchestrator segment',
      description:
        'Shows manual edit fingerprints.',
      locationHint: 'Deleted recovery',
      commandHint: 'recover --file="orchestrator.log"',
      isKey: true,
    },
    {
      id: 'c004-calendar-hr',
      source: 'calendar',
      category: 'CALENDAR',
      title: 'HR disciplinary calendar invite accepted',
      description:
        'Countdown motive reinforcement.',
      locationHint: 'Calendar',
      commandHint: 'calendar --keyword="HR" --user="derek.simmons"',
      isKey: true,
    },
    {
      id: 'c004-antiforensic-time',
      source: 'workstation',
      category: 'FILE',
      title: 'System time skew attempt detected',
      description:
        'Foiled by NTP correlation.',
      locationHint: 'System events',
      commandHint: 'wevtutil qe System /c:50 /f:text',
      isKey: true,
    },
  ],
  forwardingRules: [],
  emails: [
    {
      id: 'x1',
      mailbox: 'hr@apex-mfg.internal',
      from: 'HRBP',
      to: 'Derek Simmons',
      time: '2026-05-06 09:00',
      subject: 'Mandatory attendance — Safety CAPA review May 9',
      body: 'Please acknowledge receipt — counsel may attend.',
      attachments: [{ name: 'CAPA-8801.pdf', size: '320KB' }],
    },
  ],
  networkLog: [
    '2026-05-07 21:42:01 TCP 10.22.4.18:55102 → 10.10.0.5:3389 ESTABLISHED RDP kevin.park session token',
    '2026-05-07 21:42:18 TCP 10.22.4.18:55111 → 10.10.0.12:443 DEPLOY-API forceRollback=true',
  ],
  accessLog: [
    '2026-05-07 21:42:19 kevin.park FORCE_ROLLBACK prod-db-cluster SOURCE=OT-VLAN-10.22.4.18',
    '2026-05-07 21:42:44 orchestrator LOG_TRUNCATE job orchestrator-main — operator kevin.park',
    '2026-05-07 21:43:01 maria.gonzalez NOTIFY_INCIDENT P1 opened',
  ],
  usbLog: ['USB HISTORY CLEAN FOR WS-OT-12'],
  browserByUser: {
    'derek.simmons@apex-mfg.internal': [
      '2026-05-06 23:11:02 https://stackoverflow.com/questions/bypass-ci-gate',
    ],
  },
  badgeLog: [
    '2026-05-07 21:40:55 ENTRY derek.simmons OT-MEZZ',
    '2026-05-07 21:55:10 EXIT derek.simmons OT-MEZZ',
    '2026-05-07 21:42:00 ENTRY kevin.park IT-FLOOR2',
  ],
  slackMessages: [
    {
      id: 'r1',
      channel: '#random',
      user: 'frank.okafor',
      time: '2026-05-06 19:02',
      text: 'Heard Derek might be walked next week — stay safe out there.',
      forensicTags: ['rumor'],
    },
  ],
  printerLog: [
    '2026-05-06 20:12:01 derek.simmons PRINTER-LINE3 14 copies SAFETY-BULLETIN.pdf',
  ],
  calendarByUser: {
    'derek.simmons@apex-mfg.internal': [
      '2026-05-09 10:00 HR CAPA — REQUIRED',
    ],
  },
  workstations: {
    'WS-OT-12': {
      type: 'dir',
      children: {
        Notes: {
          type: 'dir',
          children: {
            'scratch.txt': {
              type: 'file',
              content: 'KP passphrase pattern observed near coffee maker — use tonight.',
            },
          },
        },
      },
    },
  },
  workstationSecurityLog: {
    'WS-OT-12':
      'Event 4616 — unauthorized privileged time change attempt — corrected via NTP.',
  },
  deletedRecoverable: [
    {
      name: 'orchestrator.log',
      workstation: 'DEPLOY-JUMP',
      deletedAt: '2026-05-07 21:50:01',
      confidence: 65,
    },
  ],
};
