import type { EradicationAction, EradicationActionType } from '../types/case.types'

export interface ForensicScore {
  penalty: number
  bonus: number
  notes: string[]
}

export interface ForensicViolation {
  kind: string
  target: string
  at: number
  note: string
}

/**
 * Tracks forensic integrity. Records which files have been hashed and which
 * registry keys have been exported. Penalises destructive operations performed
 * before evidence has been preserved (delete-before-export, delete-before-hash).
 * Penalises log clearing severely.
 */
export class ForensicIntegrityEngine {
  private integrity = 100
  private hashedFiles = new Set<string>()
  private exportedKeys = new Set<string>()
  private documentedProcesses = new Set<number>()
  private violations: ForensicViolation[] = []
  private notes: string[] = []

  recordHash(target: string): void {
    this.hashedFiles.add(target.toLowerCase())
    this.adjust(+2, `Hashed ${target}`)
  }

  recordExport(target: string): void {
    this.exportedKeys.add(target.toLowerCase())
    this.adjust(+2, `Exported ${target}`)
  }

  recordDocumentation(pid: number, note: string): void {
    this.documentedProcesses.add(pid)
    this.adjust(+2, `Documented PID ${pid}: ${note}`)
  }

  recordViolation(kind: string, target: string, note: string): void {
    this.violations.push({ kind, target, at: Date.now(), note })
  }

  evaluateAction(action: EradicationAction): ForensicScore {
    const notes: string[] = []
    let penalty = 0
    let bonus = 0

    switch (action.type) {
      case 'delete_file':
        if (action.target && !this.hashedFiles.has(action.target.toLowerCase())) {
          penalty += 5
          this.recordViolation('delete_before_hash', action.target, 'File deleted without SHA256 record.')
          notes.push('File removed without documented SHA256 export.')
        } else {
          bonus += 1
          notes.push('File removed AFTER hash captured.')
        }
        break
      case 'delete_registry':
        if (action.target && !this.exportedKeys.has(action.target.toLowerCase())) {
          penalty += 5
          this.recordViolation('delete_before_export', action.target, 'Registry key deleted before export.')
          notes.push('Registry deleted without export.')
        } else {
          bonus += 1
          notes.push('Registry deleted AFTER export captured.')
        }
        break
      case 'kill_process':
        if (action.target && !this.documentedProcesses.has(Number(action.target))) {
          penalty += 5
          this.recordViolation('kill_before_document', action.target, 'Process killed without commandline capture.')
          notes.push('Process terminated without parent/command capture.')
        } else {
          bonus += 1
        }
        break
      case 'clear_logs':
        penalty += 20
        this.recordViolation('log_clear', action.target ?? '', 'Security log cleared.')
        notes.push('Security log cleared — major forensic impact.')
        break
      case 'delete_user':
        penalty += 3
        notes.push('Account deleted without SID preservation.')
        break
      case 'hash_file':
        if (action.target) this.recordHash(action.target)
        bonus += 2
        notes.push('Evidence preservation recorded (hash).')
        break
      case 'document_process':
        if (action.target) this.documentedProcesses.add(Number(action.target))
        bonus += 2
        notes.push('Process documented.')
        break
      case 'export_registry':
        if (action.target) this.recordExport(action.target)
        bonus += 2
        notes.push('Registry export captured.')
        break
      default:
        break
    }

    this.adjust(bonus - penalty, notes.join(' / '))
    return { penalty, bonus, notes }
  }

  private adjust(delta: number, note: string): void {
    this.integrity = Math.max(0, Math.min(100, this.integrity + delta))
    if (note) this.notes.push(note)
  }

  isHashed(target: string): boolean {
    return this.hashedFiles.has(target.toLowerCase())
  }

  isExported(target: string): boolean {
    return this.exportedKeys.has(target.toLowerCase())
  }

  snapshot(): number {
    return this.integrity
  }

  sequenceBonus(): void {
    this.adjust(+2, 'Sequence bonus')
  }

  getViolations(): ForensicViolation[] {
    return [...this.violations]
  }

  getNotes(): string[] {
    return [...this.notes]
  }
}

export function mapCommandToAction(cmd: string): EradicationActionType | null {
  const c = cmd.toLowerCase()
  if (c.includes('del ') || c.includes('remove-item') || c.includes('erase ')) return 'delete_file'
  if (c.includes('reg delete')) return 'delete_registry'
  if (c.includes('taskkill') || c.includes('stop-process')) return 'kill_process'
  if (c.includes('wevtutil cl')) return 'clear_logs'
  if (c.includes('net user') && c.includes('/delete')) return 'delete_user'
  if (c.includes('get-filehash') || c.includes('certutil -hashfile')) return 'hash_file'
  if (c.includes('reg export')) return 'export_registry'
  return null
}
