'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Alert, AlertStatus, SLATimerStatus } from '@/lib/soc-alert-types';
import { SLA_REQUIREMENTS } from '@/lib/soc-alert-types';

interface Props {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  onTriage: (alert: Alert, status: AlertStatus, notes?: string) => void;
  onBulkAction: (alertIds: string[], action: 'assign' | 'close' | 'escalate') => void;
  currentUser?: string;
}

export default function EnhancedAlertQueue({ 
  alerts, 
  onSelectAlert, 
  onTriage,
  onBulkAction,
  currentUser = 'Your Queue'
}: Props) {
  const [filter, setFilter] = useState<'all' | 'New' | 'Investigating' | 'Escalated' | 'Closed' | 'False Positive'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'sla' | 'timestamp'>('priority');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for SLA timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter(alert => alert.status === filter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(alert => alert.alertSource === sourceFilter);
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority - a.priority;
      } else if (sortBy === 'sla') {
        return a.slaTimer.remaining - b.slaTimer.remaining;
      } else {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [alerts, filter, severityFilter, sourceFilter, sortBy]);

  function updateSLATimer(alert: Alert): Alert['slaTimer'] {
    const now = currentTime;
    const deadline = alert.slaTimer.deadline;
    const remaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 60000));
    
    let status: SLATimerStatus = 'OnTime';
    if (remaining <= 0) {
      status = 'Breached';
    } else {
      const requirements = SLA_REQUIREMENTS[alert.severity];
      const warningThreshold = requirements.investigationTime * 0.2;
      if (remaining <= warningThreshold) {
        status = 'Warning';
      }
    }
    
    return {
      ...alert.slaTimer,
      remaining,
      status,
    };
  }

  function getSLAColor(status: SLATimerStatus): string {
    switch (status) {
      case 'OnTime': return 'text-green-400';
      case 'Warning': return 'text-yellow-400';
      case 'Breached': return 'text-red-400 animate-pulse';
      default: return 'text-gray-400';
    }
  }

  function getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'Critical': return 'bg-red-900/40 text-red-400 border-red-800/60';
      case 'High': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      case 'Medium': return 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60';
      case 'Low': return 'bg-blue-900/40 text-blue-400 border-blue-800/60';
      case 'Informational': return 'bg-gray-900/40 text-gray-400 border-gray-800/60';
      default: return 'bg-gray-900/40 text-gray-400 border-gray-800/60';
    }
  }

  function getStatusColor(status: AlertStatus): string {
    switch (status) {
      case 'New': return 'bg-blue-900/40 text-blue-400';
      case 'Investigating': return 'bg-yellow-900/40 text-yellow-400';
      case 'Escalated': return 'bg-purple-900/40 text-purple-400';
      case 'Closed': return 'bg-green-900/40 text-green-400';
      case 'False Positive': return 'bg-gray-700/40 text-gray-300';
      default: return 'bg-gray-900/40 text-gray-400';
    }
  }

  function formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return 'BREACHED';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function handleSelectAlert(alert: Alert, e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button, input')) {
      return; // Don't select if clicking a button
    }
    onSelectAlert(alert);
  }

  function handleBulkSelect(alertId: string) {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
  }

  function handleSelectAll() {
    if (selectedAlerts.size === filteredAlerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<AlertStatus, number> = {
      'New': 0,
      'Investigating': 0,
      'Escalated': 0,
      'Closed': 0,
      'False Positive': 0,
    };
    alerts.forEach(alert => {
      counts[alert.status]++;
    });
    return counts;
  }, [alerts]);

  return (
    <div className="space-y-4">
      {/* Queue Header with Stats */}
      <div className="siem-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#c9d1d9]">Alert Queue</h3>
            <p className="text-sm text-[#8b949e] mt-1">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} 
              {selectedAlerts.size > 0 && ` • ${selectedAlerts.size} selected`}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-[#8b949e]">
              <span className="text-red-400 font-semibold">{statusCounts.New}</span> New
            </div>
            <div className="text-[#8b949e]">
              <span className="text-yellow-400 font-semibold">{statusCounts.Investigating}</span> Investigating
            </div>
            <div className="text-[#8b949e]">
              <span className="text-purple-400 font-semibold">{statusCounts.Escalated}</span> Escalated
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d]'}`}
            >
              All
            </button>
            {(['New', 'Investigating', 'Escalated', 'Closed', 'False Positive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 text-xs rounded ${filter === status ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d]'}`}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informational">Informational</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
          >
            <option value="all">All Sources</option>
            <option value="EDR">EDR</option>
            <option value="SIEM Correlation">SIEM</option>
            <option value="IDS">IDS</option>
            <option value="Firewall">Firewall</option>
            <option value="Proxy">Proxy</option>
            <option value="Email Gateway">Email Gateway</option>
            <option value="Cloud">Cloud</option>
            <option value="DNS">DNS</option>
            <option value="AD">Active Directory</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
          >
            <option value="priority">Sort by Priority</option>
            <option value="sla">Sort by SLA</option>
            <option value="timestamp">Sort by Time</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedAlerts.size > 0 && (
          <div className="mb-4 p-3 bg-[#161b22] border border-[#30363d] rounded flex items-center justify-between">
            <span className="text-sm text-[#c9d1d9]">
              {selectedAlerts.size} alert{selectedAlerts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onBulkAction(Array.from(selectedAlerts), 'assign');
                  setSelectedAlerts(new Set());
                }}
                className="px-3 py-1 text-xs bg-blue-900/40 text-blue-400 border border-blue-800/60 rounded hover:bg-blue-900/60"
              >
                Assign to Me
              </button>
              <button
                onClick={() => {
                  onBulkAction(Array.from(selectedAlerts), 'escalate');
                  setSelectedAlerts(new Set());
                }}
                className="px-3 py-1 text-xs bg-purple-900/40 text-purple-400 border border-purple-800/60 rounded hover:bg-purple-900/60"
              >
                Escalate
              </button>
              <button
                onClick={() => {
                  onBulkAction(Array.from(selectedAlerts), 'close');
                  setSelectedAlerts(new Set());
                }}
                className="px-3 py-1 text-xs bg-gray-900/40 text-gray-400 border border-gray-800/60 rounded hover:bg-gray-900/60"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedAlerts(new Set())}
                className="px-3 py-1 text-xs bg-[#0d1117] text-[#8b949e] border border-[#30363d] rounded hover:bg-[#161b22]"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Alert List */}
        <div className="space-y-2 max-h-[700px] overflow-y-auto">
          {filteredAlerts.map(alert => {
            const slaTimer = updateSLATimer(alert);
            const isSelected = selectedAlerts.has(alert.id);
            const hasRelatedAlerts = alert.relatedAlerts.length > 0;

            return (
              <div
                key={alert.id}
                onClick={(e) => handleSelectAlert(alert, e)}
                className={`bg-[#0d1117] border rounded p-4 hover:border-[#58a6ff]/50 transition-colors cursor-pointer ${
                  isSelected ? 'border-[#58a6ff] bg-[#58a6ff]/10' : 'border-[#30363d]'
                } ${slaTimer.status === 'Breached' ? 'ring-2 ring-red-500/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for bulk selection */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleBulkSelect(alert.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-4 h-4 text-[#58a6ff] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#58a6ff]"
                  />

                  <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="px-2 py-1 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">
                            {alert.alertSource}
                          </span>
                          {alert.containmentRequired && (
                            <span className="px-2 py-1 text-xs bg-red-900/40 text-red-400 border border-red-800/60 rounded">
                              Containment Required
                            </span>
                          )}
                          {hasRelatedAlerts && (
                            <span className="px-2 py-1 text-xs bg-purple-900/40 text-purple-400 border border-purple-800/60 rounded">
                              {alert.relatedAlerts.length} related
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-[#c9d1d9]">{alert.title}</span>
                          <span className="text-xs text-[#8b949e]">•</span>
                          <span className="text-xs text-[#8b949e] font-mono">{alert.ticketNumber}</span>
                        </div>
                      </div>

                      {/* SLA Timer */}
                      <div className={`text-right ${getSLAColor(slaTimer.status)}`}>
                        <div className="text-xs font-semibold">
                          {formatTimeRemaining(slaTimer.remaining)}
                        </div>
                        <div className="text-xs opacity-75">
                          {slaTimer.status}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-xs text-[#8b949e] mb-2">
                      <div>Rule: {alert.detectionRule}</div>
                      <div>Assets: {alert.affectedAssets.join(', ') || 'Unknown'}</div>
                      <div>Assigned: {alert.assignedTo}</div>
                      <div>Created: {alert.createdAt.toLocaleString()}</div>
                    </div>

                    {/* MITRE Techniques */}
                    {alert.mitreTechniques && alert.mitreTechniques.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {alert.mitreTechniques.slice(0, 3).map(tech => (
                          <span key={tech} className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#58a6ff] font-mono">
                            {tech}
                          </span>
                        ))}
                        {alert.mitreTechniques.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-[#8b949e]">
                            +{alert.mitreTechniques.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Threat Intel Matches */}
                    {alert.threatIntelMatches && alert.threatIntelMatches.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {alert.threatIntelMatches.slice(0, 2).map((match, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded">
                            <span className="text-[#8b949e]">{match.source}:</span>{' '}
                            <span className={match.reputation === 'malicious' ? 'text-red-400' : 'text-yellow-400'}>
                              {match.value}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#30363d]">
                      {alert.status === 'New' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTriage(alert, 'Investigating');
                            }}
                            className="px-3 py-1 text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-800/60 rounded hover:bg-yellow-900/60"
                          >
                            Investigate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTriage(alert, 'False Positive', 'Marked as false positive');
                            }}
                            className="px-3 py-1 text-xs bg-gray-900/40 text-gray-400 border border-gray-800/60 rounded hover:bg-gray-900/60"
                          >
                            False Positive
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTriage(alert, 'Escalated');
                            }}
                            className="px-3 py-1 text-xs bg-purple-900/40 text-purple-400 border border-purple-800/60 rounded hover:bg-purple-900/60"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                      {alert.status === 'Investigating' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTriage(alert, 'Escalated');
                          }}
                          className="px-3 py-1 text-xs bg-purple-900/40 text-purple-400 border border-purple-800/60 rounded hover:bg-purple-900/60"
                        >
                          Escalate to Case
                        </button>
                      )}
                      {alert.assignedTo === 'Unassigned' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBulkAction([alert.id], 'assign');
                          }}
                          className="px-3 py-1 text-xs bg-blue-900/40 text-blue-400 border border-blue-800/60 rounded hover:bg-blue-900/60"
                        >
                          Assign to Me
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-[#8b949e]">
            No alerts match the current filters
          </div>
        )}
      </div>
    </div>
  );
}


