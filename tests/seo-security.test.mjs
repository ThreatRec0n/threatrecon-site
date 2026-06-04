import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

const layout = read('../app/layout.js');
const page = read('../app/page.js');
const robots = read('../app/robots.js');
const sitemap = read('../app/sitemap.js');
const shell = read('../public/assets/js/threatReconBody.js');
const nextConfig = read('../next.config.js');

assert(layout.includes('ThreatRecon.io | Browser Based Malware Triage and Threat Hunting Lab'), 'metadata title missing');
assert(layout.includes('Analyze suspicious files locally in your browser with IOC extraction, strings analysis, entropy checks, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting.'), 'metadata description missing');
assert(layout.includes('metadataBase: new URL(siteUrl)'), 'metadata base missing');
assert(layout.includes('const siteUrl = "https://www.threatrecon.io"'), 'metadata base must use www production origin');
assert(layout.includes('canonical: `${siteUrl}/`'), 'canonical metadata missing');
assert(layout.includes('openGraph'), 'Open Graph metadata missing');
assert(layout.includes('twitter'), 'Twitter metadata missing');
assert(layout.includes('applicationName: "ThreatRecon.io"'), 'application name missing');
assert(layout.includes('"@type": "WebApplication"'), 'WebApplication JSON-LD missing');
assert(!layout.includes('"@type": "WebSite"'), 'JSON-LD should not add extra website entity');
assert(layout.includes('type="application/ld+json"'), 'JSON-LD script tag missing');
assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(layout), 'layout must not contain email-style addresses');

assert(robots.includes('userAgent: "*"'), 'native robots user agent missing');
assert(robots.includes('allow: "/"'), 'native robots allow missing');
assert(robots.includes('sitemap: "https://www.threatrecon.io/sitemap.xml"'), 'native robots sitemap missing');

['/', '/security', '/privacy', '/legal'].forEach(path => {
  assert(sitemap.includes(`url: \`${"${baseUrl}"}${path === '/' ? '/' : path}\``), `sitemap missing ${path}`);
});
assert(!sitemap.includes('/source'), 'sitemap must not include /source');
assert(!sitemap.includes('/about'), 'sitemap should only include requested public policy routes');
assert(!sitemap.includes('/terms'), 'sitemap should only include requested public policy routes');

assert(page.includes('Analyze suspicious files locally in your browser.'), 'homepage source must expose crawler-readable hero copy');
assert(page.includes('Static Malware Analysis'), 'homepage source must expose static malware analysis copy');
assert(page.includes('IOC Extraction and Threat Hunting'), 'homepage source must expose IOC/threat hunting copy');
assert(page.includes('Privacy and Safety'), 'homepage source must expose privacy and safety copy');
assert(page.includes('Static Malware Triage Walkthrough'), 'homepage source must expose walkthrough copy');
assert(page.includes('Visual proof placeholders'), 'homepage source must expose visual proof placeholder copy');
assert(page.includes('Defensive use disclaimer'), 'homepage source must expose defensive use disclaimer copy');
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

assert(nextConfig.includes("connect-src https://www.threatrecon.io/_vercel/insights/view https://www.threatrecon.io/_vercel/insights/event https://www.threatrecon.io/_vercel/insights/session https://www.threatrecon.io/_vercel/speed-insights/vitals"), 'connect-src must remain limited to exact Vercel telemetry endpoints');

assert(existsSync(new URL('../public/og-threatrecon.svg', import.meta.url)), 'OG image fallback missing');

console.log('SEO security OK — metadata, robots, sitemap, JSON-LD, OG, privacy, and crawler source checks passed.');
