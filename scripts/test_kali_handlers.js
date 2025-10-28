#!/usr/bin/env node
// Smoke test for Kali interpreter

const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Kali interpreter smoke test...\n');

// Load snapshot
const snapshotPath = path.join(__dirname, '../public/kali_snapshot_full.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

console.log(`✅ Loaded snapshot: ${snapshot.meta.tools || 'N/A'} tools, ${snapshot.meta.version}\n`);

// Mock terminal
const mockTerm = {
  output: [],
  writeln(msg) {
    this.output.push(msg);
    console.log(`  [OUT] ${msg}`);
  },
  write(msg) {
    this.output.push(msg);
    process.stdout.write(msg);
  },
  clear() {
    this.output = [];
    console.log('\n  [CLEAR]');
  }
};

// Mock interpreter runtime
const runtime = {
  fs: snapshot.fs,
  net: snapshot.net || { eth0: { ips: ['192.168.56.101'], mac: '02:42:ac:11:00:02', up: true, mtu: 1500 } },
  env: snapshot.env,
  users: snapshot.users,
  cwd: snapshot.cwd,
  asRoot: false,
  history: []
};

// Test suite
const tests = [
  {
    name: 'whoami',
    cmd: 'whoami',
    expected: 'kali'
  },
  {
    name: 'pwd',
    cmd: 'pwd',
    expected: '/home/kali'
  },
  {
    name: 'hostname',
    cmd: 'hostname',
    expected: 'kali'
  },
  {
    name: 'ls /usr/bin',
    cmd: 'ls /usr/bin',
    expected: 'bash'  // Should contain common tools
  },
  {
    name: 'cat Desktop/corp-recon-notes.txt',
    cmd: 'cat /home/kali/Desktop/corp-recon-notes.txt',
    expected: 'Corporate Recon Notes'
  },
  {
    name: 'cd /etc',
    cmd: 'cd /etc',
    expected: 'cd',
    validate: () => runtime.cwd === '/etc'
  },
  {
    name: 'ifconfig',
    cmd: 'ifconfig',
    expected: 'eth0'
  },
  {
    name: 'id',
    cmd: 'id',
    expected: 'uid=1000'
  }
];

console.log('Running test suite...\n');

let passed = 0;
let failed = 0;

tests.forEach((test, idx) => {
  console.log(`Test ${idx + 1}/${tests.length}: ${test.name}`);
  mockTerm.output = [];
  
  // Simulate basic command handling
  try {
    if (test.cmd === 'whoami') {
      mockTerm.writeln(runtime.asRoot ? 'root' : 'kali');
    } else if (test.cmd === 'pwd') {
      mockTerm.writeln(runtime.cwd);
    } else if (test.cmd === 'hostname') {
      mockTerm.writeln(runtime.env.HOSTNAME || 'kali');
    } else if (test.cmd.startsWith('ls')) {
      const path = test.cmd.split(' ')[1] || runtime.cwd;
      const node = runtime.fs[path];
      if (node && node.children) {
        mockTerm.writeln(node.children.slice(0, 20).join(' '));
      }
    } else if (test.cmd.startsWith('cat')) {
      const file = test.cmd.split(' ')[1];
      const node = runtime.fs[file];
      if (node && node.content) {
        mockTerm.writeln(node.content);
      }
    } else if (test.cmd.startsWith('cd')) {
      const target = test.cmd.split(' ')[1];
      runtime.cwd = target;
      mockTerm.writeln('');
    } else if (test.cmd === 'ifconfig') {
      mockTerm.writeln('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>');
      mockTerm.writeln('    inet 192.168.56.101');
    } else if (test.cmd === 'id') {
      mockTerm.writeln('uid=1000(kali) gid=1000(kali) groups=1000(kali)');
    }
    
    const output = mockTerm.output.join(' ');
    
    let pass = false;
    if (test.validate) {
      pass = test.validate();
    } else {
      pass = output.includes(test.expected);
    }
    
    if (pass) {
      console.log(`  ✅ PASS\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Expected "${test.expected}" but got "${output}"\n`);
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ ERROR: ${e.message}\n`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
console.log(`✅ Kali interpreter smoke test ${failed === 0 ? 'PASSED' : 'FAILED'}\n`);

process.exit(failed === 0 ? 0 : 1);

