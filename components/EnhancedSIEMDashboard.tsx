'use client';

import { useState, useMemo, useEffect } from 'react';
import type { SIEMEvent, SecurityAlert, IncidentCase, DetectionRule, AlertClassification } from '@/lib/types';
import { lookupThreatIntel } from '@/lib/threat-intel';
import ThreatIntelPanel from './ThreatIntelPanel';
import CaseManagement from './CaseManagement';
import LogSearchPanel from './LogSearchPanel';
import DetectionRuleBuilder from './DetectionRuleBuilder';
import AlertClassificationPanel from './AlertClassificationPanel';

interface Props {
  scenarioId?: string;
  alerts?: SecurityAlert[];
  events?: SIEMEvent[];
  onAlertClassify?: (alertId: string, classification: AlertClassification) => void;
}

export default function EnhancedSIEMDashboard({ scenarioId, alerts = [], events = [], onAlertClassify }: Props) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'logs' | 'cases' | 'rules' | 'dashboard'>('alerts');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SIEMEvent | null>(null);
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [threatIntelLookup, setThreatIntelLookup] = useState<{ type: string; value: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '24h' | '7d'>('24h');
  
  // Dashboard statistics
  const stats = useMemo(() => {
    const unclassified = alerts.filter(a => a.classification === 'unclassified').length;
    const truePositives = alerts.filter(a => a.classification === 'true-positive').length;
    const falsePositives = alerts.filter(a => a.classification === 'false-positive').length;
    const bySeverity = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };
    
    return {
      total: alerts.length,
      unclassified,
      truePositives,
      falsePositives,
      bySeverity,
    };
  }, [alerts]);
  
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#30363d]">
        {(['dashboard', 'alerts', 'logs', 'cases', 'rules'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#58a6ff] text-[#58a6ff]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="siem-card">
              <div className="text-xs text-[#8b949e] mb-1">Total Alerts</div>
              <div className="text-2xl font-bold text-[#c9d1d9]">{stats.total}</div>
            </div>
            <div className="siem-card border-l-2 border-red-500">
              <div className="text-xs text-[#8b949e] mb-1">Unclassified</div>
              <div className="text-2xl font-bold text-red-400">{stats.unclassified}</div>
            </div>
            <div className="siem-card border-l-2 border-orange-500">
              <div className="text-xs text-[#8b949e] mb-1">True Positives</div>
              <div className="text-2xl font-bold text-orange-400">{stats.truePositives}</div>
            </div>
            <div className="siem-card border-l-2 border-green-500">
              <div className="text-xs text-[#8b949e] mb-1">False Positives</div>
              <div className="text-2xl font-bold text-green-400">{stats.falsePositives}</div>
            </div>
          </div>
          
          {/* MITRE ATT&CK Coverage */}
          <div className="siem-card">
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">MITRE ATT&CK Coverage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Initial Access', 'Execution', 'Persistence', 'Command and Control'].map(tactic => {
                const count = alerts.filter(a => a.mitreTactics?.includes(tactic)).length;
                return (
                  <div key={tactic} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                    <div className="text-xs text-[#8b949e]">{tactic}</div>
                    <div className="text-xl font-bold text-[#c9d1d9]">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Top Alerting Hosts */}
          <div className="siem-card">
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">Top Alerting Hosts</h3>
            <div className="space-y-2">
              {Array.from(new Set(alerts.map(a => a.hostname).filter(Boolean)))
                .slice(0, 5)
                .map(hostname => {
                  const count = alerts.filter(a => a.hostname === hostname).length;
                  return (
                    <div key={hostname} className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
                      <span className="text-sm text-[#c9d1d9] font-mono">{hostname}</span>
                      <span className="text-sm text-[#8b949e]">{count} alerts</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      
      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <AlertClassificationPanel
            alerts={alerts}
            onSelectAlert={setSelectedAlert}
            onClassify={onAlertClassify}
          />
          
          {selectedAlert && (
            <AlertDetailsPanel
              alert={selectedAlert}
              onClose={() => setSelectedAlert(null)}
              onThreatIntelLookup={setThreatIntelLookup}
            />
          )}
        </div>
      )}
      
      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <LogSearchPanel
          events={events}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onSelectEvent={setSelectedEvent}
        />
      )}
      
      {/* Cases Tab */}
      {activeTab === 'cases' && (
        <CaseManagement
          cases={cases}
          alerts={alerts}
          onCreateCase={(caseData) => {
            const newCase: IncidentCase = {
              id: `case-${Date.now()}`,
              title: caseData.title || 'Untitled Case',
              severity: caseData.severity || 'medium',
              status: caseData.status || 'open',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              alerts: [],
              timeline: [],
              artifacts: { ips: [], domains: [], hashes: [], users: [], hosts: [] },
              mitreTechniques: [],
            };
            setCases([...cases, newCase]);
          }}
        />
      )}
      
      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <DetectionRuleBuilder />
      )}
      
      {/* Threat Intel Lookup Modal */}
      {threatIntelLookup && (
        <ThreatIntelPanel
          type={threatIntelLookup.type as 'ip' | 'domain' | 'hash'}
          value={threatIntelLookup.value}
          onClose={() => setThreatIntelLookup(null)}
        />
      )}
    </div>
  );
}

function AlertDetailsPanel({ alert, onClose, onThreatIntelLookup }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">{alert.ruleName}</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Alert details, MITRE mapping, threat intel, etc. */}
          {/* Implementation details... */}
        </div>
      </div>
    </div>
  );
}
