import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git", "scripts", "docs", "tests", "functions"]);
const SKIP_FILES = new Set(["package-lock.json"]);
const APPROVED_CREATOR_LINE = "ThreatRecon.io was built by Andre Boone.";
const PATTERNS = [
  /md5sim/i,
  /surrogate/i,
  /truncated SHA/i,
  /fake MD5/i,
  /api_key/i,
  /\bsecret\b/i,
  /\btoken\b/i,
  /\bpassword\b/i,
  /PRIVATE KEY/i,
  /dangerouslySetInnerHTML/,
  /\beval\s*\(/,
  /new Function/,
  /document\.write/i,
  /github\.com\/[^/\s]+\/threatrecon-site/i,
  /https?:\/\/(?:www\.)?(?:github|linkedin|twitter|x|facebook|instagram)\.com/i,
  /Google Analytics|googletagmanager|gtag\(|analytics\.js|tracking pixel|pixel\.gif/i,
  /\b(veteran|military|army|clearance|resume|school|university|college)\b/i,
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
  /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/,
];

async function walk(dir, hits) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(full, hits);
      continue;
    }
    if (SKIP_FILES.has(ent.name)) continue;
    let text;
    try {
      text = await readFile(full, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    const scanText = text.replaceAll(APPROVED_CREATOR_LINE, "");
    for (const rx of PATTERNS) {
      if (rx.test(scanText)) hits.push({ file: rel, pattern: rx.source });
    }
  }
}

const hits = [];
await walk(ROOT, hits);
if (hits.length) {
  for (const h of hits) console.log(`${h.file}: matched /${h.pattern}/`);
}
process.exit(0);
