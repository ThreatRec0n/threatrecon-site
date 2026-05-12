import type { Difficulty } from '@/types/case.types';
import type { CaseContent } from '@/data/cases/caseData.types';
import type { FileTreeNode } from '@/data/cases/caseData.types';
import { difficultyBlocks } from '@/data/cases/caseData.types';

export type TerminalContext = {
  caseContent: CaseContent;
  difficulty: Difficulty;
  workstationId: string;
  cwd: string;
  setCwd: (s: string) => void;
};

function normalizePath(p: string): string {
  const trimmed = p.replace(/\\/g, '/').replace(/^\.?\/*/, '');
  return trimmed.replace(/\/+$/, '');
}

function resolveNode(
  root: FileTreeNode,
  cwd: string,
  target: string,
): { node: FileTreeNode | null; path: string } {
  const parts = normalizePath(
    target.startsWith('\\') || target.startsWith('/')
      ? target.slice(1)
      : `${cwd}/${target}`,
  )
    .split('/')
    .filter(Boolean);

  let node: FileTreeNode | null = root;
  let pathAcc = '';
  for (const part of parts) {
    if (!node || node.type !== 'dir' || !node.children) {
      return { node: null, path: pathAcc };
    }
    const bucket: Record<string, FileTreeNode> = node.children ?? {};
    const hit: FileTreeNode | undefined = bucket[part] ?? bucket[part.toLowerCase()];
    if (!hit) return { node: null, path: pathAcc };
    pathAcc = pathAcc ? `${pathAcc}\\${part}` : part;
    node = hit;
  }
  return { node, path: pathAcc };
}

function listChildren(
  root: FileTreeNode,
  cwd: string,
  flags: { all: boolean; hiddenOnly: boolean },
): string {
  const { node } = resolveNode(root, cwd, '.');
  if (!node || node.type !== 'dir' || !node.children)
    return ' Directory not found.';
  const rows: string[] = [];
  for (const name of Object.keys(node.children).sort()) {
    const child = node.children[name];
    const isHidden = Boolean(child.hidden || name.startsWith('.'));
    if (!flags.all && isHidden) continue;
    if (flags.hiddenOnly && !isHidden) continue;
    const label = child.type === 'dir' ? `[DIR] ${name}` : `[FILE] ${name}`;
    let attr = '';
    if (child.hidden) attr += 'H';
    rows.push(`${label}${attr ? `  (${attr})` : ''}`);
  }
  return rows.length ? rows.join('\n') : ' (empty)';
}

export function runTerminalLine(ctx: TerminalContext, raw: string): string {
  const line = raw.trim();
  if (!line) return '';
  const lower = line.toLowerCase();
  const blocks = difficultyBlocks(ctx.difficulty);

  const root = ctx.caseContent.workstations[ctx.workstationId];
  if (!root)
    return `Workstation ${ctx.workstationId} image not mounted in sandbox.`;

  const prefix = `[${ctx.workstationId}]`;

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
  if (lower.startsWith('strings ')) {
    return 'Embedded strings:\n researchrelay.edu\n recruiter.helixlabs.example\n dns_chunk_encoder';
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
  if (lower.startsWith('certutil') || lower.startsWith('get-filehash')) {
    return 'SHA256: E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855 (simulated)';
  }
  if (lower.startsWith('netstat')) {
    return ctx.caseContent.networkLog.slice(0, 5).join('\n');
  }
  if (lower.startsWith('net user')) {
    return 'User accounts mirror Active Directory export — see Access Logs panel.';
  }

  // ----- Windows file ops -----
  const dirMatch = /^dir(?:\s+(.*))?$/i.exec(line);
  if (dirMatch) {
    const rest = (dirMatch[1] ?? '').trim();
    let flags = { all: false, hiddenOnly: false };
    let target = '';
    const tokens = rest.split(/\s+/).filter(Boolean);
    for (const t of tokens) {
      const tl = t.toLowerCase();
      if (tl === '/a') flags.all = true;
      else if (tl === '/ah') {
        flags.hiddenOnly = true;
        flags.all = true;
      } else if (!t.startsWith('/')) target = t;
    }
    if (!target) target = '.';
    const { node, path } = resolveNode(root, ctx.cwd, target);
    if (!node) return `Could not find ${target}`;
    if (node.type !== 'dir')
      return `${prefix} ${path} is a file — use type command.`;
    const listPath = path || ctx.cwd;
    return `${prefix} Directory of \\${listPath || '(root)'}\n${listChildren(root, listPath || '', flags)}`;
  }

  const cdMatch = /^cd\s+(.*)$/i.exec(line);
  if (cdMatch) {
    const target = cdMatch[1].trim();
    const { node, path } = resolveNode(root, ctx.cwd, target);
    if (!node || node.type !== 'dir') return `Path not found — ${target}`;
    ctx.setCwd(path || '');
    return `${prefix} cd → \\${ctx.cwd}`;
  }

  const typeMatch = /^type\s+(.*)$/i.exec(line);
  if (typeMatch) {
    const target = typeMatch[1].trim();
    const { node, path } = resolveNode(root, ctx.cwd, target);
    if (!node || node.type !== 'file')
      return `Cannot type — ${target} not a readable file.`;
    return `${prefix} ${path}\n${node.content ?? '(binary)'}`;
  }

  const delMatch = /^del\s+(.*)$/i.exec(line);
  if (delMatch) {
    return 'FORENSIC WARNING: Deleting evidence violates chain of custody. Action logged.';
  }

  const copyMatch = /^copy\s+(\S+)\s+(\S+)$/i.exec(line);
  if (copyMatch) {
    return `${prefix} simulated copy OK (sandbox)`;
  }

  const attribMatch = /^attrib\s+(.*)$/i.exec(line);
  if (attribMatch) {
    const target = attribMatch[1].trim();
    const { node } = resolveNode(root, ctx.cwd, target);
    if (!node) return 'Not found';
    return `Attributes: ${node.hidden ? 'H ' : ''}${node.type === 'dir' ? 'DIR' : 'ARCHIVE'}`;
  }

  const findMatch = /^find\s+(.*)\/name\s+(.*)$/i.exec(line);
  if (findMatch) {
    return 'MATCH: .\\Projects\\.staging\\CHECKLIST.txt';
  }

  return `Unsupported or unknown command in training sandbox: ${line}`;
}
