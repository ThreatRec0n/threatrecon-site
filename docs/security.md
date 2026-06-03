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
| Mixed-content / outbound beacons | CSP `connect-src 'none'`; no `fetch`/XHR/WebSocket exists in the code. |
| Supply-chain (third-party scripts) | No third-party scripts, CDNs, fonts, or trackers are loaded. All assets are local. |

Out of scope: the security of external pivot destinations (VirusTotal, Shodan, etc.).
Those open only on explicit user click in a new tab with `rel="noopener noreferrer"`.

## 2. Browser-only design

- Hashing uses the native `crypto.subtle` API (SHA-1, SHA-256).
- Entropy, IOC extraction, behavior/YARA matching, capability inference, scoring,
  and report generation are pure synchronous functions over in-memory strings.
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
connect-src 'none';
object-src 'none';
base-uri 'self';
form-action 'none';
frame-ancestors 'none';
upgrade-insecure-requests
```

Notes:

- `connect-src 'none'` is intentional — this build makes **no** API/network calls.
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

## 9. Responsible use

This tool is for education, research, and defensive security. Do not paste sensitive
data into any web tool. Do not upload live malware to a public deployment. Analyze
real samples only in isolated, controlled environments and in line with applicable law.
