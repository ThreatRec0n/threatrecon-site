// Client-side protocol reference dataset
// Exported array: PROTOCOLS

export const PROTOCOLS = [
  {
    proto: "HTTP",
    typicalUse: "Web requests (cleartext).",
    keyFields: "Method, Host, URI, Headers, Status, Content-Type, Length.",
    normalPatterns: "Short GETs to CDN; 200/304 status; human-readable headers.",
    commonAbuses: "Exfil via POST multipart/form-data; credential capture; web shell upload.",
    whatToLookFor: "Outbound POST with filename; large request vs tiny response; odd User-Agent; secrets in params.",
    filters: 'http || tcp.port == 80'
  },
  {
    proto: "HTTPS / TLS",
    typicalUse: "Encrypted web traffic.",
    keyFields: "ClientHello SNI, JA3/JA4 hash, cert CN/SAN, versions, cipher suites.",
    normalPatterns: "Popular SNIs; variable packet sizes; bidirectional symmetry.",
    commonAbuses: "C2 beaconing; data exfil over POST; domain fronting; self-signed certs.",
    whatToLookFor: "Even interval POSTs; rare SNI; small periodic requests w/ short responses; suspicious JA3.",
    filters: 'tls || tcp.port == 443'
  },
  {
    proto: "DNS",
    typicalUse: "Name resolution.",
    keyFields: "Query Name, Type, ID, Flags, Answers, TTL.",
    normalPatterns: "Short QNAMEs; types A/AAAA; low QPS.",
    commonAbuses: "Tunneling via long/base64-like labels; DGA; data staging in TXT.",
    whatToLookFor: "Very long labels; many subdomain levels; repeated NXDOMAIN; high QPS to one domain.",
    filters: 'dns'
  },
  {
    proto: "SMB",
    typicalUse: "Windows file/print sharing.",
    keyFields: "Tree Connect, NT Create, Read/Write, Session Setup, Share, Path.",
    normalPatterns: "Internal ↔ internal; user logons; small reads/writes.",
    commonAbuses: "Lateral movement; credential theft; mass file copy; ransomware staging.",
    whatToLookFor: "Workstation → multiple peers; sustained large writes; ADMIN$ or C$ access; failed auth streaks.",
    filters: 'smb || tcp.port in {445,139}'
  },
  {
    proto: "FTP",
    typicalUse: "File transfer (cleartext).",
    keyFields: "USER, PASS, PORT/PASV, STOR/RETR, 150/226 codes.",
    normalPatterns: "Short sessions; few commands.",
    commonAbuses: "Credential theft; anonymous upload; exfil via STOR.",
    whatToLookFor: "Cleartext PASS; large STOR to external; rare ports for data channel.",
    filters: 'ftp || tcp.port == 21'
  },
  {
    proto: "SMTP",
    typicalUse: "Mail transfer.",
    keyFields: "HELO/EHLO, MAIL FROM, RCPT TO, DATA, AUTH.",
    normalPatterns: "Outbound to MX; small control then data body.",
    commonAbuses: "Phishing relay; exfil as attachments; AUTH brute force.",
    whatToLookFor: "AUTH PLAIN/LOGIN base64 creds; many RCPTs; large attachments outbound.",
    filters: 'smtp || tcp.port == 25'
  },
  {
    proto: "IMAP",
    typicalUse: "Mail retrieval.",
    keyFields: "LOGIN/AUTH, SELECT, FETCH, UID.",
    normalPatterns: "User mailbox polling.",
    commonAbuses: "Account takeover scraping mailboxes.",
    whatToLookFor: "LOGIN clear/base64; mass FETCH; remote unusual geo.",
    filters: 'imap || tcp.port == 143'
  },
  {
    proto: "ICMP",
    typicalUse: "Network diagnostics.",
    keyFields: "Type, Code, ID, Seq.",
    normalPatterns: "Occasional pings, even sizes.",
    commonAbuses: "Covert channels; recon sweeps.",
    whatToLookFor: "High-frequency echo; variable sizes; odd payload text.",
    filters: 'icmp'
  },
  {
    proto: "ARP",
    typicalUse: "IP ↔ MAC mapping (LAN).",
    keyFields: "OP (who-has/is-at), Sender/Target IP/MAC.",
    normalPatterns: "Intermittent who-has/is-at.",
    commonAbuses: "ARP poisoning (MITM).",
    whatToLookFor: "Many replies from non-gateway MAC; flip-flopping IP→MAC.",
    filters: 'arp'
  },
  {
    proto: "DHCP",
    typicalUse: "Address assignment.",
    keyFields: "DISCOVER, OFFER, REQUEST, ACK, Options.",
    normalPatterns: "Lease events on boot or renew.",
    commonAbuses: "Rogue DHCP handing bad gateway/DNS.",
    whatToLookFor: "OFFER from unknown MAC; DNS set to attacker IP.",
    filters: 'bootp || dhcp'
  },
  {
    proto: "SSH",
    typicalUse: "Secure remote shell.",
    keyFields: "KEXINIT, keys, client/server banners.",
    normalPatterns: "Admins to servers; longer sessions.",
    commonAbuses: "Brute force; tunneling; backdoors.",
    whatToLookFor: "Many failed connections; odd client banners; unusual internal targets.",
    filters: 'ssh || tcp.port == 22'
  },
  {
    proto: "RDP",
    typicalUse: "Windows remote desktop.",
    keyFields: "TPKT/X.224, CredSSP/TLS, MCS.",
    normalPatterns: "Admin remote sessions.",
    commonAbuses: "Lateral movement; data staging.",
    whatToLookFor: "Workstation → many servers; many short connections; after-hours spikes.",
    filters: 'tcp.port == 3389'
  },
  {
    proto: "SIP/RTP",
    typicalUse: "VoIP signaling/media.",
    keyFields: "INVITE/OK/BYE, SDP; RTP SSRC/Seq/PT.",
    normalPatterns: "Burst during calls; RTP from media servers.",
    commonAbuses: "Call fraud; exfil over RTP.",
    whatToLookFor: "RTP to external IPs; long sessions without matching SIP BYE.",
    filters: 'sip || rtp || udp.port in {5060,5061}'
  },
  {
    proto: "NTP",
    typicalUse: "Time sync.",
    keyFields: "Version, Stratum, Timestamps.",
    normalPatterns: "Periodic small requests to few servers.",
    commonAbuses: "DDoS amplification; covert beaconing.",
    whatToLookFor: "NTP to rare externals; high rate; odd sizes.",
    filters: 'ntp || udp.port == 123'
  },
  {
    proto: "SNMP",
    typicalUse: "Device management.",
    keyFields: "Get/GetNext/Set, community string, OIDs.",
    normalPatterns: "Polling from NMS to devices.",
    commonAbuses: "Default public/private; data harvesting.",
    whatToLookFor: "SNMP from clients; Set requests; unknown managers.",
    filters: 'snmp || udp.port in {161,162}'
  },
  {
    proto: "LDAP/Kerberos",
    typicalUse: "Auth/directory (AD).",
    keyFields: "Bind, Search; AS-REQ/REP, TGS-REQ/REP.",
    normalPatterns: "DC-centric traffic.",
    commonAbuses: "Kerberoasting; AS-REP roast; LDAP dumps.",
    whatToLookFor: "Unusual AS-REQs; service tickets to rare SPNs; LDAP from clients.",
    filters: 'ldap || kerberos || tcp.port in {88,389,636}'
  },
  {
    proto: "MySQL/MSSQL",
    typicalUse: "Databases.",
    keyFields: "Login, Query, Result sizes.",
    normalPatterns: "App ↔ DB on fixed ports.",
    commonAbuses: "Data exfil; credential theft.",
    whatToLookFor: "Client ↔ DB from workstations; large SELECT results outbound.",
    filters: 'mysql || mssql || tcp.port in {1433,3306}'
  },
  {
    proto: "Telnet",
    typicalUse: "Legacy remote shell (cleartext).",
    keyFields: "Negotiation, user/pass in clear.",
    normalPatterns: "Rare today.",
    commonAbuses: "Credential theft; botnet propagation.",
    whatToLookFor: "USER/PASS visible; hits from IoT ranges.",
    filters: 'telnet || tcp.port == 23'
  },
  {
    proto: "TFTP",
    typicalUse: "Simple file transfer (UDP).",
    keyFields: "RRQ/WRQ, Block#, Filename.",
    normalPatterns: "Firmware PXE/boot.",
    commonAbuses: "Config/cred exfil; drop malicious binaries.",
    whatToLookFor: "WRQ to external; sensitive filenames.",
    filters: 'tftp || udp.port == 69'
  }
];


