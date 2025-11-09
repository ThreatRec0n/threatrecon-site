'use client';

import { useState } from 'react';
import type { IncidentCase, SecurityAlert } from '@/lib/types';

interface Props {
  cases: IncidentCase[];
  alerts: SecurityAlert[];
  onCreateCase: (caseData: Partial<IncidentCase>) => void;
}

export default function CaseManagement({ cases, alerts, onCreateCase }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseSeverity, setNewCaseSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  function handleCreateCase() {
    if (!newCaseTitle.trim()) return;
    
    onCreateCase({
      title: newCaseTitle,
      severity: newCaseSeverity,
      status: 'open',
    });
    
    setNewCaseTitle('');
    setNewCaseSeverity('medium');
    setShowCreateForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#c9d1d9]">Incident Cases</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary text-sm"
        >
          {showCreateForm ? 'Cancel' : '+ New Case'}
        </button>
      </div>

      {showCreateForm && (
        <div className="siem-card">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-4">Create New Case</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Case Title</label>
              <input
                type="text"
                value={newCaseTitle}
                onChange={e => setNewCaseTitle(e.target.value)}
                className="search-input w-full"
                placeholder="Enter case title..."
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Severity</label>
              <select
                value={newCaseSeverity}
                onChange={e => setNewCaseSeverity(e.target.value as any)}
                className="search-input w-full"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button onClick={handleCreateCase} className="btn-primary">
              Create Case
            </button>
          </div>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="siem-card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-[#8b949e]">No cases created yet</p>
          <p className="text-sm text-[#484f58] mt-2">Create a new case to start tracking incidents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(caseItem => (
            <div key={caseItem.id} className="siem-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[#c9d1d9]">{caseItem.title}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      caseItem.severity === 'critical' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                      caseItem.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' :
                      caseItem.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60' :
                      'bg-blue-900/40 text-blue-400 border border-blue-800/60'
                    }`}>
                      {caseItem.severity}
                    </span>
                    <span className="text-xs text-[#8b949e]">{caseItem.status}</span>
                    <span className="text-xs text-[#8b949e]">
                      {caseItem.alerts.length} alerts
                    </span>
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

