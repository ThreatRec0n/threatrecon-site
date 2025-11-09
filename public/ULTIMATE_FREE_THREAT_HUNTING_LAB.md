# Ultimate Free Threat Hunting Lab for Students and New Analysts

## 🎯 Objectives and Audience

This plan outlines a hands-on threat hunting lab that is comprehensive and free, designed as a go-to learning environment for students, junior SOC analysts, blue/purple teamers. The goal is to maximize practical learning by using open-source tools and data without any paid licenses or required logins. Participants will investigate realistic attack scenarios, leveraging separate tools (just like real analysts do) to gather information and complete the hunt.

## 🏗️ Lab Architecture and Setup

### Overview

We will deploy a mini-enterprise network lab using the popular **DetectionLab framework by Chris Long**. This automates a Windows Active Directory domain with multiple hosts and pre-configured security monitoring – all on your local machine or a cloud VM. No external accounts or payments are needed: the lab uses free trial Windows images and open-source software, so the only "cost" is your hardware (or minimal cloud fees if used).

### DetectionLab Architecture

An Ubuntu "Logger" VM and three Windows VMs (Domain Controller, an event collector (WEF), and a Windows 10 client). The Logger runs ELK/Splunk and network sensors, while Windows hosts have security agents (Sysmon, Osquery, etc.) forwarding events for centralized analysis.

### Local Deployment

The lab can run on VirtualBox via Vagrant scripts. On a typical PC (16GB+ RAM), you can spin up the entire environment for free. The automation handles installing all components and baseline configurations.

### Environment Composition

The lab consists of four VMs mimicking a corporate setup:

#### Logger (Ubuntu 18.04)
Central log server with a SIEM (either Splunk Free or ELK stack) and network monitoring tools. By default, DetectionLab uses Splunk Enterprise with a free 500 MB/day license, plus:
- **Zeek** (network analyzer)
- **Suricata** (IDS)
- **Fleet** (Osquery manager)
- **Velociraptor** (forensics)

There is also a DetectionLabELK fork that swaps Splunk for a full ELK stack if purely open-source stack is preferred.

#### DC (Windows Server 2016 Domain Controller)
Acts as an Active Directory domain controller. Security tooling installed:
- **Sysmon** for detailed Windows event logging
- **Osquery**
- **Velociraptor agent**
- Group policies enabling enhanced logging

All logs/events are forwarded to the SIEM.

#### WEF (Windows Event Forwarder Server 2016)
A dedicated event collector that aggregates Windows logs via Windows Event Forwarding. It also runs a Splunk forwarder (or Logstash agent for ELK) to send events to the Logger SIEM. Includes Sysmon, Osquery, and other sensors similar to the DC.

#### Win10 (Windows 10 Client)
Simulates an employee workstation (180-day eval license). It has:
- **Sysmon**
- **Osquery**
- **Velociraptor** running
- Common tools (e.g. web browser, Office docs)

This machine will be the primary target for simulating attacks and observing endpoint behavior. Its logs flow to the WEF/Logger.

All machines use default credentials (e.g. vagrant:vagrant) which removes login barriers during the lab. The entire network is self-contained (host-only network), but outbound internet access is allowed for realism (e.g. testing C2 traffic).

### Why DetectionLab?

It gives a ready-to-go range with rich telemetry sources and security controls already in place. Under the hood, it enables antivirus, Sysmon logging, Windows Event collection, network capture, and more out-of-box. This means students can focus on hunting and analysis rather than spending days configuring a lab. It's essentially a free "cyber range" with enterprise features.

## 🛠️ Integrated Open-Source Tools and Data Sources

One key to maximizing learning is exposing participants to a variety of industry tools and data, all without cost. Here's what our lab includes and how each tool will be used in the hands-on exercises:

### System Monitoring (Endpoint Telemetry)

#### Microsoft Sysmon
Installed on Windows hosts to record detailed OS events (process creation, file modifications, network connections, etc.). Sysmon is configured with a community-recommended config for broad coverage. These events feed into the SIEM (tagged as "Sysmon" index). Students will hunt through Sysmon logs to catch suspicious processes or malware activity.

#### Osquery
An endpoint query tool (Facebook open-source) that allows on-demand SQL-like queries of host state (running processes, loaded modules, autoruns, etc.). Fleet is set up to manage Osquery queries across the lab. While not the primary focus for newbies, we can use it in an exercise to validate findings (e.g., querying which startup programs or services exist after an intrusion).

#### Velociraptor
An open-source DFIR tool for endpoint collection and hunting. Agents on each Windows host allow deeper forensic queries (file system, memory, etc.) from the central server. For junior analysts, we'll limit use to simple hunts (for example, using Velociraptor to pull specific artifacts like browser history or MFT if needed to investigate an IOC). This introduces them to forensic hunting without needing a separate memory image.

### Network Monitoring

#### Zeek (Bro)
Network traffic analyzer capturing rich metadata of network connections (DNS requests, HTTP headers, TLS handshakes, etc.). In the lab, Zeek runs on the Logger VM and monitors the virtual network. All logs (DNS, HTTP, connection logs) go into the SIEM (e.g., indexed as "zeek" in Splunk). Students will use Zeek logs to identify suspicious outbound connections, DNS lookups to malicious domains, or lateral movement traffic.

#### Suricata
An IDS engine running on the Logger. It generates alerts for known malicious patterns (using open signature sets). Alerts are sent to the SIEM ("suricata" index). This gives participants immediate clues if any of the simulated attacks triggered known signatures (e.g., C2 beacon, exploit attempt). Students will learn to pivot from an IDS alert to deeper investigation in packet logs or Sysmon events. (Note: Suricata uses Emerging Threats open rules – no subscription needed.)

#### Wireshark
Although not running continuously, Wireshark is installed on lab machines for packet capture analysis if needed. For example, an exercise might involve capturing traffic during an attack simulation and having students manually inspect the PCAP for specific indicators (great for learning protocol details).

### Central Logging and SIEM

#### Splunk (Free license)
Used in the default DetectionLab for log aggregation and search. It comes pre-configured with indexes for Sysmon, Windows events, Zeek, Suricata, PowerShell logs, etc., and includes the ThreatHunting Splunk app (by Olaf Hartong) mapping detection logic to MITRE ATT&CK. Students can use Splunk's web UI to query logs with SPL (Search Processing Language), which is beginner-friendly. The free version has some limits (500 MB/day) but that is plenty for a contained lab. No login or Internet is needed to use Splunk locally.

#### ELK Stack (Elasticsearch, Logstash, Kibana)
If we opt for DetectionLabELK, Kibana dashboards and ElastAlert rules can replace Splunk. Kibana provides a query interface (KQL/DSL) to search the same data. This route is 100% open-source. We will choose whichever SIEM interface the students are more comfortable with. (Regardless of platform, the idea is to teach log searching, filtering, and correlation using a SIEM tool.)

#### Hunting Platforms
We can also introduce specialized hunting frameworks. For instance, **HELK (Hunting ELK)** – an open-source hunting platform that sits atop ELK with advanced analytics (Jupyter notebooks, graph analysis). While HELK is powerful, it may be overkill for beginners; however, mentioning its capabilities (and perhaps providing an optional HELK VM image) shows students what open hunt platforms can do (SQL queries on log data, machine learning for anomaly detection, etc.).

### Threat Detection & Analytics Tools

#### APT-Hunter
A free open-source tool to automatically sift through Windows event logs and highlight ATT&CK-relevant anomalies. We will include APT-Hunter in the lab so students can run it against the collected logs as a "sanity check" after their manual hunt. Its default rules map Windows Event IDs to MITRE techniques and flag suspicious patterns. This not only can validate if they found the important stuff, but also teaches them what types of patterns are considered malicious. (For example, APT-Hunter might flag "new administrative user created" or "suspicious persistence via script execution" which the students should have noticed in the hunt.)

#### DeepBlueCLI
Another free tool (PowerShell script) that parses Windows Security Event logs for anomalies (failed logons, process creations by SYSTEM, etc.). It's a simpler alternative for quick triage. This can be run on the WEF or DC to show students an automated way to find needles in the haystack of event logs (useful as a teaching aid).

#### YARA
Open-source pattern matching tool for malware hunting. We will provide a set of YARA rules (from community repositories) and let students scan suspicious files or memory dumps in the lab. For instance, if they dump a strange process memory, they can run YARA rules to see if any known malware signatures match. This introduces pattern-based threat hunting without relying on commercial AV.

#### Sysinternals Suite
The Windows hosts have Sysinternals tools (Process Explorer, Autoruns, TCPView, etc.) installed. In some exercises, students can use these GUI tools to inspect a live system (e.g. examine running processes or autorun entries on the infected Win10 machine) as part of their investigation. This builds familiarity with handy free tools for manual analysis.

### Threat Intelligence & OSINT (External Tools)

Real threat hunting often involves pivoting to external resources for more information on indicators. We ensure students can do this without any accounts, by using open and public intel sources:

#### VirusTotal (Web)
If a suspicious file hash or domain is found in the logs, students will check it on VirusTotal's website for reputation (engine detections, community comments). No login is required to search hashes, IPs, or domains on VirusTotal. This immediately exposes them to how analysts verify if an artifact is known-malicious.

#### Automater
An open-source OSINT tool that automates lookups of IPs/domains/hashes across multiple sources. We will supply Automater in the lab so they can run, for example, `python automater.py -d <suspicious_domain>` and get aggregated threat intel (from sources like OTX, VirusTotal, etc.). This teaches efficiency in gathering context about an IOC.

#### Whois/DNS lookup
Students may use simple web lookups (or command-line whois) to gather info on domains or IPs (registration data, geolocation). These are quick and require no API keys.

#### Threat Intelligence Feeds
We will include a few open threat feeds (STIX/TAXII or CSV) such as AlienVault OTX public pulses, Abuse.ch malicious URLs, or Spamhaus IP blocklists. Students won't need to log in; the feeds can be downloaded beforehand. An exercise idea: cross-reference an outbound IP from Zeek logs against these feed lists to see if it's a known bad host. This demonstrates the value of threat intel in hunting.

#### CyberChef
A free web-based tool for decoding/encoding data. We'll use the offline version of CyberChef (or host it locally) so participants can decode things like Base64 PowerShell commands or XOR-encoded traffic found during the hunt. CyberChef's versatility (parsing logs, extracting strings, etc.) makes it a great addition to the toolkit without any setup needed.

By combining these tools, the lab offers a full-spectrum hunting experience: endpoint telemetry, network data, automated analytics, and external intelligence. All components are free and widely used in the industry, so learners build practical skills they can transfer to real jobs.

## 🔐 Hands-On Scenario Design (Purple Team Simulation)

To make this lab truly "hands-on", we will simulate real attack scenarios and have participants hunt for the malicious activities. The approach is essentially purple teaming: using offensive actions (red team) to generate data for the defense (blue team) to find. We will maximize the use of **Atomic Red Team**, an open-source library of adversary technique tests, to execute various attacks in a controlled manner.

### Scenario Overview

We'll script a multi-stage attack narrative that an advanced threat actor might carry out, and map it to specific Atomic Red Team tests. For example, a possible attack kill-chain in the lab could be:

#### Initial Compromise – Phishing/Execution
Simulate a phishing email where a user runs a malicious attachment. We can use an Atomic test for a known execution technique (e.g., malicious Office macro spawning a payload or PowerShell download cradle). This will generate Sysmon events on the Win10 host (process start for Word/Excel, spawning PowerShell, etc., with network IoCs if downloading a file). It might also trigger a Windows Event Log entry for script execution or an AMSI alert.

**What students do:** Hunt in Sysmon logs for unusual process lineage (e.g., Office spawning PowerShell) and identify the malicious script or payload. They might find an encoded PowerShell command – which they can decode with CyberChef – revealing a URL or shellcode. That URL can be checked on VirusTotal to confirm it's malicious. This phase teaches initial compromise detection.

#### Persistence & Privilege Escalation
Once the "attacker" has code running on the endpoint, simulate them establishing persistence or elevating privileges. For instance, run Atomic tests for creating a Registry Run key (persistence) and for a privilege escalation like scheduled task as SYSTEM or token impersonation. These actions create Windows Security events (e.g., event ID for schedule task creation) and Sysmon events (registry edits, new process as SYSTEM).

**What students do:** Search Windows Event Logs (via the WEF logs in SIEM) for signs of persistence creation around the timeframe of the compromise. They might discover a suspicious new autorun or task. Using MITRE ATT&CK knowledge, they identify which technique that is (e.g., T1053 Scheduled Task or T1547 Registry AutoStart). They verify by looking at registry hives or Task Scheduler on the Win10 host (using Sysinternals Autoruns or schtasks command). This teaches persistence hunting.

#### Credential Access
Simulate the attacker dumping credentials from the machine (e.g., LSASS memory dump or scraping SAM database). An Atomic test could run a mimic of Mimikatz (DetectionLab even has Mimikatz available) or use Windows built-in admin tools to dump creds. This might be detected by Sysmon (suspicious handle access to LSASS) or generate an event (Event ID 4624 logon if using token replay, etc.).

**What students do:** They can pivot to logs that show credential dumping signatures. For example, use the Sigma rules (if integrated in SIEM) or simply search for known indicators (like Sysmon Event ID 10 "process access" where target is LSASS). If available, the Suricata IDS might catch known Mimikatz patterns in network traffic if it tries to exfiltrate hashes. Students confirm a credential dump occurred and identify which account credentials might be compromised.

#### Lateral Movement
Now simulate the attacker moving to the domain controller using the stolen creds. We can execute an Atomic test for a lateral movement technique such as WMI execution, SMB psexec, or pass-the-hash. In the lab, since we have a DC and possibly another server (WEF), we can attempt a remote command from the Win10 to DC (Atomic Red Team has tests for WMI Execution which will generate event logs on the DC for remote logon and process creation). The DC's Sysmon and Security logs will show a new process running under a remote account or a network logon event (4624) from the client's IP.

**What students do:** Investigate the Domain Controller's logs in the SIEM for any signs of lateral movement. They might filter for logon events from the Win10 host's IP or look at Sysmon on DC for processes launched by unexpected users. They should uncover the moment the attacker accessed the DC (e.g., a Service Control Manager event if psexec was used, or WMI process creation). This step teaches them to pivot hunts across machines and correlate events (the time the Win10 was compromised vs when DC shows activity).

#### Action on Objectives (e.g., Data Exfiltration)
Finally, simulate the attacker collecting and exfiltrating sensitive data. For instance, create a dummy "sensitive file" on the DC and then run an Atomic test that compresses it and does an HTTP or DNS exfiltration. A straightforward Atomic test could be something like exfiltrating via DNS queries (which would appear in Zeek DNS logs as large TXT queries or unusual domains), or just an HTTP POST to an external site. The lab's network sensors will pick this up (Zeek noticing large data transfer or Suricata triggering on known exfil patterns).

**What students do:** Analyze network logs for data exfil indicators. They might find in Zeek logs a host making multiple DNS queries with encoded data, or an HTTP session to an unknown server with a large payload. Using OSINT (like looking up that external IP/domain), they confirm it's not benign. They then tie it back to which host/process initiated it by correlating timestamps or IPs with the endpoint logs. This demonstrates catching the end-goal of the attack.

Throughout the simulation, Atomic Red Team provides the menu of techniques to execute, all mapped to MITRE ATT&CK. We ensure to log which technique IDs we ran, so that after the hunt the students can compare their findings against the expected techniques. This method ensures full ATT&CK coverage of the scenario, and students become familiar with techniques IDs (e.g., "Found evidence of T1055 Process Injection in the hunt"). It's worth noting that the DetectionLab even has Atomic Red Team already installed on the Windows hosts, making it easier to run these tests.

### Why this is the "best" approach

We are effectively maximizing realism without cost. The scenario touches multiple kill-chain phases and log sources, teaching students to hunt holistically (endpoint + network, using both manual analysis and automated alerts). Every tool used is free and each step reinforces knowledge of attacker TTPs. There's no single "demo" or canned path – the environment is open for exploration. Learners can rerun or tweak these atomic tests to observe different patterns, making the lab reusable. And because it's on their machine (or a provided VM), they don't need to sign up for any service or risk any real system – it's safe and isolated.

## 🔍 Guided Hunting Exercises and Learning Outcomes

To ensure the lab is approachable, we will provide a worksheet of hunting tasks that align with the attack scenario above. Each task encourages using the tools and techniques in the lab to find specific answers. The exercises will be structured but not spoon-fed, letting participants learn by discovery. For example:

### Identifying Initial Compromise
"Find evidence of the initial malicious code execution on the Win10 host. What process was spawned, and by which parent process? What script or command did it run?" – Learners will search Sysmon ProcessCreate events and Windows Event 4104 (PowerShell script block logging) if enabled. This teaches them to recognize suspicious parent-child process relationships (e.g., WINWORD.exe -> powershell.exe) and to extract malicious command content. Using MITRE ATT&CK as reference is encouraged here – e.g., realizing this behavior corresponds to Technique T1059 (Command and Scripting Interpreter). (We instruct them to keep the ATT&CK website open for reference, as it's "always a must" during threat hunting.)

### Investigating Persistence
"Check if the attacker established any persistent foothold on the Win10 machine." – They might query autoruns (via Sysinternals or Osquery) and review Sysmon Event ID 13 (registry modifications) around the attack time. They could also run APT-Hunter on the Windows event logs as a hint; APT-Hunter might flag a persistence mechanism and map it to an ATT&CK technique. The expected outcome is identifying the created registry run key or scheduled task and understanding its purpose.

### Root Cause Analysis
"Determine how the malicious code got executed. Was it via a document, a script, or something else? Can you find the origin (e.g., the name of the file or USB, etc.)?" – Here they may look at PowerShell logs or the file system. If a malware file was dropped, they can find its filename via logs or by searching the host (Velociraptor can collect an MFT or directory listing). Once found, they can compute its hash and check VirusTotal. This step reinforces forensic skills and using OSINT on file hashes (no login needed to see VT results like detection ratio).

### Tracing Lateral Movement
"The attacker moved from Win10 to another machine. Identify how and where they went. Provide relevant log evidence (timestamps, event IDs)." – Students correlate Windows Security logon events with new processes on the DC. They might discover an Event ID 4624 (network logon) on the DC from the Win10's user account at a certain time, followed by a service creation event (if psexec) or WMI-activity event. They document the chain: how the stolen credentials were used for lateral movement. This teaches analyzing logs across multiple systems for a single incident.

### Detecting Exfiltration
"Was there any data exfiltration? Check network logs for large transfers or repeated connections to external hosts." – They will use Splunk or Kibana to filter Zeek connection logs by bytes transferred or look at Suricata alerts for data exfil. They should find the anomalous DNS or HTTP traffic and then validate that as exfiltration. Perhaps the Suricata alert will directly name a known exfil technique, reinforcing how IDS signatures can assist hunts.

### Threat Intelligence & Enrichment
"Take one indicator from the attack (file hash, domain, or IP) and gather additional context about it." – This task forces them to use Automater or VirusTotal. For instance, if a suspicious domain bad.example.com was contacted, Automater might report it's flagged in multiple blacklists. Students then answer whether the indicator is known malicious and if it's associated with any known malware or threat group (sometimes VT or OSINT blogs provide this info). This demonstrates how external information enriches the investigation.

### Reporting & ATT&CK Mapping
Finally, students will compile a brief report of what happened, including which MITRE ATT&CK techniques were observed at each stage. The lab documentation can provide a matrix to fill out (e.g., Initial Access – T1566 Phishing, Execution – T1059 PowerShell, Persistence – T1547 Registry Run Key, etc.). This solidifies their understanding of the adversary behavior in standard terminology.

Throughout these exercises, no improvement or add-on is needed – we've packed the lab with the maximum free capabilities. The participants have the freedom to use multiple tools to cross-verify findings (which is exactly what a real analyst does). For example, they might spot something in Splunk, double-check it with a Sysinternals tool on the live VM, and then query an OSINT source for more info – all of which our setup enables seamlessly.

## ✅ Conclusion: A Complete, No-Compromise Learning Experience

By combining a robust lab environment (DetectionLab) with diverse open-source tools and a realistic attack scenario, this solution offers one of the best possible hands-on threat hunting experiences at zero cost. It requires no sign-ups or paid licenses, and it's not a superficial demo – it's a persistent lab that students can deeply engage with. We've maximized what can be done for free: a full Windows domain, endpoint and network telemetry, ATT&CK-aligned attack simulations, and a wide array of analysis tools.

This comprehensive approach means there is little left to improve without spending money – we've essentially "maxed out" the free capabilities. Participants will finish the lab having practiced end-to-end threat hunting: from detecting advanced threats in logs, investigating with security tools, leveraging threat intel, to mapping their findings to attacker techniques. It's an immersive, realistic training ground that can continually be used and expanded (e.g., new Atomic tests, adding a Kali attacker VM, etc.) as needed, all while remaining free.

In summary, this lab is the ultimate no-cost solution to train the next generation of threat hunters in a practical, engaging way – with nothing holding them back from learning. 🚀

## Sources

The design and tools mentioned are drawn from respected community projects and resources, including:

- **Chris Long's DetectionLab** (which bundles Splunk, Zeek, Sysmon, etc. in a free lab)
- **DetectionLabELK** (ELK-based variant)
- **Open-source hunting tools** like APT-Hunter and Automater
- **MITRE ATT&CK** and **Atomic Red Team** for developing hunting skills

All these ensure the lab is built on proven, community-endorsed practices for maximum educational value.

