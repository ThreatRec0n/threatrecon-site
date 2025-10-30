// Protocol Intelligence dataset

export const PROTOCOL_INTEL = [
  {
    proto: "HTTP/HTTPS",
    normalUse: "Web requests/responses between clients and servers.",
    attackerUse: "Exfiltration via HTTP POST; command-and-control via HTTPS; phishing hosting.",
    mitre: "T1071.001 (Application Layer Protocol: Web Protocols)",
    forensicSigns: [
      "Outbound POST with sensitive filenames or base64 blobs.",
      "Long sessions to rare domains or IPs.",
      "Self-signed TLS certificates."
    ],
    wiresharkFilters: ["http", "tls", "tcp.port==80", "tcp.port==443"]
  },
  {
    proto: "DNS",
    normalUse: "Name resolution for hostnames to IP addresses.",
    attackerUse: "Data tunneling or DGA beaconing.",
    mitre: "T1071.004 (Application Layer Protocol: DNS)",
    forensicSigns: [
      "Very long labels (50+ chars).",
      "Base32/base64-like subdomains.",
      "Hundreds of queries per minute to one domain."
    ],
    wiresharkFilters: ["dns"]
  },
  {
    proto: "SMB",
    normalUse: "Windows file/print sharing.",
    attackerUse: "Lateral movement, data staging, ransomware propagation.",
    mitre: "T1021.002 (Remote Services: SMB/Windows Admin Shares)",
    forensicSigns: [
      "Workstation → many peers over 445.",
      "Large Read/Write sequences.",
      "ADMIN$ / C$ path access."
    ],
    wiresharkFilters: ["smb", "tcp.port==445"]
  },
  {
    proto: "FTP",
    normalUse: "File transfer.",
    attackerUse: "Anonymous upload, credential theft, data exfil.",
    mitre: "T1048.003 (Exfiltration Over Unencrypted/Obfuscated Non-C2 Protocol)",
    forensicSigns: [
      "USER/PASS in cleartext.",
      "STOR large files to external IP.",
      "Odd high-port data channel."
    ],
    wiresharkFilters: ["ftp"]
  },
  {
    proto: "SMTP/IMAP",
    normalUse: "Email transport and retrieval.",
    attackerUse: "Phishing relay, credential collection, mailbox scraping.",
    mitre: "T1071.003 (Application Layer Protocol: Mail)",
    forensicSigns: [
      "AUTH PLAIN/LOGIN with base64 creds.",
      "Mass RCPT or FETCH commands.",
      "Large attachments outbound."
    ],
    wiresharkFilters: ["smtp","imap"]
  },
  {
    proto: "ICMP",
    normalUse: "Connectivity checks (ping).",
    attackerUse: "Recon sweeps or covert channels.",
    mitre: "T1046 (Network Service Scanning)",
    forensicSigns: [
      "Sequential pings across subnets.",
      "Variable payload sizes.",
      "Echo packets containing ASCII text."
    ],
    wiresharkFilters: ["icmp"]
  },
  {
    proto: "SSH/RDP",
    normalUse: "Secure remote administration.",
    attackerUse: "Unauthorized remote access or tunneling.",
    mitre: "T1021.004 (Remote Services: SSH) / T1021.001 (RDP)",
    forensicSigns: [
      "Many short auth attempts.",
      "Connections from unusual workstations.",
      "Non-standard client banners."
    ],
    wiresharkFilters: ["ssh","tcp.port==22","tcp.port==3389"]
  },
  {
    proto: "LDAP/Kerberos",
    normalUse: "Directory and authentication services.",
    attackerUse: "Credential abuse (Kerberoasting, AS-REP roast).",
    mitre: "T1558.003 (Steal or Forge Kerberos Tickets)",
    forensicSigns: [
      "AS-REQs without pre-auth.",
      "Service tickets to rare SPNs.",
      "LDAP enumeration from clients."
    ],
    wiresharkFilters: ["ldap","kerberos"]
  },
  {
    proto: "RTP/SIP",
    normalUse: "Voice-over-IP signaling and media.",
    attackerUse: "Audio exfiltration or call hijacking.",
    mitre: "T1071.005 (VoIP)",
    forensicSigns: [
      "RTP to external IPs.",
      "Long sessions without SIP BYE.",
      "Unusual ports > 20000."
    ],
    wiresharkFilters: ["sip","rtp"]
  },
  {
    proto: "NTP/SNMP/TFTP",
    normalUse: "Time sync, management, simple transfers.",
    attackerUse: "Amplification, device takeover, config theft.",
    mitre: "T1095 (Non-Application Layer Protocol)",
    forensicSigns: [
      "High-volume NTP to rare servers.",
      "SNMP Set from clients.",
      "TFTP WRQ to external host."
    ],
    wiresharkFilters: ["ntp","snmp","tftp"]
  }
];


