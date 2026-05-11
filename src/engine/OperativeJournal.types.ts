/** Meaningful analyst actions tracked for ThreatRecon OPERATIVE scoring (not terminal-only noise). */
export interface OperativeJournalSnapshot {
  detectionMalicious4688Or4698: boolean
  detectionNetworkC2: boolean
  detectionMaliciousProcess: boolean
  detectionRegistryRunPersist: boolean
  investigationMsupdateExplorer: boolean
  investigationCompromisedUser: boolean
  firewallBlockedC2: boolean
}

export const EMPTY_OPERATIVE_JOURNAL: OperativeJournalSnapshot = {
  detectionMalicious4688Or4698: false,
  detectionNetworkC2: false,
  detectionMaliciousProcess: false,
  detectionRegistryRunPersist: false,
  investigationMsupdateExplorer: false,
  investigationCompromisedUser: false,
  firewallBlockedC2: false,
}

export type OperativeMilestoneKey = keyof OperativeJournalSnapshot
