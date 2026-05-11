/**
 * VirtualRegistry — in-memory Windows-style registry tree.
 *
 * Path format: HIVE\Subkey\...\Subkey  (case-insensitive).
 * Hives: HKLM, HKCU, HKCR, HKU, HKCC.
 * Long names also accepted: HKEY_LOCAL_MACHINE etc.
 */

export type RegistryValueType =
  | 'REG_SZ'
  | 'REG_DWORD'
  | 'REG_BINARY'
  | 'REG_EXPAND_SZ'
  | 'REG_MULTI_SZ'
  | 'REG_QWORD'

export interface RegistryValue {
  name: string
  type: RegistryValueType
  data: string
}

export interface RegistryNode {
  subkeys: Map<string, RegistryNode>
  values: Map<string, RegistryValue>
}

const HIVE_ALIASES: Record<string, string> = {
  HKLM: 'HKEY_LOCAL_MACHINE',
  HKCU: 'HKEY_CURRENT_USER',
  HKCR: 'HKEY_CLASSES_ROOT',
  HKU: 'HKEY_USERS',
  HKCC: 'HKEY_CURRENT_CONFIG',
  HKEY_LOCAL_MACHINE: 'HKEY_LOCAL_MACHINE',
  HKEY_CURRENT_USER: 'HKEY_CURRENT_USER',
  HKEY_CLASSES_ROOT: 'HKEY_CLASSES_ROOT',
  HKEY_USERS: 'HKEY_USERS',
  HKEY_CURRENT_CONFIG: 'HKEY_CURRENT_CONFIG',
}

function newNode(): RegistryNode {
  return { subkeys: new Map(), values: new Map() }
}

function normalizeHive(part: string): string {
  const upper = part.toUpperCase()
  return HIVE_ALIASES[upper] ?? upper
}

function splitPath(path: string): string[] {
  const parts = path.replace(/\//g, '\\').split('\\').filter(Boolean)
  if (!parts.length) return []
  parts[0] = normalizeHive(parts[0]!)
  return parts
}

export interface RegistrySearchResult {
  path: string
  valueName?: string
  valueData?: string
}

export class VirtualRegistry {
  private root: RegistryNode = newNode()
  private exported: Set<string> = new Set()

  constructor() {
    for (const hive of ['HKEY_LOCAL_MACHINE', 'HKEY_CURRENT_USER', 'HKEY_CLASSES_ROOT', 'HKEY_USERS', 'HKEY_CURRENT_CONFIG']) {
      this.root.subkeys.set(hive, newNode())
    }
  }

  /** Walk to a key, optionally creating missing nodes */
  private walk(parts: string[], create = false): RegistryNode | null {
    let node: RegistryNode | undefined = this.root
    for (const seg of parts) {
      if (!node) return null
      const lookupKey = [...node.subkeys.keys()].find((k) => k.toLowerCase() === seg.toLowerCase())
      if (lookupKey) {
        node = node.subkeys.get(lookupKey)
      } else if (create) {
        const fresh = newNode()
        node.subkeys.set(seg, fresh)
        node = fresh
      } else {
        return null
      }
    }
    return node ?? null
  }

  getNode(path: string): RegistryNode | null {
    return this.walk(splitPath(path), false)
  }

  /** Resolve original casing for the supplied path (so output matches stored names) */
  resolveCanonicalPath(path: string): string {
    const parts = splitPath(path)
    const out: string[] = []
    let node: RegistryNode | undefined = this.root
    for (const seg of parts) {
      if (!node) return path
      const realKey = [...node.subkeys.keys()].find((k) => k.toLowerCase() === seg.toLowerCase())
      if (!realKey) return path
      out.push(realKey)
      node = node.subkeys.get(realKey)
    }
    return out.join('\\')
  }

  setValue(path: string, name: string, type: RegistryValueType, data: string): void {
    const node = this.walk(splitPath(path), true)
    if (!node) return
    node.values.set(name, { name, type, data })
  }

  setSubkey(path: string): void {
    this.walk(splitPath(path), true)
  }

  deleteValue(path: string, name: string): boolean {
    const node = this.walk(splitPath(path), false)
    if (!node) return false
    const real = [...node.values.keys()].find((k) => k.toLowerCase() === name.toLowerCase())
    if (!real) return false
    return node.values.delete(real)
  }

  deleteKey(path: string): boolean {
    const parts = splitPath(path)
    if (parts.length < 2) return false
    const last = parts.pop()!
    const parent = this.walk(parts, false)
    if (!parent) return false
    const real = [...parent.subkeys.keys()].find((k) => k.toLowerCase() === last.toLowerCase())
    if (!real) return false
    return parent.subkeys.delete(real)
  }

  /** Mark a key (and all descendants) as exported — used by ForensicIntegrityEngine */
  markExported(path: string): void {
    this.exported.add(this.resolveCanonicalPath(path).toLowerCase())
  }

  isExported(path: string): boolean {
    const canon = this.resolveCanonicalPath(path).toLowerCase()
    if (this.exported.has(canon)) return true
    for (const exp of this.exported) {
      if (canon.startsWith(exp)) return true
    }
    return false
  }

  /** Build .reg file content for a key tree */
  exportReg(path: string): string {
    const node = this.getNode(path)
    if (!node) return ''
    const lines: string[] = ['Windows Registry Editor Version 5.00', '']
    const canon = this.resolveCanonicalPath(path)
    const recurse = (subPath: string, n: RegistryNode) => {
      lines.push(`[${subPath}]`)
      for (const v of n.values.values()) {
        lines.push(formatRegValue(v))
      }
      lines.push('')
      for (const [name, child] of n.subkeys) {
        recurse(`${subPath}\\${name}`, child)
      }
    }
    recurse(canon, node)
    this.markExported(path)
    return lines.join('\r\n')
  }

  search(term: string, max = 200): RegistrySearchResult[] {
    const out: RegistrySearchResult[] = []
    const lower = term.toLowerCase()
    const recurse = (path: string, n: RegistryNode) => {
      if (out.length >= max) return
      const segs = path.split('\\')
      const last = segs[segs.length - 1] ?? ''
      if (last.toLowerCase().includes(lower)) {
        out.push({ path })
      }
      for (const v of n.values.values()) {
        if (v.name.toLowerCase().includes(lower) || v.data.toLowerCase().includes(lower)) {
          out.push({ path, valueName: v.name, valueData: v.data })
        }
        if (out.length >= max) return
      }
      for (const [name, child] of n.subkeys) {
        recurse(`${path}\\${name}`, child)
      }
    }
    for (const [name, child] of this.root.subkeys) recurse(name, child)
    return out
  }

  /** Render a key in exact `reg query` style. Returns null if not found. */
  query(path: string, valueName?: string, recursive = false): string | null {
    const parts = splitPath(path)
    const node = this.walk(parts, false)
    if (!node) return null
    const canon = this.resolveCanonicalPath(path)
    const lines: string[] = []

    const renderKey = (keyPath: string, n: RegistryNode) => {
      lines.push('')
      lines.push(keyPath)
      const values = [...n.values.values()].sort((a, b) => a.name.localeCompare(b.name))
      for (const v of values) {
        if (valueName && v.name.toLowerCase() !== valueName.toLowerCase()) continue
        lines.push(`    ${v.name}    ${v.type}    ${v.data}`)
      }
    }

    renderKey(canon, node)
    if (recursive) {
      const recurse = (keyPath: string, n: RegistryNode) => {
        for (const [name, child] of n.subkeys) {
          renderKey(`${keyPath}\\${name}`, child)
          recurse(`${keyPath}\\${name}`, child)
        }
      }
      recurse(canon, node)
    }
    return lines.join('\r\n').trimStart() + '\r\n'
  }

  /** Listing of immediate subkey names (for the GUI Registry Editor) */
  listSubkeys(path: string): string[] {
    const node = this.getNode(path)
    if (!node) return []
    return [...node.subkeys.keys()].sort()
  }

  listValues(path: string): RegistryValue[] {
    const node = this.getNode(path)
    if (!node) return []
    return [...node.values.values()]
  }

  hives(): string[] {
    return [...this.root.subkeys.keys()]
  }
}

function formatRegValue(v: RegistryValue): string {
  if (v.type === 'REG_SZ') return `"${v.name}"="${v.data.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  if (v.type === 'REG_DWORD') return `"${v.name}"=dword:${Number(v.data).toString(16).padStart(8, '0')}`
  if (v.type === 'REG_EXPAND_SZ') return `"${v.name}"=hex(2):${asciiToRegHex(v.data)}`
  if (v.type === 'REG_MULTI_SZ') return `"${v.name}"=hex(7):${asciiToRegHex(v.data)}`
  if (v.type === 'REG_BINARY') return `"${v.name}"=hex:${v.data}`
  return `"${v.name}"="${v.data}"`
}

function asciiToRegHex(s: string): string {
  return [...s]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0') + ',00')
    .join(',')
}

export function defaultBaselineRegistry(reg: VirtualRegistry, ctx: { primaryUser: string; hostname: string }): void {
  const u = ctx.primaryUser
  /* HKLM common Run keys */
  reg.setSubkey('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run')
  reg.setValue(
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'SecurityHealth',
    'REG_EXPAND_SZ',
    '%windir%\\system32\\SecurityHealthSystray.exe',
  )
  reg.setValue(
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'RtkAudUService',
    'REG_SZ',
    '"C:\\Program Files\\Realtek\\Audio\\HDA\\RtkAudUService64.exe" -s',
  )
  reg.setValue(
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'IntelGraphicsCommandCenter',
    'REG_SZ',
    '"C:\\Program Files\\Intel\\Graphics\\IGCC.exe" /background',
  )
  reg.setValue(
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'MSUpdate',
    'REG_SZ',
    'C:\\Users\\cleared.user\\AppData\\Roaming\\msupdate.exe',
  )

  /* HKCU Run keys */
  reg.setSubkey('HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run')
  reg.setValue(
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'OneDrive',
    'REG_SZ',
    `"C:\\Users\\${u}\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe" /background`,
  )
  reg.setValue(
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
    'MicrosoftEdgeAutoLaunch',
    'REG_SZ',
    `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --auto-launch`,
  )

  /* RunMRU history */
  reg.setSubkey('HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU')
  reg.setValue(
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU',
    'a',
    'REG_SZ',
    'cmd\\1',
  )
  reg.setValue(
    'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU',
    'b',
    'REG_SZ',
    'powershell\\1',
  )
  reg.setValue('HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU', 'MRUList', 'REG_SZ', 'ba')

  /* Windows version */
  reg.setSubkey('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion')
  reg.setValue('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'ProductName', 'REG_SZ', 'Windows 11 Pro')
  reg.setValue('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'CurrentBuild', 'REG_SZ', '22631')
  reg.setValue('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'EditionID', 'REG_SZ', 'Professional')
  reg.setValue('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'RegisteredOwner', 'REG_SZ', 'CORP')
  reg.setValue('HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'RegisteredOrganization', 'REG_SZ', 'CORP')
  reg.setValue(
    'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion',
    'InstallDate',
    'REG_DWORD',
    String(0x65f3a892),
  )

  /* Terminal Server / RDP */
  reg.setSubkey('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server', 'fDenyTSConnections', 'REG_DWORD', '1')

  /* LSA settings */
  reg.setSubkey('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa', 'RestrictAnonymous', 'REG_DWORD', '0')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa', 'NoLMHash', 'REG_DWORD', '1')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa', 'auditbasedirectories', 'REG_DWORD', '0')

  /* Services list (sample of 30+ realistic services) */
  const services = [
    'AppIDSvc',
    'AppMgmt',
    'AudioEndpointBuilder',
    'BFE',
    'BITS',
    'BrokerInfrastructure',
    'CDPSvc',
    'COMSysApp',
    'CryptSvc',
    'DcomLaunch',
    'Dhcp',
    'Dnscache',
    'DPS',
    'DsmSvc',
    'EventLog',
    'EventSystem',
    'FontCache',
    'gpsvc',
    'iphlpsvc',
    'KeyIso',
    'LanmanServer',
    'LanmanWorkstation',
    'LSM',
    'MpsSvc',
    'Netlogon',
    'NlaSvc',
    'PlugPlay',
    'Power',
    'ProfSvc',
    'RpcEptMapper',
    'RpcSs',
    'SamSs',
    'Schedule',
    'SecurityHealthService',
    'Spooler',
    'sppsvc',
    'TermService',
    'Themes',
    'TrkWks',
    'WdiServiceHost',
    'Winmgmt',
    'WinDefend',
    'wuauserv',
  ]
  for (const svc of services) {
    const path = `HKLM\\SYSTEM\\CurrentControlSet\\Services\\${svc}`
    reg.setSubkey(path)
    reg.setValue(path, 'DisplayName', 'REG_SZ', svc)
    reg.setValue(path, 'ImagePath', 'REG_EXPAND_SZ', `%SystemRoot%\\system32\\svchost.exe -k netsvcs`)
    reg.setValue(path, 'Start', 'REG_DWORD', String(2))
    reg.setValue(path, 'Type', 'REG_DWORD', String(0x10))
  }

  reg.setSubkey('HKLM\\SYSTEM\\CurrentControlSet')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet', 'FirmwareBootDevice', 'REG_SZ', '\\Device\\HarddiskVolume3')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet', 'SystemStartOptions', 'REG_SZ', 'NOEXECUTE=OPTIN')
  reg.setValue('HKLM\\SYSTEM\\CurrentControlSet', 'CloneTag', 'REG_SZ', '1C747864-8D48-4F29-BBAE-AFEF35CE85E7')

  /* Installed software (10+ entries) */
  const installed = [
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0001}', name: 'Microsoft 365 Apps for Enterprise', publisher: 'Microsoft Corporation', version: '16.0.17328.20184' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0002}', name: 'Google Chrome', publisher: 'Google LLC', version: '128.0.6613.114' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0003}', name: 'Mozilla Firefox', publisher: 'Mozilla', version: '129.0.2' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0004}', name: 'Adobe Acrobat Reader DC', publisher: 'Adobe Inc.', version: '24.002.20933' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0005}', name: 'VLC media player', publisher: 'VideoLAN', version: '3.0.20' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0006}', name: 'Microsoft Visual C++ 2015-2022 Redistributable (x64)', publisher: 'Microsoft Corporation', version: '14.40.33810' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0007}', name: 'Notepad++ (64-bit)', publisher: 'Notepad++ Team', version: '8.6.9' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0008}', name: 'Zoom', publisher: 'Zoom Video Communications', version: '6.1.2' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0009}', name: 'Slack', publisher: 'Slack Technologies', version: '4.40.131' },
    { id: '{31C19B92-AE0A-4F1F-8B12-AAAAAAAA0010}', name: '7-Zip 23.01 (x64)', publisher: 'Igor Pavlov', version: '23.01' },
  ]
  for (const sw of installed) {
    const p = `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${sw.id}`
    reg.setSubkey(p)
    reg.setValue(p, 'DisplayName', 'REG_SZ', sw.name)
    reg.setValue(p, 'Publisher', 'REG_SZ', sw.publisher)
    reg.setValue(p, 'DisplayVersion', 'REG_SZ', sw.version)
    reg.setValue(p, 'InstallLocation', 'REG_SZ', `C:\\Program Files\\${sw.name.split(' ')[0]}`)
  }

  void ctx.hostname
}
