import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const hasNext = !!pkg.dependencies?.next;
const hasReact = !!pkg.dependencies?.react && !!pkg.dependencies?.['react-dom'];
if (!hasNext || !hasReact) {
  console.error('framework deps missing');
  process.exitCode = 1;
} else {
  console.log(`next dep ok: ${pkg.dependencies.next}`);
}


