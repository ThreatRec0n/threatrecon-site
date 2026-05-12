import type { VfsDirNode, VfsFileNode } from './vfs';

export type DirSortOrder = 'name' | 'size' | 'date' | '-date';

export interface DirFlags {
  bare: boolean;
  recurse: boolean;
  hiddenOnly: boolean;
  showHidden: boolean;
  dirsOnly: boolean;
  wide: boolean;
  lowerCase: boolean;
  sort: DirSortOrder;
}

export function parseDirFlags(tokens: string[]): DirFlags {
  let sort: DirSortOrder = 'name';
  const flags: DirFlags = {
    bare: false,
    recurse: false,
    hiddenOnly: false,
    showHidden: false,
    dirsOnly: false,
    wide: false,
    lowerCase: false,
    sort,
  };
  for (const raw of tokens) {
    const u = raw.toUpperCase();
    if (u === '/B') flags.bare = true;
    if (u === '/S') flags.recurse = true;
    if (u === '/W') flags.wide = true;
    if (u === '/L') flags.lowerCase = true;
    if (u === '/AD' || u === '/A:D') flags.dirsOnly = true;
    if (u === '/A' || u.startsWith('/A:')) {
      flags.showHidden = true;
      if (u.includes(':H')) flags.hiddenOnly = true;
      if (u.includes(':D')) flags.dirsOnly = true;
    }
    const om = /^\/O:?(.+)$/i.exec(raw);
    if (om) {
      const ord = om[1].toUpperCase();
      if (ord === 'N') sort = 'name';
      else if (ord === 'S') sort = 'size';
      else if (ord === 'D') sort = 'date';
      else if (ord === '-D') sort = '-date';
    }
  }
  flags.sort = sort;
  return flags;
}

function displayName(name: string, flags: DirFlags): string {
  return flags.lowerCase ? name.toLowerCase() : name;
}

function fmtLine(node: VfsDirNode | VfsFileNode): { d: string; t: string } {
  void node;
  return { d: '05/07/2026', t: '11:42 PM' };
}

export function fileDisplaySize(node: VfsFileNode): number {
  return node.content.length + (node.binary ? 65536 : 0);
}

function shouldInclude(node: VfsFileNode | VfsDirNode, flags: DirFlags): boolean {
  const hid = Boolean(node.hidden);
  if (flags.hiddenOnly) return hid;
  if (!flags.showHidden && hid) return false;
  if (flags.dirsOnly && node.kind === 'file') return false;
  return true;
}

type Entry = { name: string; node: VfsDirNode | VfsFileNode };

function collectEntries(dir: VfsDirNode): Entry[] {
  const entries: Entry[] = [
    { name: '.', node: dir },
    { name: '..', node: dir },
  ];
  for (const [name, child] of [...dir.children.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    entries.push({ name, node: child });
  }
  return entries;
}

function sortEntries(entries: Entry[], flags: DirFlags): Entry[] {
  const dots = entries.filter((e) => e.name === '.' || e.name === '..');
  const rest = entries.filter((e) => e.name !== '.' && e.name !== '..');
  rest.sort((a, b) => {
    switch (flags.sort) {
      case 'size': {
        const sa = a.node.kind === 'file' ? fileDisplaySize(a.node) : 0;
        const sb = b.node.kind === 'file' ? fileDisplaySize(b.node) : 0;
        if (sa !== sb) return sa - sb;
        return a.name.localeCompare(b.name);
      }
      case 'date':
      case '-date':
        return flags.sort === '-date'
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name);
      default:
        return a.name.localeCompare(b.name);
    }
  });
  const dot = dots.find((e) => e.name === '.');
  const dotdot = dots.find((e) => e.name === '..');
  return [dot!, dotdot!, ...rest];
}

function tallyEntry(name: string, node: VfsDirNode | VfsFileNode, acc: Counts) {
  if (name === '.' || name === '..') {
    acc.dirs += 1;
    return;
  }
  if (node.kind === 'dir') acc.dirs += 1;
  else {
    acc.files += 1;
    acc.bytes += fileDisplaySize(node);
  }
}

type Counts = { files: number; dirs: number; bytes: number };

export function formatDirListing(
  labelPath: string,
  dir: VfsDirNode,
  flags: DirFlags,
  volumeFreeBytes = '187,432,960,000',
): string {
  const rows: string[] = [];
  const totals: Counts = { files: 0, dirs: 0, bytes: 0 };

  const emitWideNames = (entries: Entry[], absLabel: string) => {
    const names = entries
      .filter((e) => shouldInclude(e.node, flags))
      .map((e) =>
        flags.recurse && flags.bare
          ? `${absLabel}\\${displayName(e.name, flags)}`
          : displayName(e.name, flags),
      );
    const cols = 5;
    const maxW = names.reduce((m, n) => Math.max(m, n.length), 1);
    const cell = maxW + 2;
    for (let i = 0; i < names.length; i += cols) {
      const slice = names.slice(i, i + cols);
      rows.push(slice.map((n) => n.padEnd(cell)).join('').trimEnd());
    }
  };

  const emitSection = (absLabel: string, targetDir: VfsDirNode) => {
    if (!flags.bare) {
      rows.push('');
      rows.push(' Volume in drive C has no label.');
      rows.push(' Volume Serial Number is 3A7F-B291');
      rows.push('');
      rows.push(` Directory of ${absLabel}`);
      rows.push('');
    }

    const entries = sortEntries(collectEntries(targetDir), flags).filter((e) =>
      shouldInclude(e.node, flags),
    );

    if (flags.wide && !flags.bare) {
      emitWideNames(entries, absLabel);
      for (const { name, node } of entries) tallyEntry(name, node, totals);
      return;
    }

    for (const { name, node } of entries) {
      const dn = displayName(name, flags);
      if (flags.bare) {
        const line = flags.recurse ? `${absLabel}\\${dn}` : dn;
        rows.push(line);
        tallyEntry(name, node, totals);
        continue;
      }
      const { d, t } = fmtLine(node);
      if (node.kind === 'dir') {
        rows.push(`${d}  ${t}    <DIR>          ${dn}`);
      } else {
        const sz = fileDisplaySize(node);
        rows.push(
          `${d}  ${t}              ${sz.toLocaleString('en-US').padStart(14)} ${dn}`,
        );
      }
      tallyEntry(name, node, totals);
    }
  };

  const normalizedLabel = labelPath.replace(/\\+$/, '');

  if (!flags.recurse) {
    emitSection(normalizedLabel, dir);
  } else {
    const walk = (absPrefix: string, d: VfsDirNode) => {
      emitSection(absPrefix, d);
      for (const [n, ch] of [...d.children.entries()].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        if (ch.kind !== 'dir') continue;
        if (!shouldInclude(ch as VfsDirNode, flags)) continue;
        walk(`${absPrefix}\\${n}`, ch as VfsDirNode);
      }
    };
    walk(normalizedLabel, dir);
  }

  if (!flags.bare) {
    rows.push(
      `               ${totals.files} File(s)${' '.repeat(
        Math.max(0, 14 - String(totals.files).length),
      )}${totals.bytes.toLocaleString('en-US')} bytes`,
    );
    rows.push(
      `               ${totals.dirs} Dir(s)  ${volumeFreeBytes} bytes free`,
    );
  }

  return rows.join('\r\n');
}
