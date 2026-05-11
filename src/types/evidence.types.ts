export type EvidenceType =
  | 'FILE'
  | 'REGISTRY'
  | 'PROCESS'
  | 'NETWORK'
  | 'LOG_ENTRY'
  | 'USER_ACCOUNT'
  | 'SCHEDULED_TASK'

export interface EvidenceItem {
  id: string
  timestamp: string
  type: EvidenceType
  title: string
  path?: string
  hash?: string
  notes: string
  mitre?: string[]
  taggedIoc: boolean
  meta?: Record<string, string>
}
