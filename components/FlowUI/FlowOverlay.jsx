// components/FlowUI/FlowOverlay.jsx
import React, { useEffect, useState } from 'react';

export default function FlowOverlay({ engine, onClose }) {
  const [state, setState] = useState({ currentStage: null, allowedPickCount: 0, poolNos: [] });
  const [selected, setSelected] = useState([]);
  const [inspected, setInspected] = useState([]);

  useEffect(() => {
    const startInfo = engine.start();
    setState({ currentStage: startInfo.currentStage, allowedPickCount: startInfo.allowedPickCount, poolNos: startInfo.seedNos });
  }, [engine]);

  function onInspect(no) {
    const res = engine.inspectPacket(no);
    setInspected(prev => [...new Set([...prev, no])]);
    return res;
  }

  function onSelect(no) {
    const res = engine.selectPacket(no);
    if (res.ok) setSelected(res.selected);
    return res;
  }

  function onAdvance() {
    const res = engine.advanceStage();
    if (res.ok) {
      setState({ currentStage: res.currentStage, allowedPickCount: res.allowedPickCount, poolNos: res.poolNos });
      setSelected([]);
    }
    return res;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm">
      <div className="absolute top-4 right-4 left-4 bottom-4 bg-gray-900 border border-gray-700 rounded-xl p-4 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-mono text-terminal-green">Mode: Flow</div>
          <div className="text-xs font-mono text-gray-300">Stage {state.currentStage} • Pick up to {state.allowedPickCount}</div>
          <button onClick={onClose} className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-white font-mono border border-gray-700">Exit</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-mono text-gray-400 mb-2">Current pool</h4>
            <div className="grid grid-cols-5 gap-2">
              {state.poolNos.map(no => (
                <div key={no} className={`p-2 border rounded text-center text-xs font-mono ${selected.includes(no) ? 'border-terminal-green' : 'border-gray-700'} ${inspected.includes(no) ? 'bg-gray-800' : 'bg-gray-900'}`}>
                  <div className="mb-2">#{no}</div>
                  <div className="flex gap-2 justify-center">
                    <button className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded" onClick={() => onInspect(no)}>Inspect</button>
                    <button className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded" onClick={() => onSelect(no)}>Select</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono text-gray-400 mb-2">Actions</h4>
            <button onClick={onAdvance} className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white font-mono border border-red-400">Advance Stage</button>
          </div>
        </div>
      </div>
    </div>
  );
}


