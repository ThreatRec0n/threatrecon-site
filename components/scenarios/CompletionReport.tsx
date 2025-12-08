'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { EvaluationResult } from '@/lib/evaluation-engine';
import type { AttackScenario } from '@/lib/scenarios/scenario-engine';

interface Props {
  scenario: AttackScenario | null;
  evaluationResult: EvaluationResult;
  onClose: () => void;
  onNewScenario: () => void;
}

export default function CompletionReport({ scenario, evaluationResult, onClose, onNewScenario }: Props) {
  const successRate = scenario
    ? (evaluationResult.correctlyIdentified.length / scenario.successCriteria.length) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Attack Chain Reconstruction</h2>

        {/* Success Rate */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Attack Stages Identified</h3>
            <span className="text-2xl font-bold text-blue-400">{Math.round(successRate)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* What You Did Well */}
        {evaluationResult.correctlyIdentified.length > 0 && (
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              What You Did Well
            </h3>
            <ul className="space-y-2">
              {evaluationResult.correctlyIdentified.slice(0, 5).map((ioc, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span>Identified {ioc.ioc} as {ioc.userTag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What You Missed */}
        {evaluationResult.missedThreats.length > 0 && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              What You Missed
            </h3>
            <ul className="space-y-2">
              {evaluationResult.missedThreats.slice(0, 5).map((ioc, i) => (
                <li key={i} className="text-sm text-gray-300">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">{ioc.ioc}</div>
                      <div className="text-xs text-gray-400 mt-1">{ioc.explanation}</div>
                      {ioc.technique_id && (
                        <div className="text-xs text-blue-400 mt-1">
                          Learn: {ioc.technique_id}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {scenario && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recommended Study Topics
            </h3>
            <ul className="space-y-2">
              {scenario.learningObjectives.map((obj, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onNewScenario}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Another Scenario
          </button>
        </div>
      </motion.div>
    </div>
  );
}

