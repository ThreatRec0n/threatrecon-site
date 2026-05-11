import type { CaseDefinition, EventLogEntry } from '../types/case.types'
import { mulberry32 } from './seededRandom'

function xmlEvent(e: Partial<EventLogEntry> & { eventId: number }): string {
  return `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="${e.source ?? 'Microsoft-Windows-Security-Auditing'}" Guid="{54849625-5478-4994-A5BA-772E667D091D}"/>
    <EventID>${e.eventId}</EventID>
    <TimeCreated SystemTime="${e.time ?? new Date().toISOString()}"/>
    <Computer>${e.computer ?? 'WORKSTATION-04'}</Computer>
  </System>
  <EventData>${e.level ?? 'Information'}</EventData>
</Event>`
}

export function generateEventLogs(caseDef: CaseDefinition, lazySeed = caseDef.seed): EventLogEntry[] {
  const rng = mulberry32(lazySeed + 1337)
  const entries: EventLogEntry[] = []
  const host = caseDef.hostname
  const base = Date.now() - 86400000 * 3

  const push = (
    log: EventLogEntry['log'],
    eventId: number,
    source: string,
    level: EventLogEntry['level'],
    malicious?: boolean,
  ) => {
    const time = new Date(base + Math.floor(rng() * 86400000 * 3)).toISOString()
    entries.push({
      id: `${eventId}-${entries.length}`,
      log,
      level,
      time,
      source,
      eventId,
      task: 'None',
      computer: host,
      xml: xmlEvent({ eventId, time, computer: host, source }),
      malicious,
    })
  }

  for (let i = 0; i < 220; i++) {
    push('System', 7036, 'Service Control Manager', 'Information')
  }
  for (let i = 0; i < 120; i++) {
    push('Security', 4624, 'Microsoft-Windows-Security-Auditing', 'Success Audit')
  }
  for (let i = 0; i < 40; i++) {
    push('Security', 4634, 'Microsoft-Windows-Security-Auditing', 'Success Audit')
  }

  push('Security', 4688, 'Microsoft-Windows-Security-Auditing', 'Success Audit', true)
  push('Security', 4698, 'Microsoft-Windows-Security-Auditing', 'Success Audit', true)
  push('Security', 4720, 'Microsoft-Windows-Security-Auditing', 'Success Audit', true)
  push('Security', 4728, 'Microsoft-Windows-Security-Auditing', 'Success Audit', true)
  push('Security', 1102, 'Microsoft-Windows-Eventlog', 'Success Audit', true)

  for (let i = 0; i < 80; i++) {
    push('Application', 1000, 'Application Error', 'Information')
  }

  for (let i = 0; i < 45; i++) {
    push('PowerShell', 4104, 'Microsoft-Windows-PowerShell', 'Information', true)
  }

  entries.sort((a, b) => (a.time < b.time ? -1 : 1))
  return entries
}
