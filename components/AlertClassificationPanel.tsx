'use client';

import { useState } from 'react';
import type { SecurityAlert } from '@/lib/types';
import type { AlertClassification } from '@/lib/types';

interface Props {
  alerts: SecurityAlert[];
  onSelectAlert: (alert: SecurityAlert) => void;
  onClassify?: (alertId: string, classification: AlertClassification) => void;
}

export default function AlertClassificationPanel({ alerts, onSelectAlert, onClassify }: Props) {
  const [selectedClassification, setSelectedClassification] = useState<Record<string, AlertClassification>>({});

  function handleClassify(alertId: string, classification: AlertClassification) {
    setSelectedClassification(prev => ({ ...prev, [alertId]: classification }));
    if (onClassify) {
      onClassify(alertId, classification);
    }
  }

  function getClassificationColor(classification: AlertClassification | 'unclassified'): string {
    switch (classification) {
      case 'true-positive':
        return 'bg-red-900/40 text-red-400 border-red-800/60';
      case 'false-positive':
        return 'bg-green-900/40 text-green-400 border-green-800/60';
      case 'true-negative':
        return 'bg-blue-900/40 text-blue-400 border-blue-800/60';
      case 'false-negative':
        return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      default:
        return 'bg-gray-700/40 text-gray-400 border-gray-600/60';
    }
  }

  function formatTimestamp(ts: string): string {
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  }

  return (
    <div className="space-y-4">
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Security Alerts</h3>
        <div className="text-sm text-[#8b949e] mb-4">
          Review and classify each alert as True Positive, False Positive, True Negative, or False Negative
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="siem-card text-center py-12">
          <div className="text-4xl mb-4">🔔</div>
          <p className="text-[#8b949e]">No alerts to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const currentClassification = selectedClassification[alert.id] || alert.classification || 'unclassified';
            
            return (
              <div key={alert.id} className="siem-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-[#c9d1d9]">{alert.ruleName}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        alert.severity === 'critical' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                        alert.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' :
                        alert.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60' :
                        alert.severity === 'low' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/60' :
                        'bg-gray-700/40 text-gray-400 border border-gray-600/60'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-xs text-[#8b949e] mb-2">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                    {alert.srcIp && alert.dstIp && (
                      <div className="text-xs text-[#8b949e] mb-2">
                        <span className="font-mono text-[#58a6ff]">{alert.srcIp}</span>
                        {' → '}
                        <span className="font-mono text-[#58a6ff]">{alert.dstIp}</span>
                      </div>
                    )}
                    {alert.hostname && (
                      <div className="text-xs text-[#8b949e]">
                        Host: <span className="font-mono">{alert.hostname}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectAlert(alert)}
                    className="text-xs text-[#58a6ff] hover:underline"
                  >
                    View Details
                  </button>
                </div>
                
                <div className="flex items-center gap-2 pt-3 border-t border-[#30363d]">
                  <span className="text-xs text-[#8b949e]">Classification:</span>
                  <select
                    value={currentClassification}
                    onChange={e => handleClassify(alert.id, e.target.value as AlertClassification)}
                    className="search-input text-xs"
                  >
                    <option value="unclassified">Unclassified</option>
                    <option value="true-positive">True Positive</option>
                    <option value="false-positive">False Positive</option>
                    <option value="true-negative">True Negative</option>
                    <option value="false-negative">False Negative</option>
                  </select>
                  <span className={`px-2 py-1 text-xs rounded ${getClassificationColor(currentClassification)}`}>
                    {currentClassification.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

