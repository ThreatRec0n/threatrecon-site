import React, { useMemo, useState } from 'react';

export default function PacketList({ packets, selectedPacketId, onSelectPacket }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('ts');
  const [sortDir, setSortDir] = useState('asc');

  // Filter packets
  const filtered = useMemo(() => {
    if (!query) return packets;
    
    const q = query.toLowerCase().trim();
    const parts = q.split(/\s+/);
    
    return packets.filter(pkt => {
      // BPF-like syntax support
      if (q.includes('ip.src==') || q.includes('ip.dst==' || q.includes('ip=='))) {
        const ipMatch = q.match(/ip(?:\.(?:src|dst))?==([0-9.]+)/);
        if (ipMatch) {
          const ip = ipMatch[1];
          return pkt.src?.includes(ip) || pkt.dst?.includes(ip);
        }
      }
      if (q.includes('port==')) {
        const portMatch = q.match(/port==(\d+)/);
        if (portMatch) {
          const port = portMatch[1];
          return pkt.src?.includes(`:${port}`) || pkt.dst?.includes(`:${port}`);
        }
      }
      if (q.includes('proto==')) {
        const protoMatch = q.match(/proto==(\w+)/i);
        if (protoMatch) {
          return pkt.proto?.toLowerCase() === protoMatch[1].toLowerCase();
        }
      }
      if (q.includes('contains ')) {
        const containsMatch = q.match(/contains (.+)/i);
        if (containsMatch) {
          const searchTerm = containsMatch[1];
          return pkt.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 JSON.stringify(pkt).toLowerCase().includes(searchTerm.toLowerCase());
        }
      }
      
      // Simple text search
      return (
        pkt.src?.toLowerCase().includes(q) ||
        pkt.dst?.toLowerCase().includes(q) ||
        pkt.proto?.toLowerCase().includes(q) ||
        pkt.summary?.toLowerCase().includes(q)
      );
    });
  }, [packets, query]);

  // Sort packets
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'ts':
          aVal = new Date(a.ts).getTime();
          bVal = new Date(b.ts).getTime();
          break;
        case 'src':
          aVal = a.src || '';
          bVal = b.src || '';
          break;
        case 'dst':
          aVal = a.dst || '';
          bVal = b.dst || '';
          break;
        case 'proto':
          aVal = a.proto || '';
          bVal = b.proto || '';
          break;
        case 'length':
          aVal = a.length || 0;
          bVal = b.length || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortBy, sortDir]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="text-gray-600">↕</span>;
    return <span className="text-terminal-green">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-blue-400 shadow-neon-blue"></span>
          Packet List
        </span>
        <span className="text-[9px] text-terminal-green font-mono">{sorted.length} / {packets.length}</span>
      </div>
      
      {/* Filter Bar */}
      <div className="mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter: ip.src==192.168.1.1 | port==80 | proto==HTTP | contains GET"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green"
        />
        <div className="mt-1 text-[9px] text-gray-500 font-mono">
          Examples: ip==192.168.1.1 | port==443 | proto==TCP | contains password
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 text-[9px] font-mono text-gray-400 mb-1 px-2 pb-1 border-b border-gray-800">
        <div className="col-span-2 cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('ts')}>
          Time <SortIcon column="ts" />
        </div>
        <div className="col-span-2 cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('src')}>
          Source <SortIcon column="src" />
        </div>
        <div className="col-span-2 cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('dst')}>
          Destination <SortIcon column="dst" />
        </div>
        <div className="col-span-1 cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('proto')}>
          Proto <SortIcon column="proto" />
        </div>
        <div className="col-span-1 cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('length')}>
          Len <SortIcon column="length" />
        </div>
        <div className="col-span-4 text-gray-400">Summary</div>
      </div>

      {/* Packet List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs font-mono">
            No packets match filter
          </div>
        ) : (
          sorted.map((pkt) => {
            const timeStr = new Date(pkt.ts).toISOString().split('T')[1].slice(0, 12);
            const isSelected = selectedPacketId === pkt.id;
            
            return (
              <div
                key={pkt.id}
                onClick={() => onSelectPacket(pkt.id)}
                className={`grid grid-cols-12 gap-1 px-2 py-1.5 rounded text-[10px] font-mono cursor-pointer transition-all hover:bg-gray-800/50 ${
                  isSelected 
                    ? 'bg-terminal-green/20 border border-terminal-green/50' 
                    : 'hover:border-gray-600'
                } ${pkt.evidence ? 'border-l-2 border-yellow-500' : ''}`}
              >
                <div className="col-span-2 text-gray-400">{timeStr}</div>
                <div className="col-span-2 text-blue-400 truncate" title={pkt.src}>{pkt.src || '-'}</div>
                <div className="col-span-2 text-purple-400 truncate" title={pkt.dst}>{pkt.dst || '-'}</div>
                <div className="col-span-1 text-terminal-green">{pkt.proto || '-'}</div>
                <div className="col-span-1 text-gray-400">{pkt.length || '-'}</div>
                <div className="col-span-4 text-gray-300 truncate" title={pkt.summary}>
                  {pkt.summary || 'Packet'}
                  {pkt.evidence && <span className="ml-1 text-yellow-400">⚠</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

