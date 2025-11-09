'use client';

import { useState, useMemo } from 'react';
import type { SIEMEvent } from '@/lib/types';
import { sanitizeSearchQuery, validateTimeRange } from '@/lib/security';

interface Props {
  events: SIEMEvent[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  timeRange: '15m' | '1h' | '24h' | '7d';
  onTimeRangeChange: (range: '15m' | '1h' | '24h' | '7d') => void;
  onSelectEvent: (event: SIEMEvent) => void;
  selectedIPs?: Set<string>;
  onToggleIP?: (ip: string) => void;
  maliciousIPs?: string[];
  showFeedback?: boolean;
}

export default function LogSearchPanel({
  events,
  searchQuery,
  onSearchChange,
  timeRange,
  onTimeRangeChange,
  onSelectEvent,
  selectedIPs = new Set(),
  onToggleIP,
  maliciousIPs = [],
  showFeedback = false,
}: Props) {
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(searchQuery);
    if (sanitizedQuery !== searchQuery) {
      console.warn('[Security] Search query contained invalid characters');
    }
    
    const query = sanitizedQuery.toLowerCase();
    return events.filter(event => 
      event.sourceIP?.toLowerCase().includes(query) ||
      event.destinationIP?.toLowerCase().includes(query) ||
      event.eventType?.toLowerCase().includes(query) ||
      event.message?.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

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

  return (
    <div className="space-y-4">
      <div className="siem-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search logs (IP, event type, message)..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="search-input w-full"
            />
          </div>
          <select
            value={timeRange}
            onChange={e => {
              const newRange = e.target.value;
              if (validateTimeRange(newRange)) {
                onTimeRangeChange(newRange as any);
              } else {
                console.warn('[Security] Invalid time range selected');
              }
            }}
            className="search-input"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
      </div>

      <div className="siem-card p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Source IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Dest IP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Event Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Message</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filteredEvents.slice(0, 100).map((event) => (
                <tr
                  key={event.id}
                  className="log-row group cursor-pointer hover:bg-[#21262d]"
                  onClick={() => onSelectEvent(event)}
                >
                  <td className="px-4 py-3 log-mono text-[#c9d1d9] text-xs">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="log-mono text-[#58a6ff]">{event.sourceIP}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`log-mono ${
                        selectedIPs.has(event.destinationIP) 
                          ? 'text-orange-400 font-bold' // Just show it's marked, not if it's correct
                          : 'text-[#58a6ff]'
                      }`}>
                        {event.destinationIP}
                      </span>
                      {!event.destinationIP?.startsWith('10.') && 
                       !event.destinationIP?.startsWith('192.168.') && 
                       !event.destinationIP?.startsWith('172.') &&
                       onToggleIP && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleIP(event.destinationIP);
                          }}
                          className={`text-xs px-2 py-1 rounded ${
                            selectedIPs.has(event.destinationIP)
                              ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' // Neutral color during gameplay
                              : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:bg-[#161b22]'
                          }`}
                        >
                          {selectedIPs.has(event.destinationIP) 
                            ? 'Marked'
                            : 'Mark Bad'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#c9d1d9]">
                    {event.eventType}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate text-[#c9d1d9]" title={event.message || ''}>
                      {event.message || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
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
            <p className="text-[#8b949e]">No events match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

