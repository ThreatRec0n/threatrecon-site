/**
 * VirtualFirewall — netsh advfirewall in-memory state.
 * Tracks rules added via netsh and provides exact-format `show rule` output.
 */

export interface FirewallRule {
  name: string
  direction: 'In' | 'Out'
  action: 'Allow' | 'Block'
  enabled: boolean
  protocol: string
  remoteIp: string
  remotePort: string
  localIp: string
  localPort: string
  profiles: string
  program?: string
  description?: string
  createdAt: number
}

export class VirtualFirewall {
  private rules: FirewallRule[] = []

  add(rule: Partial<FirewallRule> & { name: string }): FirewallRule {
    const full: FirewallRule = {
      name: rule.name,
      direction: rule.direction ?? 'Out',
      action: rule.action ?? 'Block',
      enabled: rule.enabled ?? true,
      protocol: rule.protocol ?? 'Any',
      remoteIp: rule.remoteIp ?? 'Any',
      remotePort: rule.remotePort ?? 'Any',
      localIp: rule.localIp ?? 'Any',
      localPort: rule.localPort ?? 'Any',
      profiles: rule.profiles ?? 'Domain,Private,Public',
      program: rule.program,
      description: rule.description,
      createdAt: Date.now(),
    }
    this.rules.push(full)
    return full
  }

  delete(name: string): boolean {
    const i = this.rules.findIndex((r) => r.name.toLowerCase() === name.toLowerCase())
    if (i < 0) return false
    this.rules.splice(i, 1)
    return true
  }

  list(): FirewallRule[] {
    return [...this.rules]
  }

  hasRuleBlockingIp(ip: string): boolean {
    return this.rules.some(
      (r) => r.action === 'Block' && (r.remoteIp === ip || r.remoteIp === 'Any'),
    )
  }

  formatShowAll(): string {
    if (!this.rules.length) {
      return `\r\nNo rules match the specified criteria.\r\n`
    }
    const blocks: string[] = []
    for (const r of this.rules) {
      blocks.push(
        [
          ``,
          `Rule Name:                            ${r.name}`,
          `----------------------------------------------------------------------`,
          `Enabled:                              ${r.enabled ? 'Yes' : 'No'}`,
          `Direction:                            ${r.direction}`,
          `Profiles:                             ${r.profiles}`,
          `Grouping:                             `,
          `LocalIP:                              ${r.localIp}`,
          `RemoteIP:                             ${r.remoteIp}`,
          `Protocol:                             ${r.protocol}`,
          `Edge traversal:                       No`,
          `Action:                               ${r.action}`,
        ].join('\r\n'),
      )
    }
    blocks.push('\r\nOk.\r\n')
    return blocks.join('\r\n')
  }
}
