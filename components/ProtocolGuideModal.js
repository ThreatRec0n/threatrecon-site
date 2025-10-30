import React from 'react';
import { PROTOCOLS } from '../lib/protocol-encyclopedia';

function useDebouncedValue(value, delayMs = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

function copy(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(()=>{});
  }
}

const COLUMNS = [
  { key: 'proto', label: 'Protocol' },
  { key: 'typicalUse', label: 'Typical Use' },
  { key: 'keyFields', label: 'Key Fields' },
  { key: 'normalPatterns', label: 'Normal Patterns' },
  { key: 'commonAbuses', label: 'Common Abuses/TTPs' },
  { key: 'whatToLookFor', label: 'What to Look For' },
  { key: 'filters', label: 'Wireshark-style Filters' },
];

export default function ProtocolGuideModal({ open, onClose }) {
  const [query, setQuery] = React.useState('');
  const [selectedProtos, setSelectedProtos] = React.useState([]);
  const [sortAsc, setSortAsc] = React.useState(true);
  const debouncedQuery = useDebouncedValue(query, 250);

  const protoOptions = React.useMemo(() => {
    return Array.from(new Set(PROTOCOLS.map(p => p.proto)));
  }, []);

  const toggleProto = (proto) => {
    setSelectedProtos(prev => prev.includes(proto) ? prev.filter(p => p !== proto) : [...prev, proto]);
  };

  const filtered = React.useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = PROTOCOLS;
    if (selectedProtos.length > 0) {
      list = list.filter(p => selectedProtos.includes(p.proto));
    }
    if (q) {
      list = list.filter(p => {
        return COLUMNS.some(c => String(p[c.key] || '').toLowerCase().includes(q));
      });
    }
    list = [...list].sort((a, b) => a.proto.localeCompare(b.proto) * (sortAsc ? 1 : -1));
    return list;
  }, [debouncedQuery, selectedProtos, sortAsc]);

  const [expanded, setExpanded] = React.useState(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-xl shadow-xl w-[95vw] max-w-[1200px] max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="text-terminal-green font-mono font-bold">Protocol Guide</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 font-mono text-xs">CLOSE</button>
        </div>

        <div className="p-3 space-y-3">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Search across all columns (e.g., tunnel, POST, beacon)"
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none focus:ring-1 focus:ring-terminal-green"
            />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-mono">Sort:</span>
              <button onClick={()=>setSortAsc(!sortAsc)} className="px-2 py-1 text-[11px] font-mono rounded border border-gray-700 text-gray-300 hover:bg-gray-800">
                {sortAsc ? 'A→Z' : 'Z→A'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {protoOptions.map(p => (
              <button
                key={p}
                onClick={()=>toggleProto(p)}
                className={`px-2 py-1 text-[11px] font-mono rounded border ${selectedProtos.includes(p) ? 'border-terminal-green text-terminal-green bg-terminal-green/10' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                title={selectedProtos.includes(p) ? 'Remove filter' : 'Filter by protocol'}
              >
                {p}
              </button>
            ))}
            {selectedProtos.length > 0 && (
              <button onClick={()=>setSelectedProtos([])} className="px-2 py-1 text-[11px] font-mono rounded border border-gray-700 text-gray-300 hover:bg-gray-800">
                Clear
              </button>
            )}
          </div>

          <div className="overflow-auto border border-gray-800 rounded">
            <table className="min-w-full text-[11px] font-mono">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="text-left text-gray-400 font-semibold px-3 py-2 whitespace-nowrap border-b border-gray-800">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <React.Fragment key={row.proto + idx}>
                    <tr
                      className="hover:bg-gray-800/50 cursor-pointer"
                      onClick={()=> setExpanded(expanded === idx ? null : idx)}
                    >
                      {COLUMNS.map(col => (
                        <td key={col.key} className="align-top px-3 py-2 text-gray-300 border-b border-gray-800">
                          <div className="flex items-start gap-2">
                            <span className="break-words">{row[col.key]}</span>
                            <button
                              onClick={(e)=>{ e.stopPropagation(); copy(String(row[col.key] || '')); }}
                              className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                              title="Copy cell"
                            >COPY</button>
                          </div>
                        </td>
                      ))}
                    </tr>
                    {expanded === idx && (
                      <tr>
                        <td colSpan={COLUMNS.length} className="bg-gray-900/60 border-b border-gray-800">
                          <div className="p-3 text-[11px] text-gray-300">
                            <div className="text-gray-400 mb-1">Examples and notes</div>
                            <div className="text-gray-400">Use the filters in the last column directly in your filter box.</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center text-gray-500 px-3 py-6">No results</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


