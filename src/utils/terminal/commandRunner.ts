import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import { difficultyBlocks } from '@/data/cases/caseData.types';

export type TerminalContext = {
  caseContent: CaseContent;
  difficulty: Difficulty;
  workstationId: string;
  cwd: string;
  setCwd: (s: string) => void;
};

export function runTerminalLine(ctx: TerminalContext, raw: string): string {
  const line = raw.trim();
  if (!line) return '';
  const lower = line.toLowerCase();
  const blocks = difficultyBlocks(ctx.difficulty);

  const root = ctx.caseContent.workstations[ctx.workstationId];
  if (!root)
    return `Workstation ${ctx.workstationId} image not mounted in sandbox.`;

  void ctx.cwd;

  // ----- Forensic / hybrid commands (case-wide) -----
  if (lower.startsWith('query email_forwarding-rules')) {
    return ctx.caseContent.forwardingRules
      .map(
        (r) =>
          `${r.mailbox} | ${r.ruleName} → ${r.forwardTo} | created ${r.created}`,
      )
      .join('\n');
  }
  if (lower.startsWith('query email_logs')) {
    return ctx.caseContent.emails
      .map(
        (e) =>
          `${e.time} ${e.mailbox} | ${e.subject} | from ${e.from} → ${e.to}`,
      )
      .join('\n');
  }
  if (lower.startsWith('grep ') || lower.startsWith('filter network.log')) {
    const needleMatch = /"([^"]+)"/.exec(line);
    const needleRaw =
      needleMatch?.[1] ??
      line
        .split(/\s+/)
        .filter((w) => !['grep', 'filter', 'network.log'].includes(w.toLowerCase()))
        .join(' ')
        .trim();
    const needle = needleRaw || '';
    const pool = [...ctx.caseContent.networkLog, ...ctx.caseContent.accessLog];
    return pool
      .filter((row) => row.toLowerCase().includes(needle.toLowerCase()))
      .join('\n');
  }
  if (lower.startsWith('query access_logs')) {
    return ctx.caseContent.accessLog.join('\n');
  }
  if (lower.startsWith('usbview')) {
    return ctx.caseContent.usbLog.join('\n');
  }
  if (lower.startsWith('browser_history')) {
    const lines: string[] = [];
    for (const [u, rows] of Object.entries(ctx.caseContent.browserByUser)) {
      lines.push(`--- ${u} ---`, ...rows);
    }
    if (blocks.counterForensics && ctx.caseContent.definition.id === 'case-001') {
      lines.push(
        '[NOTE] Intermediate/Hard countermeasure: history vacuumed — recovered cache fragments only for non-primary users.',
      );
    }
    return lines.join('\n');
  }
  if (lower.startsWith('badge_records')) {
    return ctx.caseContent.badgeLog.join('\n');
  }
  if (lower.startsWith('search_messages')) {
    return ctx.caseContent.slackMessages
      .map((m) => `${m.time} #${m.channel} ${m.user}: ${m.text}`)
      .join('\n');
  }
  if (lower.startsWith('printer_logs')) {
    return ctx.caseContent.printerLog.join('\n');
  }
  if (lower.startsWith('calendar')) {
    const out: string[] = [];
    for (const [u, rows] of Object.entries(ctx.caseContent.calendarByUser)) {
      out.push(`--- ${u} ---`, ...rows);
    }
    return out.join('\n');
  }
  if (lower.startsWith('recover ') || lower.startsWith('carve ')) {
    if (!blocks.showRecovery)
      return 'Recover toolkit locked — elevation required (HARD difficulty only).';
    return (
      ctx.caseContent.deletedRecoverable
        ?.map((d) => `${d.name} | ${d.workstation} | ${d.deletedAt} | ${d.confidence}%`)
        .join('\n') ?? '(no recoverable objects)'
    );
  }
  if (lower.startsWith('prefetch')) {
    if (lower.includes('detail'))
      return 'SECUREWIPE.EXE last run 2026-05-07 23:18 (case-dependent artefact)';
    return 'RECENT: MSTSC.EXE, POWERSHELL.EXE, CODE.EXE';
  }
  if (lower.startsWith('wevtutil') || lower.startsWith('get-winevent')) {
    return (
      ctx.caseContent.workstationSecurityLog[ctx.workstationId] ??
      'No notable events in sampled window.'
    );
  }
  if (lower.startsWith('netstat')) {
    return ctx.caseContent.networkLog.slice(0, 5).join('\n');
  }
  if (lower.startsWith('net user')) {
    return 'User accounts mirror Active Directory export — see Access Logs panel.';
  }

  const findMatch = /^find\s+(.*)\/name\s+(.*)$/i.exec(line);
  if (findMatch) {
    return 'MATCH: .\\Projects\\.staging\\CHECKLIST.txt';
  }

  return `Unsupported or unknown command in training sandbox: ${line}`;
}
