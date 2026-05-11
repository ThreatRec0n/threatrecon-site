import type { VDir, VFile, VNode } from '../types/filesystem.types'
import { sha256Hex } from '../utils/hashUtils'

const ansi = {
  dir: '\x1b[34m',
  exe: '\x1b[32m',
  reset: '\x1b[0m',
}

function nowTs(): number {
  return Date.now()
}

function normalizePathSegments(raw: string): string[] {
  const trimmed = raw.trim().replace(/\//g, '\\')
  return trimmed.split('\\').filter(Boolean)
}

function fmtBytesGrouped(n: number): string {
  return n.toLocaleString('en-US')
}

export class VirtualFileSystem {
  private root: VDir
  private cwd: string

  constructor(primaryUser = 'jsmith') {
    this.root = this.createRoot(primaryUser)
    this.cwd = `C:\\Users\\${primaryUser}`
  }

  resetFromTemplate(tree: VDir, cwd?: string): void {
    this.root = tree
    this.cwd = cwd ?? `C:\\Users\\jsmith`
  }

  getRoot(): VDir {
    return this.root
  }

  get cwdPath(): string {
    return this.cwd
  }

  set cwdPath(v: string) {
    this.cwd = this.resolveAbsolute(v)
  }

  private createRoot(primaryUser: string): VDir {
    const mkDir = (name: string): VDir => ({
      name,
      type: 'directory',
      children: new Map(),
      created: nowTs(),
      modified: nowTs(),
      accessed: nowTs(),
      permissions: 'drwxrwxrwx',
      hidden: false,
      owner: 'SYSTEM',
      readonly: false,
      system: true,
    })

    const mkFile = (
      name: string,
      content: string,
      opts?: Partial<{ hidden: boolean; owner: string; system: boolean; readonly: boolean; binary: boolean; signed: boolean }>,
    ): VFile => ({
      name,
      type: 'file',
      content,
      isBinary: !!opts?.binary,
      size: new Blob([content]).size || content.length,
      created: nowTs(),
      modified: nowTs(),
      accessed: nowTs(),
      permissions: '-rw-rw-rw-',
      hidden: !!opts?.hidden,
      owner: opts?.owner ?? 'SYSTEM',
      readonly: !!opts?.readonly,
      system: !!opts?.system,
      signed: opts?.signed ?? false,
    })

    const root = mkDir('C:')
    const children = root.children
    const windows = mkDir('Windows')
    const system32 = mkDir('System32')
    const winevt = mkDir('winevt')
    const logs = mkDir('Logs')

    const legitExe = [
      'svchost.exe',
      'cmd.exe',
      'powershell.exe',
      'tasklist.exe',
      'netstat.exe',
      'reg.exe',
      'schtasks.exe',
      'wevtutil.exe',
      'certutil.exe',
      'wmic.exe',
      'ipconfig.exe',
      'ping.exe',
      'nslookup.exe',
      'tracert.exe',
      'arp.exe',
      'route.exe',
      'net.exe',
      'netsh.exe',
      'whoami.exe',
      'systeminfo.exe',
      'find.exe',
      'where.exe',
      'tree.com',
      'attrib.exe',
      'xcopy.exe',
      'lsass.exe',
      'winlogon.exe',
      'services.exe',
      'csrss.exe',
      'wininit.exe',
      'smss.exe',
      'spoolsv.exe',
      'explorer.exe',
    ]
    for (const ex of legitExe) {
      const bin = mkFile(ex, 'MZ\x90\x00binarystub' + '\x00'.repeat(120), { system: true, binary: true, signed: true })
      bin.signaturePublisher = 'Microsoft Windows'
      system32.children.set(ex, bin)
    }
    logs.children.set(
      'Security.evtx',
      mkFile('Security.evtx', '[virtual EVTX — query via Event Viewer / wevtutil]', {
        system: true,
        binary: true,
      }),
    )
    logs.children.set('System.evtx', mkFile('System.evtx', '[virtual EVTX]', { system: true, binary: true }))
    logs.children.set('Application.evtx', mkFile('Application.evtx', '[virtual EVTX]', { system: true, binary: true }))
    logs.children.set(
      'Microsoft-Windows-PowerShell%4Operational.evtx',
      mkFile('Microsoft-Windows-PowerShell%4Operational.evtx', '[virtual EVTX]', { system: true, binary: true }),
    )
    winevt.children.set('Logs', logs)
    system32.children.set('winevt', winevt)
    const sysWow = mkDir('SysWOW64')
    for (const ex of ['svchost.exe', 'cmd.exe', 'powershell.exe']) {
      const f = mkFile(ex, 'MZ\x90\x0032bitstub' + '\x00'.repeat(80), { system: true, binary: true, signed: true })
      f.signaturePublisher = 'Microsoft Windows'
      sysWow.children.set(ex, f)
    }
    windows.children.set('SysWOW64', sysWow)
    windows.children.set('System32', system32)
    windows.children.set('Temp', mkDir('Temp'))
    windows.children.set('Prefetch', mkDir('Prefetch'))
    children.set('Windows', windows)

    const programFiles = mkDir('Program Files')
    programFiles.children.set('Microsoft Office', mkDir('Microsoft Office'))
    const chrome = mkDir('Google')
    chrome.children.set('Chrome', mkDir('Chrome'))
    programFiles.children.set('Google', chrome)
    children.set('Program Files', programFiles)

    children.set('Program Files (x86)', mkDir('Program Files (x86)'))
    const programData = mkDir('ProgramData')
    const ms = mkDir('Microsoft')
    ms.children.set('Windows Defender', mkDir('Windows Defender'))
    programData.children.set('Microsoft', ms)
    children.set('ProgramData', programData)

    const users = mkDir('Users')
    const admin = mkDir('Administrator')
    const userHome = mkDir(primaryUser)
    const appData = mkDir('AppData')
    const local = mkDir('Local')
    const temp = mkDir('Temp')
    local.children.set('Temp', temp)
    const microsoft = mkDir('Microsoft')
    const winNs = mkDir('Windows')
    const psRoot = mkDir('PowerShell')
    const psReadline = mkDir('PSReadLine')
    psReadline.children.set(
      'ConsoleHost_history.txt',
      mkFile(
        'ConsoleHost_history.txt',
        'Get-Process\r\nInvoke-WebRequest http://internal.update/help.ps1\r\n',
        { owner: primaryUser },
      ),
    )
    psRoot.children.set('PSReadLine', psReadline)
    winNs.children.set('PowerShell', psRoot)
    microsoft.children.set('Windows', winNs)
    local.children.set('Microsoft', microsoft)
    appData.children.set('Local', local)

    const roaming = mkDir('Roaming')
    const roamingMS = mkDir('Microsoft')
    const roamingMSWin = mkDir('Windows')
    roamingMSWin.children.set('Recent', mkDir('Recent'))
    const startMenu = mkDir('Start Menu')
    const programs = mkDir('Programs')
    programs.children.set('Startup', mkDir('Startup'))
    startMenu.children.set('Programs', programs)
    roamingMSWin.children.set('Start Menu', startMenu)
    roamingMS.children.set('Windows', roamingMSWin)
    roaming.children.set('Microsoft', roamingMS)
    appData.children.set('Roaming', roaming)

    userHome.children.set('AppData', appData)
    userHome.children.set('Desktop', mkDir('Desktop'))
    userHome.children.set('Documents', mkDir('Documents'))
    userHome.children.set('Downloads', mkDir('Downloads'))
    users.children.set('Administrator', admin)
    users.children.set(primaryUser, userHome)
    children.set('Users', users)

    children.set('$Recycle.Bin', mkDir('$Recycle.Bin'))
    return root
  }

  private resolveAbsolute(input: string): string {
    let raw = input.trim()
    if (raw === '~') raw = `C:\\Users\\jsmith`
    if (!raw.includes(':')) {
      raw = `${this.cwd}\\${raw}`
    }
    const segments = normalizePathSegments(raw)
    const stack: string[] = []
    if (segments[0]?.endsWith(':')) {
      stack.push(segments[0]!)
      for (let i = 1; i < segments.length; i++) stack.push(segments[i]!)
    } else {
      const cwdSeg = normalizePathSegments(this.cwd)
      cwdSeg.forEach((s) => stack.push(s))
      segments.forEach((s) => {
        if (s === '..') stack.pop()
        else if (s !== '.' && s !== '') stack.push(s)
      })
    }
    return stack.join('\\')
  }

  resolvePath(input: string): string {
    if (input.includes(':') || input.startsWith('\\')) return this.resolveAbsolute(input)
    return this.resolveAbsolute(`${this.cwd}\\${input}`)
  }

  getNode(path: string): VNode | null {
    const abs = this.resolvePath(path)
    const segments = normalizePathSegments(abs)
    let node: VNode | undefined = this.root
    for (const seg of segments) {
      if (node.type !== 'directory') return null
      const realKey = [...node.children.keys()].find((k) => k.toLowerCase() === seg.toLowerCase())
      if (!realKey) return null
      node = node.children.get(realKey)
      if (!node) return null
    }
    return node ?? null
  }

  cd(path: string): string {
    const target = this.resolvePath(path)
    const n = this.getNode(target)
    if (!n || n.type !== 'directory') {
      return `The system cannot find the path specified.\r\n`
    }
    this.cwd = this.canonicalize(target)
    return ''
  }

  /** Return path with original case from the tree */
  private canonicalize(abs: string): string {
    const segments = normalizePathSegments(abs)
    const canonical: string[] = []
    let node: VNode | undefined = this.root
    for (const seg of segments) {
      if (!node || node.type !== 'directory') {
        canonical.push(seg)
        continue
      }
      const realKey = [...node.children.keys()].find((k) => k.toLowerCase() === seg.toLowerCase())
      if (!realKey) {
        canonical.push(seg)
        continue
      }
      canonical.push(realKey)
      node = node.children.get(realKey)
    }
    return canonical.join('\\')
  }

  getCurrentPath(): string {
    return this.cwd
  }

  /** dir command — exact Windows formatting */
  ls(path = '.', flags: string[] = []): string {
    const flagSet = new Set(flags.map((f) => f.toLowerCase()))
    const showHidden = flagSet.has('/a') || flagSet.has('/ah') || flagSet.has('-force')
    const onlyHidden = flagSet.has('/ah')
    const recursive = flagSet.has('/s') || flagSet.has('-recurse')
    const bare = flagSet.has('/b')

    const targetAbs = path === '.' ? this.cwd : this.resolvePath(path)
    const dir = this.getNode(targetAbs)
    if (!dir || dir.type !== 'directory') return `File Not Found\r\n`

    if (recursive) {
      const lines: string[] = []
      const walk = (cur: VDir, curPath: string) => {
        lines.push(...this.dirBlock(curPath, cur, { showHidden, onlyHidden, bare }))
        for (const [name, child] of cur.children) {
          if (child.type === 'directory') walk(child, `${curPath}\\${name}`)
        }
      }
      walk(dir, this.canonicalize(targetAbs))
      return lines.join('\r\n') + '\r\n'
    }

    if (bare) {
      const out: string[] = []
      const list = [...dir.children.entries()].sort((a, b) => a[0].localeCompare(b[0]))
      for (const [name, node] of list) {
        if (!showHidden && node.hidden) continue
        if (onlyHidden && !node.hidden) continue
        out.push(name)
      }
      return out.join('\r\n') + '\r\n'
    }

    return this.dirBlock(this.canonicalize(targetAbs), dir, { showHidden, onlyHidden, bare: false }).join('\r\n') + '\r\n'
  }

  private dirBlock(path: string, dir: VDir, opts: { showHidden: boolean; onlyHidden: boolean; bare: boolean }): string[] {
    const out: string[] = []
    out.push(' Volume in drive C has no label.')
    out.push(' Volume Serial Number is A1B2-C3D4')
    out.push('')
    out.push(` Directory of ${path}`)
    out.push('')

    const entries = [...dir.children.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    let fileCount = 0
    let dirCount = 0
    let total = 0
    out.push(`${fmtDirDate(dir.modified)}    <DIR>          .`)
    out.push(`${fmtDirDate(dir.modified)}    <DIR>          ..`)
    dirCount += 2
    for (const [name, node] of entries) {
      if (!opts.showHidden && node.hidden) continue
      if (opts.onlyHidden && !node.hidden) continue
      const stamp = fmtDirDate(node.modified)
      if (node.type === 'directory') {
        out.push(`${stamp}    ${ansi.dir}<DIR>${ansi.reset}          ${name}`)
        dirCount++
      } else {
        const sizeStr = fmtBytesGrouped(node.size).padStart(14)
        out.push(`${stamp}    ${sizeStr} ${name}`)
        total += node.size
        fileCount++
      }
    }
    out.push(`               ${String(fileCount).padStart(2)} File(s) ${fmtBytesGrouped(total).padStart(14)} bytes`)
    out.push(`               ${String(dirCount).padStart(2)} Dir(s)  234,567,123,456 bytes free`)
    return out
  }

  cat(filePath: string): string {
    const n = this.getNode(this.resolvePath(filePath))
    if (!n || n.type !== 'file') return 'The system cannot find the file specified.\r\n'
    if (n.isBinary) return 'This is not a text file.\r\n'
    return n.content
  }

  /** Raw file accessor for hashing/strings — bypasses isBinary text check */
  getFile(filePath: string): VFile | null {
    const n = this.getNode(this.resolvePath(filePath))
    if (!n || n.type !== 'file') return null
    return n
  }

  find(path: string, name: string): string[] {
    const rootDir = this.getNode(this.resolvePath(path))
    const out: string[] = []
    const walk = (d: VDir, prefix: string) => {
      for (const [k, ch] of d.children) {
        const p = `${prefix}\\${k}`
        if (k.toLowerCase().includes(name.toLowerCase())) out.push(p)
        if (ch.type === 'directory') walk(ch, p)
      }
    }
    if (rootDir?.type === 'directory') walk(rootDir, this.canonicalize(this.resolvePath(path)))
    return out
  }

  stat(filePath: string): string {
    const n = this.getNode(this.resolvePath(filePath))
    if (!n) return 'The system cannot find the path specified.\r\n'
    return [
      `  File: ${filePath}`,
      `  Size: ${n.type === 'file' ? n.size : 0} bytes`,
      `  Created: ${new Date(n.created).toISOString()}`,
      `  Modified: ${new Date(n.modified).toISOString()}`,
    ].join('\r\n') + '\r\n'
  }

  mkdir(path: string): void {
    const abs = this.resolvePath(path)
    const parentPath = abs.replace(/\\[^\\]+$/, '')
    const name = abs.split('\\').pop()!
    const parent = this.getNode(parentPath) as VDir | null
    if (!parent || parent.type !== 'directory') return
    parent.children.set(name, {
      name,
      type: 'directory',
      children: new Map(),
      created: nowTs(),
      modified: nowTs(),
      accessed: nowTs(),
      permissions: 'drwxrwxrwx',
      hidden: false,
      owner: 'Users',
      readonly: false,
      system: false,
    })
  }

  touch(filePath: string, content = ''): void {
    const abs = this.resolvePath(filePath)
    const parentPath = abs.replace(/\\[^\\]+$/, '')
    const name = abs.split('\\').pop()!
    const parent = this.getNode(parentPath) as VDir | null
    if (!parent || parent.type !== 'directory') return
    parent.children.set(name, {
      name,
      type: 'file',
      content,
      isBinary: false,
      size: new Blob([content]).size || content.length,
      created: nowTs(),
      modified: nowTs(),
      accessed: nowTs(),
      permissions: '-rw-rw-rw-',
      hidden: false,
      owner: 'Users',
      readonly: false,
      system: false,
    })
  }

  /** Generic write/replace — used by reg export to drop a .reg file in VFS */
  write(filePath: string, content: string): void {
    this.touch(filePath, content)
  }

  rm(filePath: string, flags: string[] = []): boolean {
    const abs = this.resolvePath(filePath)
    const parentPath = abs.replace(/\\[^\\]+$/, '')
    const name = abs.split('\\').pop()!
    const parent = this.getNode(parentPath) as VDir | null
    if (!parent || parent.type !== 'directory') return false
    const realKey = [...parent.children.keys()].find((k) => k.toLowerCase() === name.toLowerCase())
    if (!realKey) return false
    const node = parent.children.get(realKey)!
    if (node.type === 'directory' && !flags.includes('/s')) return false
    parent.children.delete(realKey)
    return true
  }

  cp(src: string, dest: string): boolean {
    const s = this.getNode(this.resolvePath(src))
    const dParentPath = this.resolvePath(dest).replace(/\\[^\\]+$/, '')
    const dName = this.resolvePath(dest).split('\\').pop()!
    const dParent = this.getNode(dParentPath) as VDir | null
    if (!s || s.type !== 'file' || !dParent || dParent.type !== 'directory') return false
    dParent.children.set(dName, { ...s, name: dName, created: nowTs(), modified: nowTs() })
    return true
  }

  mv(src: string, dest: string): boolean {
    const snode = this.getNode(this.resolvePath(src))
    const dParentPath = this.resolvePath(dest).replace(/\\[^\\]+$/, '')
    const dName = this.resolvePath(dest).split('\\').pop()!
    const sparentPath = this.resolvePath(src).replace(/\\[^\\]+$/, '')
    const sname = this.resolvePath(src).split('\\').pop()!
    const sparent = this.getNode(sparentPath) as VDir | null
    const dparent = this.getNode(dParentPath) as VDir | null
    if (!snode || !sparent || !dparent) return false
    sparent.children.delete(sname)
    dparent.children.set(dName, { ...snode, name: dName, modified: nowTs() })
    return true
  }

  chmod(_permissions: string, _path: string): void {
    /* simulated */
  }

  chown(_owner: string, _path: string): void {
    /* simulated */
  }

  grep(pattern: string, filePath: string): string {
    const text = this.cat(filePath)
    if (text.endsWith('specified.\r\n')) return text
    const lines = text.split(/\r?\n/)
    const rx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return lines.filter((l) => rx.test(l)).join('\r\n') + '\r\n'
  }

  head(filePath: string, lines = 10): string {
    return this.cat(filePath).split(/\r?\n/).slice(0, lines).join('\r\n') + '\r\n'
  }

  tail(filePath: string, lines = 10): string {
    return this.cat(filePath).split(/\r?\n/).slice(-lines).join('\r\n') + '\r\n'
  }

  wc(filePath: string): string {
    const text = this.cat(filePath)
    const ls = text.split(/\r?\n/).filter((l) => l.length)
    const words = text.split(/\s+/).filter(Boolean).length
    return `${ls.length} ${words} ${new Blob([text]).size} ${filePath}\r\n`
  }

  diff(file1: string, file2: string): string {
    const a = this.cat(file1)
    const b = this.cat(file2)
    if (a.includes('cannot find') || b.includes('cannot find')) return 'Compare failed.\r\n'
    return a === b ? 'Files compare OK\r\n' : 'Files are different\r\n'
  }

  hash(filePath: string, algorithm: 'MD5' | 'SHA1' | 'SHA256' = 'SHA256'): string {
    const n = this.getNode(this.resolvePath(filePath))
    if (!n || n.type !== 'file') return 'File not found.\r\n'
    return this.computeHash(n, algorithm) + '\r\n'
  }

  computeHash(file: VFile, _algorithm: 'MD5' | 'SHA1' | 'SHA256' = 'SHA256'): string {
    if (file.knownHash) return file.knownHash
    return sha256Hex(file.content)
  }

  /** Tab completion. Returns possible completions for the partial path. */
  getCompletions(partial: string): string[] {
    const hasSep = partial.includes('\\') || partial.includes('/')
    let dirPath = this.cwd
    let prefix = partial
    if (hasSep) {
      const segs = partial.replace(/\//g, '\\').split('\\')
      prefix = segs.pop() ?? ''
      dirPath = segs.join('\\') || (partial.startsWith('\\') ? 'C:' : this.cwd)
    }
    const dir = this.getNode(dirPath || this.cwd)
    if (!dir || dir.type !== 'directory') return []
    const lower = prefix.toLowerCase()
    const out: string[] = []
    for (const [name, node] of dir.children) {
      if (!name.toLowerCase().startsWith(lower)) continue
      out.push(node.type === 'directory' ? `${name}\\` : name)
    }
    return out.sort((a, b) => a.localeCompare(b))
  }
}

function fmtDirDate(ts: number): string {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  let hh = d.getHours()
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${mm}/${dd}/${yyyy}  ${String(hh).padStart(2, '0')}:${mi} ${ampm}`
}
