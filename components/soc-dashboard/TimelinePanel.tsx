'use client';

import { useMemo } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';

interface Props {
  stages: string[];
  events: SimulatedEvent[];
  selectedStage: string | null;
  onStageSelect: (stage: string | null) => void;
}

const STAGE_ORDER: Record<string, number> = {
  'initial-access': 1,
  'execution': 2,
  'persistence': 3,
  'privilege-escalation': 4,
  'defense-evasion': 5,
  'credential-access': 6,
  'discovery': 7,
  'lateral-movement': 8,
  'collection': 9,
  'command-and-control': 10,
  'exfiltration': 11,
  'impact': 12,
};

const STAGE_LABELS: Record<string, string> = {
  'initial-access': 'Initial Access',
  'execution': 'Execution',
  'persistence': 'Persistence',
  'privilege-escalation': 'Privilege Escalation',
  'defense-evasion': 'Defense Evasion',
  'credential-access': 'Credential Access',
  'discovery': 'Discovery',
  'lateral-movement': 'Lateral Movement',
  'collection': 'Collection',
  'command-and-control': 'Command & Control',
  'exfiltration': 'Exfiltration',
  'impact': 'Impact',
};

export default function TimelinePanel({ stages, events, selectedStage, onStageSelect }: Props) {
  // Sort stages by MITRE ATT&CK order
  const sortedStages = useMemo(() => {
    return [...stages].sort((a, b) => {
      const orderA = STAGE_ORDER[a] || 999;
      const orderB = STAGE_ORDER[b] || 999;
      return orderA - orderB;
    });
  }, [stages]);

  // Count events per stage
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stages.forEach(stage => {
      counts[stage] = events.filter(e => e.stage === stage).length;
    });
    return counts;
  }, [stages, events]);

  // Get high-threat events per stage
  const highThreatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stages.forEach(stage => {
      counts[stage] = events.filter(e => e.stage === stage && (e.threat_score || 0) >= 70).length;
    });
    return counts;
  }, [stages, events]);

  const getStageColor = (stage: string) => {
    if (selectedStage === stage) return 'bg-[#58a6ff] text-[#0d1117]';
    if (highThreatCounts[stage] > 0) return 'bg-red-900/40 text-red-400 border-red-800/60';
    return 'bg-[#161b22] text-[#c9d1d9] border-[#30363d]';
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#c9d1d9]">Attack Timeline</h2>
        <button
          onClick={() => onStageSelect(null)}
          className="text-xs text-[#8b949e] hover:text-[#c9d1d9]"
        >
          Clear Filter
        </button>
      </div>

      <div className="space-y-2">
        {sortedStages.length === 0 && (
          <p className="text-center text-[#8b949e] py-8 text-sm">No attack stages detected yet.</p>
        )}
        
        {sortedStages.map((stage, index) => {
          const eventCount = stageCounts[stage] || 0;
          const highThreatCount = highThreatCounts[stage] || 0;
          const isSelected = selectedStage === stage;

          return (
            <div key={stage} className="relative">
              {/* Timeline Line */}
              {index < sortedStages.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-full bg-[#30363d] z-0" />
              )}

              {/* Stage Node */}
              <div className="relative z-10">
                <button
                  onClick={() => onStageSelect(isSelected ? null : stage)}
                  className={`w-full p-3 rounded border transition-all text-left ${
                    isSelected ? 'ring-2 ring-[#58a6ff]' : ''
                  } ${getStageColor(stage)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Timeline Dot */}
                      <div className={`w-3 h-3 rounded-full ${
                        isSelected 
                          ? 'bg-[#0d1117] ring-2 ring-[#58a6ff]' 
                          : highThreatCount > 0 
                            ? 'bg-red-400' 
                            : 'bg-[#58a6ff]'
                      }`} />

                      <div>
                        <div className="font-semibold text-sm">
                          {STAGE_LABELS[stage] || stage}
                        </div>
                        <div className="text-xs opacity-75 mt-0.5">
                          {eventCount} event{eventCount !== 1 ? 's' : ''}
                          {highThreatCount > 0 && (
                            <span className="ml-1">
                              • <span className="text-red-400">{highThreatCount} high-threat</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="text-xs opacity-75">✓ Selected</div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Summary */}
      <div className="pt-4 border-t border-[#30363d]">
        <div className="text-xs text-[#8b949e] space-y-1">
          <div className="flex justify-between">
            <span>Total Stages:</span>
            <span className="text-[#c9d1d9] font-semibold">{sortedStages.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Events:</span>
            <span className="text-[#c9d1d9] font-semibold">{events.length}</span>
          </div>
          <div className="flex justify-between">
            <span>High-Threat Events:</span>
            <span className="text-red-400 font-semibold">
              {events.filter(e => (e.threat_score || 0) >= 70).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

