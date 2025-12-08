'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import type { AttackScenario } from '@/lib/scenarios/scenario-engine';

interface Props {
  scenario: AttackScenario | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export default function ScenarioBriefing({ scenario, isOpen, onClose, onStart }: Props) {
  if (!scenario) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="max-w-3xl w-full bg-gray-900 rounded-lg border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{scenario.name}</h2>
                  <div className="flex items-center gap-3">
                    {scenario.aptGroup && (
                      <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded-full text-sm font-semibold">
                        {scenario.aptGroup}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      scenario.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      scenario.difficulty === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
                      scenario.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-sm text-gray-400">~{scenario.duration} min</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300">{scenario.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Learning Objectives</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {scenario.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Briefing Document</h3>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {scenario.briefing}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">MITRE Techniques Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {scenario.techniques.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded border border-blue-800/50 font-mono text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onStart}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Investigation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

