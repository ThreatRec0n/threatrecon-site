import type { CaseContent } from './caseData.types';

export const CASE_003_ID = 'case-003';

export const case003Content: CaseContent = {
  definition: {
    id: CASE_003_ID,
    numberLabel: 'CASE-003',
    companyName: 'Armis Defense Solutions',
    caseType: 'IP LEAK',
    tagline: 'THE GHOST',
    descriptionOneLine:
      'Stale AD credentials move ITAR folders via DNS-shaped covert channels — uncover the ghost and its facilitator.',
    difficultyEstimateMinutes: { BEGINNER: 45, INTERMEDIATE: 75, HARD: 120 },
    guiltyEmployeeId: 'emp-colonel-riker',
    secondaryActorIds: ['emp-chen-wei'],
    correctMotive: 'IDEOLOGY',
    correctIncidentType: 'malicious',
    briefing: {
      letterheadCompany: 'Armis Defense Solutions — Security Operations',
      letterDate: 'May 10, 2026',
      classificationStamp: 'ITAR CONTROLLED',
      incidentSummary:
        'DLP sensors noted asymmetric DNS TXT payloads leaving engineering VLANs.',
      stolenOrDamaged:
        'Controlled technical papers referencing guidance firmware — slow drip exfiltration.',
      discoveryTimeline:
        'Six-month anomaly curve — spike correlates with visiting scholar program.',
      taskStatement:
        'Identify operators abusing legacy accounts and document tunnel artifacts.',
    },
    employeeIds: [
      'emp-colonel-riker',
      'emp-amanda-frost',
      'emp-paul-navarro',
      'emp-sarah-osei',
      'emp-chen-wei',
    ],
    scoringEvidenceIds: [
      'c003-dns-tunnel-pattern',
      'c003-ghost-account-logon',
      'c003-ad-disable-script-tamper',
      'c003-access-itar-share',
      'c003-vpn-geo-anomaly',
      'c003-browser-academic',
      'c003-slack-idealism',
      'c003-badge-datacenter',
      'c003-usb-clean',
      'c003-email-benign',
      'c003-net-flow-volume',
      'c003-recovery-shell',
      'c003-auth-fail-decoy',
      'c003-cal-collab',
      'c003-printer-none',
    ],
    debrief: {
      fullStory:
        'Colonel Riker preserved credentials for a departed analyst inside a shadow OU—never flagged by quarterly reviews. Chen Wei, sympathetic to Riker’s worldview, paused the automated deprovision routine during maintenance. Together they shifted firmware briefs through chunked TXT lookups tunneling to an academic resolver abroad—slow enough to evade volume thresholds until SOC retuned analytics.',
      techniques: [
        {
          title: 'DNS TUNNEL EXFILTRATION',
          whatTheyDid:
            'Encapsulated file shards inside recursive TXT queries toward attacker-controlled zones.',
          howItWorks:
            'Recursive resolvers forward chained labels that reconstruct payloads server-side.',
          artifacts:
            'High cardinality subdomains, oversized TXT bursts, timing jitter.',
          howInvestigatorsFind:
            'Entropy analytics on DNS logs + resolver reputation scoring.',
          exampleCommands: ['grep ".armislabs.example" dns.log'],
          realTools: 'Elastic SIEM, Cisco Umbrella, DNS Twist, Zeek dns.log.',
        },
      ],
      keyTakeaways: [
        'Disabled accounts should auto-expire — ghost users are classic insider pivots.',
        'DNS is as critical as HTTP for modern insider egress modeling.',
      ],
      behavioralIndicators: [
        'Ideological messaging in chat archives.',
        'Cross-functional buddy relationship between admin and veteran contractor.',
      ],
      whatToDoDifferentlyGeneric:
        'Automate joiners/movers/leavers reconciliation weekly — no manual pauses without CAB.',
    },
  },
  summaryKeyTerms: [
    'dns',
    'tunnel',
    'ghost',
    'account',
    'itar',
    'riker',
    'chen',
    'script',
    'resolver',
  ],
  employees: {
    'emp-colonel-riker': {
      id: 'emp-colonel-riker',
      avatarId: 'AVATAR_M2',
      fullName: 'Colonel James Riker (Ret.)',
      employeeIdLabel: 'CTR-1188',
      title: 'IT Systems Administrator (Contractor)',
      department: 'Enterprise IT',
      yearsAtCompany: 3,
      managerName: 'Program Security Officer',
      accessLevel: 'Level 4 (AD & imaging)',
      lastBadgeIn: '2026-05-07 20:15',
      performanceSnippet:
        '★★★★☆ — Trusted elder statesman for classified VLAN migrations.',
      notes:
        'Voiced skepticism about classification breadth in town halls.',
      workstationId: 'WS-AD-GHOST',
      email: 'james.riker@armis-def.internal',
      hiddenMotiveCategory: 'IDEOLOGY',
    },
    'emp-amanda-frost': {
      id: 'emp-amanda-frost',
      avatarId: 'AVATAR_F1',
      fullName: 'Dr. Amanda Frost',
      employeeIdLabel: 'EMP-4421',
      title: 'Chief Scientist',
      department: 'Research',
      yearsAtCompany: 9,
      managerName: 'CTO',
      accessLevel: 'Level 5',
      lastBadgeIn: '2026-05-07 18:02',
      performanceSnippet: '★★★★★ — Patent portfolio anchor.',
      notes: 'Advocates conservative data residency.',
      workstationId: 'WS-RND-01',
      email: 'amanda.frost@armis-def.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-paul-navarro': {
      id: 'emp-paul-navarro',
      avatarId: 'AVATAR_M4',
      fullName: 'Lt. Cmdr. Paul Navarro',
      employeeIdLabel: 'EMP-5512',
      title: 'Program Manager',
      department: 'Programs',
      yearsAtCompany: 7,
      managerName: 'Dr. Amanda Frost',
      accessLevel: 'Level 3',
      lastBadgeIn: '2026-05-07 17:40',
      performanceSnippet: '★★★★☆ — Runs milestone boards tightly.',
      notes: 'No abnormal DNS originating hosts tied to PMO VLAN.',
      workstationId: 'WS-PMO-03',
      email: 'paul.navarro@armis-def.internal',
      hiddenMotiveCategory: 'GRIEVANCE',
    },
    'emp-sarah-osei': {
      id: 'emp-sarah-osei',
      avatarId: 'AVATAR_F4',
      fullName: 'Sarah Osei',
      employeeIdLabel: 'EMP-6021',
      title: 'Security Officer',
      department: 'Security',
      yearsAtCompany: 6,
      managerName: 'CSO',
      accessLevel: 'Level 4',
      lastBadgeIn: '2026-05-07 19:22',
      performanceSnippet: '★★★★★ — Runs insider tabletop exercises.',
      notes: 'Escalated DNS entropy alerts — cooperative.',
      workstationId: 'WS-SEC-02',
      email: 'sarah.osei@armis-def.internal',
      hiddenMotiveCategory: 'OPPORTUNITY',
    },
    'emp-chen-wei': {
      id: 'emp-chen-wei',
      avatarId: 'AVATAR_F3',
      fullName: 'Chen Wei',
      employeeIdLabel: 'EMP-7710',
      title: 'Systems Engineer',
      department: 'Infrastructure',
      yearsAtCompany: 5,
      managerName: 'Colonel Riker (matrix)',
      accessLevel: 'Level 4',
      lastBadgeIn: '2026-05-07 21:05',
      performanceSnippet: '★★★★☆ — Writes maintenance automation.',
      notes:
        'Maintained deprovision script — maintenance windows overlap anomalies.',
      workstationId: 'WS-INFRA-07',
      email: 'chen.wei@armis-def.internal',
      hiddenMotiveCategory: 'IDEOLOGY',
    },
  },
  evidenceItems: [
    {
      id: 'c003-dns-tunnel-pattern',
      source: 'network',
      category: 'NETWORK',
      title: 'High-cardinality TXT bursts toward *.researchrelay.edu',
      description:
        'Encoded shards consistent with covert channel tooling.',
      locationHint: 'Network → DNS analytics export',
      commandHint: 'grep "TXT" dns.log',
      isKey: true,
    },
    {
      id: 'c003-ghost-account-logon',
      source: 'access',
      category: 'ACCESS',
      title: 'Stale SAM account jmelville authenticating nightly',
      description:
        'User departed 8 months ago — never disabled.',
      locationHint: 'Access / AD audit',
      commandHint: 'query access_logs --resource="itar-guidance"',
      isKey: true,
    },
    {
      id: 'c003-ad-disable-script-tamper',
      source: 'workstation',
      category: 'ACCESS',
      title: 'GPO maintenance pause correlates with weekend spikes',
      description:
        'Chen Wei change record references disable-job freeze.',
      locationHint: 'WS-INFRA-07 change logs',
      commandHint: 'type Changes\\disable-job.log',
      isKey: true,
    },
    {
      id: 'c003-access-itar-share',
      source: 'access',
      category: 'ACCESS',
      title: 'ITAR share touches from contractor VLAN',
      description:
        'Riker Kerberos tickets reused through jump box.',
      locationHint: 'Access Logs',
      commandHint: 'query concurrent_sessions --all-users',
      isKey: true,
    },
    {
      id: 'c003-vpn-geo-anomaly',
      source: 'network',
      category: 'NETWORK',
      title: 'VPN exit inconsistent with claimed travel',
      description:
        'GeoIP mismatched against badge presence.',
      locationHint: 'Network Logs',
      commandHint: 'curl -I resolver-ip-placeholder',
      isKey: true,
    },
    {
      id: 'c003-browser-academic',
      source: 'browser',
      category: 'NETWORK',
      title: 'Tor-browser download then purge attempts',
      description:
        'Prefetch artifacts recovered.',
      locationHint: 'Browser History',
      commandHint: 'browser_history --downloads --user="james.riker"',
      isKey: true,
    },
    {
      id: 'c003-slack-idealism',
      source: 'messages',
      category: 'MESSAGE',
      title: 'Channel critique of “overclassification industry”',
      description:
        'Thread participants include Riker + Wei.',
      locationHint: '#engineering',
      commandHint: 'search_messages --keyword="classification"',
      isKey: true,
    },
    {
      id: 'c003-badge-datacenter',
      source: 'badge',
      category: 'BADGE',
      title: 'Late-night datacenter presence — Riker',
      description:
        'Pairs with DNS bursts.',
      locationHint: 'Badge Records',
      commandHint: 'badge_records --location="datacenter"',
      isKey: true,
    },
    {
      id: 'c003-usb-clean',
      source: 'usb',
      category: 'USB',
      title: 'USB history sterile on implicated hosts',
      description:
        'Supports logical-only exfil theory.',
      locationHint: 'USB History',
      commandHint: 'usbview --all-workstations',
      isKey: true,
    },
    {
      id: 'c003-email-benign',
      source: 'email',
      category: 'EMAIL',
      title: 'SMTP nominal — no attachment anomalies',
      description:
        'Rules out classic mail export for this actor set.',
      locationHint: 'Email Logs',
      commandHint: 'query email_logs --external-only --user="james.riker"',
      isKey: true,
    },
    {
      id: 'c003-net-flow-volume',
      source: 'network',
      category: 'NETWORK',
      title: 'NetFlow micro bursts — 600KB/min averages',
      description:
        'Below threshold until sigma retune.',
      locationHint: 'Network Logs',
      commandHint: 'awk sample aggregation',
      isKey: true,
    },
    {
      id: 'c003-recovery-shell',
      source: 'recovery',
      category: 'FILE',
      title: 'Recovered bash history fragment',
      description:
        'References dns tunnel encoder binary.',
      locationHint: 'Deleted recovery',
      commandHint: 'recover --workstation="WS-AD-GHOST" --deleted',
      isKey: true,
    },
    {
      id: 'c003-auth-fail-decoy',
      source: 'access',
      category: 'ACCESS',
      title: 'Synthetic lockouts on unrelated interns',
      description:
        'Noise campaign masking ghost authentications.',
      locationHint: 'Failed logins report',
      commandHint: 'query failed_logins --all-users',
      isKey: true,
    },
    {
      id: 'c003-cal-collab',
      source: 'calendar',
      category: 'CALENDAR',
      title: 'Calendar invite to visiting scholar resolver domain',
      description:
        'Academic partnership veneer.',
      locationHint: 'Calendar → Riker',
      commandHint: 'calendar --external-meetings --user="james.riker"',
      isKey: true,
    },
    {
      id: 'c003-printer-none',
      source: 'printer',
      category: 'PRINTER',
      title: 'Printer telemetry negative',
      description:
        'Confirms immaterial paper trail.',
      locationHint: 'Printer Logs',
      commandHint: 'printer_logs --user="james.riker"',
      isKey: true,
    },
  ],
  forwardingRules: [],
  emails: [
    {
      id: 'a1',
      mailbox: 'amanda.frost@armis-def.internal',
      from: 'SOC',
      to: 'Leadership',
      time: '2026-05-08 07:00',
      subject: 'DNS entropy tuning deployed',
      body: 'Sigma increased — watch false positives.',
    },
  ],
  networkLog: [
    '2026-05-07 23:41:02 DNS 10.7.3.12 → 8.8.8.8 TXT chunk armis-guidance-0049.researchrelay.edu',
    '2026-05-07 23:41:03 DNS 10.7.3.12 → 8.8.8.8 TXT chunk armis-guidance-0050.researchrelay.edu',
    '2026-05-07 23:41:05 TCP 10.7.3.12:55440 → 203.0.113.50:443 ESTABLISHED 620KB',
  ],
  accessLog: [
    '2026-05-07 21:02:11 jmelville ACCESSED /share/itar/FirmwareGuidance-v3.pdf WS-JUMP-02',
    '2026-05-07 21:03:44 jmelville ACCESSED /share/itar/FirmwareGuidance-v3.pdf WS-JUMP-02',
    '2026-05-07 21:05:01 james.riker SU-context maintenance WS-AD-GHOST',
    '2026-05-07 21:06:11 chen.wei MODIFIED /scripts/DisableStaleAccounts.ps1 WS-INFRA-07',
  ],
  usbLog: ['NO USB RED FLAGS — LOGICAL PATH ONLY'],
  browserByUser: {
    'james.riker@armis-def.internal': [
      '2026-05-06 22:11:08 https://www.torproject.org/download/',
    ],
  },
  badgeLog: [
    '2026-05-07 21:10 ENTRY james.riker DATACENTER-EAST',
    '2026-05-07 23:50 EXIT james.riker DATACENTER-EAST',
  ],
  slackMessages: [
    {
      id: 'z1',
      channel: '#engineering',
      user: 'james.riker',
      time: '2026-04-12 14:02',
      text: 'Some of this stuff shouldn’t live behind eternal secrecy — academia needs baselines.',
      forensicTags: ['ideology'],
    },
    {
      id: 'z2',
      channel: '#engineering',
      user: 'chen.wei',
      time: '2026-04-12 14:05',
      text: 'Agree — but tread carefully with export regs.',
      forensicTags: ['ideology'],
    },
  ],
  printerLog: [],
  calendarByUser: {
    'james.riker@armis-def.internal': [
      '2026-05-04 16:00 Visiting Scholar Sync — researchrelay.edu bridge',
    ],
  },
  workstations: {
    'WS-INFRA-07': {
      type: 'dir',
      children: {
        Changes: {
          type: 'dir',
          children: {
            'disable-job.log': {
              type: 'file',
              content:
                '2026-05-07 21:05 Maintenance pause applied — approved by JR — rollback pending.',
            },
          },
        },
      },
    },
    'WS-AD-GHOST': {
      type: 'dir',
      children: {
        Tools: {
          type: 'dir',
          children: {
            'tunnel-encoder': {
              type: 'file',
              content: '[BINARY — strings hint dns_chunk_encoder]',
            },
          },
        },
      },
    },
  },
  workstationSecurityLog: {
    'WS-AD-GHOST':
      'Privileged group modification — temporary nested membership for svc_imaging.',
  },
  deletedRecoverable: [
    {
      name: '.bash_history',
      workstation: 'WS-AD-GHOST',
      deletedAt: '2026-05-07 23:59:01',
      confidence: 71,
    },
  ],
};
