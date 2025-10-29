import React, { useState } from 'react';

export default function PacketDetail({ packet, onMarkAsEvidence }) {
  const [viewMode, setViewMode] = useState('decoded'); // decoded, hex, ascii

  if (!packet) {
    return (
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex items-center justify-center h-full card-glow">
        <div className="text-center text-gray-500 text-xs font-mono">
          Select a packet to view details
        </div>
      </div>
    );
  }

  const renderDecoded = () => {
    return (
      <div className="space-y-3">
        {/* Ethernet Layer */}
        {packet.ethernet && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">Ethernet</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Source MAC: <span className="text-blue-400">{packet.ethernet.srcMac}</span></div>
              <div>Dest MAC: <span className="text-purple-400">{packet.ethernet.dstMac}</span></div>
              <div>Type: <span className="text-gray-400">0x{packet.ethernet.etherType.toString(16)}</span></div>
            </div>
          </div>
        )}

        {/* IP Layer */}
        {packet.ip && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">Internet Protocol</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Version: <span className="text-blue-400">{packet.ip.version}</span></div>
              <div>Source IP: <span className="text-blue-400">{packet.ip.srcIp}</span></div>
              <div>Dest IP: <span className="text-purple-400">{packet.ip.dstIp}</span></div>
              <div>Protocol: <span className="text-terminal-green">{packet.ip.protocolName} ({packet.ip.protocol})</span></div>
            </div>
          </div>
        )}

        {/* TCP Layer */}
        {packet.tcp && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">Transmission Control Protocol</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Source Port: <span className="text-blue-400">{packet.tcp.srcPort}</span></div>
              <div>Dest Port: <span className="text-purple-400">{packet.tcp.dstPort}</span></div>
              <div>Source: <span className="text-blue-400">{packet.tcp.src}</span></div>
              <div>Destination: <span className="text-purple-400">{packet.tcp.dst}</span></div>
            </div>
          </div>
        )}

        {/* UDP Layer */}
        {packet.udp && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">User Datagram Protocol</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Source Port: <span className="text-blue-400">{packet.udp.srcPort}</span></div>
              <div>Dest Port: <span className="text-purple-400">{packet.udp.dstPort}</span></div>
              <div>Source: <span className="text-blue-400">{packet.udp.src}</span></div>
              <div>Destination: <span className="text-purple-400">{packet.udp.dst}</span></div>
            </div>
          </div>
        )}

        {/* HTTP Layer */}
        {packet.http && (
          <div className="bg-gray-950 border border-yellow-600 rounded p-2">
            <div className="text-[10px] text-yellow-400 font-semibold mb-1">Hypertext Transfer Protocol</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Method: <span className="text-yellow-400">{packet.http.method}</span></div>
              <div>URL: <span className="text-terminal-green">{packet.http.url}</span></div>
              {packet.http.summary && (
                <div className="mt-2 p-1 bg-gray-900 rounded text-gray-400 break-all">
                  {packet.http.summary}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DNS Layer */}
        {packet.dns && (
          <div className="bg-gray-950 border border-blue-600 rounded p-2">
            <div className="text-[10px] text-blue-400 font-semibold mb-1">Domain Name System</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-0.5">
              <div>Query: <span className="text-terminal-green">{packet.dns.query}</span></div>
              {packet.dns.summary && (
                <div className="mt-2 text-gray-400">{packet.dns.summary}</div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Marker */}
        {packet.evidence && (
          <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded p-2">
            <div className="text-[10px] text-yellow-400 font-semibold mb-1">⚠ EVIDENCE FLAG</div>
            <div className="text-[9px] font-mono text-gray-300">
              Type: <span className="text-yellow-400">{packet.evidence.type}</span>
            </div>
          </div>
        )}

        {/* Payload Preview */}
        {packet.payload && packet.payload.length > 0 && (
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">Payload Preview</div>
            <div className="text-[9px] font-mono text-gray-400 max-h-32 overflow-y-auto">
              {new TextDecoder().decode(new Uint8Array(packet.payload.slice(0, 200))) || '[Binary data]'}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHex = () => {
    const bytes = packet.raw || [];
    const rows = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const row = bytes.slice(i, i + 16);
      const hex = row.map(b => b.toString(16).padStart(2, '0')).join(' ');
      const ascii = row.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
      const offset = i.toString(16).padStart(8, '0');
      rows.push({ offset, hex, ascii, row });
    }

    return (
      <div className="font-mono text-[9px] space-y-1">
        <div className="grid grid-cols-[80px_1fr_80px] gap-2 text-gray-400 mb-2 pb-1 border-b border-gray-800">
          <div>Offset</div>
          <div>Hex</div>
          <div>ASCII</div>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-0.5">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[80px_1fr_80px] gap-2 hover:bg-gray-800/50 rounded px-1">
              <div className="text-gray-500">{r.offset}</div>
              <div className="text-terminal-green break-all">{r.hex}</div>
              <div className="text-gray-400">{r.ascii}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderASCII = () => {
    const bytes = packet.raw || [];
    const text = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    
    return (
      <div className="font-mono text-[10px] bg-gray-950 border border-gray-800 rounded p-3 max-h-[400px] overflow-y-auto whitespace-pre-wrap break-all text-gray-300">
        {text || '[Binary data - cannot display as text]'}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-purple-400 shadow-neon-blue"></span>
          Packet Details
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('decoded')}
            className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${
              viewMode === 'decoded'
                ? 'bg-terminal-green/20 border border-terminal-green text-terminal-green'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            Decoded
          </button>
          <button
            onClick={() => setViewMode('hex')}
            className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${
              viewMode === 'hex'
                ? 'bg-terminal-green/20 border border-terminal-green text-terminal-green'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            Hex
          </button>
          <button
            onClick={() => setViewMode('ascii')}
            className={`px-2 py-1 rounded text-[9px] font-mono transition-all ${
              viewMode === 'ascii'
                ? 'bg-terminal-green/20 border border-terminal-green text-terminal-green'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            ASCII
          </button>
        </div>
      </div>

      {/* Packet Info Header */}
      <div className="mb-3 p-2 bg-gray-950 border border-gray-800 rounded text-[9px] font-mono">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400">Packet ID:</span>
          <span className="text-terminal-green">{packet.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Timestamp:</span>
          <span className="text-gray-300">{new Date(packet.ts).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Length:</span>
          <span className="text-gray-300">{packet.length} bytes</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto mb-3">
        {viewMode === 'decoded' && renderDecoded()}
        {viewMode === 'hex' && renderHex()}
        {viewMode === 'ascii' && renderASCII()}
      </div>

      {/* Mark as Evidence Button */}
      <button
        onClick={() => onMarkAsEvidence(packet.id)}
        className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500 text-yellow-300 rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-300 hover:scale-105"
      >
        MARK AS EVIDENCE
      </button>
    </div>
  );
}

