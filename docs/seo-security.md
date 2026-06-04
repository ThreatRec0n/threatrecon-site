# SEO and Security Notes

## SEO Metadata Added

- Site title and title template.
- Canonical URL for `https://www.threatrecon.io/`.
- Search description for browser based static malware triage.
- Keyword metadata for malware triage, IOC extraction, MITRE ATT&CK, YARA, Sigma, detection engineering, reverse engineering support, and threat hunting.
- Open Graph metadata for link previews.
- Twitter card metadata for large preview cards.
- Native `app/sitemap.js` entries for the public home, security, privacy, and legal routes.
- Native `app/robots.js` rules for public indexing.

## Structured Data Added

ThreatRecon.io includes static JSON-LD for:

- `WebApplication`

The structured data describes ThreatRecon.io as a browser based static malware triage and threat hunting training platform.

## Privacy Choices

ThreatRecon.io does not add Google Analytics, tracking pixels, marketing tags, or new third party scripts. Existing Vercel Web Analytics and Speed Insights remain limited to site usage and performance telemetry.

No personal details are included beyond the approved creator line shown on the site.

## Sitemap Submission

Submit:

```text
https://www.threatrecon.io/sitemap.xml
```

Use Google Search Console:

1. Add the `www.threatrecon.io` property.
2. Open Sitemaps.
3. Submit `https://www.threatrecon.io/sitemap.xml`.
4. Use URL Inspection for the home page and key policy pages.

Use Bing Webmaster Tools:

1. Add the `www.threatrecon.io` site.
2. Open Sitemaps.
3. Submit `https://www.threatrecon.io/sitemap.xml`.
4. Use URL Inspection for indexing status.

## Social Preview Testing

Use general Open Graph preview tools to verify:

- title
- description
- preview image
- canonical URL

Preview tools may cache old metadata. Re-scrape after deployment if the previous preview appears.
