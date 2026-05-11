import { useMemo } from 'react'
import type { CaseDefinition, ProcessEntry } from '../types/case.types'
import { baselineProcessesFor } from '../data/baselineSystem'

export function mergeProcessesForCase(caseDef: CaseDefinition): ProcessEntry[] {
  const baseline = baselineProcessesFor(caseDef.primaryUser)
  const caseProcs = caseDef.processes ?? []
  const seen = new Set(baseline.map((p) => `${p.pid}:${p.name}`))
  const extras = caseProcs.filter((p) => !seen.has(`${p.pid}:${p.name}`))
  return [...baseline, ...extras]
}

export function useMergedProcesses(caseDef: CaseDefinition): ProcessEntry[] {
  return useMemo(() => mergeProcessesForCase(caseDef), [caseDef])
}
