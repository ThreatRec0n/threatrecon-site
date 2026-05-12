import type { CaseContent } from './caseData.types';

export const CASE_001_ID = 'case-001';

export const case001Content: CaseContent = {
  definition: {
    id: CASE_001_ID,
    numberLabel: 'CASE-001',
    companyName: 'Nexus Technologies Inc.',
    caseType: 'DATA THEFT',
    tagline: 'THE RESIGNATION',
    descriptionOneLine:
      'Senior engineer resigns after promotion denial — unreleased roadmap and IP artifacts moved off-network.',
    difficultyEstimateMinutes: { BEGINNER: 35, INTERMEDIATE: 55, HARD: 85 },
    guiltyEmployeeId: 'emp-sarah-chen',
    correctMotive: 'GRIEVANCE',
    correctIncidentType: 'malicious',
    briefing: {
      letterheadCompany: 'Nexus Technologies Inc. — Legal & Security',
      letterDate: 'May 9, 2026',
      classificationStamp: 'CONFIDENTIAL',
      incidentSummary:
        'Executive leadership engaged ThreatRecon after anomaly detection flagged multi-gigabyte egress aligned with an employee resignation.',
      stolenOrDamaged:
        'Unreleased Q3 product roadmap, architecture portfolio, and enterprise client identifiers — integrity and confidentiality compromised.',
      discoveryTimeline:
        'May 8 06:12 — SOC alert on bulk HTTPS upload; May 8 09:30 — HR confirms resignation effective May 22; May 9 — your assignment activated.',
      taskStatement:
        'Identify the individual responsible, document digital artifacts, and sustain findings suitable for corporate counsel.',
    },
    employeeIds: [
      'emp-sarah-chen',
      'emp-marcus-webb',
      'emp-james-okafor',
      'emp-linda-park',
      'emp-ryan-torres',
      'emp-diana-reeves',
    ],
    scoringEvidenceIds: [
      'c001-forward-rule',
      'c001-usb-may7',
      'c001-badge-server',
      'c001-net-dropbox',
      'c001-access-ipvault',
      'c001-browser-upload',
      'c001-print-roadmap',
      'c001-slack-vent',
      'c001-review-promo',
      'c001-cal-coffee',
      'c001-file-exfil-notes',
      'c001-email-personal-attach',
      'c001-prefetch-archiver',
      'c001-wevt-unusual-logon',
      'c001-strings-binary',
    ],
    beginnerHints: {
      'c001-forward-rule':
        'Administrator consoles hide silent forwards — query forwarding rules across every mailbox.',
      'c001-badge-server':
        'Physical proximity still matters — correlate badge anomalies with network bursts.',
    },
    debrief: {
      fullStory:
        'Sarah Chen had six years invested when Marcus elevated a newer hire to Senior II in March 2026. She buried the resentment under polished stand-ups while quietly staging an exit. Three weeks before HR received her resignation, she dropped an inbox rule that mirrored correspondence to a personal Gmail — low noise, high persistence. On May 6 she printed seventy pages of roadmap material under the cover of a late sprint review. The next evening she badged into Server Room A — outside her routine — copied compressed archives to a SanDisk labeled PERSONAL, then saturated the outbound link with a 2.3GB Dropbox session while LinkedIn recruiter tabs flickered in the background.',
      techniques: [
        {
          title: 'SERVER-SIDE MAIL FORWARDING',
          whatTheyDid:
            'Configured an automatic forward so inbound corporate mail replicated to an external inbox without touching Sent Items.',
          howItWorks:
            'Rules execute on the mailbox server. They persist across sessions and often bypass casual inbox reviews because investigators focus on outbound SMTP traces first.',
          artifacts:
            'ForwardingRule objects, mailbox audit entries, and abnormal duplicate deliveries visible to messaging admins.',
          howInvestigatorsFind:
            'Enumerate inbox rules and investigate forwards with PowerShell or admin consoles; correlate timeline with HR milestones.',
          exampleCommands: ['query email_forwarding-rules --all-users'],
          realTools:
            'Microsoft Exchange PowerShell, Magnet AXIOM, Nuix, Purview/Mailflow investigations.',
        },
        {
          title: 'USB MASS STORAGE EXFILTRATION',
          whatTheyDid:
            'Mounted personal removable media and copied staged archives from high-sensitivity shares.',
          howItWorks:
            'Windows enumerates USBSTOR devices under HKLM\\SYSTEM\\CurrentControlSet\\Enum with serials and friendly names.',
          artifacts:
            'Setupapi logs, PlugPlay events, and forensic estimates of files touched during mount intervals.',
          howInvestigatorsFind:
            'Pivot from asset tag to USB history, then overlap sessions with authentication and file-access telemetry.',
          exampleCommands: ['usbview --workstation="WS-DEV-04"'],
          realTools: 'KAPE, USB Detective, Magnet AXIOM, Velociraptor.',
        },
      ],
      keyTakeaways: [
        'Forwarding rules are stealthy because they live server-side — audit them early.',
        'Badge data grounds cloud-heavy stories in physical reality.',
        'Large HTTPS uploads plus recruiter browsing often bracket insider staging.',
      ],
      behavioralIndicators: [
        'Recent perceived promotional injustice.',
        'Resignation filed shortly after suspicious egress.',
        'Physical access outside normal scope.',
      ],
      whatToDoDifferentlyGeneric:
        'Treat HR milestones as temporal anchors — bind mailbox rules, prints, and removable media events to those anchors.',
    },
  },
  summaryKeyTerms: [
    'forward',
    'dropbox',
    'usb',
    'badge',
    'server',
    'roadmap',
    'resign',
    'promotion',
    'exfil',
    'sarah',
  ],
  employees: {
    'emp-sarah-chen': {
      id: 'emp-sarah-chen',
      avatarId: 'AVATAR_F1',
      fullName: 'Sarah Chen',
      employeeIdLabel: 'EMP-0047',
      title: 'Senior Software Engineer',
      department: 'Product Development',
      yearsAtCompany: 6,
      managerName: 'Marcus Webb',
      accessLevel: 'Level 3 (Source Code & IP vault)',
      lastBadgeIn: '2026-05-07 23:24',
      performanceSnippet:
        '★★★★☆ — Strong contributor; passed over for Senior II promotion (Q1 2026).',
      notes:
        'Submitted resignation letter May 8; last day scheduled May 22. Previously vocal about roadmap ownership.',
      workstationId: 'WS-DEV-04',
      email: 'sarah.chen@nexus-tech.internal',
      hiddenMotiveCategory: 'GRIEVANCE',
    },
    'emp-marcus-webb': {
      id: 'emp-marcus-webb',
      avatarId: 'AVATAR_M1',
      fullName: 'Marcus Webb',
      employeeIdLabel: 'EMP-0018',
      title: 'Engineering Manager',
      department: 'Product Development',
      yearsAtCompany: 11,
      managerName: 'Linda Park',
      accessLevel: 'Level 4 (Management oversight)',
      lastBadgeIn: '2026-05-07 18:02',
      performanceSnippet:
        '★★★★★ — Stabilized delivery after roadmap thrash; delegates deeply.',
      notes:
        'Authorized reviewer for roadmap decks; frequent after-hours approvals aligned with releases.',
      workstationId: 'WS-MGR-01',
      email: 'marcus.webb@nexus-tech.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-james-okafor': {
      id: 'emp-james-okafor',
      avatarId: 'AVATAR_M2',
      fullName: 'James Okafor',
      employeeIdLabel: 'EMP-0155',
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      yearsAtCompany: 4,
      managerName: 'Diana Reeves',
      accessLevel: 'Level 3 (CI/CD & secrets rotation)',
      lastBadgeIn: '2026-05-07 19:41',
      performanceSnippet:
        '★★★★☆ — Owns release automation; meticulous change records.',
      notes:
        'Maintains gold backup drives — security-approved hardware occasionally exceeds 4GB writes.',
      workstationId: 'WS-OPS-02',
      email: 'james.okafor@nexus-tech.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-linda-park': {
      id: 'emp-linda-park',
      avatarId: 'AVATAR_F2',
      fullName: 'Linda Park',
      employeeIdLabel: 'EMP-0022',
      title: 'Product Manager',
      department: 'Product',
      yearsAtCompany: 7,
      managerName: 'Executive Staff',
      accessLevel: 'Level 2 (Roadmap narrative)',
      lastBadgeIn: '2026-05-07 17:30',
      performanceSnippet:
        '★★★★★ — Aligns GTM with engineering capacity; strong communicator.',
      notes:
        'Publishes sanitized roadmap excerpts — no direct PAT vault rights.',
      workstationId: 'WS-PM-07',
      email: 'linda.park@nexus-tech.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-ryan-torres': {
      id: 'emp-ryan-torres',
      avatarId: 'AVATAR_M3',
      fullName: 'Ryan Torres',
      employeeIdLabel: 'EMP-0311',
      title: 'Junior Developer',
      department: 'Product Development',
      yearsAtCompany: 1,
      managerName: 'Marcus Webb',
      accessLevel: 'Level 1 (Feature sandbox)',
      lastBadgeIn: '2026-05-07 16:58',
      performanceSnippet:
        '★★★☆☆ — Growing engineer; exploring external learning resources.',
      notes:
        'Browses hiring portals — no elevated share access observed.',
      workstationId: 'WS-DEV-18',
      email: 'ryan.torres@nexus-tech.internal',
      hiddenMotiveCategory: 'FINANCIAL',
    },
    'emp-diana-reeves': {
      id: 'emp-diana-reeves',
      avatarId: 'AVATAR_F3',
      fullName: 'Diana Reeves',
      employeeIdLabel: 'EMP-0099',
      title: 'IT Administrator',
      department: 'Corporate IT',
      yearsAtCompany: 9,
      managerName: 'Security Steering Committee',
      accessLevel: 'Level 4 (Directory & workstation imaging)',
      lastBadgeIn: '2026-05-07 22:10',
      performanceSnippet:
        '★★★★★ — Executes controlled rollouts; cooperative with audits.',
      notes:
        'Maintains AD hygiene scripts — elevated privileges audited quarterly.',
      workstationId: 'WS-IT-03',
      email: 'diana.reeves@nexus-tech.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
  },
  evidenceItems: [
    {
      id: 'c001-forward-rule',
      source: 'email',
      category: 'EMAIL',
      title: 'Mailbox forwarding rule to personal Gmail',
      description:
        'Rule created Apr 16 2026 mirroring inbound mail to external mailbox.',
      locationHint: 'Email Server → Forwarding Rules tab',
      commandHint: 'query email_forwarding-rules --all-users',
      isKey: true,
    },
    {
      id: 'c001-usb-may7',
      source: 'usb',
      category: 'USB',
      title: 'SanDisk PERSONAL volume — 3.2GB estimate',
      description:
        'Unauthorized consumer drive mounted on WS-DEV-04 during insider window.',
      locationHint: 'USB Device History → WS-DEV-04',
      commandHint: 'usbview --workstation="WS-DEV-04"',
      isKey: true,
    },
    {
      id: 'c001-badge-server',
      source: 'badge',
      category: 'BADGE',
      title: 'After-hours Server Room A entry',
      description:
        'Physical entry inconsistent with historical workspace pattern for engineer.',
      locationHint: 'Badge / Physical Access Records',
      commandHint: 'badge_records --after-hours --all-users --date="2026-05-07"',
      isKey: true,
    },
    {
      id: 'c001-net-dropbox',
      source: 'network',
      category: 'NETWORK',
      title: '2.3GB HTTPS burst to Dropbox-owned netblock',
      description:
        'Session correlated with WS-DEV-04 DHCP lease during resignation proximity.',
      locationHint: 'Network Traffic Logs',
      commandHint: 'filter network.log --bytes-gt=500MB --date="2026-05-07"',
      isKey: true,
    },
    {
      id: 'c001-access-ipvault',
      source: 'access',
      category: 'ACCESS',
      title: 'Compressed roadmap & patent docs touched sequentially',
      description:
        'Fifteen-minute burst across IP vault paths preceding USB staging.',
      locationHint: 'Active Directory / Access Logs',
      commandHint: 'query access_logs --user="sarah.chen" --resource="IP-vault"',
      isKey: true,
    },
    {
      id: 'c001-browser-upload',
      source: 'browser',
      category: 'NETWORK',
      title: 'Browser POST to Dropbox upload endpoint',
      description:
        'Linked tabs for competitor recruiter visible in same session.',
      locationHint: 'Browser History → sarah.chen',
      commandHint: 'browser_history --downloads --user="sarah.chen"',
      isKey: true,
    },
    {
      id: 'c001-print-roadmap',
      source: 'printer',
      category: 'PRINTER',
      title: '70-page confidential roadmap print job',
      description:
        'Printer-03-FL3 logs tie job to sarah.chen credential May 6 evening.',
      locationHint: 'Printer Logs',
      commandHint: 'printer_logs --document-contains="CONFIDENTIAL" --all-users',
      isKey: true,
    },
    {
      id: 'c001-slack-vent',
      source: 'messages',
      category: 'MESSAGE',
      title: 'Slack DM — resentment toward promotion outcome',
      description:
        'Colloquial message referencing regret about promotion timing.',
      locationHint: 'Slack / Teams → DM corpus',
      commandHint: 'search_messages --keyword="regret" OR "promotion"',
      isKey: true,
    },
    {
      id: 'c001-review-promo',
      source: 'workstation',
      category: 'FILE',
      title: 'Archived HR snapshot referencing promotion denial',
      description:
        'Performance PDF recovered from manager share mirror — aligns with motive timeline.',
      locationHint: 'Case Brief / Employee profile notes',
      commandHint: 'type perf_review_snippet.txt',
      isKey: true,
    },
    {
      id: 'c001-cal-coffee',
      source: 'calendar',
      category: 'CALENDAR',
      title: 'Opaque external coffee meeting May 3',
      description:
        'No domain affiliation — aligns with staging conversations.',
      locationHint: 'Calendar Records → sarah.chen',
      commandHint: 'calendar --external-meetings --user="sarah.chen"',
      isKey: true,
    },
    {
      id: 'c001-file-exfil-notes',
      source: 'workstation',
      category: 'FILE',
      title: 'Hidden staging checklist on workstation',
      description:
        'Attrib-hidden text referencing archives and upload checklist.',
      locationHint: 'Workstation Files → WS-DEV-04 → \\Projects\\.staging',
      commandHint: 'dir /ah',
      isKey: true,
    },
    {
      id: 'c001-email-personal-attach',
      source: 'email',
      category: 'EMAIL',
      title: 'Late-night SMTP with opaque attachment naming',
      description:
        'SMTP trace shows personal-domain recipient with unusually large MIME.',
      locationHint: 'Email Server Logs → sarah.chen',
      commandHint: 'query email_logs --has-attachment --user="sarah.chen@nexus-tech.internal"',
      isKey: true,
    },
    {
      id: 'c001-prefetch-archiver',
      source: 'workstation',
      category: 'FILE',
      title: 'Prefetch — secure wipe utility execution',
      description:
        'Shows intent to disrupt residual artifacts (Hard mode narrative).',
      locationHint: 'Workstation terminal → prefetch detail',
      commandHint: 'prefetch detail SECUREWIPE.EXE',
      isKey: true,
    },
    {
      id: 'c001-wevt-unusual-logon',
      source: 'workstation',
      category: 'ACCESS',
      title: 'Security log — unusual interactive logon classification',
      description:
        'Event summary correlates with badge-in variance.',
      locationHint: 'Workstation terminal → wevtutil Security',
      commandHint: 'wevtutil qe Security /c:50 /f:text',
      isKey: true,
    },
    {
      id: 'c001-strings-binary',
      source: 'workstation',
      category: 'FILE',
      title: 'Strings hit — competitor hostname inside binary draft',
      description:
        'Carved ASCII inside suspicious DLL masquerading as log collector.',
      locationHint: 'Workstation terminal → strings',
      commandHint: 'strings .\\Tools\\LogCollector.bin',
      isKey: true,
    },
  ],
  forwardingRules: [
    {
      mailbox: 'sarah.chen@nexus-tech.internal',
      ruleName: 'Mirror_Inbound_ExternalVault',
      forwardTo: 'sarah.chen.archive@gmail.com',
      created: '2026-04-16 09:12:04',
    },
    {
      mailbox: 'marcus.webb@nexus-tech.internal',
      ruleName: 'Travel_ACK',
      forwardTo: 'marcus.webb+pager@nexus-tech.internal',
      created: '2025-11-02 14:00:00',
    },
  ],
  emails: [
    {
      id: 'e1',
      mailbox: 'sarah.chen@nexus-tech.internal',
      from: 'Marcus Webb <marcus.webb@nexus-tech.internal>',
      to: 'Sarah Chen <sarah.chen@nexus-tech.internal>',
      time: '2026-05-06 18:22:11',
      subject: 'Roadmap review tomorrow @ 09:00',
      body: 'Bring the architecture deltas — leadership wants contingency slides.',
    },
    {
      id: 'e2',
      mailbox: 'sarah.chen@nexus-tech.internal',
      from: 'Sarah Chen <sarah.chen@nexus-tech.internal>',
      to: 'Alex Rivera <alex.rivera.recruit@helixlabs.example>',
      bcc: 'sarah.chen.archive@gmail.com',
      time: '2026-05-07 23:41:02',
      subject: '(no subject)',
      body: '',
      attachments: [{ name: 'Portfolio_Redacted.pdf', size: '4.2MB' }],
      headers:
        'Received: from mail.nexus-tech.internal\r\nX-Originating-IP: 10.0.1.47\r\nDkim-Signature: [...]',
      forensicTags: ['bcc-external', 'late-night'],
    },
    {
      id: 'e3',
      mailbox: 'ryan.torres@nexus-tech.internal',
      from: 'jobs-noreply@example',
      to: 'Ryan Torres <ryan.torres@nexus-tech.internal>',
      time: '2026-05-05 12:08:44',
      subject: 'Your saved roles — weekly digest',
      body: 'Based on your interests: Frontend Engineer, Remote.',
    },
  ],
  networkLog: [
    '2026-05-07 23:14:32 TCP 10.0.1.47:52341 → 185.220.101.47:443 ESTABLISHED 2.3GB',
    '2026-05-07 23:14:33 TCP 10.0.1.47:52342 → 142.250.80.46:443 ESTABLISHED 1.2MB',
    '2026-05-07 11:02:17 UDP 10.0.1.47:53112 → 8.8.8.8:53 DNS QUERY apex-manufacturing.example 0.1KB',
    '2026-05-07 22:58:04 TCP 10.0.1.47:51902 → 162.125.248.18:443 ESTABLISHED 640MB',
    '2026-05-06 18:55:12 TCP 10.0.12.88:44102 → 10.0.5.10:445 ESTABLISHED 512KB',
  ],
  accessLog: [
    '2026-05-07 23:07:44 sarah.chen ACCESSED /share/product-roadmap/Q3-2026-Roadmap.pdf WS-DEV-04',
    '2026-05-07 23:08:01 sarah.chen ACCESSED /share/product-roadmap/Architecture-v4.pdf WS-DEV-04',
    '2026-05-07 23:08:34 sarah.chen ACCESSED /share/IP-vault/PatentPending-2026-03.docx WS-DEV-04',
    '2026-05-07 23:09:12 sarah.chen COPIED /share/IP-vault/PatentPending-2026-03.docx WS-DEV-04',
    '2026-05-06 14:11:02 marcus.webb ACCESSED /share/product-roadmap/Q3-2026-Roadmap.pdf WS-MGR-01',
    '2026-05-07 19:22:17 james.okafor ACCESSED /ops/release/README.md WS-OPS-02',
  ],
  usbLog: [
    'WORKSTATION: WS-DEV-04 USER SESSION: sarah.chen',
    'Device: SanDisk Ultra USB 3.0 Serial: 4C530001180518112440 Label: PERSONAL',
    'First: 2026-05-07 22:58:31 Last: 2026-05-07 23:22:47 Files Copied EST: 847 / 3.2GB',
    '',
    'WORKSTATION: WS-OPS-02 USER SESSION: james.okafor',
    'Device: AcmeCorp Approved Backup Key Serial: ACME-BKP-2299 Label: OPS_GOLD',
    'First: 2026-05-06 06:12:11 Last: 2026-05-06 06:45:02 Files Copied EST: 1201 / 4.0GB [APPROVED]',
  ],
  browserByUser: {
    'sarah.chen@nexus-tech.internal': [
      '2026-05-07 22:31:04 https://www.linkedin.com/in/alex-rivera-recruiter-helix/',
      '2026-05-07 22:34:52 https://www.dropbox.com/upload (POST — upload)',
      '2026-05-07 23:29:01 https://www.glassdoor.com/Reviews/HelixLabs-Reviews',
    ],
    'ryan.torres@nexus-tech.internal': [
      '2026-05-06 20:12:44 https://boards.greenhouse.io/example',
    ],
  },
  badgeLog: [
    '2026-05-07 22:47:09 ENTRY sarah.chen MAIN LOBBY (EMP-0047)',
    '2026-05-07 22:49:33 ENTRY sarah.chen FLOOR 3 ENGINEERING (EMP-0047)',
    '2026-05-07 22:51:02 ENTRY sarah.chen SERVER ROOM A (EMP-0047) ← ANOMALY',
    '2026-05-07 23:24:18 EXIT sarah.chen FLOOR 3 ENGINEERING (EMP-0047)',
    '2026-05-07 23:24:41 EXIT sarah.chen MAIN LOBBY (EMP-0047)',
  ],
  slackMessages: [
    {
      id: 's1',
      channel: '#engineering',
      user: 'marcus.webb',
      time: '2026-05-06 09:12',
      text: 'Cut RC2 tonight — freeze lifts Friday.',
    },
    {
      id: 's2',
      channel: 'DM',
      user: 'sarah.chen',
      time: '2026-05-06 21:03',
      text: 'Honestly they will regret not promoting me — I carried this roadmap.',
      forensicTags: ['vent'],
    },
    {
      id: 's3',
      channel: '#general',
      user: 'linda.park',
      time: '2026-05-07 08:00',
      text: 'Town hall moved to 3pm — exec slides embargoed.',
    },
  ],
  printerLog: [
    '2026-05-06 18:47:03 sarah.chen PRINTER-03-FL3 47 pages Document: Q3-2026-Product-Roadmap-CONFIDENTIAL.pdf',
    '2026-05-06 18:52:17 sarah.chen PRINTER-03-FL3 23 pages Document: Client-List-Enterprise-2026.xlsx',
  ],
  calendarByUser: {
    'sarah.chen@nexus-tech.internal': [
      '2026-05-03 08:30 Coffee — external contact (no domain) — LOCATION: Greyline Cafe',
      '2026-05-07 09:00 Roadmap review — Conf Room B',
    ],
    'marcus.webb@nexus-tech.internal': [
      '2026-05-07 15:00 Leadership staffing sync',
    ],
  },
  workstations: {
    'WS-DEV-04': {
      type: 'dir',
      children: {
        Projects: {
          type: 'dir',
          children: {
            '.staging': {
              type: 'dir',
              hidden: true,
              children: {
                'CHECKLIST.txt': {
                  type: 'file',
                  hidden: true,
                  content:
                    'TODO: zip roadmap + patent packet → copy to PERSONAL drive → upload vault link.',
                },
              },
            },
            FeatureX: {
              type: 'dir',
              children: {
                'README.md': {
                  type: 'file',
                  content: 'Internal scaffold — no secrets committed.',
                },
              },
            },
          },
        },
        Tools: {
          type: 'dir',
          children: {
            'LogCollector.bin': {
              type: 'file',
              content:
                '[BINARY] Embedded strings reference recruiter host recruiter.helixlabs.example',
            },
          },
        },
      },
    },
    'WS-MGR-01': {
      type: 'dir',
      children: {
        Reviews: {
          type: 'dir',
          children: {
            'Team-Q1.txt': {
              type: 'file',
              content:
                'Sarah — promotion denied Senior II; maintain retention bonus eligibility.',
            },
          },
        },
      },
    },
  },
  workstationSecurityLog: {
    'WS-DEV-04':
      'Security-Audit-4624: Interactive logon sarah.chen @ 2026-05-07 22:46:02 from WS-DEV-04 unusual classification (after-hours bundle).',
  },
  deletedRecoverable: [
    {
      name: 'ExfilCopy-Final.zip',
      workstation: 'WS-DEV-04',
      deletedAt: '2026-05-07 23:40:12',
      confidence: 78,
    },
  ],
  redHerringNotes: [
    'James Okafor mounted a 4GB approved backup key — expected for infra.',
    'Marcus Webb accessed roadmap files — legitimate managerial review.',
    'Ryan Torres browsed job boards — no elevated share touches.',
  ],
};
