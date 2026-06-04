# SEO and Security Notes

## SEO Metadata Added

- Site title and title template.
- Canonical URL for `https://threatrecon.io`.
- Search description for browser based static malware triage.
- Keyword metadata for malware triage, IOC extraction, MITRE ATT&CK, YARA, Sigma, detection engineering, reverse engineering support, and threat hunting.
- Open Graph metadata for link previews.
- Twitter card metadata for large preview cards.
- Real sitemap entries for public 200 routes.
- Robots rules for public indexing and non-public route exclusions.

## Structured Data Added

ThreatRecon.io includes static JSON-LD for:

- `SoftwareApplication`
- `WebSite`

The structured data describes ThreatRecon.io as a browser based static malware triage, detection engineering, and reverse engineering support workbench.

## Privacy Choices

ThreatRecon.io does not add Google Analytics, tracking pixels, marketing tags, or new third party scripts. Existing Vercel Web Analytics and Speed Insights remain limited to site usage and performance telemetry.

No personal details are included beyond the approved creator line shown on the site.

## Sitemap Submission

Submit:

```text
https://threatrecon.io/sitemap.xml
```

Use Google Search Console:

1. Add the `threatrecon.io` property.
2. Open Sitemaps.
3. Submit `https://threatrecon.io/sitemap.xml`.
4. Use URL Inspection for the home page and key policy pages.

Use Bing Webmaster Tools:

1. Add the `threatrecon.io` site.
2. Open Sitemaps.
3. Submit `https://threatrecon.io/sitemap.xml`.
4. Use URL Inspection for indexing status.

## Social Preview Testing

Use general Open Graph preview tools to verify:

- title
- description
- preview image
- canonical URL

Preview tools may cache old metadata. Re-scrape after deployment if the previous preview appears.
