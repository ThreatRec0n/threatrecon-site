'use client';

import { useState } from 'react';
import type { CaseNote } from './CaseNotes';
import type { EvidenceItem } from './EvidenceBinder';
import type { SimulatedEvent } from '@/lib/simulation-engine/types';
import type { EvaluationResult } from '@/lib/evaluation-engine';

interface Props {
  scenarioName: string;
  scenarioId: string;
  notes: CaseNote[];
  evidence: EvidenceItem[];
  events: SimulatedEvent[];
  evaluationResult: EvaluationResult | null;
  iocTags: Record<string, 'confirmed-threat' | 'suspicious' | 'benign'>;
  onExport: (format: 'pdf' | 'markdown' | 'json') => void;
}

export default function ReportExport({
  scenarioName,
  scenarioId,
  notes,
  evidence,
  events,
  evaluationResult,
  iocTags,
  onExport,
}: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'markdown' | 'json') => {
    setExporting(true);
    try {
      onExport(format);

      // Generate report content
      const report = generateReport(format);

      // Download file
      const blob = format === 'json'
        ? new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        : new Blob([report], { type: format === 'pdf' ? 'application/pdf' : 'text/markdown' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investigation-report-${scenarioId}-${Date.now()}.${format === 'json' ? 'json' : format === 'pdf' ? 'pdf' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const generateReport = (format: 'pdf' | 'markdown' | 'json'): string => {
    const timestamp = new Date().toISOString();
    const confirmedIOCs = Object.entries(iocTags)
      .filter(([_, tag]) => tag === 'confirmed-threat')
      .map(([ioc]) => ioc);
    const suspiciousIOCs = Object.entries(iocTags)
      .filter(([_, tag]) => tag === 'suspicious')
      .map(([ioc]) => ioc);

    if (format === 'json') {
      return JSON.stringify({
        scenario: {
          name: scenarioName,
          id: scenarioId,
        },
        timestamp,
        summary: {
          totalEvents: events.length,
          confirmedIOCs: confirmedIOCs.length,
          suspiciousIOCs: suspiciousIOCs.length,
          notes: notes.length,
          evidence: evidence.length,
          score: evaluationResult?.score || 0,
          skillLevel: (evaluationResult as any)?.skillLevel || 'unknown',
        },
        iocs: {
          confirmed: confirmedIOCs,
          suspicious: suspiciousIOCs,
        },
        notes: notes.map(n => ({
          timestamp: n.timestamp,
          content: n.content,
          tags: n.tags,
        })),
        evidence: evidence.map(e => ({
          type: e.type,
          name: e.name,
          description: e.description,
          timestamp: e.timestamp,
          tags: e.tags,
        })),
        evaluation: evaluationResult,
      }, null, 2);
    }

    // Markdown format
    let markdown = `# Investigation Report: ${scenarioName}\n\n`;
    markdown += `**Generated:** ${new Date(timestamp).toLocaleString()}\n`;
    markdown += `**Scenario ID:** ${scenarioId}\n\n`;
    markdown += `---\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `- **Total Events Analyzed:** ${events.length}\n`;
    markdown += `- **Confirmed Threat IOCs:** ${confirmedIOCs.length}\n`;
    markdown += `- **Suspicious IOCs:** ${suspiciousIOCs.length}\n`;
    markdown += `- **Investigation Notes:** ${notes.length}\n`;
    markdown += `- **Evidence Items:** ${evidence.length}\n`;
    if (evaluationResult) {
      markdown += `- **Investigation Score:** ${evaluationResult.score}/100\n`;
      markdown += `- **Skill Level:** ${(evaluationResult as any).skillLevel || 'Not evaluated'}\n`;
    }
    markdown += `\n---\n\n`;

    // IOCs
    markdown += `## Indicators of Compromise (IOCs)\n\n`;
    if (confirmedIOCs.length > 0) {
      markdown += `### Confirmed Threats\n\n`;
      confirmedIOCs.forEach(ioc => {
        markdown += `- \`${ioc}\`\n`;
      });
      markdown += `\n`;
    }
    if (suspiciousIOCs.length > 0) {
      markdown += `### Suspicious Indicators\n\n`;
      suspiciousIOCs.forEach(ioc => {
        markdown += `- \`${ioc}\`\n`;
      });
      markdown += `\n`;
    }
    markdown += `---\n\n`;

    // Investigation Notes
    if (notes.length > 0) {
      markdown += `## Investigation Notes\n\n`;
      notes.forEach(note => {
        markdown += `### ${new Date(note.timestamp).toLocaleString()}\n\n`;
        markdown += `${note.content}\n\n`;
        if (note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.join(', ')}\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Evidence
    if (evidence.length > 0) {
      markdown += `## Evidence\n\n`;
      evidence.forEach(item => {
        markdown += `### ${item.name}\n\n`;
        markdown += `- **Type:** ${item.type}\n`;
        markdown += `- **Timestamp:** ${new Date(item.timestamp).toLocaleString()}\n`;
        if (item.description) {
          markdown += `- **Description:** ${item.description}\n`;
        }
        if (item.tags.length > 0) {
          markdown += `- **Tags:** ${item.tags.join(', ')}\n`;
        }
        markdown += `\n`;
      });
      markdown += `---\n\n`;
    }

    // Evaluation Results
    if (evaluationResult) {
      markdown += `## Evaluation Results\n\n`;
      markdown += `**Score:** ${evaluationResult.score}/100\n\n`;
      markdown += `**Skill Level:** ${(evaluationResult as any).skillLevel || 'Not evaluated'}\n\n`;
      if (evaluationResult.missedIOCs && evaluationResult.missedIOCs.length > 0) {
        markdown += `### Missed IOCs\n\n`;
        evaluationResult.missedIOCs.forEach(ioc => {
          markdown += `- \`${ioc}\`\n`;
        });
        markdown += `\n`;
      }
    }

    markdown += `---\n\n`;
    markdown += `*Report generated by ThreatRecon SOC Training Platform*\n`;

    return markdown;
  };

  return (
    <div className="siem-card space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[#c9d1d9]">📄 Export Investigation Report</h3>
        <p className="text-xs text-[#8b949e] mt-0.5">
          Export your investigation findings, notes, and evidence
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => handleExport('markdown')}
          disabled={exporting}
          className="px-4 py-3 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {exporting ? 'Exporting...' : '📝 Export Markdown'}
        </button>
        <button
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="px-4 py-3 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:border-[#58a6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {exporting ? 'Exporting...' : '📊 Export JSON'}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="px-4 py-3 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:border-[#58a6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
        >
          {exporting ? 'Exporting...' : '📄 Export PDF'}
        </button>
      </div>

      <div className="text-xs text-[#8b949e] space-y-1">
        <p>• <strong>Markdown:</strong> Human-readable report with all findings</p>
        <p>• <strong>JSON:</strong> Machine-readable data for analysis</p>
        <p>• <strong>PDF:</strong> Professional formatted report (coming soon)</p>
      </div>

      <div className="bg-blue-900/20 border border-blue-800/40 rounded p-3">
        <p className="text-xs text-[#8b949e]">
          <strong className="text-blue-400">Report includes:</strong> All investigation notes, evidence items, confirmed and suspicious IOCs, evaluation results, and scenario details.
        </p>
      </div>
    </div>
  );
}

