export interface TimelineRow {
  id: string
  datetime: string
  description: string
  evidenceRef?: string
}

export interface IncidentReport {
  executiveSummary: string
  timeline: TimelineRow[]
  attackVectorCategory:
    | 'Phishing'
    | 'Exploit'
    | 'Valid Accounts'
    | 'Supply Chain'
    | 'External Service'
    | ''
  attackVectorDetail: string
  firstEvidenceTimestamp: string
  iocs: {
    ips: string
    domains: string
    hashes: string
    paths: string
    registry: string
    processes: string
    accounts: string
    tasks: string
    cves: string
  }
  blastRadius: {
    systems: string
    dataTypes: string
    dataExfil: 'Yes' | 'No' | 'Unknown'
    exfilDetails: string
    businessImpact: string
  }
  actions: {
    eradication: string
    hardening: string
    evidence: string
  }
  regulatory: {
    requires: 'Yes' | 'No' | 'Undetermined'
    framework: string
    deadline: string
    dataTypes: string
    individuals: string
    draft: string
  }
  recommendations: {
    short: string
    medium: string
    long: string
  }
}

export interface ReportSectionScore {
  section: string
  score: number
  max: number
  notes: string
}
