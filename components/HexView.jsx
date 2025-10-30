import React from 'react';
import { hexDump } from '../utils/hex';

export default function HexView({ raw }) {
  const arr = raw instanceof Uint8Array ? raw : (Array.isArray(raw) ? Uint8Array.from(raw) : new Uint8Array());
  const rows = hexDump(arr);
  return (
    <div className="hex-view mt-3 border border-gray-800 rounded bg-black/40">
      <div className="text-xs font-mono text-gray-400 px-3 py-2 border-b border-gray-800">Hex + ASCII</div>
      <div className="max-h-[320px] overflow-y-auto font-mono text-[11px]">
        {rows.map(r => (
          <div key={r.offset} className="grid grid-cols-[90px_1fr_120px] gap-3 px-3 py-0.5 hover:bg-gray-800/40">
            <div className="text-gray-500">{r.offset.toString(16).padStart(8,'0')}</div>
            <div className="text-terminal-green break-all">{r.hex}</div>
            <div className="text-gray-300">{r.ascii}</div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-gray-500 py-6 text-xs">No raw bytes</div>
        )}
      </div>
    </div>
  );
}


