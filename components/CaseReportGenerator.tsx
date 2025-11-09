'use client';

import { useState } from 'react';
import type { IncidentCase } from '@/lib/soc-workflows';

interface Props {
  caseData: IncidentCase;
  onGenerate: (report: CaseReport) => void;
}

export interface CaseReport {
  caseId: string;
  title: string;
  executiveSummary: string;
  timeline: Array<{
    timestamp: string;
    event: string;
    source: string;
  }>;
  attackChain: {
    stages: string[];
    techniques: string[];
  };
  artifacts: {
    ips: string[];
    domains: string[];
    hashes: string[];
    files: string[];
    users: string[];
    hosts: string[];
  };
  keyFindings: string[];
  containmentActions: string[];
  eradicationActions: string[];
  recoveryActions: string[];
  recommendations: string[];
  lessonsLearned: string[];
  detectionRules: string[];
  generatedAt: string;
  generatedBy: string;
}

export default function CaseReportGenerator({ caseData, onGenerate }: Props) {
  const [report, setReport] = useState<CaseReport>(() => ({
    caseId: caseData.id,
    title: caseData.title,
    executiveSummary: '',
    timeline: caseData.timeline,
    attackChain: {
      stages: [],
      techniques: caseData.mitreTechniques,
    },
    artifacts: {
      ips: caseData.artifacts.filter(a => a.type === 'ip').map(a => a.value),
      domains: caseData.artifacts.filter(a => a.type === 'domain').map(a => a.value),
      hashes: caseData.artifacts.filter(a => a.type === 'hash').map(a => a.value),
      files: caseData.artifacts.filter(a => a.type === 'file').map(a => a.value),
      users: caseData.artifacts.filter(a => a.type === 'user').map(a => a.value),
      hosts: [],
    },
    keyFindings: caseData.keyFindings,
    containmentActions: caseData.containmentActions,
    eradicationActions: caseData.eradicationActions,
    recoveryActions: caseData.recoveryActions,
    recommendations: [],
    lessonsLearned: caseData.lessonsLearned,
    detectionRules: caseData.detectionRules,
    generatedAt: new Date().toISOString(),
    generatedBy: 'analyst',
  }));

  function handleGenerate() {
    onGenerate(report);
  }

  function exportToMarkdown() {
    const markdown = `# Incident Report: ${report.title}

**Case ID:** ${report.caseId}  
**Generated:** ${new Date(report.generatedAt).toLocaleString()}  
**Analyst:** ${report.generatedBy}

## Executive Summary

${report.executiveSummary || 'No summary provided.'}

## Attack Timeline

${report.timeline.map(event => `- **${new Date(event.timestamp).toLocaleString()}**: ${event.event} (${event.source})`).join('\n')}

## MITRE ATT&CK Techniques

${report.attackChain.techniques.map(tech => `- ${tech}`).join('\n')}

## Artifacts

### IP Addresses
${report.artifacts.ips.map(ip => `- ${ip}`).join('\n') || 'None'}

### Domains
${report.artifacts.domains.map(domain => `- ${domain}`).join('\n') || 'None'}

### File Hashes
${report.artifacts.hashes.map(hash => `- ${hash}`).join('\n') || 'None'}

## Key Findings

${report.keyFindings.map(finding => `- ${finding}`).join('\n') || 'None'}

## Response Actions

### Containment
${report.containmentActions.map(action => `- ${action}`).join('\n') || 'None'}

### Eradication
${report.eradicationActions.map(action => `- ${action}`).join('\n') || 'None'}

### Recovery
${report.recoveryActions.map(action => `- ${action}`).join('\n') || 'None'}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n') || 'None'}

## Lessons Learned

${report.lessonsLearned.map(lesson => `- ${lesson}`).join('\n') || 'None'}

## Detection Rules

${report.detectionRules.map(rule => `- ${rule}`).join('\n') || 'None'}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${report.caseId}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Case Report Generator</h3>

        {/* Executive Summary */}
        <div className="mb-4">
          <label className="block text-sm text-[#8b949e] mb-1">Executive Summary</label>
          <textarea
            value={report.executiveSummary}
            onChange={e => setReport(prev => ({ ...prev, executiveSummary: e.target.value }))}
            className="search-input w-full"
            rows={4}
            placeholder="Provide a high-level summary of the incident..."
          />
        </div>

        {/* Key Findings */}
        <div className="mb-4">
          <label className="block text-sm text-[#8b949e] mb-1">Key Findings</label>
          <div className="space-y-2">
            {report.keyFindings.map((finding, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={finding}
                  onChange={e => {
                    const updated = [...report.keyFindings];
                    updated[idx] = e.target.value;
                    setReport(prev => ({ ...prev, keyFindings: updated }));
                  }}
                  className="search-input flex-1"
                  placeholder="Key finding..."
                />
                <button
                  onClick={() => {
                    setReport(prev => ({
                      ...prev,
                      keyFindings: prev.keyFindings.filter((_, i) => i !== idx),
                    }));
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setReport(prev => ({ ...prev, keyFindings: [...prev.keyFindings, ''] }))}
              className="text-xs text-[#58a6ff] hover:underline"
            >
              + Add Finding
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-4">
          <label className="block text-sm text-[#8b949e] mb-1">Recommendations</label>
          <div className="space-y-2">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rec}
                  onChange={e => {
                    const updated = [...report.recommendations];
                    updated[idx] = e.target.value;
                    setReport(prev => ({ ...prev, recommendations: updated }));
                  }}
                  className="search-input flex-1"
                  placeholder="Recommendation..."
                />
                <button
                  onClick={() => {
                    setReport(prev => ({
                      ...prev,
                      recommendations: prev.recommendations.filter((_, i) => i !== idx),
                    }));
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setReport(prev => ({ ...prev, recommendations: [...prev.recommendations, ''] }))}
              className="text-xs text-[#58a6ff] hover:underline"
            >
              + Add Recommendation
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm bg-[#58a6ff] text-white rounded hover:bg-[#4493f8]"
          >
            Generate Report
          </button>
          <button
            onClick={exportToMarkdown}
            className="px-4 py-2 text-sm bg-green-900/40 text-green-400 border border-green-800/60 rounded hover:bg-green-900/60"
          >
            Export to Markdown
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="siem-card">
        <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Report Preview</h4>
        <div className="bg-[#0d1117] border border-[#30363d] rounded p-4 max-h-[400px] overflow-y-auto">
          <div className="text-sm text-[#c9d1d9] space-y-2">
            <div>
              <strong>Case ID:</strong> {report.caseId}
            </div>
            <div>
              <strong>Title:</strong> {report.title}
            </div>
            <div>
              <strong>Artifacts:</strong> {report.artifacts.ips.length} IPs, {report.artifacts.domains.length} domains, {report.artifacts.hashes.length} hashes
            </div>
            <div>
              <strong>MITRE Techniques:</strong> {report.attackChain.techniques.join(', ')}
            </div>
            <div>
              <strong>Key Findings:</strong> {report.keyFindings.length}
            </div>
            <div>
              <strong>Recommendations:</strong> {report.recommendations.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

