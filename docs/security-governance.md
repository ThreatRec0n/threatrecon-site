# Security governance — ThreatRecon.io

Governance aligned with NIST SSDF-style secure development: define requirements, implement safely, verify, and respond to issues — without claiming the site is “unhackable.”

## Secure design statement

- Browser-only static analysis by default; no sample execution; no backend analysis.
- No secrets in frontend code, HTML, or client bundles.
- CSP `connect-src` is limited to exact Vercel Analytics / Speed Insights endpoints; no malware-analysis API calls are permitted by default.
- Privacy-conscious: no intentional collection of pasted samples or reports (see `/privacy`).

## Dependency management

1. Pin dependencies via `package-lock.json`.
2. Before release: `npm run security:audit` (and remediate or document accepted risk).
3. Prefer minimal dependencies (Next.js, React only for the shell).
4. No third-party analytics or ad scripts unless explicitly approved and documented.

## Change control

- Changes land via Git commits with descriptive messages.
- Production deploys through Vercel from the connected repository.
- Security-sensitive changes require header/CSP review in `next.config.js`.

## Vulnerability review checklist

- [ ] `npm audit` — no unmitigated high/critical in production deps
- [ ] `npm run security:grep` — review any matches (document false positives)
- [ ] CSP unchanged or stricter (only exact Vercel telemetry endpoints in `connect-src`)
- [ ] No new `eval`, `Function`, or unsafe HTML injection of user content
- [ ] File upload gate still local-only with size/extension limits
- [ ] Demo still scores 100/100 CRITICAL (regression check)
- [ ] No personal identifiers or public GitHub repo links in UI

## Responsible-use policy

- Public copy on `/legal` and `/terms`.
- Educational and defensive use only; authorization required; acceptable-use prohibitions listed.

## Privacy review checklist

- [ ] `/privacy` accurate for current behavior
- [ ] No new trackers or analytics without privacy page update first
- [ ] Hosting log disclosure remains accurate
- [ ] External sandbox handoff warnings still present

## Release checklist

1. `npm install`
2. `npm run security:audit`
3. `npm run build`
4. Manual smoke: home, analyzer, demo, exports, dynamic analysis card, legal/privacy/terms
5. Confirm footer has no GitHub or personal attribution
6. Deploy to Vercel; verify response headers in production

## Legal limitation

Policy pages reduce risk but do not replace counsel. Have an attorney review Terms, Privacy, and Responsible Use language for commercial or regulated use.
