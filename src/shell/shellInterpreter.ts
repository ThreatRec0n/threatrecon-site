import type { CaseContent } from '@/data/cases/caseData.types';
import type { Difficulty } from '@/types/case.types';
import {
  runTerminalLine,
  type TerminalContext,
} from '@/utils/terminal/commandRunner';
import {
  buildWorkstationVfs,
  normalizeWindowsPath,
  resolveWindowsPath,
  walkVfs,
  type VfsDirNode,
  type VfsFileNode,
} from './vfs';
import { formatDirListing, parseDirFlags } from './dirFormat';
import { forensicIntegrity } from './ForensicIntegrityEngine';

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
].sort();

export interface ShellSessionState {
  mode: 'cmd' | 'powershell';
  cwd: string;
  vfsRoot: VfsDirNode;
  username: string;
  workstationId: string;
  caseContent: CaseContent;
  difficulty: Difficulty;
}

export function createShellSession(opts: {
  username: string;
  workstationId: string;
  caseContent: CaseContent;
  difficulty: Difficulty;
}): ShellSessionState {
  const tree = opts.caseContent.workstations[opts.workstationId];
  return {
    mode: 'cmd',
    cwd: `C:\\Users\\${opts.username}\\Workspace`,
    vfsRoot: buildWorkstationVfs(tree, opts.username),
    username: opts.username,
    workstationId: opts.workstationId,
    caseContent: opts.caseContent,
    difficulty: opts.difficulty,
  };
}

export function getShellPrompt(s: ShellSessionState): string {
  return s.mode === 'powershell' ? `PS ${s.cwd}> ` : `${s.cwd}> `;
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
    cwd: workspaceRelative(s.cwd, s.username),
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

function certutilHashOutput(absPath: string, node: VfsFileNode, algo: string): string {
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

export function shellAutocomplete(
  s: ShellSessionState,
  index: number,
  tokens: string[],
): string[] {
  const expr = (tokens[index] ?? '').toLowerCase();
  if (index === 0) {
    return SHELL_COMMANDS.filter((c) => c.startsWith(expr));
  }
  return pathCompletions(tokens[index] ?? '', s.cwd, s.vfsRoot);
}

export function executeShellLine(s: ShellSessionState, raw: string): string {
  const line = raw.trim();
  if (!line) return '';

  const ll = line.toLowerCase();

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
      const resolved = resolveWindowsPath(s.cwd, pathArg);
      if (!resolved) {
        return consumeForensicWarnings(
          'Get-FileHash : Cannot find path because it does not exist.',
        );
      }
      const hit = walkVfs(s.vfsRoot, resolved);
      if (!hit || hit.node.kind !== 'file') {
        return consumeForensicWarnings(
          'Get-FileHash : Cannot find path because it does not exist.',
        );
      }
      forensicIntegrity.markFileHashed(normalizeWindowsPath(resolved).toLowerCase());
      const node = hit.node as VfsFileNode;
      const key =
        algo === 'SHA256' ? 'sha256' : algo === 'MD5' ? 'md5' : 'sha1';
      const val = (node[key] ?? '').toUpperCase();
      const pad =
        algo === 'SHA256' ? 64 : algo === 'MD5' ? 32 : 40;
      const hashVal = val.slice(0, pad).padEnd(pad);
      const rows = [
        '',
        `Algorithm       Hash                                                                   Path`,
        `---------       ----                                                                   ----`,
        `${algo.padEnd(15)} ${hashVal}       ${resolved}`,
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
      if (!pathArg) return consumeForensicWarnings(s.cwd);
      let target = stripQuotes(pathArg);
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
      const driveLetter = /^([a-z]:)/i.exec(s.cwd)?.[1]?.toUpperCase() ?? 'C:';
      const resolved =
        target === '\\' || target === '/'
          ? `${driveLetter}\\`
          : resolveWindowsPath(s.cwd, target);
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      const hit = walkVfs(s.vfsRoot, resolved);
      if (!hit || hit.node.kind !== 'dir') {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      s.cwd = normalizeWindowsPath(resolved).replace(/\\+$/, '');
      return consumeForensicWarnings('');
    }

    case 'dir': {
      const flagToks = tokens.slice(1).filter((t) => t.startsWith('/'));
      const pathToks = tokens.slice(1).filter((t) => !t.startsWith('/'));
      const pathArg = pathToks.join(' ').trim();
      const flags = parseDirFlags(flagToks);
      const resolved = pathArg
        ? resolveWindowsPath(s.cwd, stripQuotes(pathArg))
        : s.cwd;
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the path specified.',
        );
      }
      const hit = walkVfs(s.vfsRoot, resolved);
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
      const resolved = resolveWindowsPath(s.cwd, stripQuotes(pathArg));
      if (!resolved) {
        return consumeForensicWarnings(
          'The system cannot find the file specified.',
        );
      }
      const hit = walkVfs(s.vfsRoot, resolved);
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
      const resolved = resolveWindowsPath(s.cwd, stripQuotes(pathArg));
      if (!resolved) return consumeForensicWarnings('');
      const hit = walkVfs(s.vfsRoot, resolved);
      if (!hit || hit.node.kind !== 'file') return consumeForensicWarnings('');
      const f = hit.node as VfsFileNode;
      if (hiddenOp === 'set') f.hidden = true;
      if (hiddenOp === 'unset') f.hidden = false;
      if (hiddenOp) return consumeForensicWarnings('');
      return consumeForensicWarnings(attribDisplayLine(f, resolved));
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
      const resolved = resolveWindowsPath(s.cwd, stripQuotes(pathArg));
      if (!resolved) {
        return consumeForensicWarnings(
          [
            `${stripQuotes(pathArg)}: The system cannot find the file specified.`,
            '0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: The system cannot find the file specified.',
          ].join('\r\n'),
        );
      }
      const hit = walkVfs(s.vfsRoot, resolved);
      if (!hit || hit.node.kind !== 'file') {
        return consumeForensicWarnings(
          [
            `${resolved}: The system cannot find the file specified.`,
            '0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)',
            'CertUtil: The system cannot find the file specified.',
          ].join('\r\n'),
        );
      }
      return consumeForensicWarnings(
        certutilHashOutput(resolved, hit.node as VfsFileNode, algoRaw),
      );
    }

    case 'strings': {
      const pathArg = tokens.slice(1).join(' ').trim();
      if (!pathArg)
        return consumeForensicWarnings('Strings: usage strings <path>');
      const resolved = resolveWindowsPath(s.cwd, stripQuotes(pathArg));
      if (!resolved || !walkVfs(s.vfsRoot, resolved)?.node) {
        return consumeForensicWarnings(`Strings: could not open ${pathArg}`);
      }
      const hit = walkVfs(s.vfsRoot, resolved)!;
      if (hit.node.kind !== 'file')
        return consumeForensicWarnings(`Strings: could not open ${pathArg}`);
      return consumeForensicWarnings(stringsOutput(resolved, hit.node));
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
