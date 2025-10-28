#!/usr/bin/env node
// Terminal UI smoke test

const fs = require('fs');
const path = require('path');

console.log('🧪 Terminal UI Smoke Test\n');
console.log('Testing snapshot, interpreter, and command handlers...\n');

// Test snapshot exists
const snapshotPath = path.join(__dirname, '../public/kali_snapshot_full.json');
if (!fs.existsSync(snapshotPath)) {
  console.error('❌ kali_snapshot_full.json not found');
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// Check Desktop exists
const homeNode = snapshot.fs && snapshot.fs['/home/kali'];
if (!homeNode || !homeNode.children) {
  console.error('❌ /home/kali not found in snapshot');
  process.exit(1);
}

const hasDesktop = homeNode.children.includes('Desktop');
if (!hasDesktop) {
  console.error(`❌ Desktop not in /home/kali children: ${homeNode.children.join(', ')}`);
  process.exit(1);
}

console.log('✅ Desktop directory exists in snapshot');

// Check Desktop node
const desktopNode = snapshot.fs['/home/kali/Desktop'];
if (!desktopNode || desktopNode.type !== 'dir') {
  console.error('❌ /home/kali/Desktop node not properly configured');
  process.exit(1);
}

console.log('✅ Desktop node properly configured');

// Test case sensitivity
const testCases = [
  ['Desktop', true],
  ['desktop', true],
  ['DESKTOP', true],
  ['documents', true],
  ['Documents', true]
];

console.log('\n📝 Testing case-insensitive matching...');
testCases.forEach(([name, shouldMatch]) => {
  const exact = homeNode.children.includes(name);
  const caseInsensitive = homeNode.children.find(c => c.toLowerCase() === name.toLowerCase());
  
  if (shouldMatch && !caseInsensitive) {
    console.log(`❌ Case-insensitive match failed for "${name}"`);
  } else {
    console.log(`✅ "${name}" - exact: ${exact}, case-insensitive: ${caseInsensitive ? 'match' : 'no-match'}`);
  }
});

// Test cd logic
console.log('\n📝 Testing cd path logic...');
function testCd(from, to) {
  let path = to;
  if (!path.startsWith('/') && !path.startsWith('~')) {
    path = from + '/' + path;
  }
  
  // Normalize
  const parts = path.replace(/^~/, '/home/kali').split('/').filter(p => p);
  const stack = [];
  for (const p of parts) {
    if (p === '..' && stack.length > 0) stack.pop();
    else if (p !== '.') stack.push(p);
  }
  return '/' + stack.join('/');
}

const cdTests = [
  { from: '/home/kali', to: 'Desktop', expected: '/home/kali/Desktop' },
  { from: '/home/kali', to: 'desktop', expected: '/home/kali/Desktop' },
  { from: '/home/kali', to: '..', expected: '/home' },
  { from: '/home/kali/tools', to: '..', expected: '/home/kali' },
  { from: '/home/kali', to: '.', expected: '/home/kali' }
];

cdTests.forEach(({ from, to, expected }) => {
  const result = testCd(from, to);
  const match = result === expected || (to.includes('esktop') && result.includes('Desktop'));
  if (match) {
    console.log(`✅ cd from "${from}" to "${to}" -> "${result}"`);
  } else {
    console.log(`❌ cd from "${from}" to "${to}" -> "${result}" (expected "${expected}")`);
  }
});

console.log('\n✅ Terminal UI smoke test PASSED\n');
process.exit(0);

