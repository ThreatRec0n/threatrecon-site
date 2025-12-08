/**
 * Phase 1 Integration Example
 * 
 * This file demonstrates how to integrate all Phase 1 components
 * into your existing ThreatRecon simulation dashboard.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateAlertBatch } from '@/lib/alert-generator';
import { generateRealisticLogVolume, DEFAULT_NOISE_CONFIG } from '@/lib/log-noise-generator';
import { executeQuery } from '@/lib/siem-query-engine';
import type { Alert, AlertStatus } from '@/lib/soc-alert-types';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';
import EnhancedAlertQueue from '@/components/EnhancedAlertQueue';
import SIEMQueryBuilder from '@/components/SIEMQueryBuilder';

export default function Phase1IntegrationExample() {
  // State management
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<SimulatedEvent[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with realistic data
  useEffect(() => {
    initializeSimulation();
  }, []);

  async function initializeSimulation() {
    setIsLoading(true);
    
    try {
      // 1. Generate realistic alert batch (30 alerts, 70% false positives)
      const generatedAlerts = generateAlertBatch(30);
      setAlerts(generatedAlerts);

      // 2. Generate realistic log volume
      // In a real scenario, you'd get attack events from your simulation engine
      const attackEvents: SimulatedEvent[] = []; // Replace with actual attack events
      
      const allEvents = generateRealisticLogVolume(attackEvents, {
        ...DEFAULT_NOISE_CONFIG,
        totalEvents: 10000, // 10,000 events with 95% noise
      });
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to initialize simulation:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle alert triage
  function handleTriage(alert: Alert, status: AlertStatus, notes?: string) {
    setAlerts(prevAlerts =>
      prevAlerts.map(a =>
        a.id === alert.id
          ? {
              ...a,
              status,
              notes: notes
                ? [
                    ...(a.notes || []),
                    {
                      id: `note-${Date.now()}`,
                      author: 'Current User',
                      timestamp: new Date(),
                      content: notes,
                      type: 'investigation',
                    },
                  ]
                : a.notes,
            }
          : a
      )
    );
  }

  // Handle bulk actions
  function handleBulkAction(alertIds: string[], action: 'assign' | 'close' | 'escalate') {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert => {
        if (!alertIds.includes(alert.id)) return alert;

        switch (action) {
          case 'assign':
            return { ...alert, assignedTo: 'Your Queue', status: 'Investigating' as AlertStatus };
          case 'close':
            return { ...alert, status: 'Closed' as AlertStatus };
          case 'escalate':
            return { ...alert, status: 'Escalated' as AlertStatus };
          default:
            return alert;
        }
      })
    );
  }

  // Handle query execution
  function handleQueryExecute(query: string, syntax: 'SPL' | 'KQL' | 'ELK') {
    return executeQuery(query, syntax, events);
  }

  // Filter events for selected alert
  const alertEvents = useMemo(() => {
    if (!selectedAlert) return [];
    
    // In a real implementation, you'd link events to alerts via event IDs
    // For now, filter by affected assets or other criteria
    return events.filter(event => {
      const hostname = event.details?.Computer || event.details?.id_orig_h;
      return selectedAlert.affectedAssets.some(asset => 
        hostname?.includes(asset) || asset.includes(hostname || '')
      );
    });
  }, [selectedAlert, events]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
          <div className="h-64 bg-[#161b22] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#c9d1d9]">SOC Simulation Dashboard</h1>
          <p className="text-sm text-[#8b949e] mt-1">
            {alerts.length} alerts • {events.length.toLocaleString()} events
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#8b949e]">
          <div>
            <span className="text-red-400 font-semibold">
              {alerts.filter(a => a.slaTimer.status === 'Breached').length}
            </span>{' '}
            SLA Breached
          </div>
          <div>
            <span className="text-yellow-400 font-semibold">
              {alerts.filter(a => a.slaTimer.status === 'Warning').length}
            </span>{' '}
            SLA Warning
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Alert Queue */}
        <div className="lg:col-span-2 space-y-4">
          <EnhancedAlertQueue
            alerts={alerts}
            onSelectAlert={setSelectedAlert}
            onTriage={handleTriage}
            onBulkAction={handleBulkAction}
            currentUser="Your Queue"
          />
        </div>

        {/* Right Column: Selected Alert Details */}
        <div className="space-y-4">
          {selectedAlert ? (
            <div className="siem-card">
              <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">
                Alert Details
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-[#8b949e]">Ticket Number</div>
                  <div className="text-sm font-mono text-[#c9d1d9]">{selectedAlert.ticketNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e]">Title</div>
                  <div className="text-sm text-[#c9d1d9]">{selectedAlert.title}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e]">Detection Rule</div>
                  <div className="text-sm text-[#c9d1d9]">{selectedAlert.detectionRule}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8b949e]">Affected Assets</div>
                  <div className="text-sm text-[#c9d1d9]">
                    {selectedAlert.affectedAssets.join(', ')}
                  </div>
                </div>
                {selectedAlert.mitreTechniques && selectedAlert.mitreTechniques.length > 0 && (
                  <div>
                    <div className="text-xs text-[#8b949e] mb-1">MITRE Techniques</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAlert.mitreTechniques.map(tech => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#58a6ff] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedAlert.notes && selectedAlert.notes.length > 0 && (
                  <div>
                    <div className="text-xs text-[#8b949e] mb-2">Notes</div>
                    <div className="space-y-2">
                      {selectedAlert.notes.map(note => (
                        <div
                          key={note.id}
                          className="p-2 bg-[#161b22] border border-[#30363d] rounded text-xs"
                        >
                          <div className="text-[#8b949e] mb-1">
                            {note.author} • {note.timestamp.toLocaleString()}
                          </div>
                          <div className="text-[#c9d1d9]">{note.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="siem-card">
              <div className="text-center py-8 text-[#8b949e]">
                Select an alert to view details
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SIEM Query Builder */}
      <div className="mt-6">
        <SIEMQueryBuilder
          events={events}
          onQueryExecute={handleQueryExecute}
          onSaveSearch={(query) => {
            console.log('Saving search:', query);
            // Implement save functionality
          }}
        />
      </div>

      {/* Event Viewer for Selected Alert */}
      {selectedAlert && alertEvents.length > 0 && (
        <div className="mt-6 siem-card">
          <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">
            Related Events ({alertEvents.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alertEvents.slice(0, 50).map((event, idx) => (
              <div
                key={event.id || idx}
                className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono"
              >
                <div className="text-[#8b949e] mb-1">
                  {new Date(event.timestamp).toLocaleString()} • {event.source} •{' '}
                  {event.technique_id || 'N/A'}
                </div>
                <pre className="text-[#c9d1d9] whitespace-pre-wrap break-words">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </div>
            ))}
            {alertEvents.length > 50 && (
              <div className="text-center py-2 text-xs text-[#8b949e]">
                Showing first 50 of {alertEvents.length} events
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Usage Instructions:
 * 
 * 1. Replace this component in your simulation dashboard
 * 2. Connect to your existing SimulationEngine to get attack events
 * 3. Link events to alerts via event IDs in the alert's events array
 * 4. Add persistence layer for saved searches and alert state
 * 5. Integrate with your authentication system for currentUser
 * 6. Add API endpoints for alert updates and query execution
 */


