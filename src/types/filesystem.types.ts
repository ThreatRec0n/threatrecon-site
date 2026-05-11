export type FileNodeType = 'file' | 'directory'

export interface FileNodeBase {
  name: string
  type: FileNodeType
  created: number
  modified: number
  accessed: number
  permissions: string
  hidden: boolean
  owner: string
  readonly: boolean
  system: boolean
}

export interface VFile extends FileNodeBase {
  type: 'file'
  content: string
  isBinary: boolean
  size: number
  /** Pre-computed strings output (Sysinternals-style) — overrides content scrape */
  strings?: string[]
  /** sigcheck behavior */
  signed?: boolean
  signaturePublisher?: string
  /** Pre-baked SHA256 hash overrides content-based hash for malicious binaries */
  knownHash?: string
}

export interface VDir extends FileNodeBase {
  type: 'directory'
  children: Map<string, VFile | VDir>
}

export type VNode = VFile | VDir
