# Deployment Guide

ThreatRecon.io is a Next.js site deployed on Vercel.

## Runtime Model

- The analyzer performs local static analysis in the browser.
- Files are not uploaded to ThreatRecon.io during local analysis workflows.
- The site does not require login or account creation.
- The site does not require paid APIs.
- Vercel Web Analytics and Speed Insights are used for site usage and performance telemetry.

## Build

```bash
npm install
npm run build
```

## Deploy

Use the default Vercel workflow for the connected repository.

Expected public routes:

- `/`
- `/about`
- `/security`
- `/legal`
- `/privacy`
- `/terms`
- `/robots.txt`
- `/sitemap.xml`

`/source` should remain removed and return `404`.

## Security Headers

Security headers are configured in `next.config.js`. Keep `connect-src` limited to the exact Vercel Analytics and Speed Insights endpoints already used by the site.

## Verification

After deployment:

- Home page loads.
- Analyzer loads.
- Demo remains `100/100` and `CRITICAL`.
- View Page Source shows the decoy and does not expose analyzer markup.
- `/source` returns `404`.
- `/robots.txt` returns `200`.
- `/sitemap.xml` returns `200`.
- Browser console has no CSP errors.
- No sample upload, login, account, paid API, or new tracking behavior is introduced.
