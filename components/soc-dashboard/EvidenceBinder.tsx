'use client';

import { useState, useEffect, useRef } from 'react';

export interface EvidenceItem {
  id: string;
  type: 'screenshot' | 'log' | 'ioc' | 'event' | 'artifact' | 'note';
  name: string;
  description: string;
  timestamp: string;
  data?: string; // Base64 for screenshots, or text content
  linkedTo?: string[]; // IDs of related evidence
  tags: string[];
}

interface Props {
  scenarioId: string;
  onEvidenceChange?: (evidence: EvidenceItem[]) => void;
}

export default function EvidenceBinder({ scenarioId, onEvidenceChange }: Props) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedType, setSelectedType] = useState<EvidenceItem['type']>('screenshot');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load evidence from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`evidence_${scenarioId}`);
    if (stored) {
      try {
        setEvidence(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading evidence:', e);
      }
    }
  }, [scenarioId]);

  // Save evidence to localStorage whenever it changes
  useEffect(() => {
    if (evidence.length > 0 || localStorage.getItem(`evidence_${scenarioId}`)) {
      localStorage.setItem(`evidence_${scenarioId}`, JSON.stringify(evidence));
      onEvidenceChange?.(evidence);
    }
  }, [evidence, scenarioId, onEvidenceChange]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle screenshots/images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const item: EvidenceItem = {
          id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'screenshot',
          name: file.name,
          description: `Screenshot captured at ${new Date().toLocaleString()}`,
          timestamp: new Date().toISOString(),
          data: base64,
          tags: ['screenshot'],
        };
        setEvidence(prev => [item, ...prev]);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle text files (logs, etc.)
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const item: EvidenceItem = {
          id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'log',
          name: file.name,
          description: `Log file: ${file.name}`,
          timestamp: new Date().toISOString(),
          data: text,
          tags: ['log'],
        };
        setEvidence(prev => [item, ...prev]);
      };
      reader.readAsText(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCaptureScreenshot = () => {
    // Use html2canvas or similar for screenshot capture
    // For now, prompt user to upload
    fileInputRef.current?.click();
  };

  const handleAddManualEvidence = () => {
    const name = prompt('Evidence name:');
    if (!name) return;

    const description = prompt('Description:') || '';
    const item: EvidenceItem = {
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedType,
      name,
      description,
      timestamp: new Date().toISOString(),
      tags: [selectedType],
    };
    setEvidence(prev => [item, ...prev]);
  };

  const handleDeleteEvidence = (id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
  };

  const filteredEvidence = evidence.filter(item => {
    if (filter) {
      const f = filter.toLowerCase();
      return (
        item.name.toLowerCase().includes(f) ||
        item.description.toLowerCase().includes(f) ||
        item.tags.some(t => t.toLowerCase().includes(f))
      );
    }
    return true;
  });

  const getTypeIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'screenshot': return '📸';
      case 'log': return '📋';
      case 'ioc': return '🔍';
      case 'event': return '⚡';
      case 'artifact': return '📦';
      case 'note': return '📝';
      default: return '📌';
    }
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#c9d1d9]">📎 Evidence Binder</h3>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Attach screenshots, logs, and artifacts to your investigation
          </p>
        </div>
        <div className="text-xs text-[#8b949e]">
          {evidence.length} {evidence.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Add Evidence Actions */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.log,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={handleCaptureScreenshot}
          className="px-3 py-2 text-sm bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
        >
          📸 Upload Screenshot
        </button>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as EvidenceItem['type'])}
          className="px-3 py-2 text-sm bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
        >
          <option value="screenshot">Screenshot</option>
          <option value="log">Log</option>
          <option value="ioc">IOC</option>
          <option value="event">Event</option>
          <option value="artifact">Artifact</option>
          <option value="note">Note</option>
        </select>
        <button
          onClick={handleAddManualEvidence}
          className="px-3 py-2 text-sm bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:border-[#58a6ff] transition-colors"
        >
          + Add Manual
        </button>
      </div>

      {/* Filter */}
      {evidence.length > 0 && (
        <div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter evidence..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent"
          />
        </div>
      )}

      {/* Evidence List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredEvidence.length === 0 ? (
          <div className="text-center py-8 text-[#8b949e] text-sm">
            {evidence.length === 0 ? 'No evidence attached yet. Add screenshots, logs, or artifacts.' : 'No evidence matches your filter.'}
          </div>
        ) : (
          filteredEvidence.map(item => (
            <div key={item.id} className="bg-[#0d1117] border border-[#30363d] rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  <div>
                    <div className="text-sm font-semibold text-[#c9d1d9]">{item.name}</div>
                    <div className="text-xs text-[#8b949e]">{new Date(item.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEvidence(item.id)}
                  className="text-[#8b949e] hover:text-red-400 text-xs"
                  aria-label="Delete evidence"
                >
                  ✕
                </button>
              </div>
              {item.description && (
                <div className="text-xs text-[#8b949e] mb-2">{item.description}</div>
              )}
              {item.type === 'screenshot' && item.data && (
                <div className="mt-2">
                  <img
                    src={item.data}
                    alt={item.name}
                    className="max-w-full h-auto rounded border border-[#30363d]"
                  />
                </div>
              )}
              {item.type === 'log' && item.data && (
                <div className="mt-2 p-2 bg-[#161b22] rounded text-xs text-[#c9d1d9] font-mono max-h-32 overflow-y-auto">
                  {item.data.substring(0, 500)}
                  {item.data.length > 500 && '...'}
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map(tag => (
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

