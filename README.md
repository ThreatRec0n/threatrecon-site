# ThreatRecon Malware Triage Workbench

A **free, browser-based malware triage and threat-intelligence workbench** for static analysis, IOC extraction, behavior mapping, YARA-style matching, deobfuscation, MITRE ATT&CK mapping, and analyst report generation.

Everything runs **locally in your browser**. There is no backend, no API, no sample upload, and no recurring cost.

> Static analysis only. No detonation. No exfiltration. No cloud calls.

---

## Features

- **Paste / Upload / IOC input** — analyze pasted text, an uploaded text/script/log file, or a single indicator.
- **Hashing (all local, all real)** — MD5 (bundled RFC 1321 implementation, `assets/js/md5.js`), SHA-1, and SHA-256 (browser SubtleCrypto). All three are genuinely computed from the input bytes; none are faked or approximated. MD5 correctness is verified by `tests/md5.test.mjs`.
- **IOC extraction** — IPs, URLs, domains, onion addresses, MD5/SHA-1/SHA-256, emails, registry keys, file paths, BTC addresses, and CVEs, each with safe click-to-pivot links.
- **Behavioral rules** — 50+ regex rules across execution, LOLBins, persistence (Windows + Linux), defense evasion, injection, credential access, impact, C2, and resource hijacking.
- **YARA-style local regex rules** — 17 built-in signatures plus your own custom regex/keyword patterns (regex matching only — not a real YARA engine).
- **Optional threat-intel enrichment** — off by default. A manual "Enrich IOCs" button can query free/free-tier providers (MalwareBazaar, ThreatFox, URLhaus, VirusTotal, NVD, OTX) **through a same-origin serverless proxy** that holds the API keys. Local analysis works 100% without it. See [`docs/deployment.md`](./docs/deployment.md).
- **MITRE ATT&CK mapping** — findings mapped to 40+ techniques with direct links.
- **Shannon entropy** — packing/encryption indicator with thresholds.
- **String classification** — network / crypto / evasion / suspicious buckets.
- **Capabilities & malware-type inference** — high-level capability tags and a best-effort family/type classification.
- **Deobfuscation** — Base64, ROT13, hex (`\xNN` and `0xNN`), URL/percent, and PowerShell `-EncodedCommand` (UTF-16LE), with multi-layer detection. Decoded output is displayed **inert** and is never executed.
- **Analyst report** — structured: executive summary, technical findings, malware type, capability summary, ATT&CK mapping, IOCs, deobfuscated content, recommended response actions, and a limitations statement.
- **Analysis modes** — Quick scan, Deep scan, IOC-only, and Script deobfuscation.
- **Exports** — JSON, Markdown, YARA-style rules, copy-all-IOCs, and copy-report.
- **Reference content** — Threat KB, RE tool reference, analyst cheat sheet, and a free sandbox directory.

## Security model (summary)

- **Browser-only by default.** No server-side code is required for analysis. The smallest attack surface is the one that never runs the sample.
- **No automatic network calls.** Local analysis makes zero requests. CSP `connect-src 'self'` permits only the optional, manual, same-origin enrichment proxy — never third-party APIs from the browser.
- **No execution.** No `eval`, no `Function()` constructor, no injection of user input as script.
- **No upload / no storage.** Files are read locally with `FileReader`; nothing is sent or persisted. Enrichment sends only extracted IOCs (never files or full sample text), and never private IPs, registry keys, file paths, or emails.
- **API keys are server-side only.** Keys live in serverless environment variables — never in frontend JS/HTML/comments/console/storage/repo.
- **XSS-safe rendering.** All user-controlled data (IOCs, decoded blobs, custom patterns, strings, file names, enrichment results) is HTML-escaped before insertion, and the report is written with `textContent`.
- **Hardening headers** shipped in [`_headers`](./_headers) for Netlify / Cloudflare Pages, plus a meta CSP fallback for GitHub Pages.

Full details: [`docs/security.md`](./docs/security.md).

## No required API cost

The core tool has no paid APIs, no required API keys, no backend, and no cloud sample storage. External links (VirusTotal, Shodan, sandboxes, etc.) are **pivot links** that only open when you click them — nothing is auto-fetched. Optional enrichment uses only free/free-tier providers and is disabled unless you deploy the serverless proxy and configure keys.

## Project structure

```
/index.html              Single-page app shell (all sections)
/assets/css/style.css    Theme + responsive styles
/assets/js/app.js        Orchestration, rendering, scoring, exports, enrichment client (ES module)
/assets/js/rules.js      Behavior rules, YARA signatures, MITRE map, KB/tool data, demo sample
/assets/js/utils.js      SHA hashing, entropy, decoders, escaping, IOC/string extraction
/assets/js/md5.js        Local RFC 1321 MD5 implementation (real, computed locally)
/assets/img/             Image assets
/functions/enrich.js     Optional serverless enrichment proxy (Cloudflare Pages Function)
/tests/md5.test.mjs      MD5 RFC 1321 test vectors (node tests/md5.test.mjs)
/favicon.svg             Site icon
/_headers                Security headers for Netlify / Cloudflare Pages
/robots.txt              Crawler directives
/sitemap.xml             Sitemap
/docs/security.md        Threat model & hardening (incl. enrichment data policy)
/docs/deployment.md      Deployment guides (static-only + enrichment)
/README.md               This file
/LICENSE                 MIT + safety disclaimer
```

## Run locally

This is a static site, but the JavaScript uses ES modules, so it must be served over HTTP (opening `index.html` via `file://` will not load the modules). Use any static server:

```bash
# Python 3 (no install needed on most systems)
python -m http.server 8080

# or Node
npx serve -l 8080 .
```

Then open `http://localhost:8080/`. Local analysis works fully here; the optional
"Enrich IOCs" button will report "unavailable" because a static server has no `/enrich`
function (this is expected and non-breaking).

Run the MD5 test suite:

```bash
node tests/md5.test.mjs   # or: npm test
```

## Deployment

No build step is required — deploy the repository root as-is. See [`docs/deployment.md`](./docs/deployment.md) for GitHub Pages, Cloudflare Pages, Netlify, and connecting `threatrecon.io`.

## Legal / safety disclaimer

For educational, research, and defensive security use only. This tool performs **static analysis only** and never executes, detonates, or uploads any sample. Do not paste sensitive data. Do not upload live malware to a public deployment. Handle malware samples only in controlled, isolated environments and in compliance with applicable laws. Provided "as is" with no warranty (see [`LICENSE`](./LICENSE)).
