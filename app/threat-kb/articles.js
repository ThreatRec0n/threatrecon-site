export const threatKbArticles = [
  {
    slug: "lockbit",
    title: "LockBit Defensive Triage Notes",
    malwareType: "Ransomware",
    summary:
      "LockBit is commonly discussed as ransomware used in intrusion-driven extortion cases. Defensive triage focuses on impact preparation, encryption indicators, lateral movement evidence, and recovery disruption attempts.",
    behaviors: [
      "Attempts to inhibit recovery through shadow copy or backup deletion.",
      "Encrypts files and may leave ransom notes or renamed extensions.",
      "Often appears after credential access, discovery, and lateral movement activity.",
    ],
    mitre: ["T1486 Data Encrypted for Impact", "T1490 Inhibit System Recovery", "T1083 File and Directory Discovery"],
    detections: [
      "Monitor for shadow copy deletion commands and rapid file rename/write patterns.",
      "Hunt for unusual archive, discovery, and remote execution activity before encryption.",
      "Review EDR process trees for scripting engines launching recovery-disruption utilities.",
    ],
    recommendations: [
      "Isolate affected hosts, preserve forensic evidence, and validate backup integrity before restoration.",
      "Rotate credentials that may have been exposed during the intrusion.",
      "Review remote access paths and lateral movement telemetry.",
    ],
  },
  {
    slug: "redline-stealer",
    title: "RedLine Stealer Defensive Triage Notes",
    malwareType: "Infostealer",
    summary:
      "RedLine Stealer is commonly associated with credential and browser artifact theft. Defensive triage focuses on credential access strings, exfiltration indicators, and delivery context.",
    behaviors: [
      "Targets browser credential stores, cookies, system metadata, and application artifacts.",
      "May contact command-and-control infrastructure for tasking or exfiltration.",
      "Often arrives through phishing, cracked software lures, or loader activity.",
    ],
    mitre: ["T1555 Credentials from Password Stores", "T1005 Data from Local System", "T1041 Exfiltration Over C2 Channel"],
    detections: [
      "Hunt for suspicious access to browser profile paths and credential storage files.",
      "Review outbound connections from unusual user-writable paths.",
      "Correlate suspicious archives, download paths, and first-seen executables.",
    ],
    recommendations: [
      "Rotate exposed credentials and revoke active sessions where theft is suspected.",
      "Review browser and endpoint telemetry for artifact access.",
      "Block confirmed infrastructure only after validating indicator quality.",
    ],
  },
  {
    slug: "qakbot",
    title: "QakBot Defensive Triage Notes",
    malwareType: "Loader / Botnet",
    summary:
      "QakBot has historically been associated with loader activity, credential theft, and follow-on intrusion enablement. Defensive triage focuses on delivery chain evidence and command execution.",
    behaviors: [
      "Uses scripted or document-driven delivery chains in many reported cases.",
      "May establish persistence, inject into processes, and communicate with remote infrastructure.",
      "Can enable follow-on hands-on-keyboard intrusion activity.",
    ],
    mitre: ["T1059 Command and Scripting Interpreter", "T1055 Process Injection", "T1105 Ingress Tool Transfer"],
    detections: [
      "Hunt for script interpreters launching unusual binaries from user-writable paths.",
      "Review process injection, scheduled task, and persistence telemetry.",
      "Correlate suspicious email delivery artifacts with endpoint execution.",
    ],
    recommendations: [
      "Preserve email, endpoint, and proxy evidence for delivery-chain reconstruction.",
      "Identify follow-on payloads or remote access tooling.",
      "Reset exposed credentials and review lateral movement signals.",
    ],
  },
  {
    slug: "asyncrat",
    title: "AsyncRAT Defensive Triage Notes",
    malwareType: "Remote Access Trojan",
    summary:
      "AsyncRAT is a remote access trojan family often used for unauthorized remote control, surveillance, and credential access. Defensive triage focuses on persistence, C2, and collection behavior.",
    behaviors: [
      "May collect system information, keystrokes, screenshots, or credentials.",
      "Often uses persistence mechanisms and outbound command-and-control connections.",
      "Can be delivered by scripts, loaders, archives, or social engineering.",
    ],
    mitre: ["T1056 Input Capture", "T1113 Screen Capture", "T1573 Encrypted Channel"],
    detections: [
      "Review suspicious .NET executables, startup persistence, and unusual outbound connections.",
      "Hunt for screen capture, keylogging, and credential access indicators.",
      "Correlate parent process lineage with user download and archive activity.",
    ],
    recommendations: [
      "Isolate affected endpoints and collect volatile process/network evidence when possible.",
      "Rotate credentials used on affected systems.",
      "Review persistence locations and remove confirmed unauthorized remote access tooling.",
    ],
  },
  {
    slug: "emotet",
    title: "Emotet Defensive Triage Notes",
    malwareType: "Loader",
    summary:
      "Emotet has been reported as a loader and initial access facilitator. Defensive triage focuses on phishing delivery, script execution, persistence, and follow-on payload risk.",
    behaviors: [
      "Often associated with malicious email delivery and script or document execution chains.",
      "May download follow-on payloads and establish persistence.",
      "Can support broader intrusion activity after initial execution.",
    ],
    mitre: ["T1566 Phishing", "T1204 User Execution", "T1105 Ingress Tool Transfer"],
    detections: [
      "Hunt for suspicious Office, script, and command interpreter parent-child relationships.",
      "Review proxy and DNS telemetry for newly contacted infrastructure after email interaction.",
      "Correlate endpoint detections with mailbox and attachment telemetry.",
    ],
    recommendations: [
      "Contain affected hosts and collect email artifacts tied to delivery.",
      "Identify and remove follow-on payloads or persistence.",
      "Review mail filtering, attachment controls, and user reporting workflows.",
    ],
  },
];

export function articleBySlug(slug) {
  return threatKbArticles.find(article => article.slug === slug);
}
