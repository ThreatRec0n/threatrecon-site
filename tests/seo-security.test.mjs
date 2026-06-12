import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

const layout = read('../app/layout.js');
const page = read('../app/page.js');
const robots = read('../app/robots.js');
const sitemap = read('../app/sitemap.js');
const site = read('../app/site.js');
const structuredData = read('../app/structured-data.js');
const articles = read('../app/threat-kb/articles.js');
const analyzerPage = read('../app/analyzer/page.js');
const articlePage = read('../app/threat-kb/[slug]/page.js');
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
assert(!layout.includes('type="application/ld+json"'), 'layout should not emit route-specific JSON-LD globally');
assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(layout), 'layout must not contain email-style addresses');
assert(structuredData.includes('"@type": "WebSite"'), 'WebSite JSON-LD missing');
assert(structuredData.includes('"@type": "SoftwareApplication"'), 'SoftwareApplication JSON-LD missing');
assert(structuredData.includes('"@type": "Article"'), 'Article JSON-LD missing');
assert(structuredData.includes('"@type": "BreadcrumbList"'), 'BreadcrumbList JSON-LD missing');
assert(analyzerPage.includes('StructuredData data={analyzerStructuredData}'), 'analyzer structured data missing');
assert(articlePage.includes('StructuredData data={structuredData}'), 'article structured data missing');

assert(robots.includes('userAgent: "*"'), 'native robots user agent missing');
assert(robots.includes('allow: "/"'), 'native robots allow missing');
[
  '"/api/"',
  '"/admin/"',
  '"/private/"',
  '"/debug/"',
  '"/dev/"',
  '"/test/"',
  '"/internal/"',
  '"/staging/"',
  '"/preview/"',
  '"/drafts/"',
  '"/*.map$"',
].forEach(rule => {
  assert(robots.includes(rule), `native robots disallow missing ${rule}`);
});
assert(!robots.includes('"/_next/"'), 'robots must not block required Next.js static assets');
assert(robots.includes('sitemap: `${SITE_URL}/sitemap.xml`'), 'native robots sitemap missing');
assert(robots.includes('host: SITE_URL'), 'native robots host missing');
assert(sitemap.includes('publicRoutes'), 'sitemap must use shared public route registry');
assert(sitemap.includes('threatKbArticles'), 'sitemap must include Threat KB articles');
assert(sitemap.includes('priority: route.priority'), 'sitemap priorities missing');

[
  '/',
  '/about',
  '/analyzer',
  '/threat-kb',
  '/re-tools',
  '/cheat-sheet',
  '/sandboxes',
  '/security',
  '/privacy',
  '/legal',
  '/terms',
  '/threat-kb/lockbit',
  '/threat-kb/redline-stealer',
  '/threat-kb/qakbot',
  '/threat-kb/asyncrat',
  '/threat-kb/emotet',
].forEach(path => {
  const source = path.startsWith('/threat-kb/') ? articles : site;
  const expected = path.startsWith('/threat-kb/') ? `slug: "${path.split('/').pop()}"` : `path: "${path}"`;
  assert(source.includes(expected), `route registry missing ${path}`);
});
assert(!sitemap.includes('/source'), 'sitemap must not include /source');
assert(!sitemap.includes('/api/'), 'sitemap must not include API routes');
assert(!sitemap.includes('/admin/'), 'sitemap must not include admin routes');

assert(page.includes('Analyze suspicious files locally in your browser.'), 'homepage source must expose crawler-readable hero copy');
assert(page.includes('Static Malware Analysis'), 'homepage source must expose static malware analysis copy');
assert(page.includes('IOC Extraction and Threat Hunting'), 'homepage source must expose IOC/threat hunting copy');
assert(page.includes('Manual threat-intelligence pivots'), 'homepage source must expose manual threat-intelligence pivot copy');
['VirusTotal', 'MalwareBazaar', 'URLhaus', 'AlienVault OTX', 'ThreatFox', 'AbuseIPDB', 'GreyNoise'].forEach(provider => {
  assert(page.includes(provider), `homepage source must mention ${provider}`);
});
assert(page.includes('without automatic IOC submission'), 'homepage source must mention no automatic IOC submission');
assert(page.includes('Privacy and Safety'), 'homepage source must expose privacy and safety copy');
assert(page.includes('Static Malware Triage Walkthrough'), 'homepage source must expose walkthrough copy');
assert(page.includes('Visual proof placeholders'), 'homepage source must expose visual proof placeholder copy');
assert(page.includes('Defensive use disclaimer'), 'homepage source must expose defensive use disclaimer copy');
assert(page.includes('Known Limitations'), 'homepage source must expose known limitations copy');
assert(page.includes('linkedRoutes.map'), 'homepage source must render public route links from registry');
assert(!page.includes('May the Sudo be with you!'), 'homepage source must not expose the old decoy as crawler copy');
assert(!page.includes('Analyzer Dashboard'), 'app/page.js must not expose stale analyzer wording');
assert(!page.includes('threatrecon-client-shell'), 'app/page.js must not expose client shell markup');

assert(shell.includes('Analyze suspicious files locally in your browser.'), 'client shell hero copy missing');
assert(shell.includes('How It Works'), 'how it works section missing');
assert(shell.includes('Static Malware Analysis'), 'static malware analysis heading missing');
assert(shell.includes('IOC Extraction and Threat Hunting'), 'IOC/threat hunting heading missing');
assert(shell.includes('Manual threat-intelligence pivots'), 'client shell manual pivot copy missing');
['VirusTotal', 'MalwareBazaar', 'URLhaus', 'AlienVault OTX', 'ThreatFox', 'AbuseIPDB', 'GreyNoise'].forEach(provider => {
  assert(shell.includes(provider), `client shell must mention ${provider}`);
});
assert(shell.includes('without automatic IOC submission'), 'client shell must mention no automatic IOC submission');
assert(shell.includes('Threat Intel Pivots'), 'client shell Threat Intel Pivots section missing');
assert(shell.includes('Detection Engineering'), 'detection engineering heading missing');
assert(shell.includes('Reverse Engineering Support'), 'reverse engineering heading missing');
assert(shell.includes('Privacy and Safety'), 'privacy and safety heading missing');
assert(shell.includes('Static Malware Triage Walkthrough'), 'walkthrough section missing');
assert(shell.includes('Visual proof placeholders'), 'visual proof placeholders section missing');
assert(shell.includes('Defensive use disclaimer'), 'defensive use disclaimer missing');
assert(shell.includes('Known Limitations'), 'known limitations section missing');
assert(shell.includes('ThreatRecon.io provides static analysis assistance and analyst training workflows.'), 'known limitations copy missing');
assert(shell.includes('ThreatRecon.io was built by Andre Boone.'), 'approved creator line missing');
['href="/analyzer"', 'href="/threat-kb"', 'href="/re-tools"', 'href="/cheat-sheet"', 'href="/sandboxes"', 'href="/about"', 'href="/security"'].forEach(link => {
  assert(shell.includes(link), `client shell missing crawlable link ${link}`);
});
assert(!/LinkedIn|github\.com|Google Analytics|googletagmanager|gtag\(|tracking pixel/i.test(shell), 'unauthorized social or tracking text found in shell');

assert(nextConfig.includes("connect-src https://www.threatrecon.io/_vercel/insights/view https://www.threatrecon.io/_vercel/insights/event https://www.threatrecon.io/_vercel/insights/session https://www.threatrecon.io/_vercel/speed-insights/vitals"), 'connect-src must remain limited to exact Vercel telemetry endpoints');

assert(existsSync(new URL('../public/og-threatrecon.svg', import.meta.url)), 'OG image fallback missing');

console.log('SEO security OK — metadata, robots, sitemap, JSON-LD, OG, privacy, and crawler source checks passed.');
