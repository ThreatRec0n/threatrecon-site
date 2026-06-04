# Deployment Guide

This is a **static site with no build step**. Deploy the repository root as-is.
The only runtime requirement is that files are served over HTTP(S) (ES modules do
not load from `file://`).

Recommended host order for full security headers: **Cloudflare Pages** or **Netlify**
(both honor the `_headers` file). GitHub Pages works too, but cannot set custom
response headers — the meta-tag CSP fallback covers most of the policy there.

### Two deployment profiles

| Profile | Hosting | Enrichment | API keys |
| --- | --- | --- | --- |
| **Static-only (default)** | GitHub Pages, or any static host | Disabled — the "Enrich IOCs" button reports "unavailable" | None needed |
| **With enrichment (optional)** | **Cloudflare Pages** (preferred), Netlify, or Vercel | Enabled via the `/enrich` serverless function | Set as env vars (all optional) |

The local analyzer is identical in both profiles. Enrichment only adds the optional
`/enrich` proxy. **The site runs fully without any API keys.**

---

## 1. GitHub Pages

1. Create a repository on GitHub (see commands in the project README / chat output).
2. Push this project to the `main` branch.
3. In the repo: **Settings → Pages**.
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `/ (root)`
4. Save. Your site publishes at `https://<user>.github.io/<repo>/`.

### Custom domain (threatrecon.io) on GitHub Pages

1. **Settings → Pages → Custom domain** → enter `threatrecon.io` → Save.
   This commits a `CNAME` file to the repo.
2. At your DNS provider, point the apex domain to GitHub Pages:
   - `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - (optional) `AAAA` records to the GitHub Pages IPv6 set
   - For `www`, add a `CNAME` to `<user>.github.io`
3. Enable **Enforce HTTPS** once the certificate is issued.

### Headers GitHub Pages CANNOT set

GitHub Pages does **not** let you configure custom HTTP response headers, so the
`_headers` file is ignored there. As a result these are **not** sent as headers:

- `Content-Security-Policy` (a `<meta http-equiv>` fallback is included in `index.html`)
- `X-Content-Type-Options`, `Referrer-Policy` (a `<meta name="referrer">` partial fallback exists), `Permissions-Policy`
- `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- `X-Frame-Options` and CSP `frame-ancestors` (meta tags cannot set frame protections)

If you need the full header set, deploy to Cloudflare Pages or Netlify, or put
Cloudflare in front of GitHub Pages and add the headers via a Cloudflare
Transform Rule / Workers.

> **GitHub Pages = static-only mode.** There is no serverless runtime, so the
> `functions/enrich.js` proxy does not run and threat-intel enrichment is disabled.
> The client handles the missing endpoint gracefully ("enrichment unavailable;
> local analysis still completed"). Current Vercel deployments keep `connect-src`
> limited to exact Vercel Analytics / Speed Insights endpoints; local analyzer content
> is not sent to telemetry.

---

## 2. Cloudflare Pages (preferred for enrichment)

1. Push the project to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
4. Deploy. The included [`/_headers`](../_headers) file is applied automatically.
   The [`functions/enrich.js`](../functions/enrich.js) file is auto-detected as a
   Pages Function and served at **`/enrich`** — no extra config needed.

### Enabling enrichment on Cloudflare Pages

1. **Pages project → Settings → Environment variables** → add any of the keys below.
2. Redeploy. The "Enrich IOCs" button now queries the configured providers.
3. (Optional, durable rate-limit/cache) Create a KV namespace and bind it; extend
   `functions/enrich.js` to read/write KV instead of the in-memory maps.

### Custom domain (threatrecon.io) on Cloudflare Pages

1. **Pages project → Custom domains → Set up a domain** → `threatrecon.io`.
2. If the domain is already on Cloudflare DNS, records are added automatically;
   otherwise follow the prompts to update DNS. HTTPS is automatic.

---

## 3. Netlify

1. Push the project to a Git provider.
2. Netlify → **Add new site → Import an existing project**.
3. Build settings:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` (root)
4. Deploy. Netlify applies the [`/_headers`](../_headers) file automatically.

### Custom domain on Netlify

1. **Site configuration → Domain management → Add a custom domain** → `threatrecon.io`.
2. Point DNS to Netlify (or use Netlify DNS). HTTPS via Let's Encrypt is automatic.

> Drag-and-drop alternative: zip the project (or use the Netlify CLI `netlify deploy`)
> and drop it into the Netlify dashboard — still no build step.

### Enrichment on Netlify

Netlify Functions use a slightly different signature. Add a thin wrapper at
`netlify/functions/enrich.js` that adapts the Cloudflare handler, or port the body:

```js
// netlify/functions/enrich.js
import { onRequestPost } from '../../functions/enrich.js';
export const handler = async (event) => {
  const request = new Request('https://local/enrich', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body,
  });
  const res = await onRequestPost({ request, env: process.env });
  return { statusCode: res.status, headers: { 'Content-Type': 'application/json' }, body: await res.text() };
};
```

Add a redirect so the client's `/enrich` path resolves:

```
# netlify.toml
[[redirects]]
  from = "/enrich"
  to = "/.netlify/functions/enrich"
  status = 200
```

Set the same environment variables (below) under **Site settings → Environment variables**.

---

## 4. Vercel (optional, enrichment-capable)

Add `api/enrich.js` exporting a default handler that calls the shared logic, set the
env vars under **Project → Settings → Environment Variables**, and the client `/enrich`
path is served by the Vercel Function. Build command stays empty (static + functions).

---

## 5. Environment variables (all optional)

Set any subset. Each enables the matching provider; missing keys simply skip that
provider. **The site runs fully without any of them.** NVD works even with no key
(at a lower rate limit). Keys are server-side only and never reach the browser.

| Variable | Provider | Notes |
| --- | --- | --- |
| `MALWAREBAZAAR_API_KEY` | MalwareBazaar (abuse.ch) | Auth-Key; hash reputation, family, first seen, tags |
| `THREATFOX_API_KEY` | ThreatFox (abuse.ch) | Auth-Key; IOC reputation, family, confidence |
| `URLHAUS_API_KEY` | URLhaus (abuse.ch) | Auth-Key; malicious URL status, payload hash |
| `VIRUSTOTAL_API_KEY` | VirusTotal | Free public API (rate-limited); hash/URL/domain/IP lookups only — never file upload |
| `NVD_API_KEY` | NVD | Optional; raises rate limit for CVE enrichment |
| `OTX_API_KEY` | OTX AlienVault | Free API key; pulses/reputation for IP/domain/hash/URL |

> **NVD attribution (required):** "This product uses data from the NVD API but is not
> endorsed or certified by the NVD." (Shown in the enrichment panel.)

Do **not** add paid APIs and do **not** place keys in any client file, comment, or commit.

---

## 6. Verifying the deployment

After deploy, confirm:

- The page loads and the **DEMO → ANALYZE** flow produces a CRITICAL (100/100) score.
- During normal analysis the **Network** tab shows **no outbound API/XHR/fetch**
  requests (only static `html/css/js/svg` assets). A request to `/enrich` appears
  **only** if you click "Enrich IOCs".
- **Console** shows the ThreatRecon easter-egg banner and **no errors**.
- On Netlify/Cloudflare, **Network → response headers** include `Content-Security-Policy`,
  `X-Frame-Options`, etc.
- With no API keys set, clicking "Enrich IOCs" shows "enrichment unavailable" and the
  local report is unaffected. With keys set, provider result cards appear.

## 7. Path notes

All asset references in `index.html` are **relative** (`assets/...`, `favicon.svg`),
so the site works both at a root domain (`https://threatrecon.io/`) and under a
GitHub Pages subpath (`https://<user>.github.io/<repo>/`). `sitemap.xml` and
`robots.txt` reference the canonical root domain — update them if you host elsewhere.
