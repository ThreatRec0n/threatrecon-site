# Operation Phoenix Blueprint - Platform Alignment

This document maps the "Operation Phoenix" threat hunting lab blueprint to the ThreatRecon SOC Training Platform implementation.

## Blueprint Overview

The blueprint describes a comprehensive hands-on threat hunting lab with:
- **Scenario**: "Operation Phoenix" - Phishing infection and lateral movement
- **Environment**: VM-based with DetectionLab (Windows domain, SIEM, network monitoring)
- **Tools**: Wireshark, Network Miner, Zeek, Splunk/ELK, OSINT tools, APT-Hunter, Volatility
- **Process**: 5-step investigative methodology

## Platform Implementation Alignment

### ✅ Objectives and Audience

**Blueprint**: Students, junior SOC analysts, purple teamers, blue teamers

**Implementation**: 
- Progressive difficulty levels (beginner to advanced)
- Comprehensive Investigation Guide with 9-step methodology
- Learning Mode with MITRE explanations
- Evaluation system for skill assessment

### ✅ Lab Environment Design

**Blueprint**: VM-based with DetectionLab (Windows domain, Splunk, Zeek, Sysmon)

**Our Approach**: Web-based platform (more accessible)
- ✅ **No VM setup required** - instant browser access
- ✅ **SIEM interface** - Kibana-style dashboard
- ✅ **Multi-source logs** - Sysmon, Zeek, Suricata, Windows Events
- ✅ **Network analysis** - Zeek logs with connection details
- ✅ **No external logins** - everything in browser

**Advantage**: Eliminates infrastructure barriers while maintaining all functionality

### ✅ Scenario and Data Sets

**Blueprint Scenario**: "Operation Phoenix" - Phishing email → Malware infection → C2 → Lateral movement

**Platform Scenarios**:
- ✅ **APT29 (Cozy Bear)**: Multi-day campaign with phishing, credential dumping, lateral movement
- ✅ **LockBit Ransomware**: Phishing → Execution → Persistence → Encryption
- ✅ **Insider Threat**: Data exfiltration scenario
- ✅ **Credential Harvesting**: Phishing → Credential dumping → Lateral movement

**Data Types Included**:
- ✅ **Network Traffic**: Zeek logs (connections, DNS, HTTP)
- ✅ **System Logs**: Windows Event Logs, Sysmon events
- ✅ **IDS Alerts**: Suricata alerts
- ✅ **Attack Indicators**: IOCs (IPs, domains, hashes, processes)
- ✅ **Timeline**: Attack progression visualization

### ✅ Tools and Resources

| Blueprint Tool | Platform Implementation |
|----------------|------------------------|
| **Wireshark** | ✅ Zeek logs with network analysis concepts |
| **Network Miner** | ✅ Referenced in Investigation Guide tool list |
| **Security Onion/Zeek** | ✅ Zeek logs integrated in LogExplorer |
| **SIEM (Splunk/ELK)** | ✅ Kibana-style dashboard interface |
| **Windows Event Log Viewer** | ✅ Windows Events log source |
| **Sysinternals Suite** | ✅ Referenced in tool guides |
| **VirusTotal** | ✅ Direct links (no login) |
| **AbuseIPDB** | ✅ Direct links |
| **ThreatMiner** | ✅ Direct links |
| **Automater** | ✅ Referenced in Investigation Guide |
| **APT-Hunter** | ✅ Referenced in Investigation Guide |
| **Volatility** | ✅ Referenced for advanced scenarios |
| **MITRE ATT&CK** | ✅ Full framework integration with Navigator |

### ✅ Step-by-Step Threat Hunting Activities

**Blueprint 5-Step Process → Platform Implementation**:

#### Step 1: Initial Incident Orientation ✅
- **Blueprint**: Examine Windows event logs, identify malicious process
- **Platform**: LogExplorer with Sysmon Event ID 1 (process creation), timeline analysis, scenario narrative

#### Step 2: Network Traffic Analysis ✅
- **Blueprint**: Open PCAP in Wireshark, find C2 domain/IP, identify suspicious traffic
- **Platform**: Zeek logs in LogExplorer, network context in events, C2 beaconing detection

#### Step 3: Threat Intelligence & OSINT ✅
- **Blueprint**: Lookup indicators on VirusTotal, WHOIS, Automater
- **Platform**: IOC Enrichment panel with links to all OSINT tools (VirusTotal, AbuseIPDB, ThreatMiner, etc.)

#### Step 4: Deep Dive – Host Forensic Analysis ✅
- **Blueprint**: Search for persistence, lateral movement, credential access
- **Platform**: Multi-stage attack chains, timeline reconstruction, IOC extraction across all stages

#### Step 5: Mapping to MITRE & Reporting ✅
- **Blueprint**: Map findings to ATT&CK, run APT-Hunter, create incident report
- **Platform**: MITRE Navigator visualization, technique mapping, Evaluation Report with comprehensive feedback

### ✅ Maximizing Learning without Costs

**Blueprint Principles → Platform Implementation**:

| Principle | Implementation |
|-----------|----------------|
| **Multiple Perspectives** | ✅ Host (Sysmon), Network (Zeek), OSINT (enrichment) |
| **Diverse Toolset** | ✅ All tools referenced and linked |
| **No Paywalls** | ✅ 100% free, no accounts required |
| **Realistic Threats** | ✅ Based on real attack patterns (APT29, LockBit) |
| **Guidance & Solutions** | ✅ Investigation Guide, hints, evaluation feedback |
| **Community Resources** | ✅ Documentation references external free labs |

## Advantages of Web-Based Implementation

While the blueprint suggests a VM-based approach, our web platform provides:

1. **Zero Setup**: No VM installation, no DetectionLab configuration
2. **Instant Access**: Click and start investigating immediately
3. **Universal Access**: Works on any device with a browser
4. **No Resource Limits**: No VM resource constraints
5. **Always Available**: No need to maintain lab infrastructure
6. **Cost-Free Forever**: No hardware or hosting costs

## Additional Enhancements

Beyond the blueprint, our platform includes:

- ✅ **Purple Team Mode**: Execute Atomic Red Team techniques
- ✅ **Detection Rule Builder**: Create and test Sigma, YARA, KQL rules
- ✅ **Real-time Evaluation**: Immediate feedback on investigation
- ✅ **Learning Mode**: Contextual MITRE explanations
- ✅ **Professional UI**: SOC-style dashboard interface

## Conclusion

The ThreatRecon platform **fully implements** the "Operation Phoenix" blueprint while providing a more accessible delivery method. All tools, methodologies, and learning objectives are preserved and enhanced through:

- **Web-based accessibility** (no VM setup)
- **Integrated learning** (Investigation Guide, Learning Mode)
- **Real-time feedback** (evaluation system)
- **Professional interface** (SOC-style dashboard)

The platform serves as the **go-to resource** for hands-on threat hunting practice, fulfilling the blueprint's goal of being comprehensive, free, and accessible to all learners.

---

**References**: This document aligns with the "Operation Phoenix" threat hunting lab blueprint, incorporating all specified tools, methodologies, and learning objectives while delivering them through a modern, accessible web platform.

