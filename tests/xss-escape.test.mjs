/**
 * XSS regression checks for escapeHtml (used before every innerHTML insert in app.js).
 * Run: node tests/xss-escape.test.mjs
 */
import { escapeHtml } from "../public/assets/js/utils.js";

const PAYLOADS = [
  "<script>alert(1)</script>",
  '"><img src=x onerror=alert(1)>',
  "<svg onload=alert(1)>",
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

for (const raw of PAYLOADS) {
  const escaped = escapeHtml(raw);
  assert(!escaped.includes("<") && !escaped.includes(">"), `angle brackets not escaped: ${raw}`);
  assert(escaped.includes("&lt;") || escaped.includes("&gt;") || escaped.includes("&quot;"),
    `expected HTML entities in escaped output: ${raw}`);
}

console.log(`XSS escape OK — ${PAYLOADS.length}/${PAYLOADS.length} payloads neutralized by escapeHtml.`);
