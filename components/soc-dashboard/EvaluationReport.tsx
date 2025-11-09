'use client';

import { useState } from 'react';
import type { EvaluationResult } from '@/lib/evaluation-engine';

interface Props {
  result: EvaluationResult;
  onClose: () => void;
  onNewInvestigation: () => void;
}

export default function EvaluationReport({ result, onClose, onNewInvestigation }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'missed' | 'replay' | 'recommendations'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
          <h2 className="text-2xl font-bold text-[#c9d1d9]">Investigation Evaluation Report</h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
          >
            ✕
          </button>
        </div>

        {/* Score Summary */}
        <div className="p-6 border-b border-[#30363d]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-[#8b949e] mb-1">Final Score</div>
              <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}/100
              </div>
              <div className={`text-lg font-semibold mt-1 ${getScoreColor(result.score)}`}>
                {getScoreLabel(result.score)}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-[#8b949e] mb-1">True Positives</div>
                <div className="text-2xl font-bold text-green-400">{result.breakdown.truePositives}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#8b949e] mb-1">False Positives</div>
                <div className="text-2xl font-bold text-orange-400">{result.breakdown.falsePositives}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#8b949e] mb-1">False Negatives</div>
                <div className="text-2xl font-bold text-red-400">{result.breakdown.falseNegatives}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#8b949e] mb-1">True Negatives</div>
                <div className="text-2xl font-bold text-blue-400">{result.breakdown.trueNegatives}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#30363d] px-6">
          {(['overview', 'missed', 'replay', 'recommendations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#58a6ff] text-[#58a6ff]'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Breakdown by Stage */}
              <div>
                <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Performance by Attack Stage</h3>
                <div className="space-y-3">
                  {Object.entries(result.byStage).map(([stage, stats]) => {
                    const detectionRate = stats.total > 0 ? (stats.detected / stats.total) * 100 : 0;
                    return (
                      <div key={stage} className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-[#c9d1d9]">
                              {stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-[#8b949e]">
                              {stats.detected} detected, {stats.missed} missed, {stats.falsePositives} false positives
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              detectionRate >= 80 ? 'text-green-400' :
                              detectionRate >= 50 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {Math.round(detectionRate)}%
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-[#161b22] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${
                              detectionRate >= 80 ? 'bg-green-500' :
                              detectionRate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${detectionRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'missed' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">
                Missed IOCs ({result.missedIOCs.length})
              </h3>
              
              {result.missedIOCs.length === 0 ? (
                <p className="text-[#8b949e] text-center py-8">No missed IOCs! Great job!</p>
              ) : (
                <div className="space-y-2">
                  {result.missedIOCs.map((ioc, idx) => {
                  const impactWeight = {
                    'credential-access': '🔴 Critical',
                    'command-and-control': '🟠 High',
                    'exfiltration': '🔴 Critical',
                    'impact': '🔴 Critical',
                    'lateral-movement': '🟠 High',
                  }[ioc.stage] || '🟡 Medium';
                  
                  return (
                    <div key={idx} className="bg-[#0d1117] p-4 rounded border border-red-800/40">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-mono text-[#c9d1d9] font-semibold">{ioc.ioc}</div>
                            <span className="text-xs px-2 py-0.5 rounded border border-red-800/60 bg-red-900/20 text-red-400">
                              {impactWeight}
                            </span>
                          </div>
                          <div className="text-xs text-[#8b949e] mt-1">
                            Type: {ioc.type} | Stage: {ioc.stage.replace('-', ' ')} | Technique: {ioc.technique_id || 'N/A'}
                          </div>
                          <div className="text-sm text-red-400 mt-2">{ioc.reason}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}

              {result.overFlaggedIOCs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">
                    Over-Flagged IOCs ({result.overFlaggedIOCs.length})
                  </h3>
                  <div className="space-y-2">
                    {result.overFlaggedIOCs.map((ioc, idx) => (
                      <div key={idx} className="bg-[#0d1117] p-4 rounded border border-orange-800/40">
                        <div className="font-mono text-[#c9d1d9] font-semibold">{ioc.ioc}</div>
                        <div className="text-xs text-[#8b949e] mt-1">
                          Type: {ioc.type} | Tagged as: {ioc.userTag}
                        </div>
                        <div className="text-sm text-orange-400 mt-2">{ioc.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'replay' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Red Team Replay</h3>
              <p className="text-sm text-[#8b949e] mb-4">
                Timeline of what the attacker actually did, and whether you detected it.
              </p>
              
              <div className="space-y-3">
                {result.redTeamReplay.map((action, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border ${
                      action.detected
                        ? 'bg-green-900/20 border-green-800/40'
                        : 'bg-red-900/20 border-red-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded border ${
                            action.detected
                              ? 'bg-green-900/40 text-green-400 border-green-800/60'
                              : 'bg-red-900/40 text-red-400 border-red-800/60'
                          }`}>
                            {action.detected ? '✓ Detected' : '✗ Missed'}
                          </span>
                          <span className="text-xs text-[#8b949e]">
                            {new Date(action.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-semibold text-[#c9d1d9] mb-1">
                          {action.technique_name} ({action.technique_id})
                        </div>
                        <div className="text-sm text-[#8b949e] mb-2">
                          Stage: {action.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-[#c9d1d9]">{action.description}</div>
                        {action.iocs.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-[#8b949e] mb-1">IOCs:</div>
                            <div className="flex flex-wrap gap-1">
                              {action.iocs.map((ioc, iocIdx) => (
                                <span
                                  key={iocIdx}
                                  className="px-2 py-1 text-xs bg-[#161b22] rounded border border-[#30363d] font-mono text-[#58a6ff]"
                                >
                                  {ioc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Recommendations</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                    <div className="flex items-start gap-3">
                      <span className="text-[#58a6ff] text-xl">💡</span>
                      <p className="text-sm text-[#c9d1d9] flex-1">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#30363d] flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
          <button
            onClick={onNewInvestigation}
            className="btn-primary"
          >
            Start New Investigation
          </button>
        </div>
      </div>
    </div>
  );
}

