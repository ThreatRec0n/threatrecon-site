import type { CaseDefinition } from '../types/case.types'

export type AttackerState = 'dormant' | 'active' | 'evasive' | 'aggressive' | 'exfiltrating' | 'defeated'

export type PlayerActionKind =
  | 'terminal_command'
  | 'idle'
  | 'gui_tool_open'

export interface PlayerAction {
  kind: PlayerActionKind
  detail: string
  at: number
}

export class AttackerStateMachine {
  state: AttackerState = 'active'
  private adaptationMs: number
  private lastTick = 0
  private lastPlayerActivity = Date.now()

  constructor(
    _caseDef: CaseDefinition,
    adaptationIntervalMs: number,
  ) {
    this.adaptationMs = adaptationIntervalMs
    void _caseDef
  }

  onPlayerAction(action: PlayerAction): void {
    this.lastPlayerActivity = action.at
    const d = action.detail.toLowerCase()
    if (d.includes('netstat')) this.state = 'evasive'
    if (d.includes('tasklist')) this.state = 'aggressive'
    if (d.includes('reg query') && d.includes('run')) this.state = 'evasive'
    if (d.includes('wevtutil')) this.state = 'aggressive'
    if (d.includes('get-localuser')) this.state = 'active'
  }

  tick(now: number): void {
    if (now - this.lastTick < this.adaptationMs) return
    this.lastTick = now
    if (now - this.lastPlayerActivity > 5 * 60 * 1000) {
      this.state = 'exfiltrating'
    }
  }

  advanceExfiltration(): void {
    this.state = 'exfiltrating'
  }

  defeat(): void {
    this.state = 'defeated'
  }
}

export function adaptationMsForDifficulty(d: string): number {
  switch (d) {
    case 'recruit':
      return 30000
    case 'analyst':
      return 20000
    case 'threat_hunter':
      return 10000
    case 'incident_commander':
      return 5000
    default:
      return 20000
  }
}
