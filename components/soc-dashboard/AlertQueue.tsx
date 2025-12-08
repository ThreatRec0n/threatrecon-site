'use client';

import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import type { Alert } from '@/lib/simulation-engine/alert-types';

interface AlertQueueProps {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  onUpdateAlert: (alertId: string, updates: Partial<Alert>) => void;
  onOpenTechnique?: (techniqueId: string) => void;
}

export default function AlertQueue({ alerts, onSelectAlert, onUpdateAlert, onOpenTechnique }: AlertQueueProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'sla' | 'severity' | 'created'>('priority');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Update SLA timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      alerts.forEach(alert => {
        // Handle both Date objects and date strings
        const deadline = alert.sla_deadline instanceof Date 
          ? alert.sla_deadline 
          : new Date(alert.sla_deadline);
        const remaining = Math.floor((deadline.getTime() - now.getTime()) / 1000);
        const total = alert.sla_remaining_seconds;
        
        let status: Alert['sla_status'] = 'OnTime';
        if (remaining < 0) status = 'Breached';
        else if (remaining < total * 0.2) status = 'Warning';
        
        if (alert.sla_status !== status) {
          onUpdateAlert(alert.id, { 
            sla_remaining_seconds: remaining,
            sla_status: status 
          });
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [alerts, onUpdateAlert]);
  
  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });
  
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return b.priority_score - a.priority_score;
      case 'sla':
        return a.sla_remaining_seconds - b.sla_remaining_seconds;
      case 'severity':
        const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1, Informational: 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      case 'created':
        const aCreated = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const bCreated = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return bCreated.getTime() - aCreated.getTime();
      default:
        return 0;
    }
  });
  
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 0) return 'BREACHED';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };
  
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'Low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };
  
  const getSLAColor = (status: string): string => {
    switch (status) {
      case 'Breached': return 'text-red-500 animate-pulse';
      case 'Warning': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-lg border border-[#30363d]" data-tutorial="alert-queue">
      <div className="p-4 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            Alert Queue
            <span className="text-sm text-gray-400">({filteredAlerts.length})</span>
          </h2>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm text-white"
          >
            <option value="priority">Sort: Priority</option>
            <option value="sla">Sort: SLA Time</option>
            <option value="severity">Sort: Severity</option>
            <option value="created">Sort: Created</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm text-white"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Escalated">Escalated</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No alerts match your filters
          </div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {sortedAlerts.map((alert, index) => (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-4 hover:bg-[#161b22] cursor-pointer transition-colors ${
                  alert.sla_status === 'Breached' ? 'bg-red-950/20' : ''
                }`}
                data-tutorial={index === 0 && alert.severity === 'Critical' ? 'first-alert' : undefined}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">
                        {alert.ticket_number}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.alert_source}
                      </span>
                      {alert.aptGroup && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-800/50 font-semibold">
                          {alert.aptGroup}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        {alert.title}
                      </h3>
                      {alert.technique_id && onOpenTechnique && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTechnique(alert.technique_id!);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                          title="Learn about this technique"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {alert.initial_context}
                    </p>
                  </div>
                  
                  <div className="text-right flex-shrink-0" data-tutorial={index === 0 && alert.severity === 'Critical' ? 'sla-timer' : undefined}>
                    <div className={`text-xs font-mono font-bold ${getSLAColor(alert.sla_status)}`}>
                      {formatTimeRemaining(alert.sla_remaining_seconds)}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">SLA</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span>Priority: {alert.priority_score}</span>
                    {alert.containment_required && (
                      <span className="text-orange-400">⚠ Containment Required</span>
                    )}
                    {alert.related_alert_ids.length > 0 && (
                      <span>🔗 {alert.related_alert_ids.length} Related</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded ${
                    alert.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                    alert.status === 'Investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                    alert.status === 'Closed' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-[#30363d] bg-[#161b22]">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="text-red-400 font-bold">
              {alerts.filter(a => a.severity === 'Critical').length}
            </div>
            <div className="text-gray-500">Critical</div>
          </div>
          <div>
            <div className="text-orange-400 font-bold">
              {alerts.filter(a => a.severity === 'High').length}
            </div>
            <div className="text-gray-500">High</div>
          </div>
          <div>
            <div className="text-green-400 font-bold">
              {alerts.filter(a => a.status === 'New').length}
            </div>
            <div className="text-gray-500">New</div>
          </div>
          <div>
            <div className={`font-bold ${
              alerts.filter(a => a.sla_status === 'Breached').length > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'
            }`}>
              {alerts.filter(a => a.sla_status === 'Breached').length}
            </div>
            <div className="text-gray-500">Breached</div>
          </div>
        </div>
      </div>
    </div>
  );
}

