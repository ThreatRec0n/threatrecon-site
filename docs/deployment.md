# Deployment Guide

This is a **static site with no build step**. Deploy the repository root as-is.
The only runtime requirement is that files are served over HTTP(S) (ES modules do
not load from `file://`).

Recommended host order for full security headers: **Cloudflare Pages** or **Netlify**
(both honor the `_headers` file). GitHub Pages works too, but cannot set custom
response headers — the meta-tag CSP fallback covers most of the policy there.

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

---

## 2. Cloudflare Pages

1. Push the project to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
4. Deploy. The included [`/_headers`](../_headers) file is applied automatically.

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

---

## 4. Verifying the deployment

After deploy, confirm:

- The page loads and the **DEMO → ANALYZE** flow produces a CRITICAL score.
- Browser devtools **Network** tab shows **no outbound API/XHR/fetch** requests
  (only the static `html/css/js/svg` assets).
- **Console** shows the ThreatRecon easter-egg banner and **no errors**.
- On Netlify/Cloudflare, **Network → response headers** include `Content-Security-Policy`,
  `X-Frame-Options`, etc.

## 5. Path notes

All asset references in `index.html` are **relative** (`assets/...`, `favicon.svg`),
so the site works both at a root domain (`https://threatrecon.io/`) and under a
GitHub Pages subpath (`https://<user>.github.io/<repo>/`). `sitemap.xml` and
`robots.txt` reference the canonical root domain — update them if you host elsewhere.
