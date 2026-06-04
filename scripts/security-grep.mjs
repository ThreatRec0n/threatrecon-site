import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", ".git", "scripts"]);
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
  /github\.com\/ThreatRec0n/i,
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
    let text;
    try {
      text = await readFile(full, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    for (const rx of PATTERNS) {
      if (rx.test(text)) hits.push({ file: rel, pattern: rx.source });
    }
  }
}

const hits = [];
await walk(ROOT, hits);
if (hits.length) {
  for (const h of hits) console.log(`${h.file}: matched /${h.pattern}/`);
}
process.exit(0);
