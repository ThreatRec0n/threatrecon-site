# Security Model — ThreatRecon Malware Triage Workbench

This document describes the threat model, design guarantees, and hardening of the
workbench. The guiding principle: **the safest malware lab is the one that never
executes the sample and never phones home.**

## 1. Threat model

| Concern | Mitigation |
| --- | --- |
| Server compromise / data leak | There is **no server**. The app is 100% static files served to the browser. |
| Sample exfiltration | No upload path exists. Files are read with `FileReader`; nothing is transmitted. |
| Sample storage / retention | Nothing is persisted. A page reload discards all state. |
| Arbitrary code execution from a sample | The app never `eval`s, compiles, or executes input. Decoders only transform text. |
| Stored/Reflected XSS via malicious input | All user-controlled data is HTML-escaped before DOM insertion; the report uses `textContent`. |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`. |
| Mixed-content / outbound beacons | CSP `connect-src 'self'`; the only possible `fetch` is a **manual** call to the same-origin enrichment proxy. No third-party host can be contacted from the browser. |
| Supply-chain (third-party scripts) | No third-party scripts, CDNs, fonts, or trackers are loaded. All assets are local. |
| API key leakage | Keys live only in serverless environment variables, never in frontend JS/HTML/comments/console/localStorage/repo. |

Out of scope: the security of external pivot destinations (VirusTotal, Shodan, etc.).
Those open only on explicit user click in a new tab with `rel="noopener noreferrer"`.

## 2. Browser-only design

- Hashing is **100% local**: SHA-1 and SHA-256 use the native `crypto.subtle` API;
  MD5 uses a small, bundled RFC 1321 implementation (`assets/js/md5.js`). All three
  hash the UTF-8 bytes of the input. **No fake/surrogate hashes are ever shown** —
  the previous truncated-SHA-1 "MD5" placeholder has been removed entirely. MD5
  correctness is verified against RFC 1321 test vectors (`tests/md5.test.mjs`).
- Entropy, IOC extraction, behavior/YARA-style regex matching, capability inference,
  scoring, and report generation are pure synchronous functions over in-memory strings.
- Decoding (Base64, ROT13, hex, URL, PowerShell EncodedCommand) transforms text and
  returns plain strings. There is **no execution path** for decoded content.

## 3. No-execution guarantee

- **No `eval()`** anywhere in the codebase.
- **No `Function()` constructor** anywhere in the codebase.
- Custom YARA patterns are compiled only via `new RegExp(pattern, 'i')` inside a
  `try/catch`; an invalid pattern is skipped, never executed as code.
- Uploaded files are read with `FileReader.readAsText()` — they are treated as inert text.

## 4. XSS prevention

A single `escapeHtml()` helper (in `assets/js/utils.js`) escapes `& < > " '`. It is
applied to every untrusted value before `innerHTML` insertion, including:

- IOC values and the URLs built from them (URLs additionally use `encodeURIComponent`).
- YARA match names/descriptions (including user-supplied custom pattern text).
- Decoded/deobfuscated blobs (raw and decoded).
- Classified strings.
- Uploaded file names (also rendered via `textContent` in the load confirmation).
- Knowledge-base, tool, cheat-sheet, and sandbox card content.

The analyst report is rendered with `textContent` only, so it can never be parsed as HTML.

## 5. File upload restrictions (File Safety Gate)

Enforced in `handleFile()`:

- **Max size:** 1 MB (`MAX_UPLOAD_BYTES`). Larger files are rejected with a message.
- **Allowed extensions:** `txt, log, ps1, bat, cmd, sh, py, js, vbs, php, rb, pl, conf, json, xml, ini, csv, yar`.
- **Blocked extensions:** `exe, dll, bin, com, msi, sys, scr, jar, iso, img, docm, xlsm, zip, 7z, rar` (and anything not on the allow list).
- Blocked uploads show a clear, escaped warning and load nothing.
- Files are read as text only and are never uploaded or stored.

## 6. Content-Security-Policy

Shipped two ways:

1. **HTTP header** via [`/_headers`](../_headers) (Netlify / Cloudflare Pages).
2. **`<meta http-equiv>`** fallback in `index.html` for hosts that cannot set headers.

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

Notes:

- `connect-src 'self'` permits **only** the same-origin enrichment proxy (`/enrich`).
  The browser can never contact a third-party API directly. Local analysis still
  makes zero network calls; enrichment is manual-only (a button). For a pure static
  GitHub Pages deployment you may tighten this to `connect-src 'none'` — enrichment
  will then simply report "unavailable" and local analysis is unaffected.
- `style-src` allows `'unsafe-inline'` because the UI uses some inline `style`
  attributes for dynamic bars/colors. No inline **scripts** or inline event handlers
  are used, so `script-src 'self'` (without `'unsafe-inline'`) is sufficient and strict.
- `frame-ancestors` and `X-Frame-Options` only take effect via real HTTP headers
  (meta tags cannot set them) — deploy with `/_headers` or an equivalent for full effect.

## 7. Recommended security headers

Send all of these at the edge (see `/_headers`):

- `Content-Security-Policy` (above)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `X-Frame-Options: DENY`

## 8. Safe handling of user input — checklist

- [x] Escape before `innerHTML`.
- [x] Prefer `textContent` for large/free-form text (report, file-load status).
- [x] `encodeURIComponent` for values placed into URLs.
- [x] `rel="noopener noreferrer"` + `target="_blank"` on every external link.
- [x] No inline event handlers (all wired via `addEventListener`).
- [x] No `eval` / `Function`.
- [x] No third-party script or font loads.

## 9. Optional threat-intel enrichment

Enrichment is **opt-in and off by default**. The local analyzer works 100% without it.

### 9.1 Two modes

- **Local-only mode (default):** No network calls. All hashing, IOC extraction,
  behavior/YARA-style matching, scoring, and reporting happen in the browser. This is
  *local static analysis*, not live threat intelligence.
- **Enrichment mode (optional):** Only when the user clicks **"Enrich IOCs"**, the
  browser POSTs a small JSON payload of *extracted IOCs* to a **same-origin** serverless
  proxy (`/enrich`). The proxy holds the API keys and queries allowlisted providers
  server-side, then returns normalized results.

### 9.2 What is sent during enrichment

Only extracted indicators, after validation and safety filtering:

- SHA-256, SHA-1, MD5 (all real, locally computed)
- URLs
- Domains (excluding `example.com/.net/.org`, `localhost`, `.test/.invalid` unless demo mode)
- **Public** IPv4 only
- CVE IDs
- `.onion` addresses

### 9.3 What is NEVER sent

- The full pasted sample or any uploaded file content
- Decoded/deobfuscated payload bodies
- Private/reserved IPs: `10/8`, `172.16/12`, `192.168/16`, `127/8`, `169.254/16`, `::1`, `fc00::/7`, `fe80::/10`
- RFC 5737 documentation/test IPs (`192.0.2/24`, `198.51.100/24`, `203.0.113/24`) — skipped unless demo mode
- Email addresses (no email enrichment feature is built)
- Registry keys and file paths
- Bitcoin addresses

Filtering is applied **both** client-side (before sending) and server-side (defense in depth).

### 9.4 API keys

API keys are stored **only** as serverless environment variables on the deployment
platform (Cloudflare/Netlify/Vercel). They never appear in frontend JavaScript, HTML,
comments, console logs, `localStorage`, `sessionStorage`, or the git repository. The
proxy never returns keys to the client.

### 9.5 Proxy hardening (`functions/enrich.js`)

- **Allowlisted providers only:** MalwareBazaar, ThreatFox, URLhaus (abuse.ch),
  VirusTotal, NVD, OTX AlienVault. No paid APIs. No arbitrary URLs.
- **Per-IP rate limiting** (best-effort in-memory; bind KV for durability).
- **Request size limit** (16 KB) and **per-type IOC caps** (15).
- **IOC type validation** via strict regex before any upstream call.
- **Per-provider timeouts** (6 s) via `AbortController`; provider errors are isolated
  and returned as `error` cards without breaking the response.
- **In-memory caching** (10 min TTL) to respect free-tier fair-use limits.
- Results are labeled with **source name and timestamp** and include
  `hit` / `not_found` / `error` / `skipped` states.

### 9.6 Limitations

- Enrichment results are **third-party intelligence and not absolute truth**; corroborate
  independently before acting.
- abuse.ch APIs require an Auth-Key under their fair-use community terms; VirusTotal/OTX
  free tiers are rate-limited; NVD works without a key at a lower rate limit.
- NVD attribution (required): *"This product uses data from the NVD API but is not
  endorsed or certified by the NVD."*
- Static analysis cannot observe runtime behavior, decrypt packed payloads, or attribute
  threat actors. Family/type labels are heuristic and require dynamic-analysis validation.

## 10. Responsible use

This tool is for education, research, and defensive security. Do not paste sensitive
data into any web tool. Do not upload live malware to a public deployment. Analyze
real samples only in isolated, controlled environments and in line with applicable law.
