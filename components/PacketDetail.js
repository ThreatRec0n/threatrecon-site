import React, { useState, useMemo } from 'react';

export default function PacketDetail({ packet, onMarkAsEvidence, markedPacketIds, tcpStreams }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!packet) {
    return (
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex items-center justify-center h-full card-glow">
        <div className="text-center text-gray-500 text-xs font-mono">
          Select a packet to view details
        </div>
      </div>
    );
  }

  const isMarked = markedPacketIds.includes(packet.id);
  const streamKey = packet.fiveTupleKey || (packet.layers?.tcp || packet.layers?.udp ? `${packet.layers.ip?.srcIp}:${packet.layers.tcp?.srcPort || packet.layers.udp?.srcPort} -> ${packet.layers.ip?.dstIp}:${packet.layers.tcp?.dstPort || packet.layers.udp?.dstPort}` : null);
  const stream = streamKey ? tcpStreams[streamKey] : null;

  // Render Summary Tab
  const renderSummary = () => (
    <div className="space-y-3">
      {/* Protocol Stack */}
      <div className="bg-gray-950 border border-gray-800 rounded p-3">
        <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Protocol Stack</div>
        <div className="flex flex-col gap-1 text-[10px] font-mono">
          {packet.layers?.eth && <div className="text-gray-300">→ Ethernet II</div>}
          {packet.layers?.ip && <div className="text-gray-300">→ Internet Protocol Version 4</div>}
          {packet.layers?.tcp && <div className="text-gray-300">→ Transmission Control Protocol</div>}
          {packet.layers?.udp && <div className="text-gray-300">→ User Datagram Protocol</div>}
          {packet.layers?.http && <div className="text-gray-300">→ Hypertext Transfer Protocol</div>}
          {packet.layers?.dns && <div className="text-gray-300">→ Domain Name System</div>}
        </div>
      </div>

      {/* Why This Packet Might Matter */}
      {packet.evidence && (
        <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded p-3">
          <div className="text-[10px] text-yellow-400 font-semibold mb-1 uppercase">⚠ Evidence Flagged</div>
          <div className="text-[9px] font-mono text-gray-300">
            Type: <span className="text-yellow-400">{packet.evidence.type}</span>
            {packet.evidence.filename && <div>File: <span className="text-terminal-green">{packet.evidence.filename}</span></div>}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-gray-500 mb-1">Packet ID</div>
          <div className="text-terminal-green">{packet.id}</div>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-gray-500 mb-1">Length</div>
          <div className="text-gray-300">{packet.length} bytes</div>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-gray-500 mb-1">Timestamp</div>
          <div className="text-gray-300">
            {typeof packet.ts === 'string' ? new Date(packet.ts).toLocaleString() : new Date(packet.ts).toLocaleString()}
          </div>
        </div>
        {stream && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-gray-500 mb-1">Stream Packets</div>
            <div className="text-gray-300">{stream.packets.length}</div>
          </div>
        )}
      </div>
    </div>
  );

  // Render Headers Tab (Tree-style)
  const renderHeaders = () => (
    <div className="space-y-2 font-mono text-[10px]">
      {/* Ethernet */}
      {packet.layers?.eth && (
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1">Ethernet II</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Destination: <span className="text-blue-400">{packet.layers.eth.dstMac}</span></div>
            <div>Source: <span className="text-purple-400">{packet.layers.eth.srcMac}</span></div>
            <div>Type: <span className="text-gray-400">0x{packet.layers.eth.etherType.toString(16)}</span></div>
          </div>
        </div>
      )}

      {/* IP */}
      {packet.layers?.ip && (
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1">Internet Protocol Version 4</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Version: <span className="text-blue-400">{packet.layers.ip.version}</span></div>
            <div>Source IP: <span className="text-blue-400">{packet.layers.ip.srcIp}</span></div>
            <div>Destination IP: <span className="text-purple-400">{packet.layers.ip.dstIp}</span></div>
            <div>Protocol: <span className="text-terminal-green">{packet.layers.ip.protocolName} ({packet.layers.ip.protocol})</span></div>
          </div>
        </div>
      )}

      {/* TCP */}
      {packet.layers?.tcp && (
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1">Transmission Control Protocol</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Source Port: <span className="text-blue-400">{packet.layers.tcp.srcPort}</span></div>
            <div>Destination Port: <span className="text-purple-400">{packet.layers.tcp.dstPort}</span></div>
            <div>Source: <span className="text-blue-400">{packet.layers.tcp.src}</span></div>
            <div>Destination: <span className="text-purple-400">{packet.layers.tcp.dst}</span></div>
            {packet.layers.tcp.flags && <div>Flags: <span className="text-yellow-400">{packet.layers.tcp.flags}</span></div>}
          </div>
        </div>
      )}

      {/* UDP */}
      {packet.layers?.udp && (
        <div className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1">User Datagram Protocol</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Source Port: <span className="text-blue-400">{packet.layers.udp.srcPort}</span></div>
            <div>Destination Port: <span className="text-purple-400">{packet.layers.udp.dstPort}</span></div>
            <div>Source: <span className="text-blue-400">{packet.layers.udp.src}</span></div>
            <div>Destination: <span className="text-purple-400">{packet.layers.udp.dst}</span></div>
          </div>
        </div>
      )}

      {/* HTTP */}
      {packet.layers?.http && (
        <div className="bg-gray-950 border border-yellow-600 rounded p-2">
          <div className="text-yellow-400 font-semibold mb-1">Hypertext Transfer Protocol</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Method: <span className="text-yellow-400">{packet.layers.http.method}</span></div>
            <div>URL: <span className="text-terminal-green">{packet.layers.http.url}</span></div>
            {packet.layers.http.host && <div>Host: <span className="text-terminal-green">{packet.layers.http.host}</span></div>}
            {packet.layers.http.userAgent && <div>User-Agent: <span className="text-gray-400 text-[9px]">{packet.layers.http.userAgent}</span></div>}
            {packet.layers.http.summary && (
              <div className="mt-2 p-1 bg-gray-900 rounded text-gray-400 break-all text-[9px]">
                {packet.layers.http.summary}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DNS */}
      {packet.layers?.dns && (
        <div className="bg-gray-950 border border-blue-600 rounded p-2">
          <div className="text-blue-400 font-semibold mb-1">Domain Name System</div>
          <div className="ml-3 space-y-0.5 text-gray-300">
            <div>Query: <span className="text-terminal-green">{packet.layers.dns.query}</span></div>
            {packet.layers.dns.summary && <div className="text-gray-400 text-[9px]">{packet.layers.dns.summary}</div>}
          </div>
        </div>
      )}
    </div>
  );

  // Render Hex/ASCII Tab
  const renderHex = () => {
    const bytes = packet.raw || [];
    if (bytes.length === 0) {
      return <div className="text-gray-500 text-xs font-mono text-center py-8">No raw data available</div>;
    }

    const rows = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const row = bytes.slice(i, i + 16);
      const hex = row.map(b => b.toString(16).padStart(2, '0')).join(' ');
      const ascii = row.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
      const offset = i.toString(16).padStart(8, '0').toUpperCase();
      rows.push({ offset, hex, ascii, row });
    }

    // Highlight suspicious patterns
    const highlightSuspicious = (text) => {
      const patterns = [
        /password/i, /username/i, /login/i, /auth/i,
        /[A-Za-z0-9+\/]{50,}/, // Base64
        /\.(exe|dll|bat|ps1)/i, // File extensions
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return true;
        }
      }
      return false;
    };

    return (
      <div className="font-mono text-[9px] space-y-0.5">
        <div className="grid grid-cols-[90px_1fr_90px] gap-3 text-gray-400 mb-2 pb-2 border-b border-gray-800 sticky top-0 bg-gray-950">
          <div>Offset</div>
          <div>Hex</div>
          <div>ASCII</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto space-y-0.5">
          {rows.map((r, idx) => {
            const isSuspicious = highlightSuspicious(r.ascii);
            return (
              <div key={idx} className={`grid grid-cols-[90px_1fr_90px] gap-3 hover:bg-gray-800/50 rounded px-1 py-0.5 ${isSuspicious ? 'bg-yellow-900/20 border-l border-yellow-500' : ''}`}>
                <div className="text-gray-500">{r.offset}</div>
                <div className="text-terminal-green break-all">{r.hex}</div>
                <div className={`text-gray-400 ${isSuspicious ? 'text-yellow-400 font-semibold' : ''}`}>{r.ascii}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Stream Tab
  const renderStream = () => {
    if (!stream) {
      return (
        <div className="text-center py-8 text-gray-500 text-xs font-mono">
          {packet.layers?.tcp || packet.layers?.udp 
            ? 'Stream reconstruction not available for this packet' 
            : 'Not a TCP/UDP packet'}
        </div>
      );
    }

    const streamText = stream.fullAscii || '';
    const streamLength = streamText.length;
    const maxLength = 8192;

    // Analyze stream
    const findings = [];
    if (streamText.toLowerCase().includes('password') || streamText.toLowerCase().includes('username')) {
      findings.push('Potential credential leak detected');
    }
    if (streamText.includes('multipart/form-data') || streamText.includes('Content-Disposition')) {
      findings.push('File transfer detected');
    }
    if (streamText.length > 1000) {
      findings.push('Large data transfer');
    }

    return (
      <div className="space-y-3">
        {findings.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded p-2">
            <div className="text-[10px] text-yellow-400 font-semibold mb-1">Stream Analysis</div>
            {findings.map((f, i) => (
              <div key={i} className="text-[9px] font-mono text-gray-300">• {f}</div>
            ))}
          </div>
        )}
        <div className="bg-gray-950 border border-gray-800 rounded p-3">
          <div className="text-[10px] text-gray-400 font-mono mb-2">
            Stream: {stream.packets.length} packets, {streamLength > maxLength ? `${maxLength}+` : streamLength} bytes
          </div>
          <div className="font-mono text-[10px] bg-black/60 border border-gray-800 rounded p-3 max-h-[500px] overflow-y-auto whitespace-pre-wrap break-all text-gray-300">
            {streamLength > maxLength 
              ? streamText.substring(0, maxLength) + '\n\n[... stream truncated ...]'
              : streamText || '[No readable text in stream]'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold">
          <span className="h-2 w-2 rounded-full bg-purple-400 shadow-neon-blue"></span>
          Packet Details
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4">
        {['summary', 'headers', 'hex', 'stream'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-[10px] font-mono transition-all border-b-2 ${
              activeTab === tab
                ? 'border-terminal-green text-terminal-green'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'headers' && renderHeaders()}
        {activeTab === 'hex' && renderHex()}
        {activeTab === 'stream' && renderStream()}
      </div>

      {/* Mark as Evidence Button */}
      <div className="px-4 pb-4 border-t border-gray-800 pt-3">
        <button
          onClick={() => onMarkAsEvidence(packet.id)}
          className={`w-full rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-300 ${
            isMarked
              ? 'bg-yellow-600/40 border-2 border-yellow-500 text-yellow-200'
              : 'bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500 text-yellow-300'
          }`}
        >
          {isMarked ? '✓ MARKED AS EVIDENCE' : 'MARK AS EVIDENCE'}
        </button>
      </div>
    </div>
  );
}
