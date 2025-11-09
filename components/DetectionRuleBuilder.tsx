'use client';

import { useState } from 'react';

export type RuleType = 'sigma' | 'yara' | 'kql' | 'splunk';

interface Props {
  onSave: (rule: DetectionRule) => void;
  onTest: (rule: DetectionRule) => void;
  existingRule?: DetectionRule;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  enabled: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string; // The actual rule content
  mitreTechniques: string[];
  tags: string[];
  threshold?: number;
  timeWindow?: string;
  testResults?: {
    matches: number;
    falsePositives: number;
    testedAt: string;
  };
}

export default function DetectionRuleBuilder({ onSave, onTest, existingRule }: Props) {
  const [rule, setRule] = useState<DetectionRule>(
    existingRule || {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      type: 'sigma',
      enabled: true,
      severity: 'medium',
      rule: '',
      mitreTechniques: [],
      tags: [],
    }
  );

  const [testResults, setTestResults] = useState<DetectionRule['testResults']>();

  const sigmaTemplate = `title: Suspicious PowerShell Execution
id: ${rule.id}
status: experimental
description: Detects suspicious PowerShell execution patterns
references:
    - https://attack.mitre.org/techniques/T1059/001/
author: SOC Analyst
date: ${new Date().toISOString().split('T')[0]}
tags:
    - attack.execution
    - attack.t1059.001
logsource:
    product: windows
    service: powershell
detection:
    selection:
        EventID: 4104
        ScriptBlockText|contains:
            - 'Base64'
            - 'EncodedCommand'
    condition: selection
falsepositives:
    - Legitimate administrative scripts
level: ${rule.severity}`;

  const yaraTemplate = `rule ${rule.name.replace(/\s+/g, '_')}
{
    meta:
        description = "${rule.description}"
        author = "SOC Analyst"
        date = "${new Date().toISOString().split('T')[0]}"
        mitre_technique = "${rule.mitreTechniques.join(', ')}"
    strings:
        $s1 = "powershell" nocase
        $s2 = /-enc[odedcommand]*\s+[A-Za-z0-9+\/]{100,}/
    condition:
        all of them
}`;

  const kqlTemplate = `SecurityEvent
| where EventID == 4104
| where EventData contains "Base64" or EventData contains "EncodedCommand"
| project TimeGenerated, Computer, Account, EventData`;

  function handleTypeChange(type: RuleType) {
    setRule(prev => ({
      ...prev,
      type,
      rule: type === 'sigma' ? sigmaTemplate :
            type === 'yara' ? yaraTemplate :
            type === 'kql' ? kqlTemplate : '',
    }));
  }

  function handleTest() {
    // Simulate rule testing
    const results = {
      matches: Math.floor(Math.random() * 50),
      falsePositives: Math.floor(Math.random() * 5),
      testedAt: new Date().toISOString(),
    };
    setTestResults(results);
    onTest({ ...rule, testResults: results });
  }

  return (
    <div className="space-y-4">
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Detection Rule Builder</h3>

        {/* Rule Metadata */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-[#8b949e] mb-1">Rule Name</label>
            <input
              type="text"
              value={rule.name}
              onChange={e => setRule(prev => ({ ...prev, name: e.target.value }))}
              className="search-input w-full"
              placeholder="e.g., Suspicious PowerShell Execution"
            />
          </div>

          <div>
            <label className="block text-sm text-[#8b949e] mb-1">Description</label>
            <textarea
              value={rule.description}
              onChange={e => setRule(prev => ({ ...prev, description: e.target.value }))}
              className="search-input w-full"
              rows={3}
              placeholder="Describe what this rule detects..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#8b949e] mb-1">Rule Type</label>
              <select
                value={rule.type}
                onChange={e => handleTypeChange(e.target.value as RuleType)}
                className="search-input w-full"
              >
                <option value="sigma">Sigma</option>
                <option value="yara">YARA</option>
                <option value="kql">KQL (Azure Sentinel)</option>
                <option value="splunk">Splunk SPL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#8b949e] mb-1">Severity</label>
              <select
                value={rule.severity}
                onChange={e => setRule(prev => ({ ...prev, severity: e.target.value as any }))}
                className="search-input w-full"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#8b949e] mb-1">MITRE ATT&CK Techniques</label>
            <input
              type="text"
              value={rule.mitreTechniques.join(', ')}
              onChange={e => setRule(prev => ({ ...prev, mitreTechniques: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              className="search-input w-full"
              placeholder="T1059.001, T1071.001 (comma-separated)"
            />
          </div>
        </div>

        {/* Rule Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-[#8b949e]">Rule Content ({rule.type.toUpperCase()})</label>
            <button
              onClick={() => {
                const template = rule.type === 'sigma' ? sigmaTemplate :
                                rule.type === 'yara' ? yaraTemplate :
                                rule.type === 'kql' ? kqlTemplate : '';
                setRule(prev => ({ ...prev, rule: template }));
              }}
              className="text-xs text-[#58a6ff] hover:underline"
            >
              Load Template
            </button>
          </div>
          <textarea
            value={rule.rule}
            onChange={e => setRule(prev => ({ ...prev, rule: e.target.value }))}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded p-3 text-sm font-mono text-[#c9d1d9] resize-none"
            rows={15}
            placeholder={`Enter your ${rule.type.toUpperCase()} rule here...`}
          />
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="mt-4 p-4 bg-[#0d1117] border border-[#30363d] rounded">
            <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Test Results</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[#8b949e]">Matches</div>
                <div className="text-[#c9d1d9] font-semibold">{testResults.matches}</div>
              </div>
              <div>
                <div className="text-[#8b949e]">False Positives</div>
                <div className="text-[#c9d1d9] font-semibold">{testResults.falsePositives}</div>
              </div>
              <div>
                <div className="text-[#8b949e]">Tested At</div>
                <div className="text-[#c9d1d9] font-semibold text-xs">
                  {new Date(testResults.testedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleTest}
            className="px-4 py-2 text-sm bg-yellow-900/40 text-yellow-400 border border-yellow-800/60 rounded hover:bg-yellow-900/60"
          >
            Test Rule
          </button>
          <button
            onClick={() => onSave(rule)}
            className="px-4 py-2 text-sm bg-[#58a6ff] text-white rounded hover:bg-[#4493f8]"
          >
            Save Rule
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="siem-card">
        <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">Rule Writing Tips</h4>
        <ul className="text-xs text-[#8b949e] space-y-1 list-disc list-inside">
          <li>Start with specific indicators to reduce false positives</li>
          <li>Include MITRE ATT&CK technique mappings for context</li>
          <li>Test rules against both malicious and benign data</li>
          <li>Document false positive scenarios in rule description</li>
          <li>Use time windows and thresholds to reduce noise</li>
        </ul>
      </div>
    </div>
  );
}
