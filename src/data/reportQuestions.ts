import type { CaseDefinition } from '../types/case.types'
import { mulberry32 } from '../utils/seededRandom'

export interface ReportQuestion {
  id: string
  category:
    | 'initial_access'
    | 'threat_actor'
    | 'malware'
    | 'c2'
    | 'persistence'
    | 'technique'
    | 'victim'
    | 'containment'
    | 'lateral_movement'
    | 'exfil'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  mitreTag?: string
  hint: string
  pointValue: number
}

export interface CaseQuestions {
  caseId: string
  questions: ReportQuestion[]
}

export const CASE_QUESTION_BANK: Record<string, CaseQuestions> = {
  'ALPHA-01': {
    caseId: 'ALPHA-01',
    questions: [
      {
        id: 'a-q1',
        category: 'initial_access',
        question: 'How did PHANTOM UNIT gain initial access to WORKSTATION-14?',
        options: [
          'Kerberoasting the Epic EMR service account from an unmanaged jump host',
          'Spearphishing attachment opened by billing staff (T1566.002)',
          'Macro-enabled invoice lure executed by the billing operator (T1566.001)',
          'Exploit chain against an unpatched Epic Hyperspace SSO gateway',
        ],
        correctIndex: 2,
        explanation:
          'Initial access was phishing with a weaponized healthcare billing attachment consistent with T1566.001 — matching the debrief macro execution narrative.',
        mitreTag: 'T1566.001',
        hint: 'Read the SIEM alert banner and debrief “Macro execution” entry — they tie to email-delivered code.',
        pointValue: 2,
      },
      {
        id: 'a-q2',
        category: 'threat_actor',
        question: 'Which tracked threat group is attributed to this intrusion?',
        options: ['GHOST COLLECTIVE', 'IRON MOLE', 'VOID BROKER', 'PHANTOM UNIT'],
        correctIndex: 3,
        explanation: 'Preset ALPHA-01 attributes activity to PHANTOM UNIT per case intelligence.',
        hint: 'Evidence Locker header lists actor attribution beside the opening alert.',
        pointValue: 2,
      },
      {
        id: 'a-q3',
        category: 'malware',
        question: 'Which process image is executing the injected DNS-capable payload?',
        options: ['powershell.exe child of mmc.exe', 'health_invoice.exe on disk only', 'dllhost.exe hosting Epic DLLs', 'svchost.exe with anomalous networking'],
        correctIndex: 3,
        explanation:
          'Malicious telemetry highlights svchost.exe (PID 5520) with suspicious modules while beaconing TCP/53 toward the foreign resolver.',
        mitreTag: 'T1055',
        hint: 'Process Monitor flags an elevated SYSTEM svchost session tied to the malicious connection.',
        pointValue: 2,
      },
      {
        id: 'a-q4',
        category: 'c2',
        question: 'What resolver / tunnel endpoint anchors the long-lived DNS channel?',
        options: ['93.184.216.34:53', '45.33.32.156:53', '185.220.101.47:4444', '203.0.113.44:0'],
        correctIndex: 1,
        explanation: 'Network artifacts show established TCP/53 toward 45.33.32.156 masquerading as DNS tunnel egress.',
        mitreTag: 'T1071.004',
        hint: 'Review Network Monitor foreign endpoint plus the alpha-dns artifact path.',
        pointValue: 2,
      },
      {
        id: 'a-q5',
        category: 'persistence',
        question: 'Where is Run-key persistence planted for the Epic-themed helper?',
        options: [
          'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\EpicHyperspace.exe',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\EpicHelper',
          'HKLM\\SYSTEM\\CurrentControlSet\\Services\\BITS\\Parameters',
          'HKCU\\Software\\Classes\\.pdf\\shell\\open\\command',
        ],
        correctIndex: 1,
        explanation:
          'Registry persistence lands under HKCU Run value EpicHelper pointing at the staged invoice binary.',
        mitreTag: 'T1547.001',
        hint: 'Registry Editor highlights Run keys — EpicHelper is explicitly enumerated in artifacts.',
        pointValue: 2,
      },
      {
        id: 'a-q6',
        category: 'technique',
        question: 'Which MITRE ATT&CK technique ID maps to the documented phishing lure?',
        options: [
          'MITRE T1486 — Data Encrypted for Impact',
          'MITRE T1195 — Supply Chain Compromise',
          'MITRE T1566.001 — Phishing: Spearphishing Attachment',
          'MITRE T1218 — Signed Binary Proxy Execution',
        ],
        correctIndex: 2,
        explanation: 'The documented entry vector maps directly to T1566.001 within the attack chain.',
        mitreTag: 'T1566.001',
        hint: 'Mission briefing lists MITRE IDs beside the actor dossier.',
        pointValue: 2,
      },
      {
        id: 'a-q7',
        category: 'victim',
        question: 'Which interactive account executed the phishing lure?',
        options: ['svc_backup', 'DOMAIN\\helpdesk', 'cleared.user', 'billing01'],
        correctIndex: 3,
        explanation: 'billing01 is the compromised Epic billing specialist tied to WORKSTATION-14.',
        hint: 'Opening SIEM alert lists Subject / Session user context.',
        pointValue: 2,
      },
      {
        id: 'a-q8',
        category: 'exfil',
        question: 'How is data egress staged relative to DNS tunneling?',
        options: [
          'BITS jobs uploading PHI ZIPs directly to tor endpoints',
          'Transparent HTTP POST exfil over tcp/8080 without staging',
          'Credential stuffing against cloud SSO without local staging',
          'Compressed archives staged locally before segmented DNS queries',
        ],
        correctIndex: 3,
        explanation:
          'Dwell narrative describes invoice staging followed by DNS tunnel exfil consistent with collection then C2 channel abuse.',
        mitreTag: 'T1071.004',
        hint: 'Artifacts pair staged healthcare trojans with DNS IOC labels.',
        pointValue: 2,
      },
      {
        id: 'a-q9',
        category: 'containment',
        question: 'What is the best immediate containment step while preserving forensic volatility?',
        options: [
          'Image memory, isolate host at switch ACL, snapshot resolver IOCs',
          'Immediately delete HKCU Run keys without logging exports',
          'Re-image workstation before capturing volatile artifacts',
          'Disable all DNS globally across the enterprise WAN',
        ],
        correctIndex: 0,
        explanation:
          'Containment balances isolation with preservation — snapshot volatile evidence before eradication.',
        mitreTag: 'M1048',
        hint: 'OPERATIVE doctrine emphasizes evidence-first isolation per playbook.',
        pointValue: 2,
      },
      {
        id: 'a-q10',
        category: 'technique',
        question: 'Which Event ID marks malicious process creation audited for this foothold?',
        options: ['4688 — new process created', '7045 — service installed', '4624 — successful logon', '4776 — credential validation'],
        correctIndex: 0,
        explanation:
          '4688 records process creation and is the canonical suspicious execution audit used alongside 4698 task creation.',
        mitreTag: 'T1204',
        hint: 'Filter Security log for malicious rows flagged in Event Viewer risk tiers.',
        pointValue: 2,
      },
    ],
  },

  'BRAVO-02': {
    caseId: 'BRAVO-02',
    questions: [
      {
        id: 'b-q1',
        category: 'initial_access',
        question: 'Which vector introduced CRIMSON SPIDER onto TRADING-WS-07?',
        options: [
          'VPN-less RDP exposure answering brute-force chatter (T1133)',
          'Malicious ISO mounted from Teams chat',
          'USB worm propagation via trading floor kiosk',
          'Zero-click Outlook exploit chain',
        ],
        correctIndex: 0,
        explanation:
          'BRAVO maps entry to External Remote Services / RDP misuse consistent with T1133 as documented in the scenario brief.',
        mitreTag: 'T1133',
        hint: 'Debrief references Type 10 logon anomalies tied to interactive remote access.',
        pointValue: 2,
      },
      {
        id: 'b-q2',
        category: 'threat_actor',
        question: 'Identify the adversary handling interactive tradecraft on this workstation.',
        options: ['STATIC ECHO', 'CRIMSON SPIDER', 'PHANTOM UNIT', 'IRON MOLE'],
        correctIndex: 1,
        explanation: 'Threat intelligence tags CRIMSON SPIDER for financially motivated interactive ops.',
        hint: 'Evidence Locker actor field mirrors OSINT codename.',
        pointValue: 2,
      },
      {
        id: 'b-q3',
        category: 'malware',
        question: 'Which remote-session process is executing encoded CRIMSON tooling?',
        options: ['cmd.exe running schtasks /delete', 'winword.exe spawning mshta', 'powershell.exe with hidden window flags', 'explorer.exe hosting WMI providers'],
        correctIndex: 2,
        explanation:
          'Telemetry highlights powershell.exe PID 4832 with hidden/no-profile invocation tied to C2 socket.',
        mitreTag: 'T1059.001',
        hint: 'Process Monitor lists suspicious PowerShell under RDP-Tcp session.',
        pointValue: 2,
      },
      {
        id: 'b-q4',
        category: 'c2',
        question: 'Which endpoint anchors the interactive reverse channel?',
        options: ['45.33.32.156:53', '203.0.113.44:0', '185.220.101.47:4444', '13.107.6.158:443'],
        correctIndex: 2,
        explanation: 'SIEM + Network Monitor agree on TCP/4444 toward 185.220.101.47.',
        mitreTag: 'T1048.003',
        hint: 'Review foreign socket pairing on suspicious rows inside Network Monitor.',
        pointValue: 2,
      },
      {
        id: 'b-q5',
        category: 'persistence',
        question: 'Where does CRIMSON SPIDER hide recurring execution?',
        options: [
          'HKCU Run key referencing EpicHelper',
          'WMI Event Consumer named SCMLogger',
          '\\Microsoft\\Windows\\UpdateOrchestrator\\Schedule Scan Static Task',
          'Print monitor DLL under spoolsv',
        ],
        correctIndex: 2,
        explanation:
          'Masqueraded scheduled task under UpdateOrchestrator maintains encrypted PowerShell payload.',
        mitreTag: 'T1053.005',
        hint: 'Task Scheduler shows suspicious Microsoft-themed jobs — compare artifact labels.',
        pointValue: 2,
      },
      {
        id: 'b-q6',
        category: 'technique',
        question: 'Which MITRE ATT&CK identifier aligns with hostile Remote Desktop exposure?',
        options: ['T1566.001 — Spearphishing Attachment', 'T1133 — External Remote Services', 'T1195 — Supply Chain Compromise', 'T1055 — Process Injection'],
        correctIndex: 1,
        explanation: 'Attack chain begins with hostile RDP leverage aligning to T1133.',
        mitreTag: 'T1133',
        hint: 'Mission MITRE strip lists entry technique before execution tactics.',
        pointValue: 2,
      },
      {
        id: 'b-q7',
        category: 'victim',
        question: 'Which account owns the compromised trading operator session?',
        options: ['svc_quant', 'local_admin_legacy', 'opsdesk', 'mesoperator'],
        correctIndex: 2,
        explanation: 'opsdesk is the enabled console user tied to malicious PowerShell.',
        hint: 'Initial alert user metadata references opsdesk.',
        pointValue: 2,
      },
      {
        id: 'b-q8',
        category: 'exfil',
        question: 'Describe the observed outbound collection pattern.',
        options: [
          'SMB pipes to domain controllers only — no internet egress',
          'Interactive reverse shell exfil over TCP/4444 with trader-context access',
          'Passive DNS cache poisoning without payload egress',
          'BITS uploads strictly to Azure Blob without shells',
        ],
        correctIndex: 1,
        explanation:
          'Artifacts label interactive RDP-driven C2 aligning with exfil technique T1048.003 style interactive channels.',
        mitreTag: 'T1048.003',
        hint: 'Evidence Locker network artifact references interactive channels.',
        pointValue: 2,
      },
      {
        id: 'b-q9',
        category: 'containment',
        question: 'Choose the highest-value immediate response step.',
        options: [
          'Leave RDP exposed while analysts finish reporting',
          'Disable compromised credential + enforce MFA / VPN-only RDP plus block C2 egress',
          'Delete scheduled tasks silently without documenting hashes',
          'Reboot workstation repeatedly to flush malware only',
        ],
        correctIndex: 1,
        explanation:
          'Credential containment + network chokepoints mirror recommended BRAVO hardening checklist entries.',
        hint: 'Firewall banner stresses blocking enumerated C2 prefix.',
        pointValue: 2,
      },
      {
        id: 'b-q10',
        category: 'technique',
        question: 'Which Event ID highlights creation of the malicious scheduled job?',
        options: ['4688 — process creation', '4698 — scheduled task created', '4720 — user account created', '7045 — service install'],
        correctIndex: 1,
        explanation:
          '4698 fires when a scheduled task object is registered — critical for CRIMSON persistence hunting.',
        hint: 'Baseline hints on recruit difficulty explicitly call out Event ID 4698.',
        pointValue: 2,
      },
    ],
  },

  'CHARLIE-03': {
    caseId: 'CHARLIE-03',
    questions: [
      {
        id: 'c-q1',
        category: 'initial_access',
        question: 'How did IRON MOLE begin collecting sensitive engineering documents?',
        options: [
          'Valid insider misuse of cleared credentials (T1078)',
          'Drive-by compromise via weaponized CAD plugin',
          'RDP lateral movement from SOC jump box',
          'Supply-chain trojan inside CAD vendor MSI',
        ],
        correctIndex: 0,
        explanation:
          'CHARLIE models insider threat leveraging legitimate accounts rather than external exploitation.',
        mitreTag: 'T1078',
        hint: 'Attack chain begins with Valid Accounts before archive staging.',
        pointValue: 2,
      },
      {
        id: 'c-q2',
        category: 'threat_actor',
        question: 'Which group specializes in trusted insider collection tradecraft here?',
        options: ['VOID BROKER', 'IRON MOLE', 'CRIMSON SPIDER', 'STATIC ECHO'],
        correctIndex: 1,
        explanation: 'IRON MOLE handles insider-focused collections against defense industrial targets.',
        hint: 'Evidence Locker actor tag references IRON MOLE.',
        pointValue: 2,
      },
      {
        id: 'c-q3',
        category: 'malware',
        question: 'Which binary is compressing CUI from the engineering share?',
        options: ['tar.exe spawned by sshd', 'rar.exe with SYSTEM privileges', '7z.exe archiving D:\\Share\\CUI', 'makecab.exe inside WinSxS'],
        correctIndex: 2,
        explanation:
          'Telemetry captures 7z.exe command line targeting staging.zip under Documents.',
        mitreTag: 'T1560.001',
        hint: 'Process Monitor highlights 7z.exe with suspicious archive arguments.',
        pointValue: 2,
      },
      {
        id: 'c-q4',
        category: 'c2',
        question: 'Which channel carries staged archives toward external storage?',
        options: [
          'Tor hidden service over tcp/9001',
          'SMB beacon to 185.220.101.47',
          'HTTPS session toward onedrive.live.com',
          'ICMP tunnel to 203.0.113.44',
        ],
        correctIndex: 2,
        explanation:
          'Network Monitor documents encrypted browser egress matching cloud staging consistent with insider misuse of Edge.',
        mitreTag: 'T1567.002',
        hint: 'Inspect flagged outbound TLS rows referencing consumer cloud sync endpoints.',
        pointValue: 2,
      },
      {
        id: 'c-q5',
        category: 'persistence',
        question: 'Where does auxiliary persistence reference msupdate.exe per baseline drift?',
        options: [
          'HKCU RunOnce\\ExplorerBrowserHelper',
          'Password filter DLL under lsass',
          'Baseline scheduled task \\WindowsUpdateHelper firing Roaming\\msupdate.exe',
          'Print monitor DLL chain',
        ],
        correctIndex: 2,
        explanation:
          'Baseline Task Scheduler injects a suspicious daily task executing msupdate.exe from Roaming — correlate with FILE staging IOC.',
        mitreTag: 'T1053.005',
        hint: 'Cross-check Task Scheduler baseline suspicious tasks with Roaming folder artifacts.',
        pointValue: 2,
      },
      {
        id: 'c-q6',
        category: 'technique',
        question: 'Which MITRE ATT&CK identifier captures insider misuse of legitimate accounts?',
        options: ['T1566.001 — Spearphishing Attachment', 'T1195 — Supply Chain Compromise', 'T1078 — Valid Accounts', 'T1133 — External Remote Services'],
        correctIndex: 2,
        explanation: 'CHARLIE anchors on abuse of valid insider accounts—MITRE T1078.',
        mitreTag: 'T1078',
        hint: 'MITRE strip at top of locker references Valid Accounts before archive tactics.',
        pointValue: 2,
      },
      {
        id: 'c-q7',
        category: 'victim',
        question: 'Which cleared account owns the archive staging activity?',
        options: ['svc_contractor', 'DOMAIN\\standard.user', 'mesoperator', 'cleared.user'],
        correctIndex: 3,
        explanation: 'cleared.user is the insider principal tied to staging telemetry.',
        hint: 'SIEM alert lists user context cleared.user on ENG-WS-31.',
        pointValue: 2,
      },
      {
        id: 'c-q8',
        category: 'exfil',
        question: 'Which technique best describes movement of the ZIP archive off-host?',
        options: [
          'Exfiltration Over Physical Medium — USB only',
          'Exfiltration Over Web Service — consumer cloud upload path',
          'Data Transfer Size Limits via ICMP beaconing',
          'Automated FTP batch scripts to tor exits',
        ],
        correctIndex: 1,
        explanation:
          'Scenario aligns with abuse of web/cloud channels consistent with T1567-style insider misuse.',
        mitreTag: 'T1567.002',
        hint: 'MITRE exfiltration IDs appear in attack chain tail.',
        pointValue: 2,
      },
      {
        id: 'c-q9',
        category: 'containment',
        question: 'Pick the best immediate containment action for insider staging.',
        options: [
          'Ignore DLP alerts until weekly governance forum',
          'Disable insider account, isolate workstation, preserve archive hash chain, notify security',
          'Delete staging.zip silently',
          'Grant broader Share permissions to speed investigation',
        ],
        correctIndex: 1,
        explanation:
          'Contain insider misuse by suspending credentials while preserving forensic artifacts for legal review.',
        hint: 'Correct eradication ordering stresses archive containment before disabling accounts.',
        pointValue: 2,
      },
      {
        id: 'c-q10',
        category: 'technique',
        question: 'Which Event ID proves scheduled task tampering tied to msupdate staging?',
        options: ['7045 — service installed', '4698 — scheduled task created', '4688 — process creation', '5145 — network share accessed'],
        correctIndex: 1,
        explanation:
          '4698 surfaces malicious task registration events—the same baseline signal referenced for insider drift.',
        hint: 'Baseline SIEM snippets mention Task creation telemetry.',
        pointValue: 2,
      },
    ],
  },

  'DELTA-04': {
    caseId: 'DELTA-04',
    questions: [
      {
        id: 'd-q1',
        category: 'initial_access',
        question: 'How did VOID BROKER poison the FerroVendor OT agent?',
        options: [
          'Malicious Windows Update hijack via WSUS MITM',
          'Compromise of upstream vendor update channel / trusted binary (T1195.002)',
          'Macro phishing targeting mesoperator mailbox',
          'Stolen VPN token reused from contractor laptop',
        ],
        correctIndex: 1,
        explanation:
          'DELTA centers on trojanized vendor update mechanics aligning with Supply Chain Compromise T1195.002.',
        mitreTag: 'T1195.002',
        hint: 'Debrief explicitly references update trojan narrative.',
        pointValue: 2,
      },
      {
        id: 'd-q2',
        category: 'threat_actor',
        question: 'Which financially motivated broker handles OT adjacent compromises?',
        options: ['IRON MOLE', 'GHOST COLLECTIVE', 'VOID BROKER', 'STATIC ECHO'],
        correctIndex: 2,
        explanation: 'VOID BROKER specializes in financially motivated vendor-facing intrusions.',
        hint: 'Evidence Locker actor banner lists VOID BROKER.',
        pointValue: 2,
      },
      {
        id: 'd-q3',
        category: 'malware',
        question: 'Which signed-but-abused binary executes from Program Files?',
        options: ['svchost.exe loading Print Spooler DLLs', 'mmc.exe hosting FerroVendor MMC snap-in', 'svc_core.exe from FerroVendor Agent path', 'dllhost.exe running COM+ telemetry'],
        correctIndex: 2,
        explanation:
          'Malicious telemetry highlights svc_core.exe with suspicious DLL loads outside vendor baseline.',
        mitreTag: 'T1574.002',
        hint: 'Process Monitor pins anomalies on svc_core.exe path.',
        pointValue: 2,
      },
      {
        id: 'd-q4',
        category: 'c2',
        question: 'Which transient foreign endpoint correlates with ICMP surge telemetry?',
        options: ['93.184.216.34', '45.33.32.156', '203.0.113.44', '185.220.101.47'],
        correctIndex: 2,
        explanation:
          'Network artifacts capture TIME_WAIT chatter toward documentation prefix 203.0.113.44 correlating with beacon wash.',
        mitreTag: 'T1048.003',
        hint: 'Inspect suspicious rows where foreign IP differs from internal RFC1918 peers.',
        pointValue: 2,
      },
      {
        id: 'd-q5',
        category: 'persistence',
        question: 'Where is service-based persistence registered for the vendor agent?',
        options: [
          'HKCU\\Environment\\FERRO_AGENT_PATH',
          'HKLM\\SYSTEM\\CurrentControlSet\\Services\\FerroVendorAgent',
          'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Shell',
          'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\EpicHelper',
        ],
        correctIndex: 1,
        explanation:
          'Registry reflects ImagePath persistence for FerroVendorAgent Windows service pointing at svc_core.exe.',
        mitreTag: 'T1543.003',
        hint: 'Registry Editor enumerates vendor service keys under HKLM Services hive.',
        pointValue: 2,
      },
      {
        id: 'd-q6',
        category: 'technique',
        question: 'Which MITRE ATT&CK identifier reflects compromised upstream vendor updates?',
        options: ['T1133 — External Remote Services', 'T1195.002 — Supply Chain Compromise', 'T1566.001 — Spearphishing Attachment', 'T1078 — Valid Accounts'],
        correctIndex: 1,
        explanation: 'Primary documented technique is vendor compromise / trojanized updates.',
        mitreTag: 'T1195.002',
        hint: 'Mission MITRE overlay begins with supply-chain tactic identifiers.',
        pointValue: 2,
      },
      {
        id: 'd-q7',
        category: 'victim',
        question: 'Which operator account is tied to MES-EDGE-02 telemetry?',
        options: ['billing01', 'opsdesk', 'mesoperator', 'cleared.user'],
        correctIndex: 2,
        explanation: 'mesoperator is the OT bridge workstation interactive account.',
        hint: 'Initial alert metadata references mesoperator.',
        pointValue: 2,
      },
      {
        id: 'd-q8',
        category: 'exfil',
        question: 'Which pattern matches VOID BROKER collection from the compromised agent?',
        options: [
          'Kerberos ticket forging via unconstrained delegation',
          'Encrypted HTTPS uploads solely to Azure CDN edges without ICMP side channels',
          'Exfiltration channel blending ICMP anomalies with TCP beaconing toward foreign TEST-NET space',
          'Exclusive SMB replication to domain controllers',
        ],
        correctIndex: 2,
        explanation:
          'Scenario blends unusual ICMP bursts with foreign socket telemetry indicative of layered exfil staging.',
        mitreTag: 'T1048.003',
        hint: 'Initial SIEM alert mentions ICMP bursts while Network Monitor shows odd foreign sockets.',
        pointValue: 2,
      },
      {
        id: 'd-q9',
        category: 'containment',
        question: 'Select the best immediate containment priority.',
        options: [
          'Pause patching windows indefinitely',
          'Stop compromised vendor service, block foreign egress, snapshot binaries, notify vendor CSIRT',
          'Grant vendor agent SYSTEM on additional hosts',
          'Disable firewall logging to reduce noise',
        ],
        correctIndex: 1,
        explanation:
          'Containment isolates trojanized agent paths while enabling coordinated disclosure.',
        hint: 'Hardening checklist stresses vendor-signed patch bundles after containment.',
        pointValue: 2,
      },
      {
        id: 'd-q10',
        category: 'technique',
        question: 'Which Event ID helps prove malicious process creation from svchost descendancy?',
        options: ['4776 — credential validation', '7045 — service installed', '4688 — new process created', '5142 — network share added'],
        correctIndex: 2,
        explanation:
          '4688 remains the canonical audit for unexpected child processes spawned from trusted parents.',
        mitreTag: 'T1204',
        hint: 'Review flagged malicious rows inside Security log via Event Viewer.',
        pointValue: 2,
      },
    ],
  },
}

export function caseQuizKey(caseDef: CaseDefinition): string {
  return caseDef.code ?? `GEN-${caseDef.caseNumber}`
}

export function getCaseQuestions(caseDef: CaseDefinition): CaseQuestions {
  const key = caseDef.code
  if (key && CASE_QUESTION_BANK[key]) return CASE_QUESTION_BANK[key]
  return buildGeneratedCaseQuestions(caseDef)
}

/** Fisher–Yates shuffle driven by session seed + stable question id */
export function shuffleQuestionOptions(
  q: ReportQuestion,
  seed: number,
): { question: ReportQuestion; correctIndex: number } {
  const rng = mulberry32(seed + hashString(q.id))
  const opts = [...q.options]
  const correctText = opts[q.correctIndex]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j]!, opts[i]!]
  }
  const correctIndex = opts.indexOf(correctText)
  return {
    question: { ...q, options: opts },
    correctIndex,
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function buildGeneratedCaseQuestions(caseDef: CaseDefinition): CaseQuestions {
  const malProc = caseDef.processes.find((p) => p.malicious)?.name ?? 'svchos.exe'
  const entry = caseDef.entryVector?.name ?? 'Unknown technique'
  const entryId = caseDef.entryVector?.id ?? 'T1190'
  const actor = caseDef.threatActor.displayName
  const c2 = caseDef.c2Ip ?? caseDef.networkConnections.find((n) => n.malicious)?.foreign ?? 'Unknown'
  const persistHint =
    Object.keys(caseDef.registry ?? {})[0] ??
    caseDef.scheduledTasks.find((t) => t.malicious)?.name ??
    'Scheduled task persistence'
  const primaryUser = caseDef.primaryUser

  const qs: ReportQuestion[] = [
    {
      id: 'g-q1',
      category: 'initial_access',
      question: `What initial access narrative matches ${caseDef.hostname}?`,
      options: [
        `Credential stuffing against VPN gateways unrelated to ${actor}`,
        `${entry} (${entryId})`,
        'Watering hole via compromised gaming CDN',
        'Firmware implants delivered solely via PXE boot',
      ],
      correctIndex: 1,
      explanation: `Case generator anchored initial access on ${entry}.`,
      mitreTag: entryId,
      hint: 'Review MITRE entry vector chip inside Evidence Locker.',
      pointValue: 2,
    },
    {
      id: 'g-q2',
      category: 'threat_actor',
      question: 'Which adversary is attributed to this synthetic scenario?',
      options: ['GHOST COLLECTIVE', actor, 'STATIC ECHO', 'IRON MOLE'],
      correctIndex: 1,
      explanation: `Generated dossiers inherit actor profile ${actor}.`,
      hint: 'Actor codename is repeated inside SIEM banner.',
      pointValue: 2,
    },
    {
      id: 'g-q3',
      category: 'malware',
      question: 'Which process image most likely carries malicious execution?',
      options: ['wininit.exe', 'Registry', malProc, 'smss.exe'],
      correctIndex: 2,
      explanation: `Malicious implants pivot through ${malProc} per process telemetry.`,
      hint: 'Process Monitor rows flagged red correspond to this binary.',
      pointValue: 2,
    },
    {
      id: 'g-q4',
      category: 'c2',
      question: 'Which foreign endpoint should analysts prioritize first?',
      options: [`${c2}`, '10.0.1.10:53', '127.0.0.1:593', 'fe80::1%9'],
      correctIndex: 0,
      explanation: 'Highest-confidence suspicious socket aligns with generated artifact paths.',
      mitreTag: 'T1071',
      hint: 'Cross-reference artifacts labeled “C2 session”.',
      pointValue: 2,
    },
    {
      id: 'g-q5',
      category: 'persistence',
      question: 'Where should responders hunt persistence first?',
      options: [
        'HKLM\\SAM hive offline export',
        persistHint,
        'EFI boot chain variables only',
        'Cloudflare WARP configuration JSON',
      ],
      correctIndex: 1,
      explanation: `Synthetic persistence aligns with ${persistHint}.`,
      hint: 'Compare Registry Editor paths against artifact registry entries.',
      pointValue: 2,
    },
    {
      id: 'g-q6',
      category: 'technique',
      question: 'Which MITRE ATT&CK entry identifier seeds this procedural scenario?',
      options: [
        `MITRE ${entryId} — aligns with documented entry`,
        'MITRE T1499 — Endpoint Denial of Service',
        'MITRE T1565 — Data Manipulation',
        'MITRE T1205 — Traffic Signaling',
      ],
      correctIndex: 0,
      explanation: `Attack chain begins with ${entryId}.`,
      mitreTag: entryId,
      hint: 'MITRE strip ordering lists entry tactic first.',
      pointValue: 2,
    },
    {
      id: 'g-q7',
      category: 'victim',
      question: 'Which interactive account anchors workstation telemetry?',
      options: ['SYSTEM virtual account', primaryUser, 'ANONYMOUS LOGON', 'LOCAL SERVICE'],
      correctIndex: 1,
      explanation: `${primaryUser} is the generated persona tied to host activity.`,
      hint: 'Opening alert lists Subject user.',
      pointValue: 2,
    },
    {
      id: 'g-q8',
      category: 'exfil',
      question: 'Which statement reflects likely adversary collection?',
      options: [
        'No outbound sockets ever observed — purely destructive ransomware',
        'Potential staged collection aligning with documented exfiltration tactic chain',
        'Exclusive Kerberos ticket forging without data staging',
        'DNS TXT-only C2 with zero binary staging',
      ],
      correctIndex: 1,
      explanation: 'Synthetic scenarios emphasize collection/exfil MITRE segments.',
      mitreTag: caseDef.exfiltration?.id,
      hint: 'Review MITRE tail IDs inside Evidence Locker.',
      pointValue: 2,
    },
    {
      id: 'g-q9',
      category: 'containment',
      question: 'Pick the best immediate containment priority.',
      options: [
        'Preserve volatile artifacts, isolate host, block enumerated C2 egress',
        'Pause SIEM ingestion to reduce analyst queues',
        'Rotate KRBTGT twice without planning',
        'Deploy unrestricted admin shares for forensic copies',
      ],
      correctIndex: 0,
      explanation: 'Isolation plus chokepoints mirrors OPERATIVE doctrine.',
      hint: 'Firewall checklist emphasizes blocking outbound adversary channels.',
      pointValue: 2,
    },
    {
      id: 'g-q10',
      category: 'technique',
      question: 'Which Event ID should hunters prioritize for malicious execution auditing?',
      options: ['4624 — successful logon', '7045 — service installed', '4688 — process creation', '4738 — user account changed'],
      correctIndex: 2,
      explanation: '4688 remains canonical for suspicious execution auditing.',
      hint: 'Security log includes seeded malicious 4688 rows.',
      pointValue: 2,
    },
  ]

  return { caseId: caseQuizKey(caseDef), questions: qs }
}
