import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThreatReconLogo } from '@/components/shared/Logo';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { Avatar } from '@/components/Avatar/Avatar';
import { InvestigationTerminal } from '@/components/Terminal/InvestigationTerminal';
import { InvestigationNotebook } from '@/components/Notebook/InvestigationNotebook';
import { useGame } from '@/contexts/GameContext';
import { useEvidence } from '@/contexts/EvidenceContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { evidenceMap } from '@/data/cases/registry';
import { formatElapsed } from '@/utils/timer';
import { loadCaseProgress } from '@/utils/storage';
import { accuseThresholdMet } from '@/utils/accuseGate';
import { captureElement } from '@/utils/screenshot';
import type { EvidenceUIPanelCategory } from '@/types/evidence.types';
import { buildVerdict } from '@/utils/scoring';
import type { AccusationSubmission } from '@/types/verdict.types';
import { difficultyBlocks } from '@/data/cases/caseData.types';
import clsx from 'clsx';

type Panel =
  | 'brief'
  | 'employees'
  | 'workstation'
  | 'email'
  | 'network'
  | 'access'
  | 'usb'
  | 'browser'
  | 'badge'
  | 'messages'
  | 'printer'
  | 'calendar'
  | 'recovery'
  | 'notebook'
  | 'gallery';

export function InvestigationScreen() {
  const { caseId } = useParams();
  const nav = useNavigate();
  const { content, difficulty, caseId: ctxCase, exitCase } = useGame();
  const ev = useEvidence();
  const { profile, updateProfile } = usePlayer();

  const [panel, setPanel] = useState<Panel>('brief');
  const [notebookCollapsed, setNotebookCollapsed] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [tagSuspect, setTagSuspect] = useState<string>('');
  const [elapsed, setElapsed] = useState(0);

  const [shotOpen, setShotOpen] = useState(false);
  const [shotPreview, setShotPreview] = useState<string | null>(null);
  const [shotLabel, setShotLabel] = useState('');
  const [shotSuspect, setShotSuspect] = useState('');
  const [shotCategory, setShotCategory] =
    useState<EvidenceUIPanelCategory>('File Evidence');
  const [shotNotes, setShotNotes] = useState('');

  const [accuseOpen, setAccuseOpen] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caseId || !content) return;
    const catalog = evidenceMap(caseId);
    ev.loadForCase(caseId, catalog);
    const saved = loadCaseProgress(caseId);
    setElapsed(saved?.elapsedSeconds ?? 0);
    const first = content.definition.employeeIds[0] ?? null;
    setSelectedEmp(first);
    setTagSuspect(first ?? '');
  }, [caseId, content]);

  useEffect(() => {
    if (!caseId) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [caseId]);

  useEffect(() => {
    if (!caseId) return;
    const handle = window.setTimeout(() => {
      ev.persist(caseId, elapsed);
    }, 800);
    return () => window.clearTimeout(handle);
  }, [elapsed, caseId, ev]);

  const employeesList = useMemo(() => {
    if (!content) return [];
    return content.definition.employeeIds.map((id) => content.employees[id]);
  }, [content]);

  const gate = useMemo(() => {
    if (!content) return { ok: false, reasons: [] as string[] };
    return accuseThresholdMet({
      tagged: ev.tagged,
      screenshotsCount: ev.screenshots.length,
      notebookNotes: ev.notebookNotes,
      evidenceById: ev.evidenceCatalog,
    });
  }, [content, ev.tagged, ev.screenshots, ev.notebookNotes, ev.evidenceCatalog]);

  const taggedBySuspect = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const t of ev.tagged) {
      m[t.suspectId] = m[t.suspectId] ?? [];
      if (!m[t.suspectId].includes(t.evidenceId)) m[t.suspectId].push(t.evidenceId);
    }
    return m;
  }, [ev.tagged]);

  if (!caseId || !content || !difficulty || ctxCase !== caseId) {
    return (
      <div className="p-8 font-mono text-amber">
        Session invalid.{' '}
        <Button onClick={() => nav('/cases')}>CASE GRID</Button>
      </div>
    );
  }

  const wsId =
    (selectedEmp && content.employees[selectedEmp]?.workstationId) ||
    content.definition.employeeIds
      .map((id) => content.employees[id].workstationId)
      .find((w) => content.workstations[w]) ||
    Object.keys(content.workstations)[0];

  const blocks = difficultyBlocks(difficulty);

  const openCapture = async () => {
    const dataUrl = await captureElement(mainRef.current);
    setShotPreview(dataUrl);
    setShotOpen(true);
  };

  const saveCapture = () => {
    if (!shotLabel.trim() || !shotPreview || !shotSuspect) return;
    ev.addScreenshot({
      id: crypto.randomUUID(),
      dataUrl: shotPreview,
      label: shotLabel.trim(),
      suspectId: shotSuspect,
      category: shotCategory,
      notes: shotNotes,
      capturedAt: new Date().toISOString(),
    });
    setShotOpen(false);
    setShotPreview(null);
    setShotLabel('');
    setShotNotes('');
  };

  const submitAccusation = (payload: AccusationSubmission) => {
    if (!content) return;
    const timelineOrder =
      ev.timeline.length > 0
        ? ev.timeline.map((t) => t.evidenceId)
        : Array.from(new Set(ev.tagged.map((t) => t.evidenceId)));
    const verdict = buildVerdict({
      caseDef: content.definition,
      evidenceById: ev.evidenceCatalog,
      employees: content.employees,
      accusation: payload,
      taggedToSuspect: taggedBySuspect,
      screenshotCount: ev.screenshots.length,
      timelineEvidenceOrder: timelineOrder,
      summaryKeyTerms: content.summaryKeyTerms,
    });
    if (profile) {
      updateProfile((p) => {
        const completed = new Set(p.casesCompleted);
        completed.add(caseId);
        return {
          ...p,
          casesCompleted: Array.from(completed),
          caseHistory: [
            ...p.caseHistory,
            {
              caseId,
              score: verdict.totalScore,
              grade: verdict.grade,
              time: formatElapsed(elapsed),
              correct: verdict.correctSuspect,
              accusedName:
                content.employees[payload.suspectId]?.fullName ?? '',
              date: new Date().toISOString(),
            },
          ],
        };
      });
    }
    ev.persist(caseId, elapsed);
    nav(`/case/${caseId}/verdict`, {
      state: {
        verdict,
        accusation: payload,
        elapsedLabel: formatElapsed(elapsed),
        tagged: ev.tagged,
      },
    });
  };

  const navItems: { id: Panel; label: string }[] = [
    { id: 'brief', label: 'CASE BRIEF' },
    { id: 'employees', label: 'EMPLOYEES' },
    { id: 'workstation', label: 'WORKSTATION FILES' },
    { id: 'email', label: 'EMAIL LOGS' },
    { id: 'network', label: 'NETWORK LOGS' },
    { id: 'access', label: 'ACCESS LOGS' },
    { id: 'usb', label: 'USB HISTORY' },
    { id: 'browser', label: 'BROWSER HISTORY' },
    { id: 'badge', label: 'BADGE RECORDS' },
    { id: 'messages', label: 'MESSAGES' },
    { id: 'printer', label: 'PRINTER LOGS' },
    { id: 'calendar', label: 'CALENDAR' },
    ...(blocks.showRecovery
      ? [{ id: 'recovery' as const, label: 'DELETED RECOVERY' }]
      : []),
    { id: 'notebook', label: 'NOTEBOOK (POPOUT)' },
    { id: 'gallery', label: 'SCREENSHOT GALLERY' },
  ];

  const beginnerHint = (evidenceId: string) =>
    difficulty === 'BEGINNER'
      ? content.definition.beginnerHints?.[evidenceId]
      : undefined;

  const renderTaggedRow = (evidenceId: string, label: string) => {
    const hint = beginnerHint(evidenceId);
    const tagged = ev.tagged.some((t) => t.evidenceId === evidenceId);
    return (
      <div
        key={evidenceId}
        className={clsx(
          'flex items-start justify-between gap-3 border-b border-border py-2 font-mono text-[11px]',
          hint && 'ring-1 ring-amber/40',
        )}
      >
        <div>
          <div className="text-ink-primary">{label}</div>
          {hint ? (
            <div className="mt-1 text-[10px] text-amber-bright">{hint}</div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <select
            value={tagSuspect}
            onChange={(e) => setTagSuspect(e.target.value)}
            className="border border-border bg-bg-tertiary px-2 py-1 text-[10px] text-ink-primary"
          >
            {employeesList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <Button
            className="px-2 py-1 text-[10px]"
            variant={tagged ? 'ghost' : 'primary'}
            onClick={() =>
              tagged ? ev.untagEvidence(evidenceId) : ev.tagEvidence(evidenceId, tagSuspect)
            }
          >
            {tagged ? 'UNTAG' : 'TAG EVIDENCE'}
          </Button>
        </div>
      </div>
    );
  };

  let mainBody: ReactNode = null;

  if (panel === 'brief') {
    const b = content.definition.briefing;
    mainBody = (
      <div className="prose prose-invert max-w-none font-document text-sm leading-relaxed text-ink-secondary">
        <p className="text-amber">{content.definition.companyName}</p>
        <p>{b.incidentSummary}</p>
        <p>{b.taskStatement}</p>
      </div>
    );
  } else if (panel === 'employees') {
    mainBody = (
      <div className="grid grid-cols-2 gap-4">
        {employeesList.map((emp) => (
          <button
            key={emp.id}
            type="button"
            onClick={() => setSelectedEmp(emp.id)}
            className={clsx(
              'flex gap-3 border p-3 text-left transition',
              selectedEmp === emp.id
                ? 'border-border-active bg-bg-tertiary'
                : 'border-border bg-bg-secondary hover:bg-bg-tertiary',
            )}
          >
            <Avatar id={emp.avatarId} />
            <div>
              <p className="font-display text-lg text-ink-primary">{emp.fullName}</p>
              <p className="font-mono text-[11px] text-ink-muted">{emp.title}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-secondary">
                {emp.performanceSnippet}
              </p>
              <p className="mt-2 font-document text-xs text-ink-secondary">{emp.notes}</p>
            </div>
          </button>
        ))}
      </div>
    );
  } else if (panel === 'workstation') {
    mainBody = (
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="border border-border bg-bg-secondary p-3 font-mono text-xs">
          <label className="text-[10px] text-amber">ACTIVE EMPLOYEE</label>
          <select
            value={selectedEmp ?? ''}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-1 text-ink-primary"
          >
            {employeesList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
          <FileTreeView root={content.workstations[wsId]} />
        </div>
        <InvestigationTerminal
          caseContent={content}
          difficulty={difficulty}
          workstationId={wsId}
          className="border border-border bg-black"
        />
      </div>
    );
  } else if (panel === 'email') {
    mainBody = (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-mono text-xs text-amber">FORWARDING RULES</h3>
          <pre className="mt-2 whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px] text-ink-secondary">
            {content.forwardingRules
              .map(
                (r) =>
                  `${r.mailbox} → ${r.forwardTo} (${r.ruleName}) @ ${r.created}`,
              )
              .join('\n')}
          </pre>
        </div>
        <div>
          <h3 className="font-mono text-xs text-amber">MAILBOX SNAPSHOT</h3>
          <div className="mt-2 space-y-3">
            {content.emails.map((mail) => (
              <div key={mail.id} className="border border-border bg-bg-secondary p-3 font-mono text-[11px] text-ink-secondary">
                <div className="text-ink-primary">{mail.subject}</div>
                <div>{mail.time}</div>
                <div>
                  {mail.from} → {mail.to}
                </div>
                {mail.bcc ? <div className="text-threat-red">BCC: {mail.bcc}</div> : null}
                <div className="mt-2 whitespace-pre-wrap">{mail.body || '(empty body)'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (panel === 'network') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px] text-evidence-network">
        {content.networkLog.join('\n')}
      </pre>
    );
  } else if (panel === 'access') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px] text-evidence-access">
        {content.accessLog.join('\n')}
      </pre>
    );
  } else if (panel === 'usb') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px] text-evidence-usb">
        {content.usbLog.join('\n')}
      </pre>
    );
  } else if (panel === 'browser') {
    const lines: string[] = [];
    for (const [u, rows] of Object.entries(content.browserByUser)) {
      lines.push(`--- ${u} ---`, ...rows);
    }
    if (blocks.counterForensics && caseId === 'case-001') {
      lines.push(
        '[SIMULATION] Browser SQLite vacuumed for primary suspect — residual timestamps degraded.',
      );
    }
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px]">
        {lines.join('\n')}
      </pre>
    );
  } else if (panel === 'badge') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px] text-evidence-badge">
        {content.badgeLog.join('\n')}
      </pre>
    );
  } else if (panel === 'messages') {
    mainBody = (
      <div className="space-y-2">
        {content.slackMessages.map((m) => (
          <div key={m.id} className="border border-border bg-bg-secondary p-2 font-mono text-[11px]">
            <span className="text-evidence-message">{m.channel}</span> · {m.user}{' '}
            <span className="text-ink-muted">{m.time}</span>
            <div className="text-ink-secondary">{m.text}</div>
          </div>
        ))}
      </div>
    );
  } else if (panel === 'printer') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px]">
        {content.printerLog.join('\n')}
      </pre>
    );
  } else if (panel === 'calendar') {
    const lines: string[] = [];
    for (const [u, rows] of Object.entries(content.calendarByUser)) {
      lines.push(`--- ${u} ---`, ...rows);
    }
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px]">
        {lines.join('\n')}
      </pre>
    );
  } else if (panel === 'recovery') {
    mainBody = (
      <pre className="whitespace-pre-wrap border border-border bg-bg-secondary p-3 font-mono text-[11px]">
        {(content.deletedRecoverable ?? [])
          .map(
            (d) =>
              `${d.name} | ${d.workstation} | deleted ${d.deletedAt} | confidence ${d.confidence}%`,
          )
          .join('\n')}
      </pre>
    );
  } else if (panel === 'notebook') {
    mainBody = (
      <p className="font-mono text-sm text-ink-muted">
        Notebook lives in the collapsible dock below — expand it to capture suspect notes.
      </p>
    );
  } else if (panel === 'gallery') {
    mainBody = (
      <div className="grid grid-cols-3 gap-4">
        {ev.screenshots.map((s) => (
          <div key={s.id} className="border border-border bg-bg-secondary p-2">
            <img src={s.dataUrl} alt={s.label} className="w-full border border-border" />
            <p className="mt-2 font-mono text-[11px] text-amber">{s.label}</p>
            <Button
              variant="danger"
              className="mt-2 w-full text-[10px]"
              onClick={() => {
                if (
                  confirm(
                    'Removing evidence from your case file. Are you sure?',
                  )
                )
                  ev.removeScreenshot(s.id);
              }}
            >
              DELETE
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg-primary text-ink-primary">
      <header className="flex items-center justify-between border-b border-border-active px-6 py-3">
        <div className="flex items-center gap-4">
          <ThreatReconLogo className="scale-90" />
          <div className="font-mono text-[11px] text-ink-secondary">
            <span className="text-amber">{content.definition.numberLabel}</span>{' '}
            · {content.definition.companyName}
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>
            INVESTIGATION TIME:{' '}
            <span className="text-amber-bright">{formatElapsed(elapsed)}</span>
          </span>
          <span>
            EVIDENCE:{' '}
            <span className="text-amber-bright">{ev.tagged.length}</span> items
          </span>
          <button
            type="button"
            className="rounded border border-border px-2 py-1 text-lg text-amber hover:border-border-active"
            title="Capture evidence panel"
            onClick={openCapture}
          >
            📷
          </button>
          <Button
            variant="ghost"
            className="text-[10px]"
            onClick={() => {
              exitCase();
              nav('/cases');
            }}
          >
            EXIT CASE
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border-active bg-bg-secondary p-3 font-mono text-[11px] uppercase tracking-wide">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              className={clsx(
                'mb-1 w-full rounded-sm px-2 py-2 text-left',
                panel === item.id
                  ? 'bg-amber/15 text-amber-bright'
                  : 'text-ink-muted hover:bg-bg-tertiary hover:text-ink-primary',
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="mt-6 border-t border-border pt-4">
            <Button
              className={clsx(
                'w-full text-[11px]',
                gate.ok && 'animate-pulse shadow-[0_0_25px_rgba(212,160,23,0.35)]',
              )}
              variant={gate.ok ? 'primary' : 'ghost'}
              disabled={!gate.ok}
              onClick={() => gate.ok && setAccuseOpen(true)}
            >
              ACCUSE
            </Button>
            {!gate.ok ? (
              <ul className="mt-2 space-y-1 text-[9px] normal-case text-ink-muted">
                {gate.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[9px] normal-case text-threat-green">
                CASE FILE THRESHOLD MET — You may now file your accusation.
              </p>
            )}
          </div>
        </aside>
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto p-6">
          <section className="mb-4 border-b border-border pb-3">
            <h2 className="font-display text-xl text-amber">
              {navItems.find((n) => n.id === panel)?.label}
            </h2>
          </section>
          {panel !== 'gallery' &&
          panel !== 'employees' &&
          panel !== 'brief' &&
          panel !== 'notebook' ? (
            <div className="mb-6 rounded border border-border-active bg-bg-secondary/40 p-3">
              <p className="mb-2 font-mono text-[10px] uppercase text-amber">
                Forensic tagging deck
              </p>
              <div className="max-h-56 overflow-y-auto">
                {content.evidenceItems
                  .filter((item) => mapPanelToSource(panel).includes(item.source))
                  .map((item) => renderTaggedRow(item.id, item.title))}
              </div>
            </div>
          ) : null}
          {mainBody}
        </main>
      </div>

      <InvestigationNotebook
        employees={employeesList}
        collapsed={notebookCollapsed}
        onToggle={() => setNotebookCollapsed((c) => !c)}
      />

      <Modal
        open={shotOpen}
        title="SCREENSHOT EVIDENCE"
        onClose={() => setShotOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShotOpen(false)}>
              DISCARD
            </Button>
            <Button disabled={!shotLabel.trim()} onClick={saveCapture}>
              ADD TO CASE FILE
            </Button>
          </>
        }
      >
        {shotPreview ? (
          <img src={shotPreview} alt="preview" className="mb-4 border border-border" />
        ) : null}
        <label className="block font-mono text-[11px] text-amber">
          EVIDENCE LABEL *
          <input
            value={shotLabel}
            onChange={(e) => setShotLabel(e.target.value)}
            className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-1 text-sm"
          />
        </label>
        <label className="mt-3 block font-mono text-[11px] text-amber">
          RELEVANT SUSPECT
          <select
            value={shotSuspect}
            onChange={(e) => setShotSuspect(e.target.value)}
            className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-1 text-sm"
          >
            <option value="">Select…</option>
            {employeesList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block font-mono text-[11px] text-amber">
          CATEGORY
          <select
            value={shotCategory}
            onChange={(e) =>
              setShotCategory(e.target.value as EvidenceUIPanelCategory)
            }
            className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-1 text-sm"
          >
            {(
              [
                'File Evidence',
                'Network Evidence',
                'Communication Evidence',
                'Access Evidence',
                'Physical Evidence',
              ] as const
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block font-mono text-[11px] text-amber">
          NOTES
          <textarea
            value={shotNotes}
            onChange={(e) => setShotNotes(e.target.value)}
            className="mt-1 min-h-[80px] w-full border border-border bg-bg-tertiary px-2 py-1 text-sm"
          />
        </label>
      </Modal>

      <AccuseModal
        open={accuseOpen}
        employees={employeesList}
        taggedIds={Array.from(new Set(ev.tagged.map((t) => t.evidenceId)))}
        evidenceCatalog={ev.evidenceCatalog}
        onCancel={() => setAccuseOpen(false)}
        onSubmit={(payload) => {
          setAccuseOpen(false);
          submitAccusation(payload);
        }}
      />
    </div>
  );
}

function mapPanelToSource(panel: Panel): string[] {
  switch (panel) {
    case 'workstation':
      return ['workstation'];
    case 'email':
      return ['email'];
    case 'network':
    case 'browser':
      return ['network', 'browser'];
    case 'access':
      return ['access'];
    case 'usb':
      return ['usb'];
    case 'badge':
      return ['badge'];
    case 'messages':
      return ['messages'];
    case 'printer':
      return ['printer'];
    case 'calendar':
      return ['calendar'];
    case 'recovery':
      return ['recovery'];
    default:
      return [];
  }
}

function FileTreeView({
  root,
}: {
  root?: import('@/data/cases/caseData.types').FileTreeNode;
}) {
  if (!root) return <p className="text-xs text-ink-muted">No image.</p>;
  return <TreeNode node={root} name="\\" />;
}

function TreeNode({
  node,
  name,
}: {
  node: import('@/data/cases/caseData.types').FileTreeNode;
  name: string;
}) {
  if (node.type === 'file') {
    return (
      <div className="pl-3 font-mono text-[11px] text-ink-secondary">
        {name}
        {node.hidden ? ' (HIDDEN)' : ''}
      </div>
    );
  }
  return (
    <div className="pl-2">
      <div className="font-mono text-[11px] text-amber">{name}\\</div>
      {node.children
        ? Object.keys(node.children).map((child) => (
            <TreeNode key={child} name={child} node={node.children![child]} />
          ))
        : null}
    </div>
  );
}

function AccuseModal({
  open,
  employees,
  taggedIds,
  evidenceCatalog,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  employees: import('@/types/employee.types').EmployeeProfile[];
  taggedIds: string[];
  evidenceCatalog: Map<string, import('@/types/case.types').CaseEvidenceItem>;
  onCancel: () => void;
  onSubmit: (payload: AccusationSubmission) => void;
}) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [suspect, setSuspect] = useState('');
  const [motive, setMotive] =
    useState<AccusationSubmission['motive']>('GRIEVANCE');
  const [incident, setIncident] =
    useState<AccusationSubmission['incidentType']>('malicious');
  const [e1, setE1] = useState('');
  const [e2, setE2] = useState('');
  const [e3, setE3] = useState('');
  const [rec, setRec] =
    useState<AccusationSubmission['recommendation']>('termination_legal');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!open) setStep('form');
  }, [open]);

  useEffect(() => {
    if (employees[0]) setSuspect((s) => s || employees[0].id);
  }, [employees]);

  const submit = () => {
    if (!suspect || !e1 || !e2 || !e3) return;
    onSubmit({
      suspectId: suspect,
      motive,
      incidentType: incident,
      topEvidenceIds: [e1, e2, e3] as [string, string, string],
      recommendation: rec,
      summary,
    });
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      wide
      title={step === 'confirm' ? 'CONFIRM SUBMISSION' : 'FORMAL ACCUSATION'}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            CANCEL — KEEP INVESTIGATING
          </Button>
          {step === 'form' ? (
            <Button
              onClick={() => {
                if (!suspect || !e1 || !e2 || !e3 || summary.trim().length < 10)
                  return;
                setStep('confirm');
              }}
            >
              REVIEW & CONTINUE
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep('form')}>
                BACK
              </Button>
              <Button onClick={submit}>SUBMIT ACCUSATION</Button>
            </>
          )}
        </>
      }
    >
      {step === 'confirm' ? (
        <p className="font-document text-sm text-ink-secondary">
          Once submitted, your accusation is final. If your evidence does not support your conclusion, the case will be dismissed. Are you ready?
        </p>
      ) : (
        <div className="grid gap-4 font-mono text-[11px] text-ink-secondary">
          <label className="block">
            SUSPECT
            <select
              value={suspect}
              onChange={(e) => setSuspect(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-2 text-sm text-ink-primary"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </label>
          <div>
            PRIMARY MOTIVE
            <div className="mt-2 space-y-1">
              {(
                [
                  ['FINANCIAL', 'Financial Pressure'],
                  ['GRIEVANCE', 'Workplace Grievance'],
                  ['IDEOLOGY', 'Ideological / Whistleblower'],
                  ['OPPORTUNITY', 'Opportunity'],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="motive"
                    checked={motive === v}
                    onChange={() => setMotive(v)}
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div>
            INCIDENT TYPE
            <div className="mt-2 space-y-1">
              {(
                [
                  ['malicious', 'Intentional / Malicious'],
                  ['negligent', 'Negligent / Accidental'],
                  ['coerced', 'Coerced by external party'],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="incident"
                    checked={incident === v}
                    onChange={() => setIncident(v)}
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <label>
            EVIDENCE ITEM 1
            <select
              value={e1}
              onChange={(e) => setE1(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {taggedIds.map((id) => (
                <option key={id} value={id}>
                  {evidenceCatalog.get(id)?.title ?? id}
                </option>
              ))}
            </select>
          </label>
          <label>
            EVIDENCE ITEM 2
            <select
              value={e2}
              onChange={(e) => setE2(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {taggedIds.map((id) => (
                <option key={id} value={id}>
                  {evidenceCatalog.get(id)?.title ?? id}
                </option>
              ))}
            </select>
          </label>
          <label>
            EVIDENCE ITEM 3
            <select
              value={e3}
              onChange={(e) => setE3(e.target.value)}
              className="mt-1 w-full border border-border bg-bg-tertiary px-2 py-2 text-sm"
            >
              <option value="">Select…</option>
              {taggedIds.map((id) => (
                <option key={id} value={id}>
                  {evidenceCatalog.get(id)?.title ?? id}
                </option>
              ))}
            </select>
          </label>
          <div>
            RECOMMENDATION
            <div className="mt-2 space-y-1">
              {(
                [
                  ['termination_legal', 'Immediate termination + legal referral'],
                  ['termination', 'Termination only'],
                  ['suspension', 'Suspension pending investigation'],
                  ['more_investigation', 'Additional investigation required'],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rec"
                    checked={rec === v}
                    onChange={() => setRec(v)}
                  />
                  {l}
                </label>
              ))}
            </div>
          </div>
          <label>
            SUMMARY STATEMENT
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 min-h-[120px] w-full border border-border bg-bg-tertiary px-2 py-2 text-sm"
            />
          </label>
        </div>
      )}
    </Modal>
  );
}
