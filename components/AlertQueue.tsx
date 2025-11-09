'use client';

import { useState, useMemo } from 'react';
import type { SecurityAlert } from '@/lib/types';
import type { AlertQueueItem, AlertStatus } from '@/lib/soc-workflows';
import { createAlertQueueItem } from '@/lib/soc-workflows';

interface Props {
  alerts: SecurityAlert[];
  onTriage: (queueItem: AlertQueueItem, status: AlertStatus, notes?: string) => void;
  onCreateCase: (alertIds: string[]) => void;
  onSelectAlert: (alert: SecurityAlert) => void;
}

export default function AlertQueue({ alerts, onTriage, onCreateCase, onSelectAlert }: Props) {
  const [queueItems, setQueueItems] = useState<AlertQueueItem[]>(() => {
    // Initialize queue with all new alerts
    return alerts.map(alert => createAlertQueueItem(
      alert.id,
      alert.severity === 'critical' ? 'critical' :
      alert.severity === 'high' ? 'high' :
      alert.severity === 'medium' ? 'medium' : 'low'
    ));
  });

  const [filter, setFilter] = useState<'all' | 'new' | 'triaged' | 'investigating' | 'escalated'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp'>('priority');

  const filteredQueue = useMemo(() => {
    let filtered = queueItems;

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        const alertA = alerts.find(alert => alert.id === a.alertId);
        const alertB = alerts.find(alert => alert.id === b.alertId);
        if (!alertA || !alertB) return 0;
        return new Date(alertB.timestamp).getTime() - new Date(alertA.timestamp).getTime();
      }
    });
  }, [queueItems, filter, sortBy, alerts]);

  function handleTriage(queueItem: AlertQueueItem, status: AlertStatus, notes?: string) {
    const updated = queueItems.map(item => 
      item.id === queueItem.id
        ? { ...item, status, triagedAt: new Date().toISOString(), triagedBy: 'analyst', notes: notes ? [...item.notes, notes] : item.notes }
        : item
    );
    setQueueItems(updated);
    onTriage(queueItem, status, notes);
  }

  function handleCreateCase(alertIds: string[]) {
    onCreateCase(alertIds);
    // Mark alerts as escalated
    const updated = queueItems.map(item =>
      alertIds.includes(item.alertId)
        ? { ...item, status: 'escalated' as AlertStatus }
        : item
    );
    setQueueItems(updated);
  }

  function getAlert(queueItem: AlertQueueItem): SecurityAlert | undefined {
    return alerts.find(a => a.id === queueItem.alertId);
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-red-900/40 text-red-400 border-red-800/60';
      case 'high': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      case 'medium': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60';
      case 'low': return 'bg-blue-900/40 text-blue-400 border-blue-800/60';
      default: return 'bg-gray-900/40 text-gray-400 border-gray-800/60';
    }
  }

  function getStatusColor(status: AlertStatus): string {
    switch (status) {
      case 'new': return 'bg-gray-900/40 text-gray-400';
      case 'triaged': return 'bg-blue-900/40 text-blue-400';
      case 'investigating': return 'bg-yellow-900/40 text-yellow-400';
      case 'escalated': return 'bg-purple-900/40 text-purple-400';
      case 'resolved': return 'bg-green-900/40 text-green-400';
      case 'false-positive': return 'bg-gray-700/40 text-gray-300';
      default: return 'bg-gray-900/40 text-gray-400';
    }
  }

  return (
    <div className="space-y-4">
      {/* Queue Controls */}
      <div className="siem-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">Alert Queue</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8b949e]">
              {filteredQueue.length} alert{filteredQueue.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`px-3 py-1 text-xs rounded ${filter === 'new' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'}`}
          >
            New ({queueItems.filter(i => i.status === 'new').length})
          </button>
          <button
            onClick={() => setFilter('investigating')}
            className={`px-3 py-1 text-xs rounded ${filter === 'investigating' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e]'}`}
          >
            Investigating ({queueItems.filter(i => i.status === 'investigating').length})
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
          >
            <option value="priority">Sort by Priority</option>
            <option value="timestamp">Sort by Time</option>
          </select>
        </div>

        {/* Queue Items */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredQueue.map(queueItem => {
            const alert = getAlert(queueItem);
            if (!alert) return null;

            return (
              <div
                key={queueItem.id}
                className="bg-[#0d1117] border border-[#30363d] rounded p-4 hover:border-[#58a6ff]/50 transition-colors cursor-pointer"
                onClick={() => onSelectAlert(alert)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(queueItem.priority)}`}>
                        {queueItem.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(queueItem.status)}`}>
                        {queueItem.status}
                      </span>
                      <span className="text-sm font-semibold text-[#c9d1d9]">{alert.ruleName}</span>
                    </div>
                    <div className="text-xs text-[#8b949e] mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                    {alert.mitreTechniques.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {alert.mitreTechniques.slice(0, 3).map(tech => (
                          <span key={tech} className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#58a6ff] font-mono">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#30363d]">
                  {queueItem.status === 'new' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriage(queueItem, 'triaged', 'Triaged as true positive');
                        }}
                        className="px-3 py-1 text-xs bg-green-900/40 text-green-400 border border-green-800/60 rounded hover:bg-green-900/60"
                      >
                        Triage: True Positive
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriage(queueItem, 'false-positive', 'Marked as false positive');
                        }}
                        className="px-3 py-1 text-xs bg-gray-900/40 text-gray-400 border border-gray-800/60 rounded hover:bg-gray-900/60"
                      >
                        Mark False Positive
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriage(queueItem, 'investigating');
                        }}
                        className="px-3 py-1 text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-800/60 rounded hover:bg-yellow-900/60"
                      >
                        Investigate
                      </button>
                    </>
                  )}
                  {queueItem.status === 'investigating' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateCase([queueItem.alertId]);
                      }}
                      className="px-3 py-1 text-xs bg-purple-900/40 text-purple-400 border border-purple-800/60 rounded hover:bg-purple-900/60"
                    >
                      Escalate to Case
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredQueue.length === 0 && (
          <div className="text-center py-8 text-[#8b949e]">
            No alerts in queue
          </div>
        )}
      </div>
    </div>
  );
}

