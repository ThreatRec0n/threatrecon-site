# ThreatRecon feature upgrades

ThreatRecon is an advanced browser-based static malware triage and reverse engineering support workbench. These upgrades improve first-pass analysis without turning the site into a sandbox or adding backend execution.

## What was added

- **Static PE Triage**: local MZ/PE header detection, architecture hints, section names, section entropy, suspicious visible Windows APIs, and packer/compiler hints.
- **Script Analysis**: local indicators for PowerShell, JavaScript, VBScript, Batch, Python, HTA, and Office macro-style artifacts.
- **Reverse Engineering Guidance**: rule-based analyst next steps for PE files, scripts, credential access, ransomware, network IOCs, and suspicious behaviors.
- **Hunting Queries**: safe Splunk, Microsoft Defender KQL, and Elastic/Kibana query templates generated from extracted IOCs and suspicious commands.
- **Manual Reputation Pivot**: local links to VirusTotal, MalwareBazaar, ThreatFox, URLhaus, and OTX. Links open only when the analyst clicks them.
- **IOC CSV export**: `type,value,source,confidence,notes` for extracted indicators.
- **Blocklist export**: plain text plus CSV for external IPs, domains, URLs, and hashes, excluding private/link-local IP ranges.
- **Report upgrades**: executive summary, analyst confidence, key findings, likely category, technical indicators, behavior timeline, containment, hunting queries, reverse engineering guidance, dynamic handoff, and limitations.
- **Deobfuscation improvements**: additional handling for JavaScript `atob`, `String.fromCharCode`, char-code arrays, and simple reversal hints.

## What is local only

- File reading happens with browser APIs.
- Hashes, entropy, PE heuristics, script heuristics, IOC extraction, deobfuscation, reports, CSV, and blocklist exports are generated in the browser.
- Manual reputation links are rendered locally; ThreatRecon does not fetch or submit anything.

## What is not supported

- No malware execution.
- No detonation.
- No sample upload.
- No automatic reputation lookup.
- No paid API dependency.
- No full PE loader, disassembler, debugger, unpacker, or sandbox behavior tracing.

## Why this is not a sandbox

ThreatRecon performs static triage only. It cannot observe process creation, network callbacks, file writes, registry activity, persistence installation, anti-debug behavior, or payload unpacking at runtime. Use a dedicated malware sandbox or isolated reverse-engineering lab for authorized dynamic analysis.

## Analyst workflow

1. Paste suspicious text, logs, strings, command lines, or select a local text-like file.
2. Review score, IOCs, behaviors, entropy, script indicators, PE hints, and deobfuscated content.
3. Export IOC CSV or blocklist for defensive workflows.
4. Use Hunting Queries for SIEM/EDR pivoting.
5. Use Reverse Engineering Guidance to decide what to inspect in PEStudio, Detect It Easy, PE-bear, Ghidra, Cutter, CyberChef, FLOSS, or an internal sandbox.
6. Use Manual Reputation Pivot links only when authorized to submit or search the indicator externally.

## Security limitations

- Static heuristics can miss packed, encrypted, staged, or dynamically generated behavior.
- Section parsing is best-effort when content is available as browser text; it is not a full binary parser.
- Reports and exports may contain sensitive IOCs, paths, hashes, or investigation notes.
- Hosting infrastructure may still process standard access logs as described in the privacy page.
- The View Page Source decoy hides analyzer markup from raw HTML, but client JavaScript bundles are still visible in browser DevTools.
