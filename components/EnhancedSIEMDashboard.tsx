'use client';

import { useState, useMemo, useEffect } from 'react';
import type { SIEMEvent, SecurityAlert, IncidentCase, DetectionRule, AlertClassification } from '@/lib/types';
import { lookupThreatIntel } from '@/lib/threat-intel';
import ThreatIntelPanel from './ThreatIntelPanel';
import CaseManagement from './CaseManagement';
import LogSearchPanel from './LogSearchPanel';
import AlertClassificationPanel from './AlertClassificationPanel';
import DashboardVisualizations from './DashboardVisualizations';

interface Props {
  scenarioId?: string;
  alerts?: SecurityAlert[];
  events?: SIEMEvent[];
  onAlertClassify?: (alertId: string, classification: AlertClassification) => void;
}

export default function EnhancedSIEMDashboard({ scenarioId, alerts = [], events = [], onAlertClassify }: Props) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'logs' | 'cases' | 'dashboard'>('dashboard');
  const [selectedIPs, setSelectedIPs] = useState<Set<string>>(new Set());
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
        {(['dashboard', 'alerts', 'logs', 'cases'] as const).map(tab => (
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

          {/* Marked Malicious IPs */}
          {selectedIPs.size > 0 && (
            <div className="siem-card border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-3">🎯 Marked Malicious IPs</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedIPs).map(ip => (
                  <div key={ip} className="flex items-center gap-2 px-3 py-2 bg-red-900/40 border border-red-800/60 rounded">
                    <span className="font-mono text-sm text-red-400">{ip}</span>
                    <button
                      onClick={() => setSelectedIPs(prev => {
                        const next = new Set(prev);
                        next.delete(ip);
                        return next;
                      })}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Visualizations */}
          <DashboardVisualizations events={events} alerts={alerts} />
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
        <div className="space-y-4">
          <LogSearchPanel
            events={events}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onSelectEvent={setSelectedEvent}
            selectedIPs={selectedIPs}
            onToggleIP={(ip) => {
              setSelectedIPs(prev => {
                const next = new Set(prev);
                if (next.has(ip)) {
                  next.delete(ip);
                } else {
                  next.add(ip);
                }
                return next;
              });
            }}
          />
          {selectedEvent && (
            <EventDetailsPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onMarkIP={(ip: string) => {
                setSelectedIPs(prev => new Set([...prev, ip]));
              }}
            />
          )}
        </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Severity</div>
              <span className={`px-2 py-1 text-xs font-medium rounded border ${
                alert.severity === 'critical' ? 'bg-red-900/40 text-red-400 border-red-800/60' :
                alert.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border-orange-800/60' :
                alert.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60' :
                'bg-blue-900/40 text-blue-400 border-blue-800/60'
              }`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Timestamp</div>
              <div className="text-sm text-[#c9d1d9]">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            {alert.srcIp && (
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Source IP</div>
                <div className="text-sm font-mono text-[#58a6ff]">{alert.srcIp}</div>
              </div>
            )}
            {alert.dstIp && (
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Destination IP</div>
                <div className="text-sm font-mono text-[#58a6ff]">{alert.dstIp}</div>
                <button
                  onClick={() => onThreatIntelLookup?.({ type: 'ip', value: alert.dstIp })}
                  className="text-xs text-[#58a6ff] hover:underline mt-1"
                >
                  Lookup Threat Intel
                </button>
              </div>
            )}
            {alert.hostname && (
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Hostname</div>
                <div className="text-sm text-[#c9d1d9]">{alert.hostname}</div>
              </div>
            )}
            {alert.username && (
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Username</div>
                <div className="text-sm text-[#c9d1d9]">{alert.username}</div>
              </div>
            )}
          </div>
          
          {alert.mitreTechniques && alert.mitreTechniques.length > 0 && (
            <div>
              <div className="text-xs text-[#8b949e] mb-2">MITRE ATT&CK Techniques</div>
              <div className="flex flex-wrap gap-2">
                {alert.mitreTechniques.map((tech: string) => (
                  <span key={tech} className="px-2 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#58a6ff] font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {alert.keyIndicators && alert.keyIndicators.length > 0 && (
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Key Indicators</div>
              <ul className="list-disc list-inside space-y-1">
                {alert.keyIndicators.map((indicator: string, idx: number) => (
                  <li key={idx} className="text-sm text-[#c9d1d9]">{indicator}</li>
                ))}
              </ul>
            </div>
          )}

          {alert.threatIntelMatches && alert.threatIntelMatches.length > 0 && (
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Threat Intelligence Matches</div>
              <div className="space-y-2">
                {alert.threatIntelMatches.map((match: any, idx: number) => (
                  <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[#c9d1d9]">{match.source}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        match.reputation === 'malicious' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                        'bg-gray-700/40 text-gray-400 border border-gray-600/60'
                      }`}>
                        {match.reputation}
                      </span>
                    </div>
                    {match.description && (
                      <div className="text-xs text-[#8b949e]">{match.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {alert.explanation && (
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Explanation</div>
              <div className="text-sm text-[#c9d1d9] bg-[#0d1117] p-3 rounded border border-[#30363d]">
                {alert.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetailsPanel({ event, onClose, onMarkIP }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">Event Details</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Timestamp</div>
              <div className="text-sm text-[#c9d1d9]">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Event Type</div>
              <div className="text-sm text-[#c9d1d9]">{event.eventType}</div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Source IP</div>
              <div className="text-sm font-mono text-[#58a6ff]">{event.sourceIP}</div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Destination IP</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-[#58a6ff]">{event.destinationIP}</span>
                {!event.destinationIP?.startsWith('10.') && !event.destinationIP?.startsWith('192.168.') && (
                  <button
                    onClick={() => onMarkIP?.(event.destinationIP)}
                    className="text-xs px-2 py-1 bg-red-900/40 text-red-400 border border-red-800/60 rounded hover:bg-red-900/60"
                  >
                    Mark as Malicious
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Message</div>
            <div className="text-sm text-[#c9d1d9] bg-[#0d1117] p-3 rounded border border-[#30363d]">
              {event.message || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
