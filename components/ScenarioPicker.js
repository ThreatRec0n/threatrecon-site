import React from 'react';
import { SCENARIOS } from '../lib/scenario-catalog';

export default function ScenarioPicker({ scenarioId, difficulty, packetCount, onChange, onNewRound, isDisabled }) {
  const scenarioOptions = Object.entries(SCENARIOS).map(([id, meta]) => ({ id, label: meta.label }));

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-gray-400">Scenario:</span>
        <select
          disabled={isDisabled}
          value={scenarioId}
          onChange={(e)=>onChange({ scenarioId: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-terminal-green font-mono"
        >
          {scenarioOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-gray-400">Difficulty:</span>
        <select
          disabled={isDisabled}
          value={difficulty}
          onChange={(e)=>onChange({ difficulty: e.target.value })}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-terminal-green font-mono"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-gray-400">Packets:</span>
        <select
          disabled={isDisabled}
          value={packetCount}
          onChange={(e)=>onChange({ packetCount: parseInt(e.target.value,10) })}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-terminal-green font-mono"
        >
          {[25,30,35,40,45,50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <button
        onClick={onNewRound}
        disabled={isDisabled}
        className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg border border-red-400 px-3 py-1.5 font-mono"
      >
        NEW ROUND
      </button>
    </div>
  );
}


