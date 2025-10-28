// kernel_proc.js - Process and network emulator
(function() {
  'use strict';

  let procSnap = {};
  let netSnap = {};
  let scenarioSnap = {};
  let session = { user: 'kali', isRoot: false, cwd: '/home/kali', startTime: Date.now() };

  window.kernelProc = {
    init(pSnap, nSnap, sSnap) {
      procSnap = pSnap || {};
      netSnap = nSnap || {};
      scenarioSnap = sSnap || {};
      session.user = 'kali';
      session.isRoot = false;
      session.cwd = '/home/kali';
      session.startTime = Date.now();
    },

    getSession() {
      return session;
    },

    whoami() {
      return { ok: true, out: [session.user] };
    },

    id(user) {
      if (session.isRoot) {
        return { ok: true, out: [`uid=0(root) gid=0(root) groups=0(root)`] };
      }
      return { ok: true, out: [`uid=1000(${session.user}) gid=1000(${session.user}) groups=1000(${session.user})`] };
    },

    hostname() {
      return { ok: true, out: [procSnap.hostname || 'kali'] };
    },

    uname(argv) {
      const arg = argv[1] || '';
      let out = 'Linux kali 6.6.0-kali9-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.13-1kali1 (2024-03-04) x86_64 GNU/Linux';
      return { ok: true, out: [out] };
    },

    uptime() {
      const uptime = ((Date.now() - session.startTime) / 1000).toFixed(2);
      return { ok: true, out: [`up ${uptime} seconds`] };
    },

    ifconfig() {
      const out = [];
      const interfaces = netSnap.interfaces || {};
      
      Object.keys(interfaces).forEach(iface => {
        const info = interfaces[iface];
        if (!info.up) return;
        
        out.push(`${iface}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500`);
        out.push(`        inet ${info.ip} netmask ${info.netmask || '255.255.255.0'}`);
        if (info.mac) out.push(`        ether ${info.mac}`);
        out.push('');
      });

      return { ok: true, out };
    },

    ip(argv) {
      const subcmd = argv[1];
      const out = [];

      if (subcmd === 'a' || subcmd === 'addr') {
        const interfaces = netSnap.interfaces || {};
        Object.keys(interfaces).forEach((iface, idx) => {
          const info = interfaces[iface];
          out.push(`${idx + 1}: ${iface}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000`);
          if (info.ip) {
            const cidr = info.netmask ? this._netmaskToCidr(info.netmask) : 24;
            out.push(`    inet ${info.ip}/${cidr} brd ${info.ip.split('/')[0].split('.').slice(0,3).join('.')}.255 scope global ${iface}`);
          }
          if (info.mac) {
            out.push(`    link/ether ${info.mac} brd ff:ff:ff:ff:ff:ff`);
          }
          out.push('');
        });
      } else if (subcmd === 'route') {
        out.push('default via 192.168.56.1 dev eth0 proto dhcp metric 100');
      }

      return { ok: true, out };
    },

    _netmaskToCidr(mask) {
      const parts = mask.split('.').map(Number);
      let cidr = 0;
      for (const p of parts) {
        cidr += p.toString(2).split('1').length - 1;
      }
      return cidr;
    },

    ping(argv) {
      const target = argv[0] || '8.8.8.8';
      const count = parseInt(argv.find(a => a === '-c') ? argv[argv.indexOf('-c') + 1] : '4') || 4;

      const out = [];
      out.push(`PING ${target} (${target}) 56(84) bytes of data.`);

      for (let i = 0; i < count; i++) {
        const latency = (Math.random() * 10 + 5).toFixed(3);
        out.push(`64 bytes from ${target}: icmp_seq=${i + 1} ttl=64 time=${latency} ms`);
      }

      const min = (5.0).toFixed(3);
      const avg = (7.0).toFixed(3);
      const max = (9.0).toFixed(3);
      out.push('');
      out.push(`--- ${target} ping statistics ---`);
      out.push(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 300}ms`);
      out.push(`rtt min/avg/max/mdev = ${min}/${avg}/${max}/1.234 ms`);

      return { ok: true, out };
    },

    nmap(argv, scenario) {
      const target = argv.find(arg => /^[\d.]+$/.test(arg)) || scenarioSnap.targetIP || '10.0.10.5';
      const scanType = argv.includes('-sV') ? 'version' : argv.includes('-sS') ? 'stealth' : 'default';

      const out = [];
      out.push(`Starting Nmap 7.95 ( https://nmap.org )`);
      out.push(`Nmap scan report for ${target}`);

      const ports = scenarioSnap.openPorts || [
        { port: 22, service: 'ssh', state: 'open' },
        { port: 80, service: 'http', state: 'open' },
        { port: 443, service: 'https', state: 'open' }
      ];

      if (scanType === 'version') {
        out.push(`Host is up (0.12s latency).`);
        out.push(`Not shown: 997 closed ports`);
        out.push(`PORT    STATE SERVICE VERSION`);
        ports.forEach(p => {
          out.push(`${p.port}/tcp ${p.state.padEnd(5)} ${p.service.padEnd(7)}`);
        });
      } else {
        out.push(`Host is up (0.012s latency).`);
        out.push(`Not shown: 997 closed ports`);
        out.push(`PORT    STATE SERVICE`);
        ports.forEach(p => {
          out.push(`${p.port}/tcp ${p.state.padEnd(5)} ${p.service}`);
        });
      }

      out.push(`MAC Address: 02:42:0A:0A:0A:32 (Unknown)`);
      out.push('');
      out.push(`Nmap done: 1 IP address (1 host up) scanned in 1.23 seconds`);

      return { ok: true, out };
    },

    ps(argv) {
      const out = [];
      const procList = procSnap.processList || [
        { pid: 1, user: 'root', cmd: '/sbin/init', cpu: 0.0, mem: 0.1 },
        { pid: 123, user: 'root', cmd: 'sshd: /usr/sbin/sshd', cpu: 0.1, mem: 0.2 },
        { pid: 234, user: 'kali', cmd: 'bash', cpu: 0.0, mem: 0.5 },
        { pid: 345, user: 'kali', cmd: 'firefox-esr', cpu: 2.3, mem: 12.1 }
      ];

      if (argv.includes('aux')) {
        out.push('USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
        procList.forEach(p => {
          out.push(`${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1)} ${p.mem.toFixed(1)}  ${String(Math.floor(Math.random()*100000)).padStart(6)} ${String(Math.floor(Math.random()*50000)).padStart(6)} ?        Ss   00:00   0:00 ${p.cmd}`);
        });
      } else {
        procList.forEach(p => {
          out.push(`  PID TTY          TIME CMD`);
          out.push(`${String(p.pid).padStart(5)} ?        00:00:00 ${p.cmd}`);
        });
      }

      return { ok: true, out };
    },

    top(argv) {
      const out = [];
      out.push(`top - ${new Date().toLocaleTimeString()} up  1:23,  1 user,  load average: 0.52, 0.58, 0.61`);
      out.push(`Tasks: ${procSnap.processList?.length || 5} total,   1 running, ${(procSnap.processList?.length || 5) - 1} sleeping,   0 stopped,   0 zombie`);
      out.push(`%Cpu(s):  2.5 us,  1.0 sy,  0.0 ni, 96.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`);
      out.push(`MiB Mem :   3847.0 total,    234.1 free,    876.2 used,   2736.7 buff/cache`);
      out.push(`MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2736.7 avail Mem`);
      out.push(``);
      out.push(`  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`);
      const procList = procSnap.processList?.slice(0, 5) || [];
      procList.forEach(p => {
        const cpu = p.cpu.toFixed(1);
        const mem = p.mem.toFixed(1);
        out.push(`${String(p.pid).padStart(5)} ${p.user.padEnd(8)} 20   0 ${String(Math.floor(Math.random()*1000000)).padStart(8)} ${String(Math.floor(Math.random()*100000)).padStart(7)} ${String(Math.floor(Math.random()*50000)).padStart(7)} S  ${String(cpu).padStart(4)} ${String(mem).padStart(4)}   0:00.12 ${p.cmd}`);
      });

      return { ok: true, out };
    },

    sudo(argv, sess) {
      if (argv[0] === '-s' || argv[0] === 'su') {
        if (!session.isRoot) {
          return { ok: true, out: [`Switched to root shell`], session: { user: 'root', isRoot: true, cwd: '/root', startTime: session.startTime } };
        }
        return { ok: true, out: [`Already root`] };
      }
      return { ok: true, out: [`sudo: ${argv.join(' ')}: command not found`] };
    },

    su(argv, sess) {
      if (argv[0] && argv[0] !== 'root') {
        return { ok: false, out: [`su: user ${argv[0]} does not exist`] };
      }
      if (!session.isRoot) {
        return { ok: true, out: [`Switched to root shell`], session: { user: 'root', isRoot: true, cwd: '/root', startTime: session.startTime } };
      }
      return { ok: true, out: [`Already root`] };
    },

    exitSession(argv, session, ctx) {
      if (session.isRoot) {
        session.user = 'kali';
        session.isRoot = false;
        session.cwd = '/home/kali';
        return { ok: true, out: [`Exited root shell`], session };
      }
      return { ok: true, out: [], type: 'control', action: 'endSession' };
    },

    remoteExec(line, ctx) {
      // Placeholder for backend execution
      return { ok: true, out: [`${line}: simulated remote exec`] };
    }
  };

  console.info('[KernelProc] Module loaded');
})();

