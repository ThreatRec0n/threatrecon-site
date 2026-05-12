import type { CaseContent } from '@/data/cases/caseData.types';
import type { Difficulty } from '@/types/case.types';
import {
  runTerminalLine,
  type TerminalContext,
} from '@/utils/terminal/commandRunner';
import {
  buildSarahWslVfs,
  buildWorkstationVfs,
  linuxRootFromCaseTree,
  normalizeWindowsPath,
  parseWslUnc,
  resolveWindowsPath,
  walkLinuxVfs,
  walkVfs,
  type VfsDirNode,
  type VfsFileNode,
} from './vfs';
import { formatDirListing, parseDirFlags } from './dirFormat';
import { forensicIntegrity } from './ForensicIntegrityEngine';
import { displayMachineName } from '@/investigation/suspectWorkstation';
import { CASE001_WS_OPS_02_TREE } from '@/data/cases/case001LinuxFs';
import { executeLinuxShellLine } from './linuxShellInterpreter';
import type { ShellHost, ShellSessionState } from './shellSession.types';

export type { ShellSessionState } from './shellSession.types';

const WSL_LAUNCH_BANNER = [
  'Provisioning Ubuntu 22.04.4 LTS on Windows Subsystem for Linux...',
  '',
  'Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-107-generic x86_64)',
  '',
  ' * Documentation:  https://help.ubuntu.com',
  '',
].join('\r\n');

const LINUX_TAB_COMMANDS = [
  'cat',
  'cd',
  'clear',
  'crontab',
  'df',
  'docker',
  'dmesg',
  'echo',
  'exit',
  'fc',
  'file',
  'find',
  'free',
  'git',
  'grep',
  'head',
  'history',
  'hostname',
  'hostnamectl',
  'id',
  'ip',
  'journalctl',
  'kubectl',
  'last',
  'lastlog',
  'ls',
  'lsblk',
  'md5sum',
  'nmcli',
  'ps',
  'pwd',
  'sha256sum',
  'ss',
  'stat',
  'strings',
  'sudo',
  'tail',
  'terraform',
  'top',
  'uname',
  'uptime',
  'wc',
  'who',
  'whoami',
  'w',
  'xxd',
];

const POWERSHELL_BANNER = [
  'Windows PowerShell',
  'Copyright (C) Microsoft Corporation. All rights reserved.',
  '',
  'Try the new cross-platform PowerShell https://aka.ms/pscore6',
  '',
].join('\r\n');

export const SHELL_COMMANDS = [
  'attrib',
  'browser_history',
  'badge_records',
  'calendar',
  'carve',
  'cd',
  'certutil',
  'chdir',
  'cls',
  'copy',
  'del',
  'dir',
  'erase',
  'exit',
  'filter',
  'find',
  'findstr',
  'get-filehash',
  'grep',
  'ipconfig',
  'mkdir',
  'move',
  'net',
  'netstat',
  'ping',
  'powershell',
  'prefetch',
  'printer_logs',
  'pwsh',
  'query',
  'recover',
  'reg',
  'rmdir',
  'schtasks',
  'search_messages',
  'sigcheck',
  'strings',
  'systeminfo',
  'taskkill',
  'tasklist',
  'type',
  'usbview',
  'wevtutil',
  'whoami',
  'wsl',
].sort();

function shortenUnixPath(cwd: string, homeDir: string): string {
  if (!homeDir) return cwd || '/';
  if (cwd === homeDir || cwd.startsWith(`${homeDir}/`)) {
    return `~${cwd === homeDir ? '' : cwd.slice(homeDir.length)}`;
  }
  return cwd;
}

export function createShellSession(opts: {
  username: string;
  workstationId: string;
  caseContent: CaseContent;
  difficulty: Difficulty;
  employeeId?: string;
  shellHost?: ShellHost;
}): ShellSessionState {
  const employeeId = opts.employeeId ?? '';
  const shellHost = opts.shellHost ?? 'windows';
  const hostname = displayMachineName(opts.workstationId).toLowerCase();

  if (shellHost === 'linux_workstation') {
    const tree = opts.caseContent.workstations[opts.workstationId];
    let unixRoot = linuxRootFromCaseTree(tree);
    if (
      !unixRoot &&
      opts.caseContent.definition.id === 'case-001' &&
      opts.workstationId === 'WS-OPS-02'
    ) {
      unixRoot = linuxRootFromCaseTree(CASE001_WS_OPS_02_TREE);
    }
    if (!unixRoot) {
      unixRoot = linuxRootFromCaseTree({
        type: 'dir',
        children: {
          home: {
            type: 'dir',
            children: {
              [opts.username]: {
                type: 'dir',
                children: {
                  'README.txt': {
                    type: 'file',
                    content: 'Linux workstation image unavailable.',
                  },
                },
              },
            },
          },
        },
      })!;
    }
    const homeDir = `/home/${opts.username}`;
    return {
      host: 'linux_workstation',
      mode: 'cmd',
      inWsl: false,
      cwdWin: '',
      cwdUnix: `${homeDir}/projects`,
      vfsWin: null,
      vfsUnix: unixRoot,
      username: opts.username,
      workstationId: opts.workstationId,
      employeeId,
      caseContent: opts.caseContent,
      difficulty: opts.difficulty,
      shellHostname: hostname,
      linuxHomeDir: homeDir,
    };
  }

  const tree = opts.caseContent.workstations[opts.workstationId];
  const vfsWin = buildWorkstationVfs(tree, opts.username);
  const sarahWsl =
    opts.caseContent.definition.id === 'case-001' &&
    employeeId === 'emp-sarah-chen';
  const vfsUnix = sarahWsl ? buildSarahWslVfs(opts.username) : null;
  const linuxHomeDir = sarahWsl ? `/home/${opts.username}` : '';

  return {
    host: 'windows',
    mode: 'cmd',
    inWsl: false,
    cwdWin: `C:\\Users\\${opts.username}\\Workspace`,
    cwdUnix: sarahWsl ? `/mnt/c/Users/${opts.username}` : '/',
    vfsWin,
    vfsUnix,
    username: opts.username,
    workstationId: opts.workstationId,
    employeeId,
    caseContent: opts.caseContent,
    difficulty: opts.difficulty,
    shellHostname: hostname,
    linuxHomeDir,
  };
}

export function getShellPrompt(s: ShellSessionState): string {
  if (s.host === 'linux_workstation') {
    const path = shortenUnixPath(s.cwdUnix, s.linuxHomeDir);
    const g = '\x1b[32m';
    const b = '\x1b[34m';
    const r = '\x1b[0m';
    return `${g}${s.username}@${s.shellHostname}${r}:${b}${path}${r}$ `;
  }
  if (s.inWsl && s.vfsUnix) {
    const path = shortenUnixPath(s.cwdUnix, s.linuxHomeDir);
    return `${s.username}@${s.shellHostname}:${path}$ `;
  }
  return s.mode === 'powershell' ? `PS ${s.cwdWin}> ` : `${s.cwdWin}> `;
}

function workspaceRelative(cwd: string, username: string): string {
  const pref = `C:\\Users\\${username}\\Workspace`;
  const n = normalizeWindowsPath(cwd);
  const nl = n.toLowerCase();
  const pl = pref.toLowerCase();
  if (nl === pl) return '';
  if (!nl.startsWith(`${pl}\\`.toLowerCase())) return '';
  return n.slice(pref.length + 1);
}

function legacyCtx(s: ShellSessionState): TerminalContext {
  return {
    caseContent: s.caseContent,
    difficulty: s.difficulty,
    workstationId: s.workstationId,
    cwd: workspaceRelative(s.cwdWin, s.username),
    setCwd: () => {},
  };
}

export function tokenizeCommand(line: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
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
      quote = c as '"' | "'";
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

function stripQuotes(p: string): string {
  const t = p.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function consumeForensicWarnings(output: string): string {
  const w = forensicIntegrity.consumeWarnings();
  if (!w.length) return output;
  const amber = w.map((line) => `\x1b[38;5;214m${line}\x1b[0m`).join('\r\n');
  return output ? `${output}\r\n${amber}` : amber;
}

function attribDisplayLine(f: VfsFileNode, windowsPath: string): string {
  const a = f.archive !== false ? 'A' : ' ';
  const h = f.hidden ? 'H' : ' ';
  return `${a}    ${h}        ${windowsPath}`;
}

function certutilHashOutput(
  absPath: string,
  node: VfsFileNode,
  algo: string,
  trackIntegrity = true,
): string {
  if (trackIntegrity)
    forensicIntegrity.markFileHashed(normalizeWindowsPath(absPath).toLowerCase());
  const key =
    algo === 'SHA256' ? 'sha256' : algo === 'MD5' ? 'md5' : 'sha1';
  const raw = (node[key] ?? '').toLowerCase();
  const hash =
    algo === 'SHA256'
      ? raw
      : algo === 'MD5'
        ? raw.slice(0, 32)
        : raw.slice(0, 40);
  return [
    `${algo} hash of ${absPath}:`,
    hash,
    'CertUtil: -hashfile command completed successfully.',
  ].join('\r\n');
}

function stringsOutput(absPath: string, node: VfsFileNode): string {
  const banner = [
    'Strings v2.54 - Search for ANSI and Unicode strings in binary images.',
    'Copyright (C) 1999-2021 Mark Russinovich',
    'Sysinternals - www.sysinternals.com',
    '',
    `${absPath}:`,
    '',
  ].join('\r\n');
  const body =
    node.strings?.join('\r\n') ??
    '!This program cannot be run in DOS mode.\r\nKERNEL32.dll';
  return `${banner}${body}`;
}

function pathCompletions(partial: string, cwd: string, vfsRoot: VfsDirNode): string[] {
  const norm = partial.replace(/\//g, '\\');
  const idx = norm.lastIndexOf('\\');
  let dirAbs = cwd.replace(/\\+$/, '');
  let rest = norm;
  if (idx >= 0) {
    const dirPart = norm.slice(0, idx + 1);
    rest = norm.slice(idx + 1);
    const resolved = /^[a-z]:\\/i.test(dirPart)
      ? normalizeWindowsPath(dirPart.replace(/\\+$/, ''))
      : resolveWindowsPath(cwd, dirPart.replace(/\\+$/, ''));
    if (!resolved) return [];
    dirAbs = normalizeWindowsPath(resolved).replace(/\\+$/, '');
  }
  const hit = walkVfs(vfsRoot, dirAbs);
  if (!hit || hit.node.kind !== 'dir') return [];
  return [...hit.node.children.keys()]
    .filter((n) => n.toLowerCase().startsWith(rest.toLowerCase()))
    .map((n) => (idx >= 0 ? `${norm.slice(0, idx + 1)}${n}` : n));
}

function resolveWinPathOrUnc(
  s: ShellSessionState,
  rawPath: string,
): { win?: string; unix?: string } | null {
  const q = stripQuotes(rawPath.trim());
  const unc = parseWslUnc(q);
  if (unc && s.vfsUnix && /^ubuntu/i.test(unc.distro)) {
    return { unix: unc.unixPath };
  }
  if (!s.vfsWin) return null;
  const resolved = resolveWindowsPath(s.cwdWin, q);
  return resolved ? { win: resolved } : null;
}

function unixDirListingBanner(label: string, dir: VfsDirNode): string {
  const lines = [...dir.children.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const ch = dir.children.get(name)!;
      const marker =
        ch.kind === 'dir'
          ? '<DIR>          '
          : `${String(ch.kind === 'file' ? ch.content.length : 0).padStart(14)}`;
      return `05/07/2026  11:14 PM    ${marker} ${name}`;
    });
  return [` Directory of ${label}`, '', ...lines, '', `               ${lines.length} File(s)`, ''].join('\r\n');
}

export function shellAutocomplete(
  s: ShellSessionState,
  index: number,
  tokens: string[],
): string[] {
  const expr = (tokens[index] ?? '').toLowerCase();
  if (index === 0) {
    const pool =
      s.host === 'linux_workstation' || s.inWsl
        ? [...new Set([...SHELL_COMMANDS, ...LINUX_TAB_COMMANDS])].sort()
        : SHELL_COMMANDS;
    return pool.filter((c) => c.startsWith(expr));
  }
  if (!s.vfsWin || s.inWsl) return [];
  return pathCompletions(tokens[index] ?? '', s.cwdWin, s.vfsWin);
}

export function executeShellLine(s: ShellSessionState, raw: string): string {
  const line = raw.trim();
  if (!line) return '';

  const ll = line.toLowerCase();

  if (s.host === 'linux_workstation') {
    return consumeForensicWarnings(executeLinuxShellLine(s, raw));
  }

  if (s.host === 'windows' && s.inWsl && s.vfsUnix && ll === 'exit') {
    s.inWsl = false;
    return consumeForensicWarnings('');
  }

  if (s.host === 'windows' && !s.inWsl && ll === 'wsl') {
    if (!s.vfsUnix) {
      return consumeForensicWarnings(
        "'wsl' is not recognized as an internal or external command.",
      );
    }
    s.inWsl = true;
    s.cwdUnix = `/mnt/c/Users/${s.username}`;
    return consumeForensicWarnings(WSL_LAUNCH_BANNER);
  }

  if (s.host === 'windows' && s.inWsl && s.vfsUnix) {
    return consumeForensicWarnings(executeLinuxShellLine(s, raw));
  }

  const vfsWin = s.vfsWin;
  if (!vfsWin) {
    return consumeForensicWarnings('Shell unavailable.');
  }

  if (s.mode === 'cmd' && (ll === 'powershell' || ll === 'pwsh')) {
    s.mode = 'powershell';
    return consumeForensicWarnings(POWERSHELL_BANNER);
  }
  if (s.mode === 'powershell' && ll === 'exit') {
    s.mode = 'cmd';
    return consumeForensicWarnings('');
  }

  const tokens = tokenizeCommand(line);
  const cmd0 = tokens[0] ?? '';

  if (s.mode === 'powershell') {
    const psHash = line.match(
      /^(?:Get-FileHash|get-filehash)\s+(.+?)\s+-Algorithm\s+(\w+)/i,
    );
    if (psHash) {
      const pathArg = stripQuotes(psHash[1].trim());
      const algo = psHash[2].toUpperCase();
      if (!['SHA256', 'MD5', 'SHA1'].includes(algo)) {
        return consumeForensicWarnings(
          'Get-FileHash : Algorithm must be MD5, SHA1, or SHA256.',
        );
      }
      const hybrid = resolveWinPathOrUnc(s, pathArg);
      if (!hybrid) {
        return consumeForensicWarnings(
          'Get-FileHash : Cannot find path because it does not exist.',
        );
      }
      let hit:
        | ReturnType<typeof walkVfs>
        | ReturnType<typeof walkLinuxVfs>
        | null = null;
      if (hybrid.unix && s.vfsUnix) {
        hit = walkLinuxVfs(s.vfsUnix, hybrid.unix);
      } else if (hybrid.win) {
        hit = walkVfs(vfsWin, hybrid.win);
      }
      if (!hit || hit.node.kind !== 'file') {
        return consumeForensicWarnings(
          'Get-FileHash : Cannot find path because it does not exist.',
        );
      }
      if (hybrid.win)
        forensicIntegrity.markFileHashed(normalizeWindowsPath(hybrid.win).toLowerCase());
      const node = hit.node as VfsFileNode;
      const key =
        algo === 'SHA256' ? 'sha256' : algo === 'MD5' ? 'md5' : 'sha1';
      const val = (node[key] ?? '').toUpperCase();
      const pad =
        algo === 'SHA256' ? 64 : algo === 'MD5' ? 32 : 40;
      const hashVal = val.slice(0, pad).padEnd(pad);
      const displayPath = hybrid.win ?? hybrid.unix ?? pathArg;
      const rows = [
        '',
        `Algorithm       Hash                                                                   Path`,
        `---------       ----                                                                   ----`,
        `${algo.padEnd(15)} ${hashVal}       ${displayPath}`,
      ];
      return consumeForensicWarnings(rows.join('\r\n'));
    }
  }

  // ----- CMD-style (also accepted from PS mode) -----
  switch (cmd0.toLowerCase()) {
    case 'cd':
    case 'chdir': {
      const restTokens = tokens.slice(1);
      let pathToks = restTokens;
      if (restTokens[0]?.toUpperCase() === '/D')
        pathToks = restTokens.slice(1);
      const pathArg = pathToks.join(' ').trim();
      if (!pathArg) return consumeForensicWarnings(s.cwdWin);
      let target = stripQuotes(pathArg);
      if (s.vfsUnix) {
        const uncCd = parseWslUnc(target);
        if (uncCd && /^ubuntu/i.test(uncCd.distro)) {
          const uh = walkLinuxVfs(s.vfsUnix, uncCd.unixPath);
          if (uh?.node.kind === 'dir') {
            s.inWsl = true;
            s.cwdUnix = uncCd.unixPath.replace(/\/+$/, '') || '/';
            return consumeForensicWarnings('');
          }
        }
      }
      if (restTokens[0]?.toUpperCase() === '/D') {
        if (/^[a-z]:/i.test(target)) {
          if (!/^c:/i.test(target)) {
            return consumeForensicWarnings(
              'The system cannot find the path specified.',
            );
          }
          target = target.slice(2).replace(/^\\/, '');
        }
      }
      const driveLetter = /^([a-z]:)/i.exec(s.cwdWin)?.[1]?.toUpperCase() ?? 'C:';
      const resolved =
        target === '\\' || target === '/'
          ? `${driveLetter}\\`
          : resolveWindowsPath(s.cwdWin, target);
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      const hit = walkVfs(vfsWin, resolved);
      if (!hit || hit.node.kind !== 'dir') {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      s.cwdWin = normalizeWindowsPath(resolved).replace(/\\+$/, '');
      return consumeForensicWarnings('');
    }

    case 'dir': {
      const flagToks = tokens.slice(1).filter((t) => t.startsWith('/'));
      const pathToks = tokens.slice(1).filter((t) => !t.startsWith('/'));
      const pathArg = pathToks.join(' ').trim();
      const flags = parseDirFlags(flagToks);
      if (pathArg && s.vfsUnix) {
        const hybridDir = resolveWinPathOrUnc(s, stripQuotes(pathArg));
        if (hybridDir?.unix) {
          const hit = walkLinuxVfs(s.vfsUnix, hybridDir.unix);
          if (!hit) {
            return consumeForensicWarnings(
              'The system cannot find the path specified.',
            );
          }
          if (hit.node.kind !== 'dir')
            return consumeForensicWarnings('File Not Found');
          return consumeForensicWarnings(
            unixDirListingBanner(stripQuotes(pathArg), hit.node),
          );
        }
      }
      const resolved = pathArg
        ? resolveWindowsPath(s.cwdWin, stripQuotes(pathArg))
        : s.cwdWin;
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      const hit = walkVfs(vfsWin, resolved);
      if (!hit) {
        const wild = pathArg.includes('*') || pathArg.includes('?');
        return consumeForensicWarnings(
          wild ? 'File Not Found' : 'The system cannot find the path specified.',
        );
      }
      if (hit.node.kind !== 'dir')
        return consumeForensicWarnings('File Not Found');
      const label = normalizeWindowsPath(resolved).replace(/\\+$/, '');
      return consumeForensicWarnings(formatDirListing(label, hit.node, flags));
    }

    case 'type': {
      const pathArg = tokens.slice(1).join(' ').trim();
      if (!pathArg) {
        return consumeForensicWarnings(
          'The syntax of the command is incorrect.',
        );
      }
      const hybridTy = resolveWinPathOrUnc(s, stripQuotes(pathArg));
      if (hybridTy?.unix && s.vfsUnix) {
        const hit = walkLinuxVfs(s.vfsUnix, hybridTy.unix);
        if (!hit) {
          return consumeForensicWarnings(
            'The system cannot find the file specified.',
          );
        }
        if (hit.node.kind === 'dir')
          return consumeForensicWarnings('Access is denied.');
        return consumeForensicWarnings(hit.node.content.replace(/\n/g, '\r\n'));
      }
      const resolved = resolveWindowsPath(s.cwdWin, stripQuotes(pathArg));
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the file specified.',
        );
      }
      const hit = walkVfs(vfsWin, resolved);
      if (!hit) {
        return consumeForensicWarnings(
          'The system cannot find the file specified.',
        );
      }
      if (hit.node.kind === 'dir')
        return consumeForensicWarnings('Access is denied.');
      return consumeForensicWarnings(hit.node.content.replace(/\n/g, '\r\n'));
    }

    case 'attrib': {
      const parts = tokens.slice(1);
      const pathToks: string[] = [];
      let hiddenOp: 'set' | 'unset' | null = null;
      for (const p of parts) {
        const u = p.toUpperCase();
        if (u === '+H') hiddenOp = 'set';
        else if (u === '-H') hiddenOp = 'unset';
        else pathToks.push(p);
      }
      const pathArg = pathToks.join(' ').trim();
      if (!pathArg)
        return consumeForensicWarnings('Parameter format not correct -');
      const hybridAt = resolveWinPathOrUnc(s, stripQuotes(pathArg));
      let resolvedWin = hybridAt?.win;
      let hit =
        hybridAt?.unix && s.vfsUnix
          ? walkLinuxVfs(s.vfsUnix, hybridAt.unix)
          : hybridAt?.win
            ? walkVfs(vfsWin, hybridAt.win)
            : null;
      if (!resolvedWin && hybridAt?.unix) {
        resolvedWin = hybridAt.unix;
      }
      if (!resolvedWin || !hit || hit.node.kind !== 'file')
        return consumeForensicWarnings('');
      const f = hit.node as VfsFileNode;
      if (hiddenOp === 'set') f.hidden = true;
      if (hiddenOp === 'unset') f.hidden = false;
      if (hiddenOp) return consumeForensicWarnings('');
      return consumeForensicWarnings(attribDisplayLine(f, resolvedWin));
    }

    case 'certutil': {
      if (tokens[1]?.toLowerCase() !== '-hashfile')
        return consumeForensicWarnings(runTerminalLine(legacyCtx(s), line));
      const algoRaw = tokens[tokens.length - 1]?.toUpperCase() ?? '';
      if (!['SHA256', 'MD5', 'SHA1'].includes(algoRaw)) {
        return consumeForensicWarnings(
          runTerminalLine(legacyCtx(s), line),
        );
      }
      const pathArg = tokens.slice(2, -1).join(' ').trim();
      const hybridCt = resolveWinPathOrUnc(s, stripQuotes(pathArg));
      if (!hybridCt) {
        return consumeForensicWarnings(
          [
            `${stripQuotes(pathArg)}: The system cannot find the file specified.`,
            '0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: The system cannot find the file specified.',
          ].join('\r\n'),
        );
      }
      let hitCt:
        | ReturnType<typeof walkVfs>
        | ReturnType<typeof walkLinuxVfs>
        | null = null;
      let displayPath = hybridCt.win ?? hybridCt.unix ?? pathArg;
      if (hybridCt.unix && s.vfsUnix) {
        hitCt = walkLinuxVfs(s.vfsUnix, hybridCt.unix);
      } else if (hybridCt.win) {
        hitCt = walkVfs(vfsWin, hybridCt.win);
      }
      if (!hitCt || hitCt.node.kind !== 'file') {
        return consumeForensicWarnings(
          [
            `${displayPath}: The system cannot find the file specified.`,
            '0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: The system cannot find the file specified.',
          ].join('\r\n'),
        );
      }
      return consumeForensicWarnings(
        certutilHashOutput(
          displayPath,
          hitCt.node as VfsFileNode,
          algoRaw,
          !!hybridCt.win,
        ),
      );
    }

    case 'strings': {
      const pathArg = tokens.slice(1).join(' ').trim();
      if (!pathArg)
        return consumeForensicWarnings('Strings: usage strings <path>');
      const hybridSt = resolveWinPathOrUnc(s, stripQuotes(pathArg));
      let hitSt:
        | ReturnType<typeof walkVfs>
        | ReturnType<typeof walkLinuxVfs>
        | null = null;
      let disp = hybridSt?.win ?? hybridSt?.unix ?? '';
      if (hybridSt?.unix && s.vfsUnix) {
        hitSt = walkLinuxVfs(s.vfsUnix, hybridSt.unix);
      } else if (hybridSt?.win) {
        hitSt = walkVfs(vfsWin, hybridSt.win);
      }
      if (!hitSt || hitSt.node.kind !== 'file') {
        return consumeForensicWarnings(`Strings: could not open ${pathArg}`);
      }
      return consumeForensicWarnings(stringsOutput(disp || pathArg, hitSt.node));
    }

    case 'copy':
    case 'move':
      return consumeForensicWarnings(
        `[${s.workstationId}] simulated ${cmd0.toLowerCase()} OK (sandbox)`,
      );

    case 'del':
    case 'erase':
      return consumeForensicWarnings(
        'FORENSIC WARNING: Deleting evidence violates chain of custody. Action logged.',
      );

    default:
      break;
  }

  return consumeForensicWarnings(runTerminalLine(legacyCtx(s), line));
}
