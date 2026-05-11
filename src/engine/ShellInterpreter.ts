import type { CaseDefinition } from '../types/case.types'
import type { VirtualFileSystem } from './VirtualFileSystem'
import type { VirtualRegistry, RegistryValueType } from './VirtualRegistry'
import type { VirtualFirewall } from './VirtualFirewall'
import type { ForensicIntegrityEngine } from './ForensicIntegrityEngine'

const C = {
  r: '\x1b[31m',
  g: '\x1b[32m',
  b: '\x1b[34m',
  c: '\x1b[36m',
  m: '\x1b[35m',
  y: '\x1b[33m',
  w: '\x1b[1;37m',
  z: '\x1b[0m',
}

const KNOWN_CMD_COMMANDS = [
  'cd',
  'chdir',
  'cls',
  'clear',
  'dir',
  'type',
  'copy',
  'move',
  'del',
  'erase',
  'mkdir',
  'md',
  'rmdir',
  'rd',
  'echo',
  'set',
  'help',
  'man',
  'hostname',
  'date',
  'time',
  'systeminfo',
  'whoami',
  'tasklist',
  'taskkill',
  'netstat',
  'ipconfig',
  'ping',
  'nslookup',
  'tracert',
  'arp',
  'route',
  'reg',
  'wevtutil',
  'schtasks',
  'net',
  'netsh',
  'certutil',
  'where',
  'tree',
  'xcopy',
  'attrib',
  'wmic',
  'find',
  'findstr',
  'powershell',
  'pwsh',
  'cmd',
  'exit',
  'strings',
  'sigcheck',
]

const KNOWN_PS_COMMANDS = [
  'Get-ChildItem',
  'ls',
  'dir',
  'gci',
  'Get-Content',
  'cat',
  'type',
  'gc',
  'Get-Process',
  'ps',
  'gps',
  'Stop-Process',
  'kill',
  'spps',
  'Get-FileHash',
  'Get-NetTCPConnection',
  'Get-LocalUser',
  'Get-LocalGroupMember',
  'Get-WinEvent',
  'Get-Service',
  'Set-Location',
  'cd',
  'Where-Object',
  'where',
  '?',
  'ForEach-Object',
  '%',
  'foreach',
  'Select-Object',
  'select',
  'Measure-Object',
  'Sort-Object',
  'sort',
  'Get-History',
  'Invoke-Expression',
  'iex',
  'Invoke-WebRequest',
  'iwr',
  'curl',
  'wget',
  'New-NetFirewallRule',
  'Get-Help',
  'help',
  'man',
  'exit',
]

export class ShellInterpreter {
  powershellMode = false
  private vfs: VirtualFileSystem
  private readonly caseDef: CaseDefinition
  private readonly registry: VirtualRegistry
  private readonly firewall: VirtualFirewall
  private readonly forensic: ForensicIntegrityEngine
  private readonly onCommand?: (raw: string) => void
  private pendingConfirm: { prompt: string; onYes: () => string; onNo: () => string } | null = null

  constructor(
    vfs: VirtualFileSystem,
    caseDef: CaseDefinition,
    registry: VirtualRegistry,
    firewall: VirtualFirewall,
    forensic: ForensicIntegrityEngine,
    onCommand?: (raw: string) => void,
  ) {
    this.vfs = vfs
    this.caseDef = caseDef
    this.registry = registry
    this.firewall = firewall
    this.forensic = forensic
    this.onCommand = onCommand
  }

  setVfs(vfs: VirtualFileSystem): void {
    this.vfs = vfs
  }

  /** Execute one command line; returns terminal output string */
  execute(line: string): string {
    const trimmed = line.trim()
    if (!trimmed) return ''
    this.onCommand?.(trimmed)

    if (this.pendingConfirm) {
      const c = this.pendingConfirm
      this.pendingConfirm = null
      const ans = trimmed.toLowerCase()
      if (ans === 'y' || ans === 'yes') return c.onYes()
      return c.onNo()
    }

    const lower = trimmed.toLowerCase()
    if (lower === 'powershell' || lower === 'pwsh') {
      this.powershellMode = true
      return `Windows PowerShell\r\nCopyright (C) Microsoft Corporation. All rights reserved.\r\n\r\nInstall the latest PowerShell for new features and improvements! https://aka.ms/PSWindows\r\n\r\n`
    }
    if (lower === 'cmd' || (this.powershellMode && lower === 'exit')) {
      this.powershellMode = false
      return ''
    }
    if (!this.powershellMode && lower === 'exit') {
      return ''
    }

    if (this.powershellMode) return this.executePowerShell(trimmed)
    return this.executeCmd(trimmed)
  }

  prompt(): string {
    const path = this.vfs.getCurrentPath()
    if (this.pendingConfirm) return this.pendingConfirm.prompt
    if (this.powershellMode) return `${C.c}PS ${path}>${C.z} `
    return `${path}>`
  }

  /** Available commands list — for tab completion */
  knownCommands(): string[] {
    return this.powershellMode ? KNOWN_PS_COMMANDS : KNOWN_CMD_COMMANDS
  }

  /** Path completion delegated to VFS (used by terminal Tab key) */
  pathCompletions(partial: string): string[] {
    return this.vfs.getCompletions(partial)
  }

  // ────────────────────────────────────────────────────────────────────────
  // CMD
  // ────────────────────────────────────────────────────────────────────────

  private executeCmd(line: string): string {
    const parts = tokenize(line)
    const cmd = parts[0]?.toLowerCase() ?? ''
    const args = parts.slice(1)

    switch (cmd) {
      case 'cls':
      case 'clear':
        return '\x1b[2J\x1b[H'
      case 'cd':
      case 'chdir':
        if (!args.length) return `${this.vfs.getCurrentPath()}\r\n`
        return this.vfs.cd(args.join(' '))
      case 'dir':
        return this.dirCmd(args)
      case 'type':
        return this.vfs.cat(args.join(' '))
      case 'copy':
        return this.cmdCopy(args)
      case 'move':
        return this.cmdMove(args)
      case 'del':
      case 'erase':
        return this.cmdDel(args)
      case 'mkdir':
      case 'md':
        this.vfs.mkdir(args.join(' '))
        return ''
      case 'rmdir':
      case 'rd':
        this.vfs.rm(args[0] ?? '', ['/s'])
        return ''
      case 'echo':
        return `${args.join(' ')}\r\n`
      case 'set':
        return this.cmdSet()
      case 'help':
      case 'man':
        return helpText(args[0])
      case 'hostname':
        return `${this.caseDef.hostname}\r\n`
      case 'date':
        return `The current date is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric' })}\r\n`
      case 'time':
        return `The current time is: ${new Date().toLocaleTimeString('en-US')}\r\n`
      case 'systeminfo':
        return this.systeminfo()
      case 'whoami':
        return this.whoami(args)
      case 'tasklist':
        return this.tasklist(args)
      case 'taskkill':
        return this.taskkill(args)
      case 'netstat':
        return this.netstat(args)
      case 'ipconfig':
        return this.ipconfig(args)
      case 'ping':
        return this.ping(args)
      case 'nslookup':
        return this.nslookup(args)
      case 'tracert':
        return this.tracert(args)
      case 'arp':
        return this.arp(args)
      case 'route':
        return this.route(args)
      case 'reg':
        return this.reg(args)
      case 'wevtutil':
        return this.wevtutil(args)
      case 'schtasks':
        return this.schtasks(args)
      case 'net':
        return this.net(args)
      case 'netsh':
        return this.netsh(args)
      case 'certutil':
        return this.certutil(args)
      case 'where':
        return this.where(args)
      case 'tree':
        return this.tree(args)
      case 'xcopy':
        return `        1 File(s) copied\r\n`
      case 'attrib':
        return ``
      case 'wmic':
        return this.wmic(args)
      case 'find':
      case 'findstr':
        return this.findstr(args)
      case 'strings':
        return this.strings(args)
      case 'sigcheck':
        return this.sigcheck(args)
      default:
        return `'${cmd}' is not recognized as an internal or external command,\r\noperable program or batch file.\r\n`
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // PowerShell
  // ────────────────────────────────────────────────────────────────────────

  private executePowerShell(line: string): string {
    const parts = tokenize(line)
    const head = (parts[0] ?? '').toLowerCase()
    const args = parts.slice(1)

    if (head === 'exit') {
      this.powershellMode = false
      return ''
    }
    if (head === 'cls' || head === 'clear' || head === 'clear-host') return '\x1b[2J\x1b[H'
    if (head === 'cd' || head === 'set-location' || head === 'sl') {
      return this.vfs.cd(args.join(' ') || '.')
    }
    if (head === 'pwd' || head === 'get-location' || head === 'gl') return `Path\r\n----\r\n${this.vfs.getCurrentPath()}\r\n`
    if (head === 'ls' || head === 'dir' || head === 'gci' || head === 'get-childitem') {
      return this.psGetChildItem(args)
    }
    if (head === 'cat' || head === 'type' || head === 'gc' || head === 'get-content') {
      return this.vfs.cat(args.filter((a) => !a.startsWith('-')).join(' ').replace(/['"]/g, ''))
    }
    if (head === 'ps' || head === 'gps' || head === 'get-process') return this.psGetProcess()
    if (head === 'stop-process' || head === 'kill' || head === 'spps') {
      const idArg = args.find((a) => /^\d+$/.test(a)) ?? args[1]
      return `Confirm\r\nAre you sure you want to perform this action?\r\nPerforming the operation "Stop-Process" on target "${idArg}".\r\n[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "Y"): Y\r\n`
    }
    if (head === 'get-filehash') return this.psGetFileHash(args)
    if (head === 'get-nettcpconnection') return this.netstat(['-an', '-o'])
    if (head === 'get-localuser') return this.psGetLocalUser()
    if (head === 'get-localgroupmember') return this.psGetLocalGroupMember(args)
    if (head === 'get-service') return this.psGetService()
    if (head === 'get-winevent') return this.wevtutil(['qe', 'Security', '/c:5', '/f:text'])
    if (head === 'get-history' || head === 'h' || head === 'history') return ``
    if (head === 'invoke-expression' || head === 'iex') return `${C.y}WARNING: Script execution logged${C.z}\r\n`
    if (head === 'new-netfirewallrule') return this.psNewNetFirewallRule(args)
    if (head === 'invoke-webrequest' || head === 'iwr' || head === 'curl' || head === 'wget') {
      return `${C.r}Invoke-WebRequest: Unable to connect to the remote server (sandbox).${C.z}\r\n`
    }
    if (head === 'help' || head === 'get-help' || head === 'man') return helpText(args[0])
    return `${C.r}${parts[0]} : The term '${parts[0]}' is not recognized as the name of a cmdlet,\r\nfunction, script file, or operable program.${C.z}\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // dir
  // ────────────────────────────────────────────────────────────────────────

  private dirCmd(args: string[]): string {
    const flags = args.filter((a) => a.startsWith('/'))
    const positional = args.filter((a) => !a.startsWith('/'))
    return this.vfs.ls(positional[0] ?? '.', flags) || ''
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers — common
  // ────────────────────────────────────────────────────────────────────────

  private cmdCopy(args: string[]): string {
    if (args.length < 2) return `The syntax of the command is incorrect.\r\n`
    return this.vfs.cp(args[0]!, args[1]!) ? `        1 file(s) copied.\r\n` : `The system cannot find the file specified.\r\n`
  }

  private cmdMove(args: string[]): string {
    if (args.length < 2) return `The syntax of the command is incorrect.\r\n`
    return this.vfs.mv(args[0]!, args[1]!) ? `        1 file(s) moved.\r\n` : `The system cannot find the file specified.\r\n`
  }

  private cmdDel(args: string[]): string {
    const path = args.filter((a) => !a.startsWith('/')).join(' ')
    if (!path) return `The syntax of the command is incorrect.\r\n`
    const flags = args.filter((a) => a.startsWith('/'))
    const file = this.vfs.getFile(path)
    if (file && !this.forensic.isHashed(this.vfs.resolvePath(path))) {
      this.forensic.recordViolation('delete_before_hash', this.vfs.resolvePath(path), `Deleted ${path} without prior hash.`)
    }
    const ok = this.vfs.rm(path, flags)
    return ok ? `` : `Could Not Find ${path}\r\n`
  }

  private cmdSet(): string {
    return [
      `ALLUSERSPROFILE=C:\\ProgramData`,
      `APPDATA=C:\\Users\\${this.caseDef.primaryUser}\\AppData\\Roaming`,
      `COMPUTERNAME=${this.caseDef.hostname}`,
      `ComSpec=C:\\Windows\\system32\\cmd.exe`,
      `HOMEDRIVE=C:`,
      `HOMEPATH=\\Users\\${this.caseDef.primaryUser}`,
      `LOGONSERVER=\\\\DC01`,
      `NUMBER_OF_PROCESSORS=8`,
      `OS=Windows_NT`,
      `Path=C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\`,
      `PROCESSOR_ARCHITECTURE=AMD64`,
      `SystemDrive=C:`,
      `SystemRoot=C:\\Windows`,
      `TEMP=C:\\Users\\${this.caseDef.primaryUser}\\AppData\\Local\\Temp`,
      `USERDOMAIN=CORP`,
      `USERNAME=${this.caseDef.primaryUser}`,
      `USERPROFILE=C:\\Users\\${this.caseDef.primaryUser}`,
      `windir=C:\\Windows`,
    ].join('\r\n') + '\r\n'
  }

  // ────────────────────────────────────────────────────────────────────────
  // systeminfo
  // ────────────────────────────────────────────────────────────────────────

  private systeminfo(): string {
    const installDate = '3/15/2026, 9:14:22 AM'
    const bootTime = '5/7/2026, 8:02:11 AM'
    return [
      `Host Name:                 ${this.caseDef.hostname}`,
      `OS Name:                   Microsoft Windows 11 Pro`,
      `OS Version:                10.0.22631 N/A Build 22631`,
      `OS Manufacturer:           Microsoft Corporation`,
      `OS Configuration:          Member Workstation`,
      `OS Build Type:             Multiprocessor Free`,
      `Registered Owner:          ${this.caseDef.industry.companyName}`,
      `Registered Organization:   ${this.caseDef.industry.companyName}`,
      `Product ID:                00330-80000-00000-AA123`,
      `Original Install Date:     ${installDate}`,
      `System Boot Time:          ${bootTime}`,
      `System Manufacturer:       Dell Inc.`,
      `System Model:              OptiPlex 7090`,
      `System Type:               x64-based PC`,
      `Processor(s):              1 Processor(s) Installed.`,
      `                           [01]: Intel64 Family 6 Model 167 Stepping 1 GenuineIntel ~3600 Mhz`,
      `BIOS Version:              Dell Inc. 1.12.0, 1/20/2026`,
      `Windows Directory:         C:\\Windows`,
      `System Directory:          C:\\Windows\\system32`,
      `Boot Device:               \\Device\\HarddiskVolume1`,
      `System Locale:             en-us;English (United States)`,
      `Input Locale:              en-us;English (United States)`,
      `Time Zone:                 (UTC-05:00) Eastern Time (US & Canada)`,
      `Total Physical Memory:     16,384 MB`,
      `Available Physical Memory: 8,204 MB`,
      `Virtual Memory: Max Size:  18,820 MB`,
      `Virtual Memory: Available: 9,614 MB`,
      `Virtual Memory: In Use:    9,206 MB`,
      `Page File Location(s):     C:\\pagefile.sys`,
      `Domain:                    corp.local`,
      `Logon Server:              \\\\DC01`,
      `Hotfix(s):                 12 Hotfix(s) Installed.`,
      `                           [01]: KB5034441`,
      `                           [02]: KB5035853`,
      `                           [03]: KB5036893`,
      `                           [04]: KB5037771`,
      `                           [05]: KB5038500`,
      `                           [06]: KB5039212`,
      `                           [07]: KB5040442`,
      `                           [08]: KB5041585`,
      `                           [09]: KB5042099`,
      `                           [10]: KB5043076`,
      `                           [11]: KB5044033`,
      `                           [12]: KB5045061`,
      `Network Card(s):           1 NIC(s) Installed.`,
      `                           [01]: Intel(R) Ethernet Connection I219-V`,
      `                                 Connection Name: Ethernet`,
      `                                 DHCP Enabled:    Yes`,
      `                                 DHCP Server:     10.0.1.1`,
      `                                 IP address(es)`,
      `                                 [01]: 10.0.1.5`,
    ].join('\r\n') + '\r\n'
  }

  // ────────────────────────────────────────────────────────────────────────
  // whoami
  // ────────────────────────────────────────────────────────────────────────

  private whoami(args: string[]): string {
    const u = this.caseDef.primaryUser
    const flag = args[0]?.toLowerCase()
    if (flag === '/all') {
      return [
        ``,
        `USER INFORMATION`,
        `----------------`,
        ``,
        `User Name           SID`,
        `=================== =============================================`,
        `corp\\${u}${' '.repeat(Math.max(0, 19 - u.length - 5))} S-1-5-21-1234567890-1234567890-1234567890-1001`,
        ``,
        ``,
        `GROUP INFORMATION`,
        `-----------------`,
        ``,
        `Group Name                             Type             SID          Attributes`,
        `====================================== ================ ============ ==================================================`,
        `Everyone                               Well-known group S-1-1-0      Mandatory group, Enabled by default, Enabled group`,
        `CORP\\Domain Users                      Group            S-1-5-21...  Mandatory group, Enabled by default, Enabled group`,
        `BUILTIN\\Users                          Alias            S-1-5-32-545 Mandatory group, Enabled by default, Enabled group`,
        `NT AUTHORITY\\NETWORK                   Well-known group S-1-5-2      Mandatory group, Enabled by default, Enabled group`,
        `NT AUTHORITY\\Authenticated Users       Well-known group S-1-5-11     Mandatory group, Enabled by default, Enabled group`,
        ``,
        ``,
        `PRIVILEGES INFORMATION`,
        `----------------------`,
        ``,
        `Privilege Name                Description                          State`,
        `============================= ==================================== ========`,
        `SeShutdownPrivilege           Shut down the system                 Disabled`,
        `SeChangeNotifyPrivilege       Bypass traverse checking             Enabled`,
        `SeUndockPrivilege             Remove computer from docking station Disabled`,
        `SeIncreaseWorkingSetPrivilege Increase a process working set       Disabled`,
        `SeTimeZonePrivilege           Change the time zone                 Disabled`,
        ``,
      ].join('\r\n')
    }
    if (flag === '/user') return `\r\nUSER INFORMATION\r\n----------------\r\n\r\nUser Name           SID\r\n=================== =============================================\r\ncorp\\${u}            S-1-5-21-1234567890-1234567890-1234567890-1001\r\n\r\n`
    return `corp\\${u}\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // tasklist
  // ────────────────────────────────────────────────────────────────────────

  private tasklist(args: string[]): string {
    const lower = args.join(' ').toLowerCase()
    const showSvc = lower.includes('/svc')
    const verbose = lower.includes('/v')

    let processes = [...this.caseDef.processes]
    const fiMatch = /\/fi\s+"?([^"]+)"?/i.exec(args.join(' '))
    if (fiMatch) {
      processes = applyTasklistFilter(processes, fiMatch[1] ?? '')
    }

    if (showSvc) {
      const head = `${'Image Name'.padEnd(25)} ${'PID'.padStart(8)} ${'Services'.padEnd(40)}`
      const bar = `${'='.repeat(25)} ${'='.repeat(8)} ${'='.repeat(40)}`
      const rows = processes.map((p) => {
        const svc = (p.services ?? []).join(',') || 'N/A'
        return `${p.name.padEnd(25)} ${String(p.pid).padStart(8)} ${svc.padEnd(40)}`
      })
      return [head, bar, ...rows, ''].join('\r\n')
    }

    if (verbose) {
      const head = `${'Image Name'.padEnd(25)} ${'PID'.padStart(8)} ${'Session Name'.padEnd(16)} ${'Session#'.padStart(11)} ${'Mem Usage'.padStart(12)} ${'Status'.padEnd(15)} ${'User Name'.padEnd(20)} ${'CPU Time'.padEnd(15)} Window Title`
      const bar = `${'='.repeat(25)} ${'='.repeat(8)} ${'='.repeat(16)} ${'='.repeat(11)} ${'='.repeat(12)} ${'='.repeat(15)} ${'='.repeat(20)} ${'='.repeat(15)} ${'='.repeat(30)}`
      const rows = processes.map((p) => {
        const mem = `${(p.memKb).toLocaleString('en-US')} K`.padStart(12)
        const status = (p.status ?? 'Running').padEnd(15)
        const user = (p.user.includes('\\') ? p.user : `CORP\\${p.user}`).padEnd(20)
        const cpu = `0:00:${String(Math.floor((p.cpuMs ?? 0) / 1000)).padStart(2, '0')}`.padEnd(15)
        const title = p.windowTitle ?? 'N/A'
        return `${p.name.padEnd(25)} ${String(p.pid).padStart(8)} ${p.sessionName.padEnd(16)} ${String(p.sessionNum).padStart(11)} ${mem} ${status} ${user} ${cpu} ${title}`
      })
      return [head, bar, ...rows, ''].join('\r\n')
    }

    const header = `Image Name                     PID Session Name        Session#    Mem Usage`
    const bar = `========================= ======== ================ =========== ============`
    const rows = processes.map((p) => {
      const mem = `${p.memKb.toLocaleString('en-US')} K`.padStart(12)
      return `${p.name.padEnd(25)} ${String(p.pid).padStart(8)} ${p.sessionName.padEnd(16)} ${String(p.sessionNum).padStart(11)} ${mem}`
    })
    return [header, bar, ...rows, ''].join('\r\n')
  }

  private taskkill(args: string[]): string {
    const pidArg = args[args.findIndex((a) => a.toLowerCase() === '/pid') + 1] ?? args.find((a) => /^\d+$/.test(a))
    const imArg = args[args.findIndex((a) => a.toLowerCase() === '/im') + 1]
    if (!pidArg && !imArg) return `ERROR: Invalid argument/option - '${args.join(' ')}'.\r\n`
    if (pidArg) {
      const pid = Number(pidArg)
      const proc = this.caseDef.processes.find((p) => p.pid === pid)
      if (!proc) return `ERROR: The process "${pid}" not found.\r\n`
      return `SUCCESS: The process with PID ${pid} has been terminated.\r\n`
    }
    return `SUCCESS: Sent termination signal to the process "${imArg}".\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // netstat
  // ────────────────────────────────────────────────────────────────────────

  private netstat(args: string[]): string {
    const flagStr = args.filter((a) => a.startsWith('-')).join('').toLowerCase()
    const showAll = flagStr.includes('a')
    const showPid = flagStr.includes('o')
    const showProc = flagStr.includes('b')

    if (showProc) {
      return `The requested operation requires elevation.\r\n`
    }

    let conns = [...this.caseDef.networkConnections]
    if (!showAll) conns = conns.filter((c) => c.state === 'ESTABLISHED')

    const out: string[] = ['', 'Active Connections', '']
    if (showPid) {
      out.push(`  Proto  Local Address          Foreign Address        State           PID`)
    } else {
      out.push(`  Proto  Local Address          Foreign Address        State`)
    }
    for (const c of conns) {
      const localPad = (c.local ?? '').padEnd(22)
      const foreignPad = (c.foreign ?? '').padEnd(22)
      const statePad = c.state === 'LISTENING' ? 'LISTENING'.padEnd(15) : c.state.padEnd(15)
      const proto = c.proto.padEnd(5)
      if (showPid) {
        out.push(`  ${proto}  ${localPad} ${foreignPad} ${statePad} ${c.pid}`)
      } else if (c.proto === 'UDP') {
        out.push(`  ${proto}  ${localPad} *:*${' '.repeat(19)}                  `)
      } else {
        out.push(`  ${proto}  ${localPad} ${foreignPad} ${statePad}`)
      }
    }
    return out.join('\r\n') + '\r\n'
  }

  // ────────────────────────────────────────────────────────────────────────
  // ipconfig
  // ────────────────────────────────────────────────────────────────────────

  private ipconfig(args: string[]): string {
    if (args.includes('/all')) {
      return [
        ``,
        `Windows IP Configuration`,
        ``,
        `   Host Name . . . . . . . . . . . . : ${this.caseDef.hostname}`,
        `   Primary Dns Suffix  . . . . . . . : corp.local`,
        `   Node Type . . . . . . . . . . . . : Hybrid`,
        `   IP Routing Enabled. . . . . . . . : No`,
        `   WINS Proxy Enabled. . . . . . . . : No`,
        `   DNS Suffix Search List. . . . . . : corp.local`,
        ``,
        `Ethernet adapter Ethernet:`,
        ``,
        `   Connection-specific DNS Suffix  . : corp.local`,
        `   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-V`,
        `   Physical Address. . . . . . . . . : A4-C3-F0-12-34-56`,
        `   DHCP Enabled. . . . . . . . . . . : Yes`,
        `   Autoconfiguration Enabled . . . . : Yes`,
        `   IPv4 Address. . . . . . . . . . . : 10.0.1.5(Preferred)`,
        `   Subnet Mask . . . . . . . . . . . : 255.255.255.0`,
        `   Lease Obtained. . . . . . . . . . : Thursday, May 7, 2026 8:02:11 AM`,
        `   Lease Expires . . . . . . . . . . : Friday, May 8, 2026 8:02:11 AM`,
        `   Default Gateway . . . . . . . . . : 10.0.1.1`,
        `   DHCP Server . . . . . . . . . . . : 10.0.1.1`,
        `   DNS Servers . . . . . . . . . . . : 10.0.1.10`,
        `                                       8.8.8.8`,
        `   NetBIOS over Tcpip. . . . . . . . : Enabled`,
        ``,
      ].join('\r\n')
    }
    return [
      ``,
      `Windows IP Configuration`,
      ``,
      ``,
      `Ethernet adapter Ethernet:`,
      ``,
      `   Connection-specific DNS Suffix  . : corp.local`,
      `   IPv4 Address. . . . . . . . . . . : 10.0.1.5`,
      `   Subnet Mask . . . . . . . . . . . : 255.255.255.0`,
      `   Default Gateway . . . . . . . . . : 10.0.1.1`,
      ``,
    ].join('\r\n')
  }

  private ping(args: string[]): string {
    const host = args.find((a) => !a.startsWith('-')) ?? '127.0.0.1'
    const lines = [`\r\nPinging ${host} with 32 bytes of data:`]
    for (let i = 0; i < 4; i++) lines.push(`Reply from ${host}: bytes=32 time=${12 + i}ms TTL=54`)
    lines.push(``, `Ping statistics for ${host}:`, `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`, `Approximate round trip times in milli-seconds:`, `    Minimum = 12ms, Maximum = 15ms, Average = 13ms`)
    return lines.join('\r\n') + '\r\n'
  }

  private nslookup(args: string[]): string {
    const host = args[0] ?? 'update.internal'
    const ip = this.caseDef.c2Ip ?? '203.0.113.10'
    return `\r\nServer:  dns1.corp.local\r\nAddress:  10.0.1.10\r\n\r\nNon-authoritative answer:\r\nName:    ${host}\r\nAddress:  ${ip}\r\n`
  }

  private tracert(args: string[]): string {
    const host = args[0] ?? '8.8.8.8'
    return `\r\nTracing route to ${host} over a maximum of 30 hops\r\n\r\n  1    <1 ms    <1 ms    <1 ms  10.0.1.1\r\n  2     2 ms     2 ms     2 ms  203.0.113.1\r\n  3     8 ms     8 ms     8 ms  ${host}\r\n\r\nTrace complete.\r\n`
  }

  private arp(_args: string[]): string {
    return `\r\nInterface: 10.0.1.5 --- 0xb\r\n  Internet Address      Physical Address      Type\r\n  10.0.1.1              00-11-22-33-44-55     dynamic\r\n  10.0.1.10             00-15-5d-01-ab-32     dynamic\r\n  224.0.0.22            01-00-5e-00-00-16     static\r\n`
  }

  private route(_args: string[]): string {
    return `\r\nIPv4 Route Table\r\n===========================================================================\r\nActive Routes:\r\nNetwork Destination        Netmask          Gateway       Interface  Metric\r\n          0.0.0.0          0.0.0.0       10.0.1.1       10.0.1.5     25\r\n         10.0.1.0    255.255.255.0         On-link       10.0.1.5    281\r\n        127.0.0.0        255.0.0.0         On-link      127.0.0.1    331\r\n===========================================================================\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // reg
  // ────────────────────────────────────────────────────────────────────────

  private reg(args: string[]): string {
    const sub = args[0]?.toLowerCase()
    const rest = args.slice(1)
    if (sub === 'query') return this.regQuery(rest)
    if (sub === 'add') return this.regAdd(rest)
    if (sub === 'delete') return this.regDelete(rest)
    if (sub === 'export') return this.regExport(rest)
    return `ERROR: Invalid syntax.\r\nType "REG /?" for usage.\r\n`
  }

  private regQuery(args: string[]): string {
    const path = args[0]
    if (!path) return `ERROR: Invalid syntax.\r\n`
    const valueIdx = args.findIndex((a) => a.toLowerCase() === '/v')
    const valueName = valueIdx >= 0 ? args[valueIdx + 1] : undefined
    const recursive = args.some((a) => a.toLowerCase() === '/s')
    const out = this.registry.query(path, valueName, recursive)
    if (out == null) return `ERROR: The system was unable to find the specified registry key or value.\r\n`
    return out
  }

  private regAdd(args: string[]): string {
    const path = args[0]
    if (!path) return `ERROR: Invalid syntax.\r\n`
    const vIdx = args.findIndex((a) => a.toLowerCase() === '/v')
    const tIdx = args.findIndex((a) => a.toLowerCase() === '/t')
    const dIdx = args.findIndex((a) => a.toLowerCase() === '/d')
    if (vIdx < 0) {
      this.registry.setSubkey(path)
      return `The operation completed successfully.\r\n`
    }
    const name = args[vIdx + 1] ?? ''
    const type = (args[tIdx + 1] as RegistryValueType) ?? 'REG_SZ'
    const data = args[dIdx + 1] ?? ''
    this.registry.setValue(path, name, type, data)
    return `The operation completed successfully.\r\n`
  }

  private regDelete(args: string[]): string {
    const path = args[0]
    if (!path) return `ERROR: Invalid syntax.\r\n`
    const vIdx = args.findIndex((a) => a.toLowerCase() === '/v')
    const value = vIdx >= 0 ? args[vIdx + 1] : undefined
    const force = args.some((a) => a.toLowerCase() === '/f')
    const target = value ? `${path}\\${value}` : path

    const performDelete = (): string => {
      if (!this.registry.isExported(path)) {
        this.forensic.recordViolation('delete_before_export', target, 'Registry deleted without export.')
      }
      const ok = value ? this.registry.deleteValue(path, value) : this.registry.deleteKey(path)
      return ok ? `The operation completed successfully.\r\n` : `ERROR: The system was unable to find the specified registry key or value.\r\n`
    }

    if (force) return performDelete()

    this.pendingConfirm = {
      prompt: value
        ? `Delete the registry value ${value} (Yes/No)? `
        : `Permanently delete the registry key ${path} (Yes/No)? `,
      onYes: performDelete,
      onNo: () => `The operation was cancelled by the user.\r\n`,
    }
    return ''
  }

  private regExport(args: string[]): string {
    const path = args[0]
    const file = args[1]
    if (!path || !file) return `ERROR: Invalid syntax.\r\n`
    const content = this.registry.exportReg(path)
    if (!content) return `ERROR: The system was unable to find the specified registry key or value.\r\n`
    this.vfs.write(file, content)
    this.forensic.recordExport(path)
    return `The operation completed successfully.\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // wevtutil
  // ────────────────────────────────────────────────────────────────────────

  private wevtutil(args: string[]): string {
    const sub = args[0]?.toLowerCase()
    if (sub === 'qe') {
      const log = args[1] ?? 'Security'
      const all = args.join(' ')
      const cm = /\/c:(\d+)/i.exec(all)
      const fmtMatch = /\/f:(text|xml)/i.exec(all)
      const fmt = (fmtMatch?.[1] ?? 'xml').toLowerCase()
      const reverse = /\/rd:true/i.test(all)
      const limit = cm ? Number(cm[1]) : 5
      let entries = (this.caseDef.eventLogEntries ?? []).filter((e) => e.log.toLowerCase() === log.toLowerCase())
      entries = reverse ? entries.slice().reverse() : entries
      entries = entries.slice(0, limit)
      if (fmt === 'text') {
        return entries
          .map((e, i) => `Event[${i}]:\r\n  Log Name: ${e.log}\r\n  Source: ${e.source}\r\n  Date: ${e.time}\r\n  Event ID: ${e.eventId}\r\n  Task: ${e.task}\r\n  Level: ${e.level}\r\n  Computer: ${e.computer}\r\n`)
          .join('\r\n')
      }
      return entries.map((e) => e.xml).join('\r\n') + '\r\n'
    }
    if (sub === 'cl') {
      const log = args[1] ?? 'Security'
      this.forensic.recordViolation('log_clear', log, `Security log '${log}' cleared.`)
      return `\r\n` /* clearing logs prints nothing on success — but we trigger Event 1102 in events */
    }
    if (sub === 'el') {
      return `Application\r\nSecurity\r\nSetup\r\nSystem\r\nMicrosoft-Windows-PowerShell/Operational\r\n`
    }
    if (sub === 'gl') {
      const log = args[1] ?? 'Security'
      return `name: ${log}\r\nenabled: true\r\ntype: Admin\r\nowningPublisher:\r\nisolation: Application\r\nchannelAccess: O:BAG:SYD:(A;;0xf0007;;;SY)(A;;0x7;;;BA)\r\nlogging:\r\n  logFileName: %SystemRoot%\\System32\\Winevt\\Logs\\${log}.evtx\r\n  retention: false\r\n  autoBackup: false\r\n  maxSize: 20971520\r\n`
    }
    return `Unknown parameter\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // schtasks
  // ────────────────────────────────────────────────────────────────────────

  private schtasks(args: string[]): string {
    const all = args.join(' ').toLowerCase()
    if (all.includes('/query')) {
      const fo = /\/fo\s+(list|table|csv)/i.exec(args.join(' '))
      const tnMatch = /\/tn\s+"?([^"]+)"?/i.exec(args.join(' '))
      let tasks = [...this.caseDef.scheduledTasks]
      if (tnMatch) {
        tasks = tasks.filter((t) => t.name.toLowerCase().includes(tnMatch[1]!.toLowerCase()))
      }
      const fmt = (fo?.[1] ?? 'TABLE').toUpperCase()
      if (fmt === 'CSV') {
        const head = `"HostName","TaskName","Next Run Time","Status","Logon Mode","Last Run Time","Last Result","Author","Task To Run","Start In","Comment","Scheduled Task State","Idle Time","Power Management","Run As User","Delete Task If Not Rescheduled","Stop Task If Runs X Hours and X Mins","Schedule","Schedule Type","Start Time","Start Date","End Date","Days","Months","Repeat: Every","Repeat: Until: Time","Repeat: Until: Duration","Repeat: Stop If Still Running"`
        const rows = tasks.map((t) => `"${this.caseDef.hostname}","${t.name}","${t.nextRun}","${t.status}","Interactive/Background","${t.lastRun}","0","${t.author}","${t.command}","N/A","N/A","Enabled","Disabled","Stop On Battery Mode, No Start On Batteries","${t.runAs}","Disabled","72:00:00","Scheduling data is not available in this format.","Daily","3:00:00 AM","5/6/2026","N/A","Every 1 day(s)","N/A","Disabled","Disabled","Disabled","Disabled"`)
        return [head, ...rows, ''].join('\r\n')
      }
      if (fmt === 'TABLE') {
        const head = `\r\nFolder: \\\r\nTaskName                                 Next Run Time          Status\r\n======================================== ====================== ===============`
        const rows = tasks.map((t) => `${t.name.padEnd(40).slice(0, 40)} ${t.nextRun.padEnd(22)} ${t.status}`)
        return [head, ...rows, ''].join('\r\n')
      }
      const out: string[] = []
      for (const t of tasks) {
        const folder = t.name.includes('\\') ? t.name.substring(0, t.name.lastIndexOf('\\')) : '\\'
        out.push(``)
        out.push(`Folder: ${folder}`)
        out.push(`HostName:                             ${this.caseDef.hostname}`)
        out.push(`TaskName:                             ${t.name}`)
        out.push(`Next Run Time:                        ${t.nextRun}`)
        out.push(`Status:                               ${t.status}`)
        out.push(`Logon Mode:                           Interactive/Background`)
        out.push(`Last Run Time:                        ${t.lastRun}`)
        out.push(`Last Result:                          0`)
        out.push(`Author:                               ${t.author}`)
        out.push(`Task To Run:                          ${t.command}`)
        out.push(`Start In:                             N/A`)
        out.push(`Comment:                              N/A`)
        out.push(`Scheduled Task State:                 Enabled`)
        out.push(`Idle Time:                            Disabled`)
        out.push(`Power Management:                     Stop On Battery Mode, No Start On Batteries`)
        out.push(`Run As User:                          ${t.runAs}`)
        out.push(`Delete Task If Not Rescheduled:       Disabled`)
        out.push(`Stop Task If Runs X Hours and X Mins: 72:00:00`)
        out.push(`Schedule:                             Scheduling data is not available in this format.`)
        out.push(`Schedule Type:                        Daily`)
        out.push(`Start Time:                           3:00:00 AM`)
        out.push(`Start Date:                           5/6/2026`)
        out.push(`End Date:                             N/A`)
        out.push(`Days:                                 Every 1 day(s)`)
        out.push(`Months:                               N/A`)
        out.push(`Repeat: Every:                        Disabled`)
        out.push(`Repeat: Until: Time:                  Disabled`)
        out.push(`Repeat: Until: Duration:              Disabled`)
        out.push(`Repeat: Stop If Still Running:        Disabled`)
      }
      return out.join('\r\n') + '\r\n'
    }
    if (all.includes('/delete')) {
      return `SUCCESS: The scheduled task was successfully deleted.\r\n`
    }
    if (all.includes('/create')) {
      return `SUCCESS: The scheduled task was successfully created.\r\n`
    }
    return `ERROR: Invalid syntax.\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // net
  // ────────────────────────────────────────────────────────────────────────

  private net(args: string[]): string {
    const sub = args[0]?.toLowerCase()
    if (sub === 'user' && args.length === 1) return this.netUserList()
    if (sub === 'user' && args[1]) {
      if (args.includes('/delete') || args.includes('/DELETE')) return `The command completed successfully.\r\n`
      return this.netUserDetail(args[1])
    }
    if (sub === 'localgroup') return this.netLocalGroup(args.slice(1))
    if (sub === 'session') return `There are no entries in the list.\r\n`
    if (sub === 'use') return `New connections will be remembered.\r\n\r\nThere are no entries in the list.\r\n`
    return `The command completed successfully.\r\n`
  }

  private netUserList(): string {
    const names = this.caseDef.userAccounts.map((u) => u.name).concat(['Administrator', 'Guest', 'DefaultAccount'])
    const unique = Array.from(new Set(names))
    const cols = 3
    const colW = 25
    const out: string[] = ['', `User accounts for \\\\${this.caseDef.hostname}`, '', '-'.repeat(79)]
    for (let i = 0; i < unique.length; i += cols) {
      out.push(unique.slice(i, i + cols).map((n) => n.padEnd(colW)).join(''))
    }
    out.push('The command completed successfully.', '')
    return out.join('\r\n')
  }

  private netUserDetail(name: string): string {
    const u = this.caseDef.userAccounts.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (!u) return `The user name could not be found.\r\n\r\nMore help is available by typing NET HELPMSG 2221.\r\n`
    return [
      ``,
      `User name                    ${u.name}`,
      `Full Name                    ${u.fullName || ''}`,
      `Comment                      ${u.description || ''}`,
      `User's comment               `,
      `Country/region code          000 (System Default)`,
      `Account active               ${u.enabled ? 'Yes' : 'No'}`,
      `Account expires              Never`,
      ``,
      `Password last set            ${u.lastLogon}`,
      `Password expires             Never`,
      `Password changeable          ${u.lastLogon}`,
      `Password required            Yes`,
      `User may change password     Yes`,
      ``,
      `Workstations allowed         All`,
      `Logon script                 `,
      `User profile                 `,
      `Home directory               `,
      `Last logon                   ${u.lastLogon}`,
      ``,
      `Logon hours allowed          All`,
      ``,
      `Local Group Memberships      ${u.groups.map((g) => `*${g}`).join('       ')}`,
      `Global Group memberships     *None`,
      `The command completed successfully.`,
      ``,
    ].join('\r\n')
  }

  private netLocalGroup(args: string[]): string {
    if (!args.length) {
      return `\r\nAliases for \\\\${this.caseDef.hostname}\r\n\r\n-------------------------------------------------------------------------------\r\n*Administrators\r\n*Backup Operators\r\n*Cryptographic Operators\r\n*Distributed COM Users\r\n*Event Log Readers\r\n*Guests\r\n*Hyper-V Administrators\r\n*Network Configuration Operators\r\n*Performance Log Users\r\n*Performance Monitor Users\r\n*Power Users\r\n*Remote Desktop Users\r\n*Remote Management Users\r\n*Replicator\r\n*System Managed Accounts Group\r\n*Users\r\nThe command completed successfully.\r\n`
    }
    const group = args[0]!
    const members = this.caseDef.userAccounts.filter((u) => u.groups.includes(group)).map((u) => u.name)
    return [
      ``,
      `Alias name     ${group}`,
      `Comment        Members in this group can fully administer the computer/domain`,
      ``,
      `Members`,
      ``,
      `-------------------------------------------------------------------------------`,
      ...members,
      `The command completed successfully.`,
      ``,
    ].join('\r\n')
  }

  // ────────────────────────────────────────────────────────────────────────
  // netsh
  // ────────────────────────────────────────────────────────────────────────

  private netsh(args: string[]): string {
    const lower = args.join(' ').toLowerCase()
    if (lower.startsWith('advfirewall firewall add rule')) {
      const name = pickArg(args, 'name=')
      const dir = (pickArg(args, 'dir=') ?? 'out').toLowerCase() === 'in' ? 'In' : 'Out'
      const action = (pickArg(args, 'action=') ?? 'block').toLowerCase() === 'allow' ? 'Allow' : 'Block'
      const remoteIp = pickArg(args, 'remoteip=') ?? 'Any'
      const remotePort = pickArg(args, 'remoteport=') ?? 'Any'
      const protocol = pickArg(args, 'protocol=') ?? 'Any'
      const profile = pickArg(args, 'profile=') ?? 'Domain,Private,Public'
      const program = pickArg(args, 'program=')
      this.firewall.add({ name: name ?? `Rule-${Date.now()}`, direction: dir, action, remoteIp, remotePort, protocol, profiles: profile, program })
      return `Ok.\r\n`
    }
    if (lower.startsWith('advfirewall firewall show rule')) {
      return this.firewall.formatShowAll()
    }
    if (lower.startsWith('advfirewall firewall delete rule')) {
      const name = pickArg(args, 'name=') ?? ''
      this.firewall.delete(name)
      return `\r\nDeleted ${name}\r\nOk.\r\n`
    }
    if (lower.startsWith('advfirewall set')) {
      return `Ok.\r\n`
    }
    if (lower.startsWith('interface ip show')) {
      return this.ipconfig(['/all'])
    }
    return `Ok.\r\n`
  }

  // ────────────────────────────────────────────────────────────────────────
  // certutil
  // ────────────────────────────────────────────────────────────────────────

  private certutil(args: string[]): string {
    const sub = args[0]?.toLowerCase()
    if (sub === '-hashfile') {
      const path = args[1]
      if (!path) return `CertUtil: Too few arguments\r\n`
      const file = this.vfs.getFile(path)
      if (!file) return `CertUtil: -hashfile command FAILED: 0x80070002 (WIN32: 2 ERROR_FILE_NOT_FOUND)\r\nCertUtil: The system cannot find the file specified.\r\n`
      const alg = (args[2] ?? 'SHA256').toUpperCase()
      const hash = this.vfs.computeHash(file, alg as 'SHA256' | 'SHA1' | 'MD5')
      this.forensic.recordHash(this.vfs.resolvePath(path))
      return [`${alg} hash of ${path}:`, hash, `CertUtil: -hashfile command completed successfully.`, ''].join('\r\n')
    }
    return `CertUtil [Options] <command>\r\n  Verbs:\r\n    -hashfile        -- Generate and display cryptographic hash over a file\r\n    -dump            -- Dump configuration information or files\r\n    -store           -- Dump the contents of a certificate store\r\n`
  }

  private where(args: string[]): string {
    const name = args[0] ?? ''
    if (!name) return `INFO: Could not find files for the given pattern(s).\r\n`
    return `C:\\Windows\\System32\\${name}\r\n`
  }

  private tree(args: string[]): string {
    const path = args.find((a) => !a.startsWith('/')) ?? this.vfs.getCurrentPath()
    const lines: string[] = [`Folder PATH listing for volume Windows`, `Volume serial number is A1B2-C3D4`, path]
    const node = this.vfs.getNode(path)
    if (!node || node.type !== 'directory') {
      lines.push('No subfolders exist ')
      return lines.join('\r\n') + '\r\n'
    }
    const walk = (dir: import('../types/filesystem.types').VDir, prefix: string) => {
      const dirs = [...dir.children.entries()].filter(([, n]) => n.type === 'directory').sort((a, b) => a[0].localeCompare(b[0]))
      dirs.forEach(([name, child], i) => {
        const last = i === dirs.length - 1
        lines.push(`${prefix}${last ? '└───' : '├───'}${name}`)
        if (child.type === 'directory') walk(child, `${prefix}${last ? '    ' : '│   '}`)
      })
    }
    walk(node, '')
    return lines.join('\r\n') + '\r\n'
  }

  private wmic(args: string[]): string {
    const all = args.join(' ').toLowerCase()
    if (all.startsWith('process')) {
      const head = `ProcessId  ParentProcessId  Name`
      const rows = this.caseDef.processes.map((p) => `${String(p.pid).padEnd(10)} ${String(p.ppid).padEnd(16)} ${p.name}`)
      return [head, ...rows, ''].join('\r\n')
    }
    if (all.startsWith('useraccount')) {
      const rows = this.caseDef.userAccounts.map((u) => `${u.name.padEnd(20)} ${u.sid}`)
      return ['Name                 SID', ...rows, ''].join('\r\n')
    }
    return `Node - ${this.caseDef.hostname}\r\n`
  }

  private findstr(args: string[]): string {
    const pattern = args[0]
    const file = args[1]
    if (!pattern || !file) return `FINDSTR: Bad command line\r\n`
    return this.vfs.grep(pattern, file)
  }

  // ────────────────────────────────────────────────────────────────────────
  // strings / sigcheck
  // ────────────────────────────────────────────────────────────────────────

  private strings(args: string[]): string {
    const path = args.find((a) => !a.startsWith('-'))
    if (!path) return `Usage: strings [filename]\r\n`
    const file = this.vfs.getFile(path)
    if (!file) return `The system cannot find the file specified.\r\n`
    const lines = file.strings && file.strings.length ? file.strings : extractStringsFromBinary(file.content)
    return lines.join('\r\n') + '\r\n'
  }

  private sigcheck(args: string[]): string {
    const path = args.find((a) => !a.startsWith('-'))
    if (!path) return `Usage: sigcheck [filename]\r\n`
    const file = this.vfs.getFile(path)
    if (!file) return `Sigcheck: The system cannot find the file specified.\r\n`
    const verified = file.signed ? 'Signed' : 'Unsigned'
    const publisher = file.signaturePublisher ?? 'n/a'
    const dateStr = new Date(file.modified).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' })
    return [
      ``,
      `${this.vfs.resolvePath(path)}:`,
      `        Verified:       ${verified}`,
      `        Link date:      ${dateStr}`,
      `        Publisher:      ${publisher}`,
      `        Company:        ${file.signed ? publisher : 'n/a'}`,
      `        Description:    ${file.signed ? 'Microsoft Windows Operating System' : 'n/a'}`,
      `        Product:        ${file.signed ? 'Microsoft® Windows® Operating System' : 'n/a'}`,
      `        Prod version:   ${file.signed ? '10.0.22631.1' : 'n/a'}`,
      `        File version:   ${file.signed ? '10.0.22631.1' : 'n/a'}`,
      `        MachineType:    64-bit`,
      ``,
    ].join('\r\n')
  }

  // ────────────────────────────────────────────────────────────────────────
  // PowerShell helpers
  // ────────────────────────────────────────────────────────────────────────

  private psGetChildItem(_args: string[]): string {
    const dir = this.vfs.getNode(this.vfs.getCurrentPath())
    if (!dir || dir.type !== 'directory') return ``
    const lines: string[] = ['', `    Directory: ${this.vfs.getCurrentPath()}`, '', `Mode                 LastWriteTime         Length Name`, `----                 -------------         ------ ----`]
    for (const [name, n] of [...dir.children.entries()].sort()) {
      const mode = n.type === 'directory' ? 'd-----' : '-a----'
      const ts = new Date(n.modified)
      const stamp = `${ts.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}  ${ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
      const sizeStr = n.type === 'file' ? String(n.size).padStart(14) : ' '.repeat(14)
      lines.push(`${mode}        ${stamp}   ${sizeStr} ${name}`)
    }
    return lines.join('\r\n') + '\r\n'
  }

  private psGetProcess(): string {
    const head = `\r\n Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName`
    const bar = ` -------  ------    -----      -----     ------     --  -- -----------`
    const rows = this.caseDef.processes.map((p) => {
      const handles = String((p.pid * 13) % 800 + 100).padStart(7)
      const npm = String((p.pid * 7) % 60 + 8).padStart(7)
      const pm = String(p.memKb).padStart(8)
      const ws = String(p.memKb + 1500).padStart(10)
      const cpu = `${((p.cpuMs ?? 100) / 1000).toFixed(2)}`.padStart(10)
      const id = String(p.pid).padStart(7)
      const si = String(p.sessionNum).padStart(3)
      const name = p.name.replace(/\.exe$/i, '')
      return `${handles}${npm}${pm}${ws}${cpu}${id}${si} ${name}`
    })
    return [head, bar, ...rows, ''].join('\r\n')
  }

  private psGetFileHash(args: string[]): string {
    const positional = args.find((a) => !a.startsWith('-'))
    const path = positional ?? args[args.findIndex((a) => a.toLowerCase() === '-path') + 1]
    if (!path) return ``
    const file = this.vfs.getFile(path)
    if (!file) return `Get-FileHash : Cannot find path '${path}' because it does not exist.\r\n`
    const algIdx = args.findIndex((a) => a.toLowerCase() === '-algorithm')
    const alg = (args[algIdx + 1] ?? 'SHA256').toUpperCase()
    const hash = this.vfs.computeHash(file, alg as 'SHA256' | 'SHA1' | 'MD5').toUpperCase()
    this.forensic.recordHash(this.vfs.resolvePath(path))
    return [
      ``,
      `Algorithm       Hash                                                                   Path`,
      `---------       ----                                                                   ----`,
      `${alg.padEnd(15)} ${hash.padEnd(72)} ${this.vfs.resolvePath(path)}`,
      ``,
    ].join('\r\n')
  }

  private psGetLocalUser(): string {
    const head = `\r\nName               Enabled Description\r\n----               ------- -----------`
    const rows = this.caseDef.userAccounts.map((u) => `${u.name.padEnd(18)} ${(u.enabled ? 'True' : 'False').padEnd(7)} ${u.description}`)
    return [head, ...rows, ''].join('\r\n')
  }

  private psGetLocalGroupMember(args: string[]): string {
    const groupIdx = args.findIndex((a) => a.toLowerCase() === '-group')
    const group = groupIdx >= 0 ? args[groupIdx + 1]?.replace(/['"]/g, '') ?? 'Administrators' : (args[0] ?? 'Administrators').replace(/['"]/g, '')
    const members = this.caseDef.userAccounts.filter((u) => u.groups.includes(group))
    const head = `\r\nObjectClass Name                       PrincipalSource\r\n----------- ----                       ---------------`
    const rows = members.map((m) => `User        ${`${this.caseDef.hostname}\\${m.name}`.padEnd(26)} Local`)
    return [head, ...rows, ''].join('\r\n')
  }

  private psGetService(): string {
    const head = `\r\nStatus   Name               DisplayName`
    const bar = `------   ----               -----------`
    const services = ['Appinfo', 'AudioSrv', 'BFE', 'BITS', 'CryptSvc', 'DcomLaunch', 'Dhcp', 'Dnscache', 'EventLog', 'LSM', 'MpsSvc', 'PlugPlay', 'RpcSs', 'Schedule', 'SecurityHealthService', 'Spooler', 'Themes', 'TrkWks', 'Winmgmt', 'WinDefend', 'wuauserv']
    const rows = services.map((s) => `Running  ${s.padEnd(18)} ${s} Service`)
    return [head, bar, ...rows, ''].join('\r\n')
  }

  private psNewNetFirewallRule(args: string[]): string {
    const name = args[args.findIndex((a) => a.toLowerCase() === '-displayname') + 1]?.replace(/['"]/g, '') ?? `Rule-${Date.now()}`
    const dirArg = args[args.findIndex((a) => a.toLowerCase() === '-direction') + 1]?.toLowerCase()
    const actArg = args[args.findIndex((a) => a.toLowerCase() === '-action') + 1]?.toLowerCase()
    const remote = args[args.findIndex((a) => a.toLowerCase() === '-remoteaddress') + 1]
    this.firewall.add({
      name,
      direction: dirArg === 'inbound' ? 'In' : 'Out',
      action: actArg === 'allow' ? 'Allow' : 'Block',
      remoteIp: remote ?? 'Any',
    })
    return `\r\nName                  : ${name}\r\nDisplayName           : ${name}\r\nEnabled               : True\r\nProfile               : Any\r\nDirection             : ${dirArg ?? 'Outbound'}\r\nAction                : ${actArg ?? 'Block'}\r\n`
  }
}

// ──────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────

function tokenize(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: string | null = null
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === ' ') {
      if (cur) {
        out.push(cur)
        cur = ''
      }
      continue
    }
    cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function pickArg(args: string[], prefix: string): string | undefined {
  const a = args.find((x) => x.toLowerCase().startsWith(prefix))
  if (!a) return undefined
  return a.slice(prefix.length).replace(/^['"]|['"]$/g, '')
}

function applyTasklistFilter(processes: import('../types/case.types').ProcessEntry[], filter: string): import('../types/case.types').ProcessEntry[] {
  const m = /(\w+)\s+(eq|ne|gt|lt|ge|le)\s+(.+)/i.exec(filter)
  if (!m) return processes
  const [, field, op, rawValue] = m
  const value = rawValue!.trim().replace(/^"|"$/g, '')
  const test = (a: number, b: number) => {
    if (op === 'eq') return a === b
    if (op === 'ne') return a !== b
    if (op === 'gt') return a > b
    if (op === 'lt') return a < b
    if (op === 'ge') return a >= b
    return a <= b
  }
  return processes.filter((p) => {
    if (field?.toLowerCase() === 'imagename') return op === 'eq' ? p.name.toLowerCase() === value.toLowerCase() : p.name.toLowerCase() !== value.toLowerCase()
    if (field?.toLowerCase() === 'pid') return test(p.pid, Number(value))
    if (field?.toLowerCase() === 'status') {
      const s = (p.status ?? 'Running').toLowerCase()
      return op === 'eq' ? s === value.toLowerCase() : s !== value.toLowerCase()
    }
    return true
  })
}

function extractStringsFromBinary(buf: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of buf) {
    const c = ch.charCodeAt(0)
    if (c >= 32 && c < 127) cur += ch
    else {
      if (cur.length >= 4) out.push(cur)
      cur = ''
    }
  }
  if (cur.length >= 4) out.push(cur)
  return out
}

function helpText(topic?: string): string {
  if (!topic) {
    return [
      `For more information on a specific command, type HELP command-name`,
      `CD             Displays the name of or changes the current directory.`,
      `CERTUTIL       Manages certificates and computes hashes.`,
      `DIR            Displays a list of files and subdirectories.`,
      `IPCONFIG       Displays IP configuration.`,
      `NET            Manages user accounts, groups, sessions.`,
      `NETSH          Configure firewall and network interfaces.`,
      `NETSTAT        Displays protocol statistics and current TCP/IP network connections.`,
      `REG            Registry Console Tool`,
      `SCHTASKS       Manages scheduled tasks.`,
      `SYSTEMINFO     Displays system configuration information.`,
      `TASKLIST       Displays a list of currently running processes.`,
      `TASKKILL       Terminates a running process by PID or image name.`,
      `WEVTUTIL       Retrieves information about event logs and publishers.`,
      `WHOAMI         Displays user, group, and privileges information.`,
      `WMIC          Provides command-line interface for WMI.`,
    ].join('\r\n') + '\r\n'
  }
  return `Help for ${topic}\r\n`
}
