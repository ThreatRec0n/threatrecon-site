'use client';

import { useState, useEffect } from 'react';
import type { Alert } from '@/lib/simulation-engine/core-types';

interface Props {
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export default function AlertQueue({ alerts, onSelectAlert }: Props) {
  const [sortBy, setSortBy] = useState<'priority' | 'sla'>('priority');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      alerts.forEach(alert => {
        if (alert.status === 'New' || alert.status === 'Investigating') {
          const remaining = Math.floor((alert.sla_deadline.getTime() - now.getTime()) / 1000);
          alert.sla_remaining_seconds = remaining;
          
          if (remaining < 0) alert.sla_status = 'Breached';
          else if (remaining < 180) alert.sla_status = 'Warning';
          else alert.sla_status = 'Safe';
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [alerts]);
  
  const sorted = [...alerts].sort((a, b) => 
    sortBy === 'priority' 
      ? b.priority_score - a.priority_score 
      : a.sla_remaining_seconds - b.sla_remaining_seconds
  );
  
  const formatTime = (seconds: number) => {
    if (seconds < 0) return '⚠️ BREACHED';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-900/40 text-red-400 border-red-700';
      case 'High': return 'bg-orange-900/40 text-orange-400 border-orange-700';
      case 'Medium': return 'bg-yellow-900/40 text-yellow-400 border-yellow-700';
      default: return 'bg-blue-900/40 text-blue-400 border-blue-700';
    }
  };
  
  return (
    <div className="h-full bg-[#0d1117] rounded-lg border border-[#30363d] flex flex-col">
      <div className="p-4 border-b border-[#30363d]">
        <h2 className="text-xl font-bold text-white mb-3">
          🚨 Alert Queue ({alerts.filter(a => a.status === 'New').length} New)
        </h2>
        
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-white text-sm"
        >
          <option value="priority">Sort by Priority</option>
          <option value="sla">Sort by SLA Time</option>
        </select>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sorted.map(alert => (
          <div
            key={alert.id}
            onClick={() => onSelectAlert(alert)}
            className={`p-4 border-b border-[#30363d] hover:bg-[#161b22] cursor-pointer ${
              alert.sla_status === 'Breached' ? 'bg-red-950/30' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-mono">{alert.ticket_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-white">{alert.title}</h3>
              </div>
              
              <div className="text-right ml-4">
                <div className={`text-sm font-mono font-bold ${
                  alert.sla_status === 'Breached' ? 'text-red-500 animate-pulse' :
                  alert.sla_status === 'Warning' ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {formatTime(alert.sla_remaining_seconds)}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">SLA</div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mb-2">{alert.initial_description}</p>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Priority: {alert.priority_score}</span>
              <span className={`px-2 py-0.5 rounded ${
                alert.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {alert.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
