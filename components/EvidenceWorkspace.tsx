'use client';

import { useState, useMemo } from 'react';
import type { EvidenceItem, InvestigationNote } from '@/lib/soc-workflows';
import { createEvidenceItem, createInvestigationNote } from '@/lib/soc-workflows';

interface Props {
  evidence: EvidenceItem[];
  notes: InvestigationNote[];
  onAddEvidence: (evidence: EvidenceItem) => void;
  onUpdateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
  onAddNote: (note: InvestigationNote) => void;
  onSelectEvidence: (evidence: EvidenceItem) => void;
}

export default function EvidenceWorkspace({
  evidence,
  notes,
  onAddEvidence,
  onUpdateEvidence,
  onAddNote,
  onSelectEvidence,
}: Props) {
  const [activeTab, setActiveTab] = useState<'evidence' | 'notes' | 'pinned'>('evidence');
  const [filter, setFilter] = useState<string>('');
  const [newNote, setNewNote] = useState('');

  const filteredEvidence = useMemo(() => {
    if (!filter) return evidence;
    const f = filter.toLowerCase();
    return evidence.filter(e =>
      e.value.toLowerCase().includes(f) ||
      e.type.toLowerCase().includes(f) ||
      e.source.toLowerCase().includes(f) ||
      e.tags.some(t => t.toLowerCase().includes(f))
    );
  }, [evidence, filter]);

  const pinnedEvidence = useMemo(() => {
    return evidence.filter(e => e.pinned);
  }, [evidence]);

  function handleBookmark(id: string) {
    const item = evidence.find(e => e.id === id);
    if (item) {
      onUpdateEvidence(id, { bookmarked: !item.bookmarked });
    }
  }

  function handlePin(id: string) {
    const item = evidence.find(e => e.id === id);
    if (item) {
      onUpdateEvidence(id, { pinned: !item.pinned });
    }
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    const note = createInvestigationNote(newNote);
    onAddNote(note);
    setNewNote('');
  }

  function getEvidenceTypeIcon(type: EvidenceItem['type']): string {
    switch (type) {
      case 'ip': return '🌐';
      case 'domain': return '🔗';
      case 'hash': return '🔐';
      case 'file': return '📄';
      case 'process': return '⚙️';
      case 'user': return '👤';
      case 'log': return '📋';
      case 'alert': return '🚨';
      default: return '📌';
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#30363d]">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-[#58a6ff] text-[#58a6ff]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Evidence ({evidence.length})
        </button>
        <button
          onClick={() => setActiveTab('pinned')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pinned'
              ? 'border-[#58a6ff] text-[#58a6ff]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Pinned ({pinnedEvidence.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notes'
              ? 'border-[#58a6ff] text-[#58a6ff]'
              : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          Notes ({notes.length})
        </button>
      </div>

      {/* Evidence Tab */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="siem-card">
            <input
              type="text"
              placeholder="Search evidence (IP, domain, hash, tags)..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="search-input w-full"
            />
          </div>

          {/* Evidence List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEvidence.map(item => (
              <div
                key={item.id}
                className="siem-card p-4 hover:border-[#58a6ff]/50 transition-colors cursor-pointer"
                onClick={() => onSelectEvidence(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getEvidenceTypeIcon(item.type)}</span>
                      <span className="text-sm font-semibold text-[#c9d1d9] capitalize">{item.type}</span>
                      <span className="font-mono text-sm text-[#58a6ff]">{item.value}</span>
                      {item.bookmarked && <span className="text-yellow-400">⭐</span>}
                      {item.pinned && <span className="text-orange-400">📌</span>}
                    </div>
                    <div className="text-xs text-[#8b949e] mb-2">
                      Source: {item.source} | {new Date(item.timestamp).toLocaleString()}
                    </div>
                    {item.notes && (
                      <div className="text-sm text-[#c9d1d9] mb-2 bg-[#0d1117] p-2 rounded border border-[#30363d]">
                        {item.notes}
                      </div>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(item.id);
                      }}
                      className={`p-2 rounded ${item.bookmarked ? 'text-yellow-400' : 'text-[#8b949e] hover:text-yellow-400'}`}
                      title="Bookmark"
                    >
                      ⭐
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePin(item.id);
                      }}
                      className={`p-2 rounded ${item.pinned ? 'text-orange-400' : 'text-[#8b949e] hover:text-orange-400'}`}
                      title="Pin"
                    >
                      📌
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvidence.length === 0 && (
            <div className="text-center py-8 text-[#8b949e]">
              {filter ? 'No evidence matches your search' : 'No evidence collected yet'}
            </div>
          )}
        </div>
      )}

      {/* Pinned Tab */}
      {activeTab === 'pinned' && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {pinnedEvidence.map(item => (
            <div
              key={item.id}
              className="siem-card p-4 border-l-4 border-orange-500"
              onClick={() => onSelectEvidence(item)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getEvidenceTypeIcon(item.type)}</span>
                <span className="font-mono text-sm text-[#58a6ff]">{item.value}</span>
                <span className="text-xs text-[#8b949e]">from {item.source}</span>
              </div>
            </div>
          ))}
          {pinnedEvidence.length === 0 && (
            <div className="text-center py-8 text-[#8b949e]">No pinned evidence</div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Add Note */}
          <div className="siem-card">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add investigation note..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-sm text-[#c9d1d9] resize-none"
              rows={3}
            />
            <button
              onClick={handleAddNote}
              className="mt-2 px-4 py-2 text-sm bg-[#58a6ff] text-white rounded hover:bg-[#4493f8]"
            >
              Add Note
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {notes.map(note => (
              <div key={note.id} className="siem-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-[#8b949e]">
                    {new Date(note.timestamp).toLocaleString()} by {note.author}
                  </div>
                </div>
                <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap">{note.content}</div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div className="text-center py-8 text-[#8b949e]">No notes yet</div>
          )}
        </div>
      )}
    </div>
  );
}

