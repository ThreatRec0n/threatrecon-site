'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, ExternalLink, Copy, Check } from 'lucide-react';
import type { MITRETechnique } from '@/lib/learning/mitre-knowledge';
import { getAllTechniques } from '@/lib/learning/mitre-knowledge';

interface TechniqueExplainerPanelProps {
  technique: MITRETechnique | null;
  isOpen: boolean;
  onClose: () => void;
  onNextTechnique?: () => void;
}

export default function TechniqueExplainerPanel({
  technique,
  isOpen,
  onClose,
  onNextTechnique
}: TechniqueExplainerPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    redFlags: true,
    investigation: true,
    example: true,
    defense: true,
    related: true
  });
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!technique) return null;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyStep = (step: string, index: number) => {
    navigator.clipboard.writeText(step);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const mitreUrl = `https://attack.mitre.org/techniques/${technique.id}`;
  const allTechniques = getAllTechniques();
  const currentIndex = allTechniques.findIndex(t => t.id === technique.id);
  const nextTechnique = currentIndex < allTechniques.length - 1 ? allTechniques[currentIndex + 1] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9997]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#161b22] border-l border-[#30363d] shadow-2xl z-[9998] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] p-4 z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs font-mono text-[#58a6ff]">
                      {technique.id}
                    </span>
                    <span className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-gray-400">
                      {technique.tactic}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{technique.name}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              <div className="text-sm text-gray-300 leading-relaxed">
                {technique.description}
              </div>

              {/* 🎯 Why This is Suspicious */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('redFlags')}
                  className="w-full p-3 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  <span className="font-semibold text-white">🎯 Why This is Suspicious</span>
                  {expandedSections.redFlags ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.redFlags && (
                  <div className="p-4 space-y-2">
                    {technique.redFlags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🔍 How to Investigate */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('investigation')}
                  className="w-full p-3 flex items-center justify-between bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                >
                  <span className="font-semibold text-white">🔍 How to Investigate</span>
                  {expandedSections.investigation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.investigation && (
                  <div className="p-4 space-y-3">
                    {technique.investigationSteps.map((step, idx) => (
                      <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#21262d]">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="text-sm text-white font-mono">{step}</div>
                          </div>
                          <button
                            onClick={() => copyStep(step, idx)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy step"
                          >
                            {copiedStep === idx ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 📖 Real-World Example */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('example')}
                  className="w-full p-3 flex items-center justify-between bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                >
                  <span className="font-semibold text-white">📖 Real-World Example</span>
                  {expandedSections.example ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.example && (
                  <div className="p-4">
                    <p className="text-sm text-gray-300 leading-relaxed">{technique.realWorldExample}</p>
                  </div>
                )}
              </div>

              {/* 🛡️ How to Defend */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('defense')}
                  className="w-full p-3 flex items-center justify-between bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  <span className="font-semibold text-white">🛡️ How to Defend</span>
                  {expandedSections.defense ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.defense && (
                  <div className="p-4 space-y-2">
                    {technique.defenseRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🔗 Related Techniques */}
              <div className="border border-[#30363d] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('related')}
                  className="w-full p-3 flex items-center justify-between bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                >
                  <span className="font-semibold text-white">
                    🔗 Related Techniques ({technique.relatedTechniques.length})
                  </span>
                  {expandedSections.related ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.related && (
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {technique.relatedTechniques.map((techId) => (
                        <a
                          key={techId}
                          href={`https://attack.mitre.org/techniques/${techId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#58a6ff] hover:bg-[#30363d] transition-colors"
                        >
                          {techId}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Common Tools */}
              {technique.commonTools.length > 0 && (
                <div className="border border-[#30363d] rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Common Tools:</h4>
                  <div className="flex flex-wrap gap-2">
                    {technique.commonTools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-gray-400"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-[#161b22] border-t border-[#30363d] p-4 space-y-2">
              <a
                href={mitreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded border border-[#30363d] text-white hover:bg-[#21262d] transition-colors"
              >
                <ExternalLink size={16} />
                Read Full MITRE Page
              </a>
              {nextTechnique && onNextTechnique && (
                <button
                  onClick={onNextTechnique}
                  className="w-full px-4 py-2 rounded bg-[#58a6ff] text-white font-medium hover:bg-[#4493f8] transition-colors"
                >
                  Next Technique: {nextTechnique.id}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded border border-[#30363d] text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

