# Max Free Upgrade

ThreatRecon is an advanced browser based static malware triage, detection engineering, and reverse engineering support workbench. This upgrade pushes the free/local model further without adding paid services, required APIs, backend malware execution, sample upload, or automatic threat-intelligence fetches.

## What Was Added

- Stronger local PE parsing: MZ/PE headers, architecture, timestamp, subsystem, DLL characteristics, image base, entry point RVA, sections, entropy, import/export tables when parsable, suspicious API strings, overlay hints, and packer indicators.
- Strings Intelligence: grouped static strings for network, registry, file path, crypto, anti-debug, persistence, PowerShell, Windows API, credential, ransomware, C2, Linux persistence, and suspicious command categories.
- API Risk Table: suspicious imports or API strings categorized by process injection, dynamic loading, networking, persistence, credential access, anti-debug, keylogging, and execution.
- Draft YARA generator: local draft rules generated from suspicious strings, artifacts, API strings, registry keys, mutexes, URLs/domains, and behavior findings.
- Draft Sigma generator: local experimental Sigma rules for encoded PowerShell, LOLBins, persistence, LSASS dumping, shadow copy deletion, and Defender tampering.
- ATT&CK Evidence Table: tactic, technique, observed evidence, confidence, and detection idea.
- Attack Timeline: static reconstruction of likely stages from execution through impact, with validation steps.
- Sample Comparison: two local inputs can be compared for shared IOCs, strings, behaviors, YARA-style hits, and MITRE techniques.
- Analyst Workflow Modes: SOC Triage, Malware Analysis, Reverse Engineering Prep, Threat Hunting, and Incident Report. Modes change report emphasis only, not detection truth.
- Detection Engineering panel: Sigma, YARA, Splunk, Defender KQL, Elastic, firewall blocklist, DNS blocklist, and EDR hash hunt suggestions.
- IOC Actionability: confidence, actionability, reason, and recommended action for each indicator class.
- Safer local binary handling: PE-like files can be selected and read locally as bytes under a browser-safe size cap. Files are never uploaded, stored, or executed.

## Local Only

All analysis remains in the browser. Hashing, IOC extraction, PE parsing, string grouping, deobfuscation, rule generation, sample comparison, and exports happen locally. Vercel Web Analytics and Speed Insights are limited to site usage and performance telemetry; they do not receive pasted samples, local file contents, decoded payloads, reports, or malware analysis content.

## What Is Not Supported

ThreatRecon is not a sandbox, debugger, emulator, unpacker, or full disassembler. It does not execute samples, detonate malware, emulate API calls, recover all dynamically generated strings, or guarantee family attribution.

## Why This Is Not A Sandbox

Dynamic malware analysis requires isolated execution, process monitoring, filesystem/registry tracing, network simulation, and often VM rollback. ThreatRecon deliberately avoids execution and server upload. It prepares analysts for safe follow-up in a dedicated lab or sandbox.

## How To Use The Workflow

1. Paste a script, log, command line, strings output, IOC list, or select a local file.
2. Choose an analysis mode and workflow emphasis.
3. Run local analysis and review score explanation, PE triage, strings intelligence, API risk, ATT&CK evidence, timeline, and IOCs.
4. Use Detection Engineering output to draft hunts and review YARA/Sigma rules.
5. Use manual reputation pivots only when authorized.
6. Export reports, CSVs, blocklists, YARA, Sigma, or comparison reports as needed.

## Interpreting YARA And Sigma

Generated YARA and Sigma content is draft material. It is designed to accelerate analyst work, not to be deployed blindly. Review for false positives, environment-specific field names, generic strings, demo placeholders, and detection scope before production use.

## Privacy And Safety Limits

- No sample upload.
- No malware execution.
- No required APIs.
- No secrets in frontend code.
- No Google Analytics, ad trackers, or marketing pixels.
- Manual reputation links open only when clicked.
- Large inputs are capped to protect browser responsiveness.

## Future Ideas Not Implemented

Infrastructure-heavy or paid features remain outside the free static model: VM detonation, debugger integration, full disassembly/decompilation, live threat-intelligence APIs, cloud sample storage, collaborative case management, and enterprise telemetry ingestion.
