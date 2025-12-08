'use client';

import { useMemo } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';

interface Props {
  events: SimulatedEvent[];
  discoveredIOCs?: Set<string>;
}

export default function AttackTimeline({ events, discoveredIOCs = new Set() }: Props) {
  const timelineEvents = useMemo(() => {
    return events
      .filter(e => e.is_malicious || e.threat_score > 50)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [events]);

  const getEventColor = (event: SimulatedEvent) => {
    if (!event.is_malicious && (event.threat_score || 0) < 50) return 'bg-green-500';
    if (event.threat_score && event.threat_score >= 80) return 'bg-red-500';
    if (event.threat_score && event.threat_score >= 60) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Attack Timeline</h3>
        <p className="text-gray-400 text-center py-8">No malicious events discovered yet</p>
      </div>
    );
  }

  const firstTime = new Date(timelineEvents[0].timestamp).getTime();
  const lastTime = new Date(timelineEvents[timelineEvents.length - 1].timestamp).getTime();
  const totalSpan = lastTime - firstTime;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Attack Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700" />

        {/* Events */}
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
            const eventTime = new Date(event.timestamp).getTime();
            const position = ((eventTime - firstTime) / totalSpan) * 100;

            return (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 w-4 h-4 rounded-full ${getEventColor(event)} border-2 border-gray-900`}>
                  <div className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: getEventColor(event).replace('bg-', '') }} />
                </div>

                {/* Event content */}
                <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-mono">{formatTime(event.timestamp)}</span>
                        {event.technique_id && (
                          <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs font-mono">
                            {event.technique_id}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          event.is_malicious ? 'bg-red-900/30 text-red-400' : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {event.stage}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">{event.process_name || event.event_type || 'Unknown Event'}</p>
                    </div>
                    {event.threat_score && (
                      <span className={`text-sm font-bold ${
                        event.threat_score >= 80 ? 'text-red-400' :
                        event.threat_score >= 60 ? 'text-orange-400' :
                        'text-yellow-400'
                      }`}>
                        {event.threat_score}
                      </span>
                    )}
                  </div>
                  
                  {event.details && (
                    <div className="text-xs text-gray-400 mt-2">
                      {JSON.stringify(event.details).substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

