import React, { useMemo, useState, useRef, useEffect } from 'react';

export default function PacketList({ packets, selectedPacketId, onSelectPacket, markedPacketIds, isStreaming }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('no');
  const [sortDir, setSortDir] = useState('asc');
  const filterInputRef = useRef(null);
  const listRef = useRef(null);
  const userScrolledRef = useRef(false);
  const lastPacketCountRef = useRef(0);

  // Auto-scroll to newest packet when streaming (unless user scrolled up)
  useEffect(() => {
    if (isStreaming && packets.length > lastPacketCountRef.current && !userScrolledRef.current) {
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 50);
      lastPacketCountRef.current = packets.length;
    }
  }, [packets.length, isStreaming]);

  useEffect(() => {
    const handleScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        userScrolledRef.current = !isNearBottom;
      }
    };
    
    const listEl = listRef.current;
    if (listEl) {
      listEl.addEventListener('scroll', handleScroll);
      return () => listEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Filter packets with BPF-like syntax
  const filtered = useMemo(() => {
    if (!query.trim()) return packets;
    
    const q = query.trim();
    
    return packets.filter(pkt => {
      // BPF-like filters
      if (q.includes('ip.src==')) {
        const match = q.match(/ip\.src==([0-9.]+)/);
        if (match) {
          return pkt.layers?.ip?.srcIp === match[1] || pkt.src?.startsWith(match[1]);
        }
      }
      if (q.includes('ip.dst==')) {
        const match = q.match(/ip\.dst==([0-9.]+)/);
        if (match) {
          return pkt.layers?.ip?.dstIp === match[1] || pkt.dst?.startsWith(match[1]);
        }
      }
      if (q.includes('ip==')) {
        const match = q.match(/ip==([0-9.]+)/);
        if (match) {
          const ip = match[1];
          return pkt.layers?.ip?.srcIp === ip || pkt.layers?.ip?.dstIp === ip ||
                 pkt.src?.includes(ip) || pkt.dst?.includes(ip);
        }
      }
      if (q.includes('port==')) {
        const match = q.match(/port==(\d+)/);
        if (match) {
          const port = match[1];
          return pkt.layers?.tcp?.srcPort?.toString() === port ||
                 pkt.layers?.tcp?.dstPort?.toString() === port ||
                 pkt.layers?.udp?.srcPort?.toString() === port ||
                 pkt.layers?.udp?.dstPort?.toString() === port ||
                 pkt.src?.includes(`:${port}`) || pkt.dst?.includes(`:${port}`);
        }
      }
      if (q.includes('proto==')) {
        const match = q.match(/proto==(\w+)/i);
        if (match) {
          return pkt.proto?.toLowerCase() === match[1].toLowerCase();
        }
      }
      if (q.includes('contains ')) {
        const match = q.match(/contains ["']?(.+?)["']?$/i);
        if (match) {
          const term = match[1].toLowerCase();
          return pkt.summary?.toLowerCase().includes(term) ||
                 pkt.payloadAscii?.toLowerCase().includes(term) ||
                 JSON.stringify(pkt).toLowerCase().includes(term);
        }
      }
      
      // Simple text search
      const lowerQ = q.toLowerCase();
      return (
        pkt.src?.toLowerCase().includes(lowerQ) ||
        pkt.dst?.toLowerCase().includes(lowerQ) ||
        pkt.proto?.toLowerCase().includes(lowerQ) ||
        pkt.summary?.toLowerCase().includes(lowerQ)
      );
    });
  }, [packets, query]);

  // Sort packets
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const idxA = packets.indexOf(a);
      const idxB = packets.indexOf(b);
      let aVal, bVal;
      
      switch (sortBy) {
        case 'no':
          return sortDir === 'asc' ? idxA - idxB : idxB - idxA;
        case 'ts':
          aVal = typeof a.ts === 'string' ? new Date(a.ts).getTime() : a.ts;
          bVal = typeof b.ts === 'string' ? new Date(b.ts).getTime() : b.ts;
          break;
        case 'src':
          aVal = a.layers?.ip?.srcIp || a.src || '';
          bVal = b.layers?.ip?.srcIp || b.src || '';
          break;
        case 'dst':
          aVal = a.layers?.ip?.dstIp || a.dst || '';
          bVal = b.layers?.ip?.dstIp || b.dst || '';
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
  }, [filtered, sortBy, sortDir, packets]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="text-gray-600 text-[8px]">↕</span>;
    return <span className="text-terminal-green text-[8px]">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const clearFilter = () => {
    setQuery('');
    if (filterInputRef.current) filterInputRef.current.focus();
  };

  // Format time display
  const formatTime = (pkt) => {
    const ts = typeof pkt.ts === 'string' ? new Date(pkt.ts).getTime() : pkt.ts;
    const date = new Date(ts);
    return date.toISOString().split('T')[1].slice(0, 12);
  };

  // Get packet number (index)
  const getPacketNo = (pkt) => {
    return packets.indexOf(pkt) + 1;
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold">
          <span className="h-2 w-2 rounded-full bg-blue-400 shadow-neon-blue"></span>
          Packet List
        </span>
        <span className="text-[9px] text-terminal-green font-mono">{sorted.length} / {packets.length}</span>
      </div>
      
      {/* Filter Bar */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800">
        <div className="flex gap-2 items-center mb-2">
          <input
            ref={filterInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter: ip.src==192.168.1.1 | port==80 | proto==HTTP | contains password"
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-[11px] font-mono text-gray-200 focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green"
          />
          {query && (
            <button
              onClick={clearFilter}
              className="text-gray-400 hover:text-gray-200 px-2 text-sm"
              title="Clear filter"
            >
              ×
            </button>
          )}
        </div>
        {query && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] text-gray-500 font-mono">Active filter:</span>
            <span className="bg-terminal-green/20 border border-terminal-green/50 rounded px-2 py-0.5 text-[9px] font-mono text-terminal-green">
              {query}
            </span>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_80px_120px_120px_70px_60px_1fr] gap-2 text-[9px] font-mono text-gray-400 px-4 py-2 border-b border-gray-800 bg-gray-900/50">
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('no')}>
          No. <SortIcon column="no" />
        </div>
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('ts')}>
          Time <SortIcon column="ts" />
        </div>
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('src')}>
          Source <SortIcon column="src" />
        </div>
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('dst')}>
          Destination <SortIcon column="dst" />
        </div>
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('proto')}>
          Protocol <SortIcon column="proto" />
        </div>
        <div className="cursor-pointer hover:text-terminal-green flex items-center gap-1" onClick={() => handleSort('length')}>
          Length <SortIcon column="length" />
        </div>
        <div className="text-gray-400">Info</div>
      </div>

      {/* Packet List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs font-mono">
            No packets match filter
          </div>
        ) : (
          sorted.map((pkt) => {
            const packetNo = getPacketNo(pkt);
            const timeStr = formatTime(pkt);
            const isSelected = selectedPacketId === pkt.id;
            const isMarked = markedPacketIds.includes(pkt.id);
            const srcIp = pkt.layers?.ip?.srcIp || pkt.src?.split(':')[0] || pkt.src || '-';
            const dstIp = pkt.layers?.ip?.dstIp || pkt.dst?.split(':')[0] || pkt.dst || '-';
            const srcPort = pkt.layers?.tcp?.srcPort || pkt.layers?.udp?.srcPort || '';
            const dstPort = pkt.layers?.tcp?.dstPort || pkt.layers?.udp?.dstPort || '';
            const src = srcPort ? `${srcIp}:${srcPort}` : srcIp;
            const dst = dstPort ? `${dstIp}:${dstPort}` : dstIp;
            
            return (
              <div
                key={pkt.id}
                data-packet-id={pkt.id}
                onClick={() => onSelectPacket(pkt.id)}
                className={`grid grid-cols-[40px_80px_120px_120px_70px_60px_1fr] gap-2 px-4 py-1.5 text-[10px] font-mono cursor-pointer transition-all hover:bg-gray-800/50 ${
                  isSelected 
                    ? 'bg-terminal-green/20 border-l-2 border-terminal-green' 
                    : ''
                } ${isMarked ? 'border-l-2 border-yellow-500 bg-yellow-900/10' : ''} ${pkt.evidence ? 'border-l-2 border-red-500' : ''}`}
              >
                <div className="text-gray-500">{packetNo}</div>
                <div className="text-gray-400">{timeStr}</div>
                <div className="text-blue-400 truncate" title={src}>{src}</div>
                <div className="text-purple-400 truncate" title={dst}>{dst}</div>
                <div className="text-terminal-green">{pkt.proto || '-'}</div>
                <div className="text-gray-400">{pkt.length || '-'}</div>
                <div className="text-gray-300 truncate" title={pkt.summary}>
                  {pkt.summary || 'Packet'}
                  {isMarked && <span className="ml-1 text-yellow-400">✓</span>}
                  {pkt.evidence && <span className="ml-1 text-red-400">⚠</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
