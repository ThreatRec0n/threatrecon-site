'use client';

import { useState } from 'react';
import type { DetectionRule } from '@/lib/types';

export default function DetectionRuleBuilder() {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState<Partial<DetectionRule>>({
    name: '',
    description: '',
    enabled: true,
    severity: 'medium',
    query: '',
    mitreTechniques: [],
    tags: [],
  });

  function handleCreateRule() {
    if (!newRule.name || !newRule.query) return;
    
    const rule: DetectionRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: newRule.description || '',
      enabled: newRule.enabled ?? true,
      severity: newRule.severity || 'medium',
      query: newRule.query,
      mitreTechniques: newRule.mitreTechniques || [],
      tags: newRule.tags || [],
    };
    
    setRules([...rules, rule]);
    setNewRule({
      name: '',
      description: '',
      enabled: true,
      severity: 'medium',
      query: '',
      mitreTechniques: [],
      tags: [],
    });
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#c9d1d9]">Detection Rules</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </div>

      {showForm && (
        <div className="siem-card">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-4">Create Detection Rule</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Rule Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                className="search-input w-full"
                placeholder="e.g., Suspicious PowerShell Execution"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Description</label>
              <textarea
                value={newRule.description}
                onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                className="search-input w-full min-h-[60px]"
                placeholder="Describe what this rule detects..."
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Query (KQL/Lucene)</label>
              <textarea
                value={newRule.query}
                onChange={e => setNewRule({ ...newRule, query: e.target.value })}
                className="search-input w-full min-h-[100px] font-mono text-sm"
                placeholder="process_name:powershell.exe AND command:*base64*"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Severity</label>
              <select
                value={newRule.severity}
                onChange={e => setNewRule({ ...newRule, severity: e.target.value as any })}
                className="search-input w-full"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
            <button onClick={handleCreateRule} className="btn-primary">
              Create Rule
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="siem-card text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-[#8b949e]">No detection rules created yet</p>
          <p className="text-sm text-[#484f58] mt-2">Create a new rule to start detecting threats</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="siem-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-[#c9d1d9]">{rule.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${
                      rule.severity === 'critical' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                      rule.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' :
                      rule.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60' :
                      rule.severity === 'low' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/60' :
                      'bg-gray-700/40 text-gray-400 border border-gray-600/60'
                    }`}>
                      {rule.severity}
                    </span>
                    {rule.enabled ? (
                      <span className="px-2 py-1 text-xs bg-green-900/40 text-green-400 border border-green-800/60 rounded">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-700/40 text-gray-400 border border-gray-600/60 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-xs text-[#8b949e] mb-2">{rule.description}</p>
                  )}
                  <div className="bg-[#0d1117] p-2 rounded border border-[#30363d]">
                    <code className="text-xs text-[#58a6ff] font-mono">{rule.query}</code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

