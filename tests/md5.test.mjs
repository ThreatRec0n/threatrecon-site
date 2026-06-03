/* Node test for the local MD5 implementation.
   Run: node tests/md5.test.mjs
   Proves MD5 is REAL (matches RFC 1321 vectors) — so the UI never shows a fake. */
import assert from 'node:assert';
import { md5 } from '../public/assets/js/md5.js';

const vectors = [
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
  ['The quick brown fox jumps over the lazy dog', '9e107d9d372bb6826bd81d3542a419d6'],
  ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a'],
];

let pass = 0;
for (const [input, expected] of vectors) {
  const got = md5(input);
  assert.strictEqual(got, expected, `md5(${JSON.stringify(input.slice(0, 20))}) = ${got}, expected ${expected}`);
  pass++;
}
console.log(`MD5 OK — ${pass}/${vectors.length} RFC 1321 test vectors passed.`);
