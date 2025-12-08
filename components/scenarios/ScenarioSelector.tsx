'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { ATTACK_SCENARIOS, type AttackScenario } from '@/lib/scenarios/scenario-engine';
import ScenarioBriefing from './ScenarioBriefing';

interface Props {
  onSelectScenario: (scenario: AttackScenario) => void;
  currentDifficulty?: string;
}

export default function ScenarioSelector({ onSelectScenario, currentDifficulty }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterAPT, setFilterAPT] = useState<string>('all');

  const filteredScenarios = ATTACK_SCENARIOS.filter(s => {
    if (filterDifficulty !== 'all' && s.difficulty !== filterDifficulty) return false;
    if (filterAPT !== 'all' && s.aptGroup !== filterAPT) return false;
    return true;
  });

  const aptGroups = Array.from(new Set(ATTACK_SCENARIOS.map(s => s.aptGroup).filter(Boolean)));

  const handleStart = () => {
    if (selectedScenario) {
      onSelectScenario(selectedScenario);
      setShowBriefing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-6xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Select Attack Scenario</h1>
              <p className="text-gray-400">Choose a realistic attack scenario to investigate</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              {aptGroups.length > 0 && (
                <select
                  value={filterAPT}
                  onChange={(e) => setFilterAPT(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                >
                  <option value="all">All APT Groups</option>
                  {aptGroups.map(apt => (
                    <option key={apt} value={apt}>{apt}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-blue-600 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedScenario(scenario);
                  setShowBriefing(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-white">{scenario.name}</h3>
                  {scenario.aptGroup && (
                    <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-semibold">
                      {scenario.aptGroup.split(' ')[0]}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-300 mb-4 line-clamp-2">{scenario.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Difficulty:</span>
                    <span className={`font-semibold ${
                      scenario.difficulty === 'Beginner' ? 'text-green-400' :
                      scenario.difficulty === 'Intermediate' ? 'text-blue-400' :
                      scenario.difficulty === 'Advanced' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Duration:</span>
                    <span className="text-white">{scenario.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Techniques:</span>
                    <span className="text-white">{scenario.techniques.length}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {scenario.techniques.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                  {scenario.techniques.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-400 text-xs">
                      +{scenario.techniques.length - 3}
                    </span>
                  )}
                </div>

                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>

          {filteredScenarios.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No scenarios match your filters
            </div>
          )}
        </div>
      </div>

      <ScenarioBriefing
        scenario={selectedScenario}
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
        onStart={handleStart}
      />
    </>
  );
}

