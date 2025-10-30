import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if (!pkg.dependencies?.next) {
  console.error('next dep missing');
  process.exitCode = 1;
} else {
  console.log(`next dep ok: ${pkg.dependencies.next}`);
}


