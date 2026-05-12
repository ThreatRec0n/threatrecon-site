import {
  runTerminalLine,
  type TerminalContext,
} from '@/utils/terminal/commandRunner';
import {
  resolveUnixPath,
  walkLinuxVfs,
  type VfsDirNode,
} from './vfs';
import { forensicIntegrity } from './ForensicIntegrityEngine';
import type { ShellSessionState } from './shellSession.types';

function tokenizeUnix(line: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) {
        quote = null;
        continue;
      }
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c
      continue;
    }
    if (/\s/.test(c)) {
      if (cur.length) {
        tokens.push(cur);
        cur = '';
      }
      continue;
    }
    cur += c;
  }
  if (cur.length) tokens.push(cur);
  return tokens;
}

function consume(output: string): string {
  const w = forensicIntegrity.consumeWarnings();
  if (!w.length) return output;
  const amber = w.map((line) => `\x1b[38;5;214m${line}\x1b[0m`).join('\r\n');
  return output ? `${output}\r\n${amber}` : amber;
}

function expandHome(path: string, homeDir: string): string {
  if (!homeDir) return path;
  if (path === '~') return homeDir;
  if (path.startsWith('~/')) return `${homeDir}/${path.slice(2)}`;
  return path;
}

function linuxCtx(s: ShellSessionState): TerminalContext {
  const rel =
    s.linuxHomeDir && s.cwdUnix.startsWith(s.linuxHomeDir)
      ? s.cwdUnix.slice(s.linuxHomeDir.length).replace(/^\//, '')
      : s.cwdUnix.replace(/^\//, '');
  return {
    caseContent: s.caseContent,
    difficulty: s.difficulty,
    workstationId: s.workstationId,
    cwd: rel,
    setCwd: () => {},
  };
}

function formatLs(node: VfsDirNode, showHidden: boolean): string {
  const rows: string[] = ['total 0'];
  const keys = [...node.children.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
  for (const name of keys) {
    if (!showHidden && name.startsWith('.')) continue;
    const child = node.children.get(name)!;
    const sym = child.kind === 'dir' ? 'd' : '-';
    const mode = child.kind === 'dir' ? `${sym}rwxr-xr-x` : `${sym}rw-r--r--`;
    const size =
      child.kind === 'file' ? String(child.content?.length ?? 0).padStart(6) : '     -';
    rows.push(`${mode}  1 root root ${size} May  7 23:14 ${name}`);
  }
  return rows.join('\r\n');
}

function collectFind(
  root: VfsDirNode,
  prefix: string,
  glob: string | null,
  max = 120,
): string[] {
  const out: string[] = [];
  const match = (fname: string) => {
    if (!glob) return true;
    const g = glob.replace(/^["']|["']$/g, '');
    if (g.startsWith('*.')) return fname.endsWith(g.slice(1));
    if (g.includes('*')) {
      const re = new RegExp(
        `^${g.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`,
      );
      return re.test(fname);
    }
    return fname === g;
  };
  const walk = (dir: VfsDirNode, base: string) => {
    if (out.length >= max) return;
    for (const [name, child] of [...dir.children.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      if (out.length >= max) return;
      const p = `${base}/${name}`;
      if (child.kind === 'dir') walk(child, p);
      else if (match(name)) out.push(p);
    }
  };
  walk(root, prefix);
  return out;
}

export function executeLinuxShellLine(s: ShellSessionState, raw: string): string {
  const line = raw.trim();
  if (!line) return '';
  const vfs = s.vfsUnix;
  if (!vfs) return consume('bash: no Linux subsystem mounted for this shell.');

  const tokens = tokenizeUnix(line);
  const cmd = (tokens[0] ?? '').toLowerCase();
  const home = s.linuxHomeDir || `/home/${s.username}`;

  const resolvePath = (p: string) => {
    const exp = expandHome(p.trim(), home);
    return resolveUnixPath(s.cwdUnix, exp) ?? s.cwdUnix;
  };

  switch (cmd) {
    case 'pwd':
      return consume(s.cwdUnix);
    case 'clear':
    case 'cls':
      return consume('');
    case 'cd': {
      const arg = tokens.slice(1).join(' ') || home;
      const target = resolvePath(arg);
      const hit = walkLinuxVfs(vfs, target);
      if (!hit || hit.node.kind !== 'dir')
        return consume(`bash: cd: ${arg}: No such file or directory`);
      s.cwdUnix = target.replace(/\/+$/, '') || '/';
      return consume('');
    }
    case 'ls': {
      const showHidden = tokens.includes('-la') || tokens.includes('-a');
      const pathTok = tokens.filter((t) => !t.startsWith('-')).slice(1).join(' ');
      const abs = pathTok ? resolvePath(pathTok) : s.cwdUnix;
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit) return consume(`ls: cannot access '${pathTok || abs}': No such file or directory`);
      if (hit.node.kind === 'file')
        return consume(hit.node.name);
      return consume(formatLs(hit.node, showHidden));
    }
    case 'cat': {
      const pathArg = tokens.slice(1).join(' ');
      if (!pathArg) return consume('cat: missing operand');
      const targetPath = expandHome(pathArg.trim(), home);
      const abs = resolveUnixPath(s.cwdUnix, targetPath) ?? targetPath;
      if (abs === '/etc/shadow' || pathArg.includes('shadow'))
        return consume('cat: /etc/shadow: Permission denied');
      const hit = walkLinuxVfs(vfs, abs.startsWith('/') ? abs : resolvePath(pathArg) ?? abs);
      if (!hit) return consume(`cat: ${pathArg}: No such file or directory`);
      if (hit.node.kind === 'dir') return consume(`cat: ${pathArg}: Is a directory`);
      return consume(hit.node.content.replace(/\n/g, '\r\n'));
    }
    case 'head': {
      const n = /^-n(\d+)$/.exec(tokens[1] ?? '')?.[1];
      const start = n ? 2 : 1;
      const pathArg = tokens.slice(start).join(' ');
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file')
        return consume(`head: cannot open '${pathArg}' for reading`);
      const lines = hit.node.content.split('\n').slice(0, Number(n ?? '10'));
      return consume(lines.join('\r\n'));
    }
    case 'tail': {
      const n = /^-n(\d+)$/.exec(tokens[1] ?? '')?.[1];
      const start = n ? 2 : 1;
      const pathArg = tokens.slice(start).join(' ');
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file')
        return consume(`tail: cannot open '${pathArg}' for reading`);
      const all = hit.node.content.split('\n');
      const take = Number(n ?? '10');
      return consume(all.slice(-take).join('\r\n'));
    }
    case 'grep': {
      const rest = tokens.slice(1).filter((t) => !t.startsWith('-'));
      if (rest.length < 2) return consume('grep: usage: grep PATTERN FILE');
      const needle = rest[0].replace(/^["']|["']$/g, '');
      const pathArg = rest[rest.length - 1];
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file') return consume(`grep: ${pathArg}: No such file`);
      const rows = hit.node.content.split('\n').filter((ln) => ln.includes(needle));
      return consume(rows.join('\r\n'));
    }
    case 'history':
    case 'fc': {
      const hist = walkLinuxVfs(vfs, `${home}/.zsh_history`);
      const bashHist = walkLinuxVfs(vfs, `${home}/.bash_history`);
      const node =
        hist?.node.kind === 'file'
          ? hist.node
          : bashHist?.node.kind === 'file'
            ? bashHist.node
            : null;
      if (!node)
        return consume(
          '(no shell history file — check ~/.zsh_history or ~/.bash_history)',
        );
      return consume(node.content.replace(/\n/g, '\r\n'));
    }
    case 'whoami':
      return consume(s.username);
    case 'id':
      return consume(
        `uid=1000(${s.username}) gid=1000(${s.username}) groups=1000(${s.username}),27(sudo)`,
      );
    case 'hostname':
      return consume(s.shellHostname);
    case 'uname': {
      if (tokens.includes('-a'))
        return consume(
          `Linux ${s.shellHostname} 5.15.0-107-generic #117-Ubuntu SMP x86_64 GNU/Linux`,
        );
      return consume('Linux');
    }
    case 'hostnamectl':
      return consume(
        `   Static hostname: ${s.shellHostname}\nOperating System: Ubuntu 22.04.4 LTS\n          Kernel: Linux 5.15.0-107-generic`,
      ).replace(/\n/g, '\r\n');
    case 'uptime':
      return consume(' 23:03:41 up 15:01,  1 user,  load average: 0.42, 0.38, 0.31');
    case 'df':
      return consume(
        'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2       251G   98G  141G  42% /\ntmpfs           7.8G  2.1M  7.8G   1% /run',
      ).replace(/\n/g, '\r\n');
    case 'free':
      return consume(
        '               total        used        free\nMem:       16307836    9823412     6484424\nSwap:       2097148           0     2097148',
      ).replace(/\n/g, '\r\n');
    case 'ps':
      return consume(
        [
          'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
          'root         1  0.0  0.0 166548 11208 ?        Ss   May07   0:02 /sbin/init',
          `${s.username.padEnd(10)} 2142  0.4  1.2 4412428 198332 pts/0 Sl+ May07   0:12 /usr/bin/gnome-shell`,
          `${s.username.padEnd(10)} 3891  0.1  0.4 1289024 65102 pts/1  Sl+ May07   0:04 docker ps`,
        ].join('\r\n'),
      );
    case 'top':
      return consume(
        'top - 23:03:41 up 15:01,  1 user...\r\nTasks: 212 total...\r\n  PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM TIME+ COMMAND\r\n 2142 james.o+  20   0 4412428 198332  89212 S  4.2  1.2   0:12 gnome-shell\r\n',
      );
    case 'pstree':
      return consume('systemd---gnome-shell---bash---docker\r\n');
    case 'lsblk':
      return consume(
        'NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT\nsda      8:0    0 238.5G  0 disk \n`-sda2   8:2    0 237.4G  0 part /\nsdb      8:16   1  14.9G  0 disk \n`-sdb1   8:17   1  14.9G  0 part ',
      ).replace(/\n/g, '\r\n');
    case 'docker':
      if (tokens[1] === 'ps' || tokens.slice(1, 3).join(' ') === 'ps -a')
        return consume(
          [
            'CONTAINER ID   IMAGE                          STATUS',
            'a1b2c3d4e5f6   nexus-registry/api-server:v2   Up 4 hours',
            '904feeaacccc   hashicorp/terraform:light      Exited (0) 2 days ago',
          ].join('\r\n'),
        );
      if (tokens[1] === 'images')
        return consume(
          'REPOSITORY                        TAG       IMAGE ID\nnexus-registry/api-server        v2.4.1    d5f6e7a8b9c0\n',
        ).replace(/\n/g, '\r\n');
      return consume('docker: training sandbox — try docker ps -a');
    case 'journalctl': {
      const auth = walkLinuxVfs(vfs, '/var/log/auth.log');
      const body =
        auth?.node.kind === 'file'
          ? auth.node.content
          : 'May  7 08:03:22 systemd-logind[1247]: New session';
      const wantSsh = line.toLowerCase().includes('ssh');
      let filtered = body.split('\n').filter((l) =>
        wantSsh ? l.toLowerCase().includes('ssh') : true,
      );
      if (wantSsh && filtered.length === 0) {
        filtered = body.split('\n').slice(-18);
      }
      filtered = filtered.slice(-40);
      return consume(filtered.join('\r\n'));
    }
    case 'last': {
      if (tokens[1] === '-f')
        return consume(
          '/var/log/wtmp: forensic snapshot — inode frozen at acquisition time.',
        );
      return consume(
        `${s.username} pts/0        10.0.1.52      Thu May  7 08:03 - 23:03  (15:00)\n\nwtmp begins Thu May  1 06:00:01 2026`,
      ).replace(/\n/g, '\r\n');
    }
    case 'lastlog':
      return consume(
        `Username         Port     From             Latest\n${s.username} pts/0    10.0.1.52        Thu May  7 08:03:22 +0000 2026`,
      ).replace(/\n/g, '\r\n');
    case 'who':
    case 'w':
      return consume(
        `${s.username} pts/0        2026-05-07 08:03 (:pts/0)\n`,
      ).replace(/\n/g, '\r\n');
    case 'stat':
    case 'file': {
      const pathArg = tokens.slice(1).join(' ');
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit) return consume(`${cmd}: cannot stat '${pathArg}'`);
      if (hit.node.kind === 'dir')
        return consume(`${pathArg}: directory`);
      return consume(
        `${pathArg}: ASCII text, ${hit.node.content.length} bytes\r\nModify: 2026-05-07 23:14:44.000000000 +0000`,
      );
    }
    case 'wc': {
      const args = tokens.slice(1).filter((t) => !t.startsWith('-'));
      const fileArg = args[0];
      if (!fileArg) return consume('wc: missing file operand');
      const abs = resolvePath(fileArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file') return consume(`wc: ${fileArg}: No such file`);
      const nl = hit.node.content.split('\n').length;
      return consume(`${nl} ${hit.node.content.length} ${fileArg}`);
    }
    case 'sha256sum':
    case 'md5sum': {
      const pathArg = tokens[1] ?? '';
      if (!pathArg) return consume(`${cmd}: missing operand`);
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file')
        return consume(`${cmd}: ${pathArg}: No such file or directory`);
      const h =
        cmd === 'sha256sum'
          ? (hit.node.sha256 ?? '').toLowerCase()
          : (hit.node.md5 ?? '').toLowerCase();
      return consume(`${h}  ${pathArg}`);
    }
    case 'find': {
      let start = s.cwdUnix;
      let i = 1;
      if (tokens[i] && !tokens[i].startsWith('-')) {
        start = resolvePath(tokens[i]);
        i++;
      }
      let namePat: string | null = null;
      const ni = tokens.indexOf('-name');
      if (ni >= 0) namePat = tokens[ni + 1] ?? null;
      const dirHit = walkLinuxVfs(vfs, start);
      if (!dirHit || dirHit.node.kind !== 'dir')
        return consume(`find: '${start}': No such file or directory`);
      const rows = collectFind(
        dirHit.node,
        start.replace(/\/+$/, '') || '',
        namePat,
      );
      return consume(rows.join('\r\n'));
    }
    case 'netstat':
    case 'ss':
      return consume(
        [
          'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
          'tcp        0      0 10.0.1.52:22           10.0.3.10:55102         ESTABLISHED',
          'tcp        0      0 10.0.1.52:44344        162.125.248.18:443      TIME_WAIT',
        ].join('\r\n'),
      );
    case 'ip': {
      return consume(
        [
          '1: lo: <LOOPBACK,UP> mtu 65536',
          '    inet 127.0.0.1/8 scope host lo',
          '2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500',
          '    inet 10.0.1.52/24 brd 10.0.1.255 scope global dynamic eth0',
        ].join('\r\n'),
      );
    }
    case 'nmcli':
      return consume(
        'NAME                UUID                                  TYPE      DEVICE\nCorporate VLAN      d82b8f8e-...                           ethernet  eth0\n',
      ).replace(/\n/g, '\r\n');
    case 'crontab':
      if (tokens[1] === '-l')
        return consume('# m h dom mon dow command\n0 3 * * * /usr/local/bin/rotate-logs.sh\n');
      return consume('crontab: using read-only forensic shell — no edits.');
    case 'dmesg':
      return consume(
        '[    2.314891] usb 1-1: new high-speed USB device number 2 using xhci_hcd\r\n[    2.452110] usb-storage: SanDisk Ultra\r\n',
      );
    case 'strings': {
      const pathArg = tokens[1] ?? '';
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file') return consume(`strings: '${pathArg}'`);
      const printable = hit.node.content.replace(/[^\x20-\x7e\r\n]+/g, '\n');
      return consume(printable.split('\n').filter(Boolean).slice(0, 40).join('\r\n'));
    }
    case 'xxd': {
      const pathArg = tokens.filter((t) => !t.startsWith('-'))[1];
      if (!pathArg) return consume('xxd: missing operand');
      const abs = resolvePath(pathArg);
      const hit = walkLinuxVfs(vfs, abs);
      if (!hit || hit.node.kind !== 'file') return consume(`xxd: ${pathArg}:`);
      const chunk = hit.node.content.slice(0, 64);
      const hex = [...chunk]
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(' ');
      return consume(`00000000: ${hex}`);
    }
    case 'sudo':
      return consume(
        `[sudo] password for ${s.username}: \r\nsudo: forensic read-only snapshot — elevated writes blocked.`,
      );
    case 'git': {
      const sub = tokens[1] ?? '';
      if (sub === 'log') {
        const p = tokens.indexOf('--');
        const cwdGit =
          p >= 0 ? resolvePath(tokens.slice(p + 1).join(' ')) : `${s.cwdUnix}/.git`;
        const logs = walkLinuxVfs(
          vfs,
          cwdGit.endsWith('.git') ? `${cwdGit}/logs/HEAD` : `${s.cwdUnix}/.git/logs/HEAD`,
        );
        if (logs?.node.kind === 'file')
          return consume(logs.node.content.replace(/\n/g, '\r\n'));
        return consume(
          `a7f3e21 fix: update prod k8s resource limits\r\n904ab12 chore: rotate kubeconfigs\r\n`,
        );
      }
      return consume('git: training sandbox — try git log --oneline -20 in ~/projects/nexus-infrastructure');
    }
    case 'kubectl':
    case 'terraform':
    case 'ansible-playbook':
      return consume(`${tokens[0]}: simulated OK — see ~/.zsh_history for captured commands.`);
    default:
      return consume(runTerminalLine(linuxCtx(s), line));
  }
}
