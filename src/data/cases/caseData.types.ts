import type { CaseDefinition, CaseEvidenceItem } from '@/types/case.types';
import type { EmployeeProfile } from '@/types/employee.types';
import type { Difficulty } from '@/types/case.types';

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  time: string;
  subject: string;
  body: string;
  attachments?: { name: string; size: string }[];
  headers?: string;
  /** Employee mailbox owner */
  mailbox: string;
  forensicTags?: string[];
}

export interface SlackMessage {
  id: string;
  channel: string;
  user: string;
  time: string;
  text: string;
  forensicTags?: string[];
}

export interface FileTreeNode {
  type: 'dir' | 'file';
  hidden?: boolean;
  /** Plaintext or highlighted body */
  content?: string;
  children?: Record<string, FileTreeNode>;
}

export interface ForwardingRuleRow {
  mailbox: string;
  ruleName: string;
  forwardTo: string;
  created: string;
}

export interface DeletedRecoverable {
  name: string;
  workstation: string;
  deletedAt: string;
  confidence: number;
}

export interface CaseContent {
  definition: CaseDefinition;
  employees: Record<string, EmployeeProfile>;
  evidenceItems: CaseEvidenceItem[];
  summaryKeyTerms: string[];
  emails: EmailMessage[];
  forwardingRules: ForwardingRuleRow[];
  networkLog: string[];
  accessLog: string[];
  usbLog: string[];
  browserByUser: Record<string, string[]>;
  badgeLog: string[];
  slackMessages: SlackMessage[];
  printerLog: string[];
  calendarByUser: Record<string, string[]>;
  workstations: Record<string, FileTreeNode>;
  /** Security / System snippet per workstation id */
  workstationSecurityLog: Record<string, string>;
  deletedRecoverable?: DeletedRecoverable[];
  redHerringNotes?: string[];
}

export function difficultyBlocks(d: Difficulty): {
  hideHints: boolean;
  counterForensics: boolean;
  showRecovery: boolean;
} {
  return {
    hideHints: d !== 'BEGINNER',
    counterForensics: d === 'INTERMEDIATE' || d === 'HARD',
    showRecovery: d === 'HARD',
  };
}
