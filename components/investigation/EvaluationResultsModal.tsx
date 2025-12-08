'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, BookOpen, Download } from 'lucide-react';
import type { EvaluationResult, IOCResult } from '@/lib/evaluation/investigation-evaluator';
import confetti from 'canvas-confetti';

interface EvaluationResultsModalProps {
  result: EvaluationResult;
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onNextScenario: () => void;
}

export default function EvaluationResultsModal({
  result,
  isOpen,
  onClose,
  onTryAgain,
  onNextScenario
}: EvaluationResultsModalProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    correct: true,
    missed: true,
    falsePositives: true,
    recommendations: true
  });

  // Animate score counter
  useEffect(() => {
    if (isOpen) {
      const duration = 2000;
      const steps = 60;
      const increment = result.score / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= result.score) {
          setAnimatedScore(result.score);
          clearInterval(timer);
          
          // Confetti for A+ grade
          if (result.grade === 'A+') {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isOpen, result.score, result.grade]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-yellow-400';
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getGradeMessage = (grade: string) => {
    switch (grade) {
      case 'A+': return '🎉 Perfect Investigation!';
      case 'A': return '🎉 Excellent Work!';
      case 'B': return '👍 Good Job!';
      case 'C': return '⚠️ Needs Improvement';
      case 'D': return '⚠️ Poor Performance';
      case 'F': return '❌ Failed Investigation';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Investigation Results</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <motion.div
                  className={`text-6xl font-bold ${getGradeColor(result.grade)}`}
                  key={animatedScore}
                >
                  {animatedScore}
                </motion.div>
                <div className="text-gray-400 text-sm">out of {result.maxScore}</div>
              </div>

              <div className="flex-1">
                <div className={`text-3xl font-bold ${getGradeColor(result.grade)} mb-2`}>
                  Grade: {result.grade}
                </div>
                <div className="text-lg text-gray-300">{getGradeMessage(result.grade)}</div>
                <div className="mt-2 text-sm text-gray-400">
                  Accuracy: {result.accuracy}% • Time: {formatTime(result.timeTaken)}
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="p-6 border-b border-[#30363d]">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Correct Threats:</span>
                <span className="text-green-400">+{result.breakdown.correctThreats * 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Correct Benign:</span>
                <span className="text-green-400">+{result.breakdown.correctBenign * 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Correct Suspicious:</span>
                <span className="text-green-400">+{result.breakdown.correctSuspicious * 7}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Missed Threats:</span>
                <span className="text-red-400">-{result.breakdown.missedThreats * 15}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">False Positives:</span>
                <span className="text-orange-400">-{result.breakdown.falsePositives * 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SLA Breaches:</span>
                <span className="text-red-400">-{result.breakdown.slaBreaches * 10}</span>
              </div>
              {result.breakdown.speedBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed Bonus:</span>
                  <span className="text-blue-400">+{result.breakdown.speedBonus}</span>
                </div>
              )}
              {result.breakdown.accuracyBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy Bonus:</span>
                  <span className="text-blue-400">+{result.breakdown.accuracyBonus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="p-6 space-y-4">
            {/* Correctly Identified */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                onClick={() => toggleSection('correct')}
                className="w-full p-4 flex items-center justify-between bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" size={20} />
                  <span className="font-semibold text-white">
                    ✅ Correctly Identified ({result.correctlyIdentified.length})
                  </span>
                </div>
                {expandedSections.correct ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.correct && (
                <div className="p-4 space-y-3">
                  {result.correctlyIdentified.map((ioc, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#21262d]">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-green-400 mt-0.5" size={16} />
                        <div className="flex-1">
                          <div className="font-mono text-sm text-white">{ioc.ioc}</div>
                          <div className="text-xs text-gray-400 mt-1">{ioc.explanation}</div>
                          {ioc.mitreTechnique && (
                            <div className="text-xs text-[#58a6ff] mt-1">
                              MITRE: {ioc.mitreTechnique}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missed Threats */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                onClick={() => toggleSection('missed')}
                className="w-full p-4 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-400" size={20} />
                  <span className="font-semibold text-white">
                    ❌ Missed Threats ({result.missedThreats.length})
                  </span>
                </div>
                {expandedSections.missed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.missed && (
                <div className="p-4 space-y-3">
                  {result.missedThreats.map((ioc, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#21262d]">
                      <div className="flex items-start gap-3">
                        <XCircle className="text-red-400 mt-0.5" size={16} />
                        <div className="flex-1">
                          <div className="font-mono text-sm text-white">{ioc.ioc}</div>
                          <div className="text-xs text-gray-400 mt-1">{ioc.explanation}</div>
                          {ioc.mitreTechnique && (
                            <a
                              href={`https://attack.mitre.org/techniques/${ioc.mitreTechnique}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#58a6ff] mt-1 hover:underline inline-block"
                            >
                              Learn about: {ioc.mitreTechnique}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* False Positives */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                onClick={() => toggleSection('falsePositives')}
                className="w-full p-4 flex items-center justify-between bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-400" size={20} />
                  <span className="font-semibold text-white">
                    ⚠️ False Positives ({result.falsePositives.length})
                  </span>
                </div>
                {expandedSections.falsePositives ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.falsePositives && (
                <div className="p-4 space-y-3">
                  {result.falsePositives.map((ioc, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#21262d]">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-orange-400 mt-0.5" size={16} />
                        <div className="flex-1">
                          <div className="font-mono text-sm text-white">{ioc.ioc}</div>
                          <div className="text-xs text-gray-400 mt-1">{ioc.explanation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Learning Recommendations */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full p-4 flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="text-blue-400" size={20} />
                  <span className="font-semibold text-white">📚 Learning Recommendations</span>
                </div>
                {expandedSections.recommendations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.recommendations && (
                <div className="p-4 space-y-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-sm text-gray-300">• {suggestion}</div>
                  ))}
                  {result.mitreTechniques.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-white mb-2">Study These MITRE Techniques:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.mitreTechniques.map((tech, idx) => (
                          <a
                            key={idx}
                            href={`https://attack.mitre.org/techniques/${tech}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#58a6ff] hover:bg-[#30363d] transition-colors"
                          >
                            {tech}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-[#161b22] border-t border-[#30363d] p-6 flex items-center justify-between gap-4">
            <button
              onClick={onTryAgain}
              className="px-6 py-2 rounded border border-[#30363d] text-white hover:bg-[#21262d] transition-colors"
            >
              Try Again
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => {/* Export PDF */}}
                className="flex items-center gap-2 px-6 py-2 rounded border border-[#30363d] text-white hover:bg-[#21262d] transition-colors"
              >
                <Download size={16} />
                Export Report
              </button>
              <button
                onClick={onNextScenario}
                className="px-6 py-2 rounded bg-[#58a6ff] text-white font-medium hover:bg-[#4493f8] transition-colors"
              >
                Next Scenario
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

