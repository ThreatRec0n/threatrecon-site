import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

const layout = read('../app/layout.js');
const page = read('../app/page.js');
const robots = read('../public/robots.txt');
const sitemap = read('../public/sitemap.xml');
const shell = read('../public/assets/js/threatReconBody.js');
const nextConfig = read('../next.config.js');

assert(layout.includes('ThreatRecon.io | Browser Based Malware Triage and Threat Hunting Lab'), 'metadata title missing');
assert(layout.includes('Analyze suspicious files locally in your browser with IOC extraction, strings analysis, entropy checks, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting.'), 'metadata description missing');
assert(layout.includes('metadataBase: new URL(siteUrl)'), 'metadata base missing');
assert(layout.includes('canonical: siteUrl'), 'canonical metadata missing');
assert(layout.includes('openGraph'), 'Open Graph metadata missing');
assert(layout.includes('twitter'), 'Twitter metadata missing');
assert(layout.includes('applicationName: "ThreatRecon.io"'), 'application name missing');
assert(layout.includes('"@type": "SoftwareApplication"'), 'SoftwareApplication JSON-LD missing');
assert(layout.includes('"@type": "WebSite"'), 'WebSite JSON-LD missing');
assert(layout.includes('type="application/ld+json"'), 'JSON-LD script tag missing');
assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(layout), 'layout must not contain email-style addresses');

assert(robots.includes('Allow: /'), 'robots allow missing');
assert(robots.includes('Sitemap: https://threatrecon.io/sitemap.xml'), 'robots sitemap missing');

['/', '/legal', '/privacy', '/terms', '/security', '/about'].forEach(path => {
  assert(sitemap.includes(`<loc>https://threatrecon.io${path === '/' ? '/' : path}</loc>`), `sitemap missing ${path}`);
});
assert(!sitemap.includes('/source'), 'sitemap must not include /source');

assert(page.includes('Analyze suspicious files locally in your browser.'), 'homepage source must expose crawler-readable hero copy');
assert(page.includes('Static Malware Analysis'), 'homepage source must expose static malware analysis copy');
assert(page.includes('IOC Extraction and Threat Hunting'), 'homepage source must expose IOC/threat hunting copy');
assert(page.includes('Known Limitations'), 'homepage source must expose known limitations copy');
assert(!page.includes('May the Sudo be with you!'), 'homepage source must not expose the old decoy as crawler copy');
assert(!page.includes('Analyzer Dashboard'), 'app/page.js must not expose stale analyzer wording');
assert(!page.includes('threatrecon-client-shell'), 'app/page.js must not expose client shell markup');

assert(shell.includes('Analyze suspicious files locally in your browser.'), 'client shell hero copy missing');
assert(shell.includes('How It Works'), 'how it works section missing');
assert(shell.includes('Static Malware Analysis'), 'static malware analysis heading missing');
assert(shell.includes('IOC Extraction and Threat Hunting'), 'IOC/threat hunting heading missing');
assert(shell.includes('Detection Engineering'), 'detection engineering heading missing');
assert(shell.includes('Reverse Engineering Support'), 'reverse engineering heading missing');
assert(shell.includes('Privacy and Safety'), 'privacy and safety heading missing');
assert(shell.includes('Static Malware Triage Walkthrough'), 'walkthrough section missing');
assert(shell.includes('Visual proof placeholders'), 'visual proof placeholders section missing');
assert(shell.includes('Defensive use disclaimer'), 'defensive use disclaimer missing');
assert(shell.includes('Known Limitations'), 'known limitations section missing');
assert(shell.includes('ThreatRecon.io provides static analysis assistance and analyst training workflows.'), 'known limitations copy missing');
assert(shell.includes('ThreatRecon.io was built by Andre Boone.'), 'approved creator line missing');
assert(!/LinkedIn|github\.com|Google Analytics|googletagmanager|gtag\(|tracking pixel/i.test(shell), 'unauthorized social or tracking text found in shell');

assert(nextConfig.includes("connect-src https://threatrecon.io/_vercel/insights/view https://threatrecon.io/_vercel/insights/event https://threatrecon.io/_vercel/insights/session https://threatrecon.io/_vercel/speed-insights/vitals"), 'connect-src must remain limited to Vercel telemetry endpoints');

assert(existsSync(new URL('../public/og-threatrecon.svg', import.meta.url)), 'OG image fallback missing');

console.log('SEO security OK — metadata, robots, sitemap, JSON-LD, OG, privacy, and crawler source checks passed.');
