'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';

type Row = Record<string, unknown>;

export default function LogViewer() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');

  function parseText(text: string) {
    if (!text.trim()) {
      setRows([]);
      return;
    }
    
    // try JSONL first
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length > 0) {
      try {
        const jsonl = lines.map(l => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        }).filter((r): r is Row => r !== null);
        
        if (jsonl.length > 0) {
          setRows(jsonl);
          return;
        }
      } catch {
        // fall through to CSV parsing
      }
    }
    
    // fall back to CSV
    try {
      const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
      if (parsed.data && parsed.data.length > 0) {
        setRows(parsed.data);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      setRows([]);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(parseText);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  // Extract keys from first row for column headers
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-4">
      {/* Professional Search Bar */}
      <div className="flex gap-3">
        <label className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-md hover:bg-[#21262d] cursor-pointer transition-colors">
          <span className="text-sm text-[#c9d1d9]">📁</span>
          <span className="text-sm font-medium text-[#c9d1d9]">Upload</span>
          <input 
            type="file" 
            onChange={onFile} 
            className="hidden"
            accept=".json,.jsonl,.csv,.txt"
            aria-label="Upload log file"
          />
        </label>
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]">🔍</span>
          <input
            className="search-input w-full pl-10 pr-4"
            placeholder="Search logs... (e.g., 10.0.1.5, ET MALWARE, tcp)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Filter logs"
          />
        </div>
      </div>

      {/* Stats Bar */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="text-[#8b949e]">
              <span className="text-[#c9d1d9] font-semibold">{filtered.length}</span> of <span className="text-[#c9d1d9] font-semibold">{rows.length}</span> events
            </div>
            {query && (
              <div className="px-2 py-1 bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">
                Filtered
              </div>
            )}
          </div>
          <div className="text-[#8b949e]">
            Showing first 500 results
          </div>
        </div>
      )}

      {/* Professional Table */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">#</th>
                  {columns.slice(0, 8).map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      {col.length > 20 ? `${col.substring(0, 20)}...` : col}
                    </th>
                  ))}
                  {columns.length > 8 && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      +{columns.length - 8} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {filtered.slice(0, 500).map((r, i) => (
                  <tr key={`row-${i}`} className="log-row group">
                    <td className="px-4 py-3 text-[#8b949e] font-mono text-xs">
                      {i + 1}
                    </td>
                    {columns.slice(0, 8).map((col) => {
                      const value = r[col];
                      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
                      return (
                        <td key={col} className="px-4 py-3 log-mono text-[#c9d1d9] max-w-xs">
                          <div className="truncate" title={displayValue}>
                            {displayValue.length > 50 ? `${displayValue.substring(0, 50)}...` : displayValue}
                          </div>
                        </td>
                      );
                    })}
                    {columns.length > 8 && (
                      <td className="px-4 py-3 text-[#8b949e] text-xs">
                        <button className="hover:text-[#58a6ff] transition-colors">
                          View all
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-[#8b949e] mb-2">
              {rows.length === 0 ? 'No logs loaded' : 'No results match your search'}
            </p>
            <p className="text-sm text-[#484f58]">
              {rows.length === 0 
                ? 'Upload a log file to begin analysis' 
                : 'Try adjusting your search query'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
