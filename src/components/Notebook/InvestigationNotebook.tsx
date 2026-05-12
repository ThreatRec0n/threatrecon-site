import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EmployeeProfile } from '@/types/employee.types';
import {
  taggedNotebookEntries,
  useEvidence,
} from '@/contexts/EvidenceContext';
import clsx from 'clsx';

function SortRow({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-grab border border-border bg-bg-tertiary px-3 py-2 font-mono text-xs text-ink-primary active:cursor-grabbing"
    >
      {label}
    </div>
  );
}

export function InvestigationNotebook({
  employees,
  collapsed,
  onToggle,
}: {
  employees: EmployeeProfile[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const ev = useEvidence();
  const [tab, setTab] = useState<
    'suspects' | 'evidence' | 'timeline' | 'connections'
  >('suspects');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const nbEntries = taggedNotebookEntries(ev.tagged, ev.evidenceCatalog);

  const baseIds = Array.from(new Set(ev.tagged.map((t) => t.evidenceId)));
  const timelineIds =
    ev.timeline.length > 0
      ? ev.timeline.map((t) => t.evidenceId)
      : baseIds;

  const orderedLabels = timelineIds.map((id) => {
    const item = ev.evidenceCatalog.get(id);
    return { id, label: item?.title ?? id };
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedLabels.map((o) => o.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    ev.setTimeline(next.map((id) => ({ id, evidenceId: id })));
  };

  return (
    <div className="border-t border-border-active bg-bg-secondary">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2 font-mono text-xs uppercase tracking-wide text-amber"
      >
        Investigation Notebook
        <span>{collapsed ? 'EXPAND' : 'COLLAPSE'}</span>
      </button>
      {!collapsed ? (
        <div className="max-h-[320px] overflow-hidden border-t border-border">
          <div className="flex gap-2 border-b border-border px-3 py-2">
            {(['suspects', 'evidence', 'timeline', 'connections'] as const).map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={clsx(
                    'rounded-sm px-3 py-1 font-mono text-[11px] uppercase',
                    tab === t
                      ? 'bg-amber/15 text-amber-bright'
                      : 'text-ink-muted hover:text-ink-primary',
                  )}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <div className="max-h-[260px] overflow-y-auto p-3">
            {tab === 'suspects' ? (
              <div className="grid grid-cols-2 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="border border-border bg-bg-tertiary p-3"
                  >
                    <p className="font-display text-sm text-ink-primary">
                      {emp.fullName}
                    </p>
                    <label className="mt-2 block font-mono text-[10px] text-ink-muted">
                      NOTES
                      <textarea
                        value={ev.notebookNotes[emp.id] ?? ''}
                        onChange={(e) =>
                          ev.setNotebookNote(emp.id, e.target.value)
                        }
                        className="mt-1 min-h-[72px] w-full border border-border bg-bg-secondary px-2 py-1 font-mono text-xs text-ink-primary"
                      />
                    </label>
                    <label className="mt-2 block font-mono text-[10px] text-ink-muted">
                      MOTIVE HYPOTHESIS
                      <textarea
                        value={ev.motiveNotes[emp.id] ?? ''}
                        onChange={(e) =>
                          ev.setMotiveNote(emp.id, e.target.value)
                        }
                        className="mt-1 min-h-[56px] w-full border border-border bg-bg-secondary px-2 py-1 font-mono text-xs text-ink-primary"
                      />
                    </label>
                    <div className="mt-2 font-mono text-[10px] text-ink-muted">
                      TAGGED ITEMS:{' '}
                      {
                        ev.tagged.filter((t) => t.suspectId === emp.id).length
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === 'evidence' ? (
              <div className="space-y-2">
                {nbEntries.length === 0 ? (
                  <p className="font-mono text-xs text-ink-muted">
                    No tagged evidence yet.
                  </p>
                ) : (
                  nbEntries.map((row) => (
                    <div
                      key={row.evidenceId + row.suspectId}
                      className="border border-border bg-bg-tertiary p-2 font-mono text-[11px] text-ink-secondary"
                    >
                      <span className="text-evidence-access">{row.typeBadge}</span>{' '}
                      {row.description}{' '}
                      <span className="text-ink-muted">→ {row.suspectId}</span>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === 'timeline' ? (
              <div>
                <p className="mb-2 font-mono text-[10px] text-ink-muted">
                  Drag cards into chronological order. Scoring compares relative
                  ordering against the canonical insider timeline.
                </p>
                {orderedLabels.length === 0 ? (
                  <p className="font-mono text-xs text-ink-muted">
                    Tag evidence to populate the timeline.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={orderedLabels.map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedLabels.map((o) => (
                        <SortRow key={o.id} id={o.id} label={o.label} />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            ) : null}

            {tab === 'connections' ? (
              <ConnectionMiniBoard employees={employees} />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConnectionMiniBoard({
  employees,
}: {
  employees: EmployeeProfile[];
}) {
  const ev = useEvidence();
  const employeeNodes = employees.map((e) => ({
    id: `emp:${e.id}`,
    label: e.fullName,
    type: 'employee' as const,
  }));
  const evidenceNodes = Array.from(
    new Set(ev.tagged.map((t) => t.evidenceId)),
  ).map((id) => ({
    id: `ev:${id}`,
    label: ev.evidenceCatalog.get(id)?.title ?? id,
    type: 'evidence' as const,
  }));
  const nodes = [...employeeNodes, ...evidenceNodes];

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const addEdge = () => {
    if (!from || !to || from === to) return;
    const id = `${from}->${to}`;
    ev.setConnectionBoard({
      nodes,
      edges: [
        ...ev.connectionBoard.edges.filter((e) => e.id !== id),
        { id, fromNodeId: from, toNodeId: to },
      ],
    });
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      <p className="text-ink-muted">
        Map implication threads — visualize how artifacts tie to people.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-border bg-bg-tertiary px-2 py-1 text-ink-primary"
        >
          <option value="">From…</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-border bg-bg-tertiary px-2 py-1 text-ink-primary"
        >
          <option value="">To…</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addEdge}
          className="border border-threat-red/40 bg-threat-red-dim px-3 py-1 text-threat-red"
        >
          ADD THREAD
        </button>
      </div>
      <ul className="space-y-1 text-[11px] text-ink-secondary">
        {ev.connectionBoard.edges.map((edge) => (
          <li key={edge.id}>
            ⎯ {edge.fromNodeId} → {edge.toNodeId}
          </li>
        ))}
      </ul>
    </div>
  );
}
