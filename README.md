# ThreatRecon Malware Triage Workbench

ThreatRecon.io is an advanced browser based static malware triage, detection engineering, and reverse engineering support workbench.

The analyzer is designed for local static analysis in the browser. Files are not uploaded to ThreatRecon.io during local analysis workflows, samples are not executed, and the site does not require account creation or login.

## Features

- Static malware triage for suspicious scripts, logs, command lines, IOCs, and text artifacts.
- Local MD5, SHA-1, and SHA-256 hashing.
- IOC extraction for IPs, URLs, domains, onion addresses, hashes, email indicators, registry keys, file paths, BTC addresses, and CVEs.
- Behavior scoring, MITRE ATT&CK mapping, strings intelligence, deobfuscation previews, and entropy checks.
- Draft YARA and Sigma output for analyst review.
- Detection engineering output for Splunk, Defender KQL, Elastic, DNS, firewall, and EDR workflows.
- Analyst reports and local exports for JSON, Markdown, IOC CSV, blocklists, YARA drafts, and Sigma drafts.
- Manual external reputation and sandbox pivot links.

## Security Model

- Static analysis only.
- No malware execution or detonation.
- No backend sample upload workflow.
- No account system.
- No login system.
- No intentional collection of submitted samples.
- Vercel Web Analytics and Speed Insights are used for site usage and performance telemetry.
- External reputation and sandbox destinations open only when the user clicks a link.

## Project Structure

```text
/app                    Next.js App Router pages and layout
/components             Shared page components
/public/assets          Client analyzer assets
/docs                   Project documentation
/tests                  Regression tests
/next.config.js         Security headers and Next.js configuration
```

## Run Locally

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run build
npm test
npm audit
```

## Responsible Use

ThreatRecon.io is built for defensive security education, malware triage practice, and analyst workflow training. Users are responsible for using the platform legally and ethically.
