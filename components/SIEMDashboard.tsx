'use client';

import { useMemo, useState, useEffect } from 'react';
import type { SIEMEvent, Severity, Status } from '@/lib/siem-types';
import { getSeverityColor, getSeverityIcon, getStatusColor } from '@/lib/siem-types';
import { enrichEvent } from '@/lib/event-enricher';
import Papa from 'papaparse';

export default function SIEMDashboard() {
  const [events, setEvents] = useState<SIEMEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SIEMEvent | null>(null);
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '24h' | '7d'>('24h');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load and enrich events
  useEffect(() => {
    async function loadEvents() {
      try {
        const [zeekResponse, suricataResponse] = await Promise.all([
          fetch('/sample/zeek_conn_small.jsonl'),
          fetch('/sample/suricata_alerts_small.jsonl')
        ]);

        const zeekText = await zeekResponse.text();
        const suricataText = await suricataResponse.text();

        const zeekLines = zeekText.trim().split(/\r?\n/).filter(l => l.trim());
        const suricataLines = suricataText.trim().split(/\r?\n/).filter(l => l.trim());

        const zeekData = zeekLines.map(l => {
          try {
            return { ...JSON.parse(l), _source: 'zeek' };
          } catch {
            return null;
          }
        }).filter(r => r !== null);

        const suricataData = suricataLines.map(l => {
          try {
            return { ...JSON.parse(l), _source: 'suricata' };
          } catch {
            return null;
          }
        }).filter(r => r !== null);

        const allData = [...zeekData, ...suricataData];
        const enriched = allData.map((r, i) => enrichEvent(r, i));
        setEvents(enriched);
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(e => e.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.srcIp.toLowerCase().includes(q) ||
        e.dstIp.toLowerCase().includes(q) ||
        e.signature?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.ruleName?.toLowerCase().includes(q)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events, severityFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const bySeverity = {
      critical: events.filter(e => e.severity === 'critical').length,
      high: events.filter(e => e.severity === 'high').length,
      medium: events.filter(e => e.severity === 'medium').length,
      low: events.filter(e => e.severity === 'low').length,
      info: events.filter(e => e.severity === 'info').length,
    };
    
    const byStatus = {
      new: events.filter(e => e.status === 'new').length,
      'in-progress': events.filter(e => e.status === 'in-progress').length,
      escalated: events.filter(e => e.status === 'escalated').length,
      closed: events.filter(e => e.status === 'closed').length,
    };

    return { bySeverity, byStatus, total: events.length };
  }, [events]);

  function formatTimestamp(ts: string): string {
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return ts;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-[#8b949e]">Loading SIEM events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#c9d1d9]">Security Events</h2>
          <p className="text-sm text-[#8b949e]">Real-time threat detection and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="search-input text-sm"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="siem-card">
          <div className="text-xs text-[#8b949e] mb-1">Total Events</div>
          <div className="text-2xl font-bold text-[#c9d1d9]">{stats.total}</div>
        </div>
        <div className="siem-card border-l-2 border-red-500">
          <div className="text-xs text-[#8b949e] mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-400">{stats.bySeverity.critical}</div>
        </div>
        <div className="siem-card border-l-2 border-orange-500">
          <div className="text-xs text-[#8b949e] mb-1">High</div>
          <div className="text-2xl font-bold text-orange-400">{stats.bySeverity.high}</div>
        </div>
        <div className="siem-card border-l-2 border-yellow-500">
          <div className="text-xs text-[#8b949e] mb-1">Medium</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.bySeverity.medium}</div>
        </div>
        <div className="siem-card border-l-2 border-blue-500">
          <div className="text-xs text-[#8b949e] mb-1">New</div>
          <div className="text-2xl font-bold text-blue-400">{stats.byStatus.new}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="siem-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search IPs, signatures, categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input w-full"
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as any)}
            className="search-input"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="search-input"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="siem-card p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Severity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Source IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Dest IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Protocol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Signature</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filteredEvents.slice(0, 100).map((event) => (
                <tr
                  key={event.id}
                  className="log-row group cursor-pointer hover:bg-[#21262d]"
                  onClick={() => setSelectedEvent(event)}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(event.severity)}`}>
                      {getSeverityIcon(event.severity)} {event.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 log-mono text-[#c9d1d9] text-xs">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(event.srcIp);
                      }}
                      className="log-mono text-[#58a6ff] hover:underline"
                    >
                      {event.srcIp}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(event.dstIp);
                      }}
                      className="log-mono text-[#58a6ff] hover:underline"
                    >
                      {event.dstIp}
                    </button>
                  </td>
                  <td className="px-4 py-3 log-mono text-[#c9d1d9]">
                    {event.protocol?.toUpperCase() || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-[#c9d1d9]" title={event.signature || ''}>
                      {event.signature || event.category || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className="text-xs text-[#58a6ff] hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEvents.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[#8b949e]">No events match your filters</p>
          </div>
        )}
      </div>

      {/* Event Details Panel */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#8b949e] hover:text-[#c9d1d9]"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Severity</div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(selectedEvent.severity)}`}>
                    {getSeverityIcon(selectedEvent.severity)} {selectedEvent.severity.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Status</div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Timestamp</div>
                  <div className="log-mono text-[#c9d1d9]">{formatTimestamp(selectedEvent.timestamp)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Source</div>
                  <div className="text-[#c9d1d9]">{selectedEvent.source}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Source IP</div>
                  <div className="log-mono text-[#58a6ff]">{selectedEvent.srcIp}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Destination IP</div>
                  <div className="log-mono text-[#58a6ff]">{selectedEvent.dstIp}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Protocol</div>
                  <div className="text-[#c9d1d9]">{selectedEvent.protocol?.toUpperCase() || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e] mb-1">Category</div>
                  <div className="text-[#c9d1d9]">{selectedEvent.category || '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Signature / Rule</div>
                <div className="text-[#c9d1d9] font-medium">{selectedEvent.signature || selectedEvent.ruleName || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-2">Raw Event Data</div>
                <pre className="bg-[#0d1117] p-4 rounded border border-[#30363d] overflow-x-auto text-xs log-mono text-[#c9d1d9]">
                  {JSON.stringify(selectedEvent.raw, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

