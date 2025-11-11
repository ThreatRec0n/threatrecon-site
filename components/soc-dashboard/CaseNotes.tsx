'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/client';
import { sanitizeAndValidate } from '@/lib/security/input-sanitization';

export interface CaseNote {
  id: string;
  timestamp: string;
  content: string;
  tags: string[];
  linkedIOCs: string[];
  linkedEvents: string[];
}

interface Props {
  scenarioId: string;
  onNotesChange?: (notes: CaseNote[]) => void;
}

export default function CaseNotes({ scenarioId, onNotesChange }: Props) {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      if (isSupabaseEnabled()) {
        try {
          const supabase = getSupabaseClient();
          if (supabase) {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session?.user) {
              setIsAuthenticated(true);
              setUserId(session.user.id);
            } else {
              setIsAuthenticated(false);
              setUserId(null);
            }
          } else {
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Error checking auth:', err);
          setIsAuthenticated(false);
        }
      } else {
        // Supabase not enabled - require account
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Load notes from localStorage on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && userId) {
      const stored = localStorage.getItem(`case_notes_${scenarioId}_${userId}`);
      if (stored) {
        try {
          setNotes(JSON.parse(stored));
        } catch (e) {
          console.error('Error loading notes:', e);
        }
      }
    }
  }, [scenarioId, isAuthenticated, userId]);

  // Save notes to localStorage whenever they change (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && userId) {
      const storageKey = `case_notes_${scenarioId}_${userId}`;
      if (notes.length > 0 || localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(notes));
        onNotesChange?.(notes);
      }
    }
  }, [notes, scenarioId, isAuthenticated, userId, onNotesChange]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    // Check authentication
    if (!isAuthenticated) {
      setError('Please sign in to add case notes. Case notes require an account for security and tracking purposes.');
      return;
    }

    // Sanitize and validate input
    const { sanitized, valid, reason } = sanitizeAndValidate(newNote.trim());
    
    if (!valid) {
      setError(reason || 'Invalid input. Please check your note for inappropriate content or suspicious patterns.');
      return;
    }

    // Clear any previous errors
    setError(null);

    const note: CaseNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      content: sanitized,
      tags: selectedTags,
      linkedIOCs: [],
      linkedEvents: [],
    };

    setNotes(prev => [note, ...prev]);
    setNewNote('');
    setSelectedTags([]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const commonTags = ['IOC', 'Timeline', 'Attack Chain', 'Suspicious', 'Confirmed Threat', 'False Positive', 'Requires Review'];

  const filteredNotes = notes.filter((note) => {
    if (filter) {
      const f = filter.toLowerCase();
      return (
        note.content.toLowerCase().includes(f) ||
        note.tags.some((t) => t.toLowerCase().includes(f))
      );
    }
    return true;
  });

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#c9d1d9]">📝 Case Notes</h3>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Document your investigation findings and observations
          </p>
        </div>
        <div className="text-xs text-[#8b949e]">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </div>
      </div>

      {!isCheckingAuth && !isAuthenticated && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded p-3 mb-4">
          <p className="text-sm text-yellow-400">
            <strong>⚠️ Account Required:</strong> Case notes require an account for security and tracking purposes. 
            <a href="/simulation" className="underline ml-1">Sign in</a> to add notes.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => {
            setNewNote(e.target.value);
            setError(null); // Clear error on input change
          }}
          placeholder={
            isAuthenticated 
              ? "Add investigation note... Document findings, observations, hypotheses, or key evidence."
              : "Sign in to add case notes..."
          }
          disabled={!isAuthenticated || isCheckingAuth}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-sm text-[#c9d1d9] placeholder-[#484f58] resize-none focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          rows={4}
        />

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[#8b949e] self-center">Tags:</span>
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTags.includes(tag)) {
                  handleRemoveTag(tag);
                } else {
                  handleAddTag(tag);
                }
              }}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]'
                  : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#58a6ff]/50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          onClick={handleAddNote}
          disabled={!newNote.trim() || !isAuthenticated || isCheckingAuth}
          className="w-full px-4 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {isCheckingAuth ? 'Checking...' : isAuthenticated ? 'Add Note' : 'Sign In Required'}
        </button>
      </div>

      {notes.length > 0 && (
        <div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter notes..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
          />
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-[#8b949e] text-sm">
            {notes.length === 0 ? 'No notes yet. Start documenting your investigation.' : 'No notes match your filter.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-[#0d1117] border border-[#30363d] rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-[#8b949e]">
                  {new Date(note.timestamp).toLocaleString()}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-[#8b949e] hover:text-red-400 text-xs"
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>
              <div className="text-sm text-[#c9d1d9] whitespace-pre-wrap mb-2">
                {note.content}
              </div>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
