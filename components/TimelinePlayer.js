import React from 'react';

export default function TimelinePlayer({ packets = [], onTick, autoOpen = false }) {
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const timerRef = React.useRef(null);
  const idxRef = React.useRef(0);

  const stop = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } setPlaying(false); };

  const step = () => {
    if (idxRef.current >= packets.length) { stop(); return; }
    const cur = packets[idxRef.current];
    const next = packets[idxRef.current + 1];
    onTick && onTick(cur);
    idxRef.current += 1;
    if (!next) { stop(); return; }
    const delay = Math.max(20, ((next.timeEpochMs - cur.timeEpochMs) / speed));
    timerRef.current = setTimeout(step, delay);
  };

  const play = () => {
    if (playing || packets.length === 0) return;
    setPlaying(true);
    idxRef.current = 0;
    step();
  };

  const pause = () => stop();

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-2 flex items-center gap-2">
      <button onClick={playing ? pause : play} className="px-2 py-1 text-[11px] font-mono rounded border border-gray-700 text-gray-200 hover:bg-gray-800">{playing ? 'Pause' : 'Play'}</button>
      <div className="text-[10px] text-gray-400 font-mono">Speed</div>
      <input type="range" min="0.25" max="4" step="0.25" value={speed} onChange={(e)=>setSpeed(parseFloat(e.target.value))} />
      <div className="text-[10px] text-gray-400 font-mono">{speed}x</div>
    </div>
  );
}


