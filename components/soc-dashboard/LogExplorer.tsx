'use client';

import { useState, useMemo } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';

interface Props {
  events: SimulatedEvent[];
  selectedStage: string | null;
  onEventSelect: (event: SimulatedEvent) => void;
}

export default function LogExplorer({ events, selectedStage, onEventSelect }: Props) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    source: '',
    host: '',
    eventType: '',
    stage: '',
    threatScoreMin: '',
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'threat_score'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.source) {
      filtered = filtered.filter(e => e.source === filters.source);
    }

    if (filters.host) {
      filtered = filtered.filter(e => 
        e.hostname?.toLowerCase().includes(filters.host.toLowerCase()) ||
        e.details?.Computer?.toLowerCase().includes(filters.host.toLowerCase())
      );
    }

    if (filters.eventType) {
      filtered = filtered.filter(e => 
        e.details?.EventType?.toLowerCase().includes(filters.eventType.toLowerCase()) ||
        e.details?.eventType?.toLowerCase().includes(filters.eventType.toLowerCase())
      );
    }

    if (filters.stage) {
      filtered = filtered.filter(e => e.stage === filters.stage);
    }

    if (filters.threatScoreMin) {
      const minScore = parseInt(filters.threatScoreMin);
      filtered = filtered.filter(e => (e.threat_score || 0) >= minScore);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else {
        comparison = (a.threat_score || 0) - (b.threat_score || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, filters, sortBy, sortOrder]);

  const getThreatScoreColor = (score: number | undefined) => {
    if (!score) return 'text-[#8b949e]';
    if (score >= 80) return 'text-red-400 bg-red-900/20 border-red-800/40';
    if (score >= 60) return 'text-orange-400 bg-orange-900/20 border-orange-800/40';
    if (score >= 40) return 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40';
    return 'text-green-400 bg-green-900/20 border-green-800/40';
  };
  
  const getThreatScoreBar = (score: number | undefined) => {
    if (!score) return { width: '0%', color: 'bg-gray-600' };
    if (score >= 80) return { width: `${score}%`, color: 'bg-red-500' };
    if (score >= 60) return { width: `${score}%`, color: 'bg-orange-500' };
    if (score >= 40) return { width: `${score}%`, color: 'bg-yellow-500' };
    return { width: `${score}%`, color: 'bg-green-500' };
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'sysmon': return 'bg-blue-900/40 text-blue-400 border-blue-800/60';
      case 'zeek': return 'bg-green-900/40 text-green-400 border-green-800/60';
      case 'suricata': return 'bg-purple-900/40 text-purple-400 border-purple-800/60';
      case 'edr': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      default: return 'bg-gray-700/40 text-gray-400 border-gray-600/60';
    }
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9]">Log Explorer</h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            SIEM-style interface (ELK/Kibana concepts) • Log sources: Sysmon, Zeek, Suricata, Windows Events
          </p>
        </div>
        <div className="text-sm text-[#8b949e]">
          {filteredAndSortedEvents.length} / {events.length} events
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="search-input text-sm"
        >
          <option value="">All Sources</option>
          <option value="sysmon">Sysmon</option>
          <option value="zeek">Zeek</option>
          <option value="suricata">Suricata</option>
          <option value="edr">EDR</option>
        </select>

        <input
          type="text"
          placeholder="Filter by host..."
          value={filters.host}
          onChange={(e) => setFilters(prev => ({ ...prev, host: e.target.value }))}
          className="search-input text-sm"
        />

        <input
          type="text"
          placeholder="Filter by event type..."
          value={filters.eventType}
          onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
          className="search-input text-sm"
        />

        <select
          value={filters.stage}
          onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
          className="search-input text-sm"
        >
          <option value="">All Stages</option>
          <option value="initial-access">Initial Access</option>
          <option value="execution">Execution</option>
          <option value="persistence">Persistence</option>
          <option value="privilege-escalation">Privilege Escalation</option>
          <option value="defense-evasion">Defense Evasion</option>
          <option value="credential-access">Credential Access</option>
          <option value="discovery">Discovery</option>
          <option value="lateral-movement">Lateral Movement</option>
          <option value="collection">Collection</option>
          <option value="command-and-control">C2</option>
          <option value="exfiltration">Exfiltration</option>
          <option value="impact">Impact</option>
        </select>

        <input
          type="number"
          placeholder="Min threat score..."
          value={filters.threatScoreMin}
          onChange={(e) => setFilters(prev => ({ ...prev, threatScoreMin: e.target.value }))}
          className="search-input text-sm"
          min="0"
          max="100"
        />

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'threat_score')}
            className="search-input text-sm flex-1"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="threat_score">Sort by Threat Score</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="btn-secondary text-sm px-3"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Event Table */}
      <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Time</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Source</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Stage</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Technique</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Threat</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {filteredAndSortedEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#8b949e]">
                  No events match the current filters.
                </td>
              </tr>
            )}
            {filteredAndSortedEvents.map(event => (
              <>
                <tr
                  className={`hover:bg-[#21262d] cursor-pointer ${
                    expandedEventId === event.id ? 'bg-[#161b22]' : ''
                  }`}
                  onClick={() => {
                    setExpandedEventId(expandedEventId === event.id ? null : event.id);
                    onEventSelect(event);
                  }}
                >
                  <td className="px-3 py-2 text-[#c9d1d9] font-mono text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getSourceColor(event.source)}`}>
                      {event.source}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[#8b949e] text-xs">
                    {event.stage?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {event.technique_id ? (
                      <span className="text-xs font-mono text-[#58a6ff]">{event.technique_id}</span>
                    ) : (
                      <span className="text-xs text-[#8b949e]">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded border ${getThreatScoreColor(event.threat_score)}`}>
                          {event.threat_score || 0}
                        </span>
                      </div>
                      {event.threat_score && (
                        <div className="w-full h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getThreatScoreBar(event.threat_score).color} transition-all`}
                            style={{ width: getThreatScoreBar(event.threat_score).width }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button className="text-[#58a6ff] hover:text-[#79c0ff] text-xs">
                      {expandedEventId === event.id ? '▼' : '▶'} View
                    </button>
                  </td>
                </tr>
                {expandedEventId === event.id && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 bg-[#0d1117] border-b border-[#30363d]">
                      <EventDetails event={event} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventDetails({ event }: { event: SimulatedEvent }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Event ID</h4>
          <p className="text-sm font-mono text-[#c9d1d9]">{event.id}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Correlation Key</h4>
          <p className="text-sm font-mono text-[#c9d1d9]">{event.correlation_key || '-'}</p>
        </div>
      </div>

      {event.process_tree && (
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Process Tree</h4>
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
            <p className="text-sm text-[#c9d1d9]">
              <span className="font-mono">{event.process_tree.process_name}</span>
              {event.process_tree.command_line && (
                <span className="text-[#8b949e] ml-2">{event.process_tree.command_line}</span>
              )}
            </p>
            <p className="text-xs text-[#8b949e] mt-1">
              PID: {event.process_tree.process_id} | User: {event.process_tree.user} | Host: {event.process_tree.hostname}
            </p>
          </div>
        </div>
      )}

      {event.network_context && (
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Network Context</h4>
          <div className="bg-[#161b22] p-2 rounded border border-[#30363d]">
            <p className="text-sm text-[#c9d1d9]">
              {event.network_context.source_ip}:{event.network_context.source_port} → {event.network_context.dest_ip}:{event.network_context.dest_port}
            </p>
            <p className="text-xs text-[#8b949e] mt-1">
              Protocol: {event.network_context.protocol} | Duration: {event.network_context.duration}s | 
              Bytes: {event.network_context.bytes_sent} sent, {event.network_context.bytes_received} received
            </p>
          </div>
        </div>
      )}

      {event.related_event_ids && event.related_event_ids.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Related Events</h4>
          <div className="flex flex-wrap gap-1">
            {event.related_event_ids.map(relatedId => (
              <span key={relatedId} className="px-2 py-1 text-xs bg-[#161b22] rounded border border-[#30363d] text-[#58a6ff] font-mono">
                {relatedId.substring(0, 16)}...
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-[#8b949e] mb-1">Raw Event Details</h4>
        <pre className="bg-[#161b22] p-2 rounded border border-[#30363d] text-xs text-[#8b949e] overflow-x-auto max-h-48 overflow-y-auto">
          {JSON.stringify(event.details, null, 2)}
        </pre>
      </div>
    </div>
  );
}

