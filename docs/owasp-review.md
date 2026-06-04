# OWASP Top 10 review — ThreatRecon.io

ThreatRecon is a browser-only static malware triage workbench deployed on Vercel (Next.js). This document maps the public site against the [OWASP Top 10](https://owasp.org/www-project-top-ten/) baseline. Deeper verification should follow [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/); secure-development governance aligns with [NIST SSDF](https://csrc.nist.gov/projects/ssdf) practices.

**Posture:** production-hardened, privacy-conscious, OWASP-aligned — not “unhackable.”

## A01 — Broken Access Control

| Check | Status |
|-------|--------|
| No login or user accounts | Yes |
| No protected objects or admin panels | Yes |
| Legal/privacy/terms are public by design | Yes |
| No sensitive server routes exposing private data | Yes (no API routes for analysis) |

## A02 — Cryptographic Failures

| Check | Status |
|-------|--------|
| No sensitive data stored server-side by the app | Yes |
| HTTPS via hosting (Vercel) | Yes |
| MD5/SHA-1/SHA-256 used for triage metadata only | Yes |
| MD5 not used as an authentication or integrity control | Yes |

## A03 — Injection

| Check | Status |
|-------|--------|
| No `eval` or `Function` constructor | Yes |
| User/decoded content rendered via `escapeHtml` / `textContent` in `app.js` | Yes |
| Static shell uses `dangerouslySetInnerHTML` for fixed template only (`threatReconBody.js` → `ThreatReconClientApp.jsx`; SSR decoy is separate) | Documented |
| Custom regex errors shown as text | Yes |

## A04 — Insecure Design

| Check | Status |
|-------|--------|
| No sample execution or detonation | Yes |
| No automatic upload to third parties | Yes |
| Sandbox links are manual handoff only | Yes |
| Threat model in `docs/security.md` | Yes |

## A05 — Security Misconfiguration

| Check | Status |
|-------|--------|
| Strict CSP and security headers in `next.config.js` | Yes |
| `connect-src` limited to exact Vercel Analytics / Speed Insights endpoints | Yes |
| `productionBrowserSourceMaps: false` | Yes |
| No debug endpoints or exposed `.env` in frontend | Yes |

## A06 — Vulnerable and Outdated Components

| Check | Status |
|-------|--------|
| `package-lock.json` committed | Yes |
| No CDN runtime scripts | Yes |
| Run `npm audit` before releases | Process |

## A07 — Identification and Authentication Failures

| Check | Status |
|-------|--------|
| No auth system | N/A |
| If auth is added later: secure cookies/sessions required | Future |

## A08 — Software and Data Integrity Failures

| Check | Status |
|-------|--------|
| Dependencies from npm lockfile | Yes |
| No third-party runtime JS on pages | Yes |
| Build/deploy via Git → Vercel | Yes |

## A09 — Security Logging and Monitoring Failures

| Check | Status |
|-------|--------|
| App does not log analysis content server-side | Yes |
| Hosting access logs may exist (Vercel) | Disclosed on `/privacy` |
| No intentional collection of pasted samples | Yes |

## A10 — Server-Side Request Forgery (SSRF)

| Check | Status |
|-------|--------|
| No server-side fetch of user-supplied URLs | Yes |
| No API routes processing user URLs | Yes |
| External links are user-initiated navigation only | Yes |
| CSP `connect-src` does not allow user-supplied URLs or third-party malware-analysis APIs | Yes |

## Review cadence

- Re-run this checklist on major releases.
- Run `npm run security:audit` and `npm run security:grep`.
- Update `/legal` and `/privacy` if site behavior changes.
