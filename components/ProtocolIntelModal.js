import React from 'react';
import { PROTOCOL_INTEL } from '../lib/protocol-intel';

function useDebounced(value, delay = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function copy(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(()=>{});
  }
}

const COLUMNS = [
  { key: 'proto', label: 'Protocol' },
  { key: 'normalUse', label: 'Normal Use' },
  { key: 'attackerUse', label: 'Attacker Use' },
  { key: 'mitre', label: 'MITRE ID' },
  { key: 'forensicSigns', label: 'Forensic Signs' },
  { key: 'wiresharkFilters', label: 'Filters' },
];

export default function ProtocolIntelModal({ open, onClose }) {
  const [query, setQuery] = React.useState('');
  const [expanded, setExpanded] = React.useState(null);
  const debounced = useDebounced(query, 250);

  if (!open) return null;

  const filtered = React.useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return PROTOCOL_INTEL;
    return PROTOCOL_INTEL.filter(row => {
      const all = [
        row.proto,
        row.normalUse,
        row.attackerUse,
        row.mitre,
        ...(row.forensicSigns || []),
        ...(row.wiresharkFilters || []),
      ].join(' ').toLowerCase();
      return all.includes(q);
    });
  }, [debounced]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-xl shadow-xl w-[95vw] max-w-[1200px] max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="text-terminal-green font-mono font-bold">Protocol Intelligence</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 font-mono text-xs">CLOSE</button>
        </div>

        <div className="p-3 space-y-3">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search protocol or keyword..."
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 font-mono outline-none focus:ring-1 focus:ring-terminal-green"
          />

          <div className="overflow-x-auto border border-gray-800 rounded">
            <table className="min-w-[900px] w-full text-[11px] font-mono">
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
                    <tr className="hover:bg-gray-800/50 cursor-pointer" onClick={()=> setExpanded(expanded === idx ? null : idx)}>
                      <td className="px-3 py-2 text-gray-200 border-b border-gray-800 whitespace-nowrap">{row.proto}</td>
                      <td className="px-3 py-2 text-gray-300 border-b border-gray-800">{row.normalUse}</td>
                      <td className="px-3 py-2 text-gray-300 border-b border-gray-800">{row.attackerUse}</td>
                      <td className="px-3 py-2 text-gray-300 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <span>{row.mitre}</span>
                          <button
                            onClick={(e)=>{ e.stopPropagation(); copy(row.mitre); }}
                            className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                            title="Copy MITRE ID"
                          >COPY</button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-300 border-b border-gray-800">
                        <ul className="list-disc list-inside space-y-1">
                          {(row.forensicSigns || []).map((s, i) => (
                            <li key={i} className="text-gray-300">{s}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 text-gray-300 border-b border-gray-800">
                        <div className="flex flex-wrap gap-1">
                          {(row.wiresharkFilters || []).map((f, i) => (
                            <button
                              key={i}
                              onClick={(e)=>{ e.stopPropagation(); copy(f); }}
                              className="px-2 py-0.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
                              title="Copy filter"
                            >{f}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {expanded === idx && (
                      <tr>
                        <td colSpan={COLUMNS.length} className="bg-gray-900/60 border-b border-gray-800">
                          <div className="p-3 text-[11px] text-gray-300">
                            <div className="text-gray-400">Additional notes: validate context with timing, directionality, and tuple alignment.</div>
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


