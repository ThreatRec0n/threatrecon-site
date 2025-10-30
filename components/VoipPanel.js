import React from 'react';

// Minimal VoIP panel: lists SIP dialogs and RTP streams detected in current packets
export default function VoipPanel({ packets = [], onSelectPacket }) {
  const calls = React.useMemo(() => {
    const map = new Map();
    for (const p of packets) {
      const layers = p.layers || {};
      if (layers.sip && layers.sip.callId) {
        const id = layers.sip.callId;
        if (!map.has(id)) map.set(id, { callId: id, sip: [], rtp: new Set(), a: null, b: null });
        map.get(id).sip.push(p);
      }
      if (layers.rtp) {
        const key = `rtp-${layers.rtp.ssrc}`;
        if (!map.has(key)) map.set(key, { callId: key, sip: [], rtp: new Set(), a: null, b: null });
        map.get(key).rtp.add(p.id);
      }
    }
    return Array.from(map.values());
  }, [packets]);

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold">Calls</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {calls.length === 0 && (
          <div className="text-center text-gray-500 text-[11px] font-mono py-6">No calls detected</div>
        )}
        {calls.map((c) => (
          <div key={c.callId} className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[11px] font-mono text-terminal-green mb-1">{c.callId}</div>
            <div className="text-[10px] font-mono text-gray-400 mb-1">SIP messages: {c.sip.length} • RTP packets: {c.rtp.size}</div>
            <div className="flex flex-wrap gap-1">
              {c.sip.map(s => (
                <button key={s.id} onClick={()=>onSelectPacket && onSelectPacket(s.id)} className="px-2 py-0.5 text-[10px] rounded border border-gray-700 text-gray-300 hover:bg-gray-800">{s.layers.sip.method}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


