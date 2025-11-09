'use client';

import { useState } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/types';
import DetectionRuleBuilder, { type DetectionRule } from '@/components/DetectionRuleBuilder';

interface Props {
  events: SimulatedEvent[];
  onExecuteAttack: (techniqueId: string) => void;
  onTestDetection: (rule: DetectionRule) => void;
}

type Mode = 'attack' | 'defend';

export default function PurpleTeamMode({ events, onExecuteAttack, onTestDetection }: Props) {
  const [mode, setMode] = useState<Mode>('defend');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('');
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [savedRules, setSavedRules] = useState<DetectionRule[]>([]);

  const availableTechniques = [
    { id: 'T1059.001', name: 'PowerShell Execution' },
    { id: 'T1003', name: 'OS Credential Dumping' },
    { id: 'T1071.001', name: 'Web Protocols C2' },
    { id: 'T1021.002', name: 'SMB Lateral Movement' },
    { id: 'T1048', name: 'Exfiltration Over HTTP' },
    { id: 'T1566.001', name: 'Phishing Attachment' },
  ];

  const handleExecuteAttack = async () => {
    if (selectedTechnique) {
      try {
        // Call API to execute attack technique
        const response = await fetch('/api/simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute_attack',
            config: {
              technique_id: selectedTechnique,
            },
          }),
        });

        const data = await response.json();
        if (data.success && data.events) {
          onExecuteAttack(selectedTechnique);
          setSelectedTechnique('');
          // Events are returned, parent component should handle updating
          alert(`Attack technique ${selectedTechnique} executed successfully! ${data.events.length} events generated.`);
        } else {
          alert(`Failed to execute attack: ${data.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        alert(`Error executing attack: ${err.message}`);
      }
    }
  };

  const handleSaveRule = (rule: DetectionRule) => {
    setSavedRules(prev => [...prev, rule]);
    setShowRuleBuilder(false);
  };

  const handleTestRule = (rule: DetectionRule) => {
    onTestDetection(rule);
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#c9d1d9]">Purple Team Mode</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('attack')}
            className={`px-4 py-2 rounded border transition-colors ${
              mode === 'attack'
                ? 'bg-red-900/40 text-red-400 border-red-800/60'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-red-800/60'
            }`}
          >
            🔴 Attack Mode
          </button>
          <button
            onClick={() => setMode('defend')}
            className={`px-4 py-2 rounded border transition-colors ${
              mode === 'defend'
                ? 'bg-blue-900/40 text-blue-400 border-blue-800/60'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-blue-800/60'
            }`}
          >
            🛡️ Defend Mode
          </button>
        </div>
      </div>

      <div className="text-sm text-[#8b949e]">
        Purple teaming combines red team (attack) and blue team (defense) activities. 
        In <strong className="text-red-400">Attack Mode</strong>, execute attack techniques and observe the logs. 
        In <strong className="text-blue-400">Defend Mode</strong>, write detection rules to catch those attacks.
      </div>

      {mode === 'attack' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Execute Attack Technique</h3>
            <p className="text-xs text-[#8b949e] mb-3">
              Select a MITRE ATT&CK technique to execute. This will generate attack logs that you can then detect.
            </p>
            <div className="space-y-2">
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="search-input w-full"
              >
                <option value="">Select a technique...</option>
                {availableTechniques.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.id} - {tech.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExecuteAttack}
                disabled={!selectedTechnique}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Execute Attack Technique
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#30363d]">
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Recent Attack Executions</h3>
            <div className="text-xs text-[#8b949e]">
              Attack techniques will appear in the log explorer after execution. Switch to Defend Mode to write detection rules.
            </div>
          </div>
        </div>
      )}

      {mode === 'defend' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Detection Rules</h3>
            <button
              onClick={() => setShowRuleBuilder(!showRuleBuilder)}
              className="btn-secondary text-sm"
            >
              {showRuleBuilder ? 'Hide' : 'New Rule'}
            </button>
          </div>

          {showRuleBuilder && (
            <div className="border border-[#30363d] rounded p-4 bg-[#0d1117]">
              <DetectionRuleBuilder
                onSave={handleSaveRule}
                onTest={handleTestRule}
              />
            </div>
          )}

          {savedRules.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#8b949e]">Saved Detection Rules</h4>
              {savedRules.map(rule => (
                <div key={rule.id} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-[#c9d1d9]">{rule.name}</div>
                      <div className="text-xs text-[#8b949e]">{rule.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${
                        rule.severity === 'critical' ? 'bg-red-900/40 text-red-400 border-red-800/60' :
                        rule.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border-orange-800/60' :
                        rule.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60' :
                        'bg-blue-900/40 text-blue-400 border-blue-800/60'
                      }`}>
                        {rule.severity}
                      </span>
                      <button
                        onClick={() => handleTestRule(rule)}
                        className="text-xs text-[#58a6ff] hover:underline"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                  {rule.mitreTechniques.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rule.mitreTechniques.map(tech => (
                        <span key={tech} className="px-2 py-0.5 text-xs bg-[#161b22] rounded text-[#58a6ff] font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {rule.testResults && (
                    <div className="mt-2 text-xs text-[#8b949e]">
                      Test: {rule.testResults.matches} matches, {rule.testResults.falsePositives} false positives
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

