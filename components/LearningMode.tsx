'use client';

import { useState } from 'react';
import type { SecurityAlert, SIEMEvent } from '@/lib/types';
import { getDetailedMitreTechnique, getTechniqueExplanation } from '@/lib/mitre-explanations';

interface Props {
  alert?: SecurityAlert;
  event?: SIEMEvent;
  onClose: () => void;
}

export default function LearningMode({ alert, event, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'mitre' | 'investigation' | 'examples'>('overview');

  if (!alert && !event) return null;

  const mitreTechniques = alert?.mitreTechniques || [];
  const firstTechnique = mitreTechniques.length > 0 ? getDetailedMitreTechnique(mitreTechniques[0]) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">📚 Learning Mode - Detailed Explanation</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[#30363d]">
            {(['overview', 'mitre', 'investigation', 'examples'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#58a6ff] text-[#58a6ff]'
                    : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && alert && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">What is this alert?</h4>
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  {alert.explanation || 'This alert indicates potential malicious activity detected in your network.'}
                </p>
              </div>
              
              {alert.keyIndicators && alert.keyIndicators.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Key Indicators to Look For:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {alert.keyIndicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-[#8b949e]">{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Why This Matters:</h4>
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  {alert.correctClassification === 'true-positive' 
                    ? 'This is a TRUE POSITIVE - meaning it indicates actual malicious activity. You should investigate this immediately and take appropriate containment actions.'
                    : 'This is a FALSE POSITIVE - meaning it looks suspicious but is actually legitimate activity. Understanding why helps you tune your detection rules and reduce alert fatigue.'}
                </p>
              </div>

              {alert.threatIntelMatches && alert.threatIntelMatches.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Threat Intelligence Context:</h4>
                  <div className="space-y-2">
                    {alert.threatIntelMatches.map((match, idx) => (
                      <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#c9d1d9]">{match.source}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            match.reputation === 'malicious' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                            'bg-gray-700/40 text-gray-400 border border-gray-600/60'
                          }`}>
                            {match.reputation}
                          </span>
                        </div>
                        {match.description && (
                          <p className="text-xs text-[#8b949e]">{match.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MITRE Tab */}
          {activeTab === 'mitre' && firstTechnique && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">
                  MITRE ATT&CK Technique: {firstTechnique.name} ({firstTechnique.id})
                </h4>
                <p className="text-sm text-[#8b949e] leading-relaxed mb-4">
                  {firstTechnique.description}
                </p>
                <a
                  href={firstTechnique.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#58a6ff] hover:underline"
                >
                  Learn more on MITRE ATT&CK →
                </a>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Detection Tips:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {firstTechnique.detectionTips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-[#8b949e]">{tip}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Common Indicators of Compromise (IOCs):</h4>
                <div className="flex flex-wrap gap-2">
                  {firstTechnique.commonIOCs.map((ioc, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#58a6ff]">
                      {ioc}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Real-World Examples:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {firstTechnique.realWorldExamples.map((ex, idx) => (
                    <li key={idx} className="text-sm text-[#8b949e]">{ex}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Investigation Tab */}
          {activeTab === 'investigation' && firstTechnique && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3">Step-by-Step Investigation Guide</h4>
                <div className="space-y-3">
                  {firstTechnique.investigationSteps.map((step, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-4 rounded border border-[#30363d]">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#58a6ff]/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#58a6ff]">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-[#c9d1d9] flex-1">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {alert && (
                <div>
                  <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">What to Check in This Alert:</h4>
                  <div className="bg-[#0d1117] p-4 rounded border border-[#30363d] space-y-2">
                    {alert.srcIp && (
                      <div>
                        <span className="text-xs text-[#8b949e]">Source IP:</span>
                        <span className="ml-2 font-mono text-sm text-[#58a6ff]">{alert.srcIp}</span>
                        <p className="text-xs text-[#8b949e] mt-1">Check if this host is compromised or authorized</p>
                      </div>
                    )}
                    {alert.dstIp && (
                      <div>
                        <span className="text-xs text-[#8b949e]">Destination IP:</span>
                        <span className="ml-2 font-mono text-sm text-[#58a6ff]">{alert.dstIp}</span>
                        <p className="text-xs text-[#8b949e] mt-1">Look this up in threat intelligence feeds</p>
                      </div>
                    )}
                    {alert.timestamp && (
                      <div>
                        <span className="text-xs text-[#8b949e]">Timestamp:</span>
                        <span className="ml-2 text-sm text-[#c9d1d9]">{new Date(alert.timestamp).toLocaleString()}</span>
                        <p className="text-xs text-[#8b949e] mt-1">Check if this is during normal business hours</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && firstTechnique && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Example Commands/Patterns:</h4>
                <div className="space-y-2">
                  {firstTechnique.examples.map((example, idx) => (
                    <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                      <code className="text-xs text-[#58a6ff] font-mono">{example}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">How to Search for This:</h4>
                <div className="bg-[#0d1117] p-4 rounded border border-[#30363d] space-y-2">
                  <p className="text-sm text-[#8b949e]">
                    In the SIEM search, try these queries:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-[#58a6ff] font-mono">
                    <li>process_name:powershell.exe AND command:*base64*</li>
                    <li>dst_ip:{alert?.dstIp} AND bytes_out:&gt;10000</li>
                    <li>event_type:connection AND protocol:tcp AND periodic:true</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!firstTechnique && activeTab === 'mitre' && (
            <div className="text-center py-8 text-[#8b949e]">
              No MITRE ATT&CK techniques associated with this alert.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

