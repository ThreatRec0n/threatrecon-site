'use client';

import { useState, useEffect, useMemo } from 'react';
import LogExplorer from './LogExplorer';
import IOCTaggingPanel from './IOCTaggingPanel';
import TimelinePanel from './TimelinePanel';
import LearningMode from './LearningMode';
import IOCEnrichment from './IOCEnrichment';
import EvaluationReport from './EvaluationReport';
import type { SimulatedEvent, GeneratedAlert, AttackChain } from '@/lib/simulation-engine/types';
import type { EvaluationResult } from '@/lib/evaluation-engine';

interface SimulationSession {
  session_id: string;
  scenario_stories: Array<{
    id: string;
    name: string;
    description: string;
    narrative?: {
      background: string;
      incident: string;
      yourRole: string;
    };
  }>;
  events: SimulatedEvent[];
  alerts: GeneratedAlert[];
  attack_chains: AttackChain[];
  start_time: string;
}

export default function SimulationDashboard() {
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [iocTags, setIocTags] = useState<Record<string, 'confirmed-threat' | 'suspicious' | 'benign'>>({});
  const [learningMode, setLearningMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SimulatedEvent | null>(null);
  const [enrichingIOC, setEnrichingIOC] = useState<{ value: string; type: 'ip' | 'domain' | 'hash' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize simulation
  const initializeSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          config: {
            story_type: 'ransomware-deployment',
            difficulty: 'intermediate',
            add_noise: true,
            noise_count: 50,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize simulation');
      }

      setSession(data.session);
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation');
      console.error('Simulation initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique stages from events
  const stages = useMemo(() => {
    if (!session) return [];
    const uniqueStages = new Set(session.events.map(e => e.stage).filter(Boolean));
    return Array.from(uniqueStages).sort();
  }, [session]);

  // Filter events by selected stage
  const filteredEvents = useMemo(() => {
    if (!session) return [];
    if (!selectedStage) return session.events;
    return session.events.filter(e => e.stage === selectedStage);
  }, [session, selectedStage]);

  // Finalize investigation
  const handleFinalizeInvestigation = async () => {
    if (!session || isLocked) return;

    setIsSubmitting(true);
    try {
      // Submit to backend
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          config: {
            session_id: session.session_id,
            ioc_tags: iocTags,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit investigation');
      }

      // Evaluate locally
      const { evaluateInvestigation } = await import('@/lib/evaluation-engine');
      const result = evaluateInvestigation(iocTags, session);
      setEvaluationResult(result);
      setIsLocked(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'Failed to submit investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract IOCs from events
  const extractedIOCs = useMemo(() => {
    if (!session) return { ips: [], domains: [], hashes: [], pids: [] };

    const ips = new Set<string>();
    const domains = new Set<string>();
    const hashes = new Set<string>();
    const pids = new Set<string>();

    session.events.forEach(event => {
      // Extract IPs
      if (event.network_context) {
        if (event.network_context.source_ip) ips.add(event.network_context.source_ip);
        if (event.network_context.dest_ip) ips.add(event.network_context.dest_ip);
      }
      if (event.details?.DestinationIp) ips.add(event.details.DestinationIp);
      if (event.details?.SourceIp) ips.add(event.details.SourceIp);
      if (event.details?.id_orig_h) ips.add(event.details.id_orig_h);
      if (event.details?.id_resp_h) ips.add(event.details.id_resp_h);

      // Extract domains
      if (event.details?.QueryName) domains.add(event.details.QueryName);
      if (event.details?.host) domains.add(event.details.host);
      if (event.details?.query) domains.add(event.details.query);

      // Extract hashes
      if (event.details?.Hashes) {
        const hashMatch = event.details.Hashes.match(/SHA256=([A-Fa-f0-9]+)/);
        if (hashMatch) hashes.add(hashMatch[1]);
      }

      // Extract PIDs
      if (event.process_tree?.process_id) pids.add(event.process_tree.process_id);
      if (event.details?.ProcessId) pids.add(event.details.ProcessId);
    });

    return {
      ips: Array.from(ips).sort(),
      domains: Array.from(domains).sort(),
      hashes: Array.from(hashes).sort(),
      pids: Array.from(pids).sort(),
    };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
          <p className="text-[#8b949e]">Initializing SOC simulation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-xl">⚠️ Error</div>
          <p className="text-[#8b949e]">{error}</p>
          <button onClick={initializeSimulation} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-3xl font-bold text-[#c9d1d9]">SOC Simulation Dashboard</h1>
          <p className="text-[#8b949e]">
            This is a realistic SOC training environment. You'll investigate threats by analyzing logs,
            correlating events, and identifying malicious indicators of compromise (IOCs).
          </p>
          <button onClick={initializeSimulation} className="btn-primary px-8 py-3 text-lg">
            Start New Investigation
          </button>
        </div>
      </div>
    );
  }

  const currentScenario = session.scenario_stories[0];

  return (
    <div className="min-h-screen bg-[#0d1117] p-4 space-y-4">
      {/* Header */}
      <div className="siem-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#c9d1d9]">{currentScenario?.name || 'Active Investigation'}</h1>
            <p className="text-sm text-[#8b949e] mt-1">
              Session: {session.session_id.substring(0, 16)}... | Started: {new Date(session.start_time).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right px-3 py-2 rounded border border-[#30363d] bg-[#0d1117]">
              <div className="text-xs text-[#8b949e]">Events</div>
              <div className="text-xl font-bold text-[#c9d1d9]">{session.events.length}</div>
            </div>
            <div className="text-right px-3 py-2 rounded border border-[#30363d] bg-[#0d1117]">
              <div className="text-xs text-[#8b949e]">Alerts</div>
              <div className="text-xl font-bold text-[#c9d1d9]">{session.alerts.length}</div>
            </div>
            <div className="text-right px-3 py-2 rounded border border-[#30363d] bg-[#0d1117]">
              <div className="text-xs text-[#8b949e]">IOCs Tagged</div>
              <div className="text-xl font-bold text-[#c9d1d9]">
                {Object.keys(iocTags).filter(k => iocTags[k] === 'confirmed-threat' || iocTags[k] === 'suspicious').length}
              </div>
            </div>
            <button
              onClick={() => setLearningMode(!learningMode)}
              disabled={isLocked}
              className={`px-4 py-2 rounded border transition-colors ${
                learningMode
                  ? 'bg-[#58a6ff] text-[#0d1117] border-[#58a6ff]'
                  : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              📘 Learning Mode {learningMode ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleFinalizeInvestigation}
              disabled={isLocked || isSubmitting}
              className={`px-6 py-2 rounded border font-semibold transition-colors ${
                isLocked
                  ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : isLocked ? 'Investigation Locked' : 'Finalize Investigation'}
            </button>
          </div>
        </div>

        {/* Scenario Intro */}
        {currentScenario?.narrative && (
          <div className="mt-4 pt-4 border-t border-[#30363d]">
            <h2 className="text-lg font-semibold text-[#c9d1d9] mb-2">Scenario Background</h2>
            <p className="text-sm text-[#8b949e] mb-2">{currentScenario.narrative.background}</p>
            <p className="text-sm text-[#8b949e] mb-2">{currentScenario.narrative.incident}</p>
            <p className="text-sm text-[#c9d1d9] font-medium">{currentScenario.narrative.yourRole}</p>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Timeline */}
        <div className="lg:col-span-1">
          <TimelinePanel
            stages={stages}
            events={session.events}
            selectedStage={selectedStage}
            onStageSelect={setSelectedStage}
          />
        </div>

        {/* Middle Column: Log Explorer */}
        <div className="lg:col-span-1 space-y-4">
          <LogExplorer
            events={filteredEvents}
            selectedStage={selectedStage}
            onEventSelect={(event) => {
              setSelectedEvent(event);
            }}
          />
          
          {/* Learning Mode Panel */}
          {learningMode && selectedEvent && (
            <LearningMode event={selectedEvent} enabled={learningMode} />
          )}
        </div>

        {/* Right Column: IOC Tagging */}
        <div className="lg:col-span-1 space-y-4">
          <IOCTaggingPanel
            iocs={extractedIOCs}
            tags={iocTags}
            isLocked={isLocked}
            onTagChange={(ioc, tag) => {
              if (!isLocked) {
                setIocTags(prev => ({ ...prev, [ioc]: tag }));
              }
            }}
            onEnrich={(ioc, type) => {
              setEnrichingIOC({ value: ioc, type });
            }}
          />
          
          {/* IOC Enrichment Panel */}
          {enrichingIOC && (
            <IOCEnrichment
              ioc={enrichingIOC.value}
              type={enrichingIOC.type}
              onClose={() => setEnrichingIOC(null)}
            />
          )}
        </div>
      </div>

      {/* Evaluation Report Modal */}
      {evaluationResult && (
        <EvaluationReport
          result={evaluationResult}
          onClose={() => setEvaluationResult(null)}
          onNewInvestigation={() => {
            setEvaluationResult(null);
            setIsLocked(false);
            setIocTags({});
            setSelectedEvent(null);
            setSelectedStage(null);
            initializeSimulation();
          }}
        />
      )}
    </div>
  );
}

