import type { VDir, VFile } from '../types/filesystem.types'

function splitWindowsPath(abs: string): string[] {
  const norm = abs.trim().replace(/\//g, '\\')
  const parts = norm.split('\\').filter(Boolean)
  if (parts[0]?.endsWith(':')) return parts
  return ['C:', ...parts]
}

export function ensureDirectoryChain(root: VDir, segments: string[]): VDir {
  let cur = root
  for (const seg of segments) {
    const next = cur.children.get(seg)
    if (next && next.type === 'directory') {
      cur = next
      continue
    }
    const dir: VDir = {
      name: seg,
      type: 'directory',
      children: new Map(),
      created: Date.now(),
      modified: Date.now(),
      accessed: Date.now(),
      permissions: 'drwxrwxrwx',
      hidden: false,
      owner: 'SYSTEM',
      readonly: false,
      system: false,
    }
    cur.children.set(seg, dir)
    cur = dir
  }
  return cur
}

export function plantTextFile(root: VDir, absPath: string, content: string, opts?: Partial<VFile>): void {
  const segments = splitWindowsPath(absPath)
  const fileName = segments.pop()!
  const parent = ensureDirectoryChain(root, segments)
  const file: VFile = {
    name: fileName,
    type: 'file',
    content,
    isBinary: !!opts?.isBinary,
    size: new Blob([content]).size || content.length,
    created: opts?.created ?? Date.now(),
    modified: opts?.modified ?? Date.now(),
    accessed: opts?.accessed ?? Date.now(),
    permissions: opts?.permissions ?? '-rw-rw-rw-',
    hidden: !!opts?.hidden,
    owner: opts?.owner ?? 'Users',
    readonly: !!opts?.readonly,
    system: !!opts?.system,
    strings: opts?.strings,
    signed: opts?.signed ?? false,
    signaturePublisher: opts?.signaturePublisher,
    knownHash: opts?.knownHash,
  }
  parent.children.set(fileName, file)
}
