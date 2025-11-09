'use client';

import { useMemo } from 'react';
import type { SimulatedEvent, AttackChain } from '@/lib/simulation-engine/types';
import { MITRE_TECHNIQUES } from '@/lib/mitre';

interface Props {
  events: SimulatedEvent[];
  attackChains: AttackChain[];
  detectedTechniques?: string[]; // Techniques that were detected by user
}

// MITRE ATT&CK Tactics in order
const TACTICS = [
  { id: 'initial-access', name: 'Initial Access', color: 'bg-red-500' },
  { id: 'execution', name: 'Execution', color: 'bg-orange-500' },
  { id: 'persistence', name: 'Persistence', color: 'bg-yellow-500' },
  { id: 'privilege-escalation', name: 'Privilege Escalation', color: 'bg-green-500' },
  { id: 'defense-evasion', name: 'Defense Evasion', color: 'bg-blue-500' },
  { id: 'credential-access', name: 'Credential Access', color: 'bg-purple-500' },
  { id: 'discovery', name: 'Discovery', color: 'bg-pink-500' },
  { id: 'lateral-movement', name: 'Lateral Movement', color: 'bg-indigo-500' },
  { id: 'collection', name: 'Collection', color: 'bg-teal-500' },
  { id: 'command-and-control', name: 'Command and Control', color: 'bg-cyan-500' },
  { id: 'exfiltration', name: 'Exfiltration', color: 'bg-amber-500' },
  { id: 'impact', name: 'Impact', color: 'bg-red-600' },
];

export default function MitreNavigator({ events, attackChains, detectedTechniques = [] }: Props) {
  // Extract all techniques from events and attack chains
  const techniqueMap = useMemo(() => {
    const map = new Map<string, {
      technique_id: string;
      tactic: string;
      count: number;
      detected: boolean;
      stages: string[];
    }>();

    // From events
    events.forEach(event => {
      if (event.technique_id) {
        const existing = map.get(event.technique_id) || {
          technique_id: event.technique_id,
          tactic: event.stage,
          count: 0,
          detected: false,
          stages: [],
        };
        existing.count++;
        if (!existing.stages.includes(event.stage)) {
          existing.stages.push(event.stage);
        }
        map.set(event.technique_id, existing);
      }
    });

    // From attack chains
    attackChains.forEach(chain => {
      chain.stages.forEach(stage => {
        if (stage.technique_id) {
          const existing = map.get(stage.technique_id) || {
            technique_id: stage.technique_id,
            tactic: stage.stage,
            count: 0,
            detected: false,
            stages: [],
          };
          existing.count++;
          if (!existing.stages.includes(stage.stage)) {
            existing.stages.push(stage.stage);
          }
          map.set(stage.technique_id, existing);
        }
      });
    });

    // Mark detected techniques
    detectedTechniques.forEach(techId => {
      const existing = map.get(techId);
      if (existing) {
        existing.detected = true;
      }
    });

    return map;
  }, [events, attackChains, detectedTechniques]);

  // Group techniques by tactic
  const techniquesByTactic = useMemo(() => {
    const grouped: Record<string, Array<typeof techniqueMap extends Map<string, infer V> ? V : never>> = {};
    
    TACTICS.forEach(tactic => {
      grouped[tactic.id] = [];
    });

    techniqueMap.forEach((tech, techId) => {
      // Find tactic from technique info or stage
      const mitreTech = MITRE_TECHNIQUES[techId];
      const tactic = mitreTech?.tactic.toLowerCase() || tech.tactic;
      
      // Map to our tactic IDs
      const tacticId = TACTICS.find(t => 
        tactic.includes(t.id.replace('-', ' ')) || 
        t.name.toLowerCase().includes(tactic.split(',')[0].trim().toLowerCase())
      )?.id || tech.tactic;

      if (!grouped[tacticId]) {
        grouped[tacticId] = [];
      }
      grouped[tacticId].push(tech);
    });

    return grouped;
  }, [techniqueMap]);

  const getTechniqueColor = (detected: boolean, count: number) => {
    if (detected) {
      return 'bg-green-600 border-green-500';
    }
    if (count >= 5) {
      return 'bg-red-600 border-red-500';
    }
    if (count >= 2) {
      return 'bg-orange-600 border-orange-500';
    }
    return 'bg-gray-700 border-gray-600';
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#c9d1d9]">MITRE ATT&CK Navigator</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 border border-green-500 rounded"></div>
            <span className="text-[#8b949e]">Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 border border-red-500 rounded"></div>
            <span className="text-[#8b949e]">High Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
            <span className="text-[#8b949e]">Observed</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
        {TACTICS.map(tactic => {
          const techniques = techniquesByTactic[tactic.id] || [];
          if (techniques.length === 0) return null;

          return (
            <div key={tactic.id} className="border border-[#30363d] rounded p-3 bg-[#0d1117]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded ${tactic.color}`}></div>
                <h3 className="text-sm font-semibold text-[#c9d1d9]">{tactic.name}</h3>
                <span className="text-xs text-[#8b949e]">({techniques.length})</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {techniques.map(tech => {
                  const mitreTech = MITRE_TECHNIQUES[tech.technique_id];
                  return (
                    <div
                      key={tech.technique_id}
                      className={`px-3 py-1.5 rounded border text-xs cursor-pointer transition-all hover:scale-105 ${getTechniqueColor(tech.detected, tech.count)}`}
                      title={`${mitreTech?.name || tech.technique_id} - ${tech.count} events${tech.detected ? ' (Detected)' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white">
                          {tech.technique_id}
                        </span>
                        {tech.detected && (
                          <span className="text-green-300">✓</span>
                        )}
                        <span className="text-white/70">
                          ({tech.count})
                        </span>
                      </div>
                      {mitreTech && (
                        <div className="text-white/80 text-xs mt-0.5">
                          {mitreTech.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="pt-3 border-t border-[#30363d]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[#8b949e]">Total Techniques</div>
            <div className="text-[#c9d1d9] font-semibold">{techniqueMap.size}</div>
          </div>
          <div>
            <div className="text-[#8b949e]">Detected</div>
            <div className="text-green-400 font-semibold">
              {Array.from(techniqueMap.values()).filter(t => t.detected).length}
            </div>
          </div>
          <div>
            <div className="text-[#8b949e]">Coverage</div>
            <div className="text-[#c9d1d9] font-semibold">
              {techniqueMap.size > 0 
                ? Math.round((Array.from(techniqueMap.values()).filter(t => t.detected).length / techniqueMap.size) * 100)
                : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

