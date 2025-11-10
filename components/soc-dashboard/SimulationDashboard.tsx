'use client';

import { useState, useEffect, useMemo } from 'react';
import LogExplorer from './LogExplorer';
import IOCTaggingPanel from './IOCTaggingPanel';
import TimelinePanel from './TimelinePanel';
import LearningMode from './LearningMode';
import IOCEnrichment from './IOCEnrichment';
import EvaluationReport from './EvaluationReport';
import MitreNavigator from './MitreNavigator';
import PurpleTeamMode from './PurpleTeamMode';
import DetectionRuleBuilder, { type DetectionRule } from '@/components/DetectionRuleBuilder';
import InvestigationGuide from './InvestigationGuide';
import OnboardingModal from './OnboardingModal';
import ScenarioSelector from './ScenarioSelector';
import ProgressTracker, { markScenarioCompleted } from './ProgressTracker';
import CaseNotes, { type CaseNote } from './CaseNotes';
import EvidenceBinder, { type EvidenceItem } from './EvidenceBinder';
import ReportExport from './ReportExport';
import TutorialWalkthrough from '@/components/tutorial/TutorialWalkthrough';
import WelcomeModal from '@/components/tutorial/WelcomeModal';
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
  const [activeView, setActiveView] = useState<'main' | 'mitre' | 'purple' | 'rules' | 'case'>('main');
  const [detectedTechniques, setDetectedTechniques] = useState<string[]>([]);
  const [savedRules, setSavedRules] = useState<DetectionRule[]>([]);
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [showScenarioIntro, setShowScenarioIntro] = useState(true);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  const [currentScenarioType, setCurrentScenarioType] = useState<string>('');
  const [investigationGuideOpen, setInvestigationGuideOpen] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [simulationLoaded, setSimulationLoaded] = useState(false);

  // Initialize simulation on mount
  useEffect(() => {
    initializeSimulation();
    
    // Check if tutorial should be shown from URL param
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tutorial') === 'true') {
        setShowTutorial(true);
        // Clean up URL
        window.history.replaceState({}, '', '/simulation');
      }
    }
    
    // Track simulation visit
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'simulation_visit',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  // Timer effect
  useEffect(() => {
    if (!timedMode || !startTime || isLocked) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [timedMode, startTime, isLocked]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize simulation
  const initializeSimulation = async (config?: {
    story_type?: string;
    stages?: number;
    noise_level?: 'low' | 'medium' | 'high';
  }) => {
    setLoading(true);
    setError(null);
    setIsLocked(false);
    setIocTags({});
    setSelectedEvent(null);
    setSelectedStage(null);
    setEvaluationResult(null);
    setShowScenarioIntro(true);

    try {
      const storyType = config?.story_type || ['ransomware-deployment', 'apt29-cozy-bear', 'credential-harvesting', 'ransomware-lockbit', 'insider-threat'][Math.floor(Math.random() * 5)];
      const noiseCount = config?.noise_level === 'low' ? 25 : config?.noise_level === 'high' ? 100 : 50;

      setCurrentScenarioType(storyType);

      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          config: {
            story_type: storyType,
            difficulty: 'intermediate',
            add_noise: true,
            noise_count: noiseCount,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize simulation');
      }

      setSession(data.session);
      setSimulationLoaded(true);
      
      // Start timer if timed mode is enabled
      if (timedMode) {
        setStartTime(new Date());
        setElapsedTime(0);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation');
      console.error('Simulation initialization error:', err);
      setSimulationLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle scenario regeneration
  const handleRegenerateScenario = (config: {
    story_type: string;
    stages: number;
    noise_level: 'low' | 'medium' | 'high';
  }) => {
    initializeSimulation(config);
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

  // Extract IOCs from events
  const extractedIOCs = useMemo(() => {
    if (!session) return { ips: [], domains: [], hashes: [], pids: [] };

    const ips = new Set<string>();
    const domains = new Set<string>();
    const hashes = new Set<string>();
    const pids = new Set<string>();

    session.events.forEach(event => {
      // Extract IPs from network context
      if (event.network_context) {
        if (event.network_context.source_ip && typeof event.network_context.source_ip === 'string' && !event.network_context.source_ip.startsWith('10.') && !event.network_context.source_ip.startsWith('192.168.')) {
          ips.add(event.network_context.source_ip);
        }
        if (event.network_context.dest_ip && typeof event.network_context.dest_ip === 'string' && !event.network_context.dest_ip.startsWith('10.') && !event.network_context.dest_ip.startsWith('192.168.')) {
          ips.add(event.network_context.dest_ip);
        }
        // Domains are typically in details, not network_context
      }

      // Extract from details
      if (event.details) {
        if (event.details.DestinationIp && typeof event.details.DestinationIp === 'string') {
          const ip = event.details.DestinationIp;
          if (!ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('127.')) {
            ips.add(ip);
          }
        }
        if (event.details.QueryName && typeof event.details.QueryName === 'string') {
          domains.add(event.details.QueryName);
        }
        if (event.details.Hash && typeof event.details.Hash === 'string') {
          hashes.add(event.details.Hash);
        }
        if (event.details.ProcessId && typeof event.details.ProcessId === 'string') {
          pids.add(event.details.ProcessId);
        }
      }
    });

    return {
      ips: Array.from(ips).sort(),
      domains: Array.from(domains).sort(),
      hashes: Array.from(hashes).sort(),
      pids: Array.from(pids).sort(),
    };
  }, [session]);

  // Finalize investigation
  const handleFinalizeInvestigation = async () => {
    if (!session || isLocked) return;

    setIsSubmitting(true);
    try {
      // Lock the investigation
      setIsLocked(true);

      // Import evaluation engine
      const { evaluateInvestigation } = await import('@/lib/evaluation-engine');
      
      // Evaluate the investigation
      const result = evaluateInvestigation(iocTags, {
        events: session.events,
        attack_chains: session.attack_chains,
        alerts: session.alerts,
      });

      setEvaluationResult(result);
      
      // Mark scenario as completed
      if (currentScenarioType) {
        markScenarioCompleted(currentScenarioType);
      }
      
      // Save progress to localStorage
      const progress = JSON.parse(localStorage.getItem('threatrecon_scenario_progress') || '{}');
      if (currentScenarioType) {
        progress[currentScenarioType] = true;
        localStorage.setItem('threatrecon_scenario_progress', JSON.stringify(progress));
      }

      // Save score
      const scores = JSON.parse(localStorage.getItem('threatrecon_scores') || '[]');
      const skillLevel = result.score >= 90 ? 'Incident Commander' :
                        result.score >= 70 ? 'Threat Hunter' :
                        result.score >= 50 ? 'SOC Analyst' : 'Analyst in Training';
      
      scores.push({
        scenario: currentScenarioType,
        score: result.score,
        timestamp: new Date().toISOString(),
        skill_level: skillLevel,
      });
      localStorage.setItem('threatrecon_scores', JSON.stringify(scores));

      // Save to leaderboard if timed mode
      if (timedMode && startTime) {
        const completionTime = elapsedTime;
        const leaderboardEntry = {
          score: result.score,
          time: completionTime,
          scenario: currentScenarioType,
          timestamp: new Date().toISOString(),
          skillLevel: skillLevel,
        };
        
        // Save to localStorage
        const leaderboard = JSON.parse(localStorage.getItem('threatrecon_leaderboard') || '[]');
        leaderboard.push(leaderboardEntry);
        // Keep only top 100 entries
        leaderboard.sort((a: any, b: any) => {
          // Sort by score first, then by time (faster is better)
          if (b.score !== a.score) return b.score - a.score;
          return a.time - b.time;
        });
        localStorage.setItem('threatrecon_leaderboard', JSON.stringify(leaderboard.slice(0, 100)));
      }
      
      // Update detected techniques based on evaluation
      const detected = new Set<string>();
      session.events.forEach(event => {
        if (event.technique_id && result.breakdown.truePositives > 0) {
          // If IOC from this technique was correctly tagged, mark as detected
          const iocsFromEvent = extractedIOCs.ips.concat(extractedIOCs.domains, extractedIOCs.hashes);
          const hasCorrectTag = iocsFromEvent.some(ioc => 
            iocTags[ioc] === 'confirmed-threat' || iocTags[ioc] === 'suspicious'
          );
          if (hasCorrectTag) {
            detected.add(event.technique_id);
          }
        }
      });
      setDetectedTechniques(Array.from(detected));

      // Submit to API
      await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          config: { ioc_tags: iocTags },
        }),
      });
    } catch (err: any) {
      console.error('Error finalizing investigation:', err);
      alert('Error finalizing investigation: ' + err.message);
      setIsLocked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
          <p className="text-[#8b949e]">Initializing SOC simulation environment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full siem-card text-center space-y-4">
          <div className="text-red-400 text-xl">⚠️ Error Loading Simulation</div>
          <p className="text-[#8b949e]">{error}</p>
          <button onClick={() => initializeSimulation()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No session state
  if (!session) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl font-bold text-[#c9d1d9]">SOC Simulation Dashboard</h1>
          <p className="text-lg text-[#8b949e]">
            Advanced threat hunting and investigation training environment. Analyze multi-stage attack chains,
            correlate events across log sources, and identify malicious IOCs using professional SOC workflows.
          </p>
          <button onClick={() => initializeSimulation()} className="btn-primary px-8 py-3 text-lg">
            Start New Investigation
          </button>
        </div>
      </div>
    );
  }

  const currentScenario = session.scenario_stories[0];

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top Navigation Bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50 shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-[#c9d1d9]">ThreatRecon SOC Platform</h1>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1.5 rounded border border-[#30363d] bg-[#0d1117]">
                  <span className="text-[#8b949e]">Session: </span>
                  <span className="text-[#c9d1d9] font-mono">{session.session_id.substring(0, 12)}...</span>
                </div>
                <div className="px-3 py-1.5 rounded border border-[#30363d] bg-[#0d1117]">
                  <span className="text-[#8b949e]">Events: </span>
                  <span className="text-[#c9d1d9] font-bold">{session.events.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded border border-[#30363d] bg-[#0d1117]">
                  <span className="text-[#8b949e]">Alerts: </span>
                  <span className="text-[#c9d1d9] font-bold">{session.alerts.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded border border-[#30363d] bg-[#0d1117]">
                  <span className="text-[#8b949e]">IOCs: </span>
                  <span className="text-[#c9d1d9] font-bold">
                    {Object.keys(iocTags).filter(k => iocTags[k] === 'confirmed-threat' || iocTags[k] === 'suspicious').length}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Timer Display */}
              {timedMode && startTime && (
                <div className="px-3 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono text-sm">
                  ⏱️ {formatTime(elapsedTime)}
                </div>
              )}
              
              {/* Timed Mode Toggle */}
              <button
                onClick={() => {
                  const newTimedMode = !timedMode;
                  setTimedMode(newTimedMode);
                  if (newTimedMode && session && !startTime) {
                    setStartTime(new Date());
                    setElapsedTime(0);
                  } else if (!newTimedMode) {
                    setStartTime(null);
                    setElapsedTime(0);
                  }
                }}
                disabled={isLocked}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                  timedMode
                    ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800/60'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff]'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-[#58a6ff]`}
                aria-label={timedMode ? "Timed mode is ON - Your investigation time is being tracked" : "Timed mode is OFF - Click to enable timed challenge mode"}
                title={timedMode ? "Timed mode enabled - Your completion time will be recorded" : "Enable timed mode to track your investigation speed"}
              >
                {timedMode ? '⏱️ Timed ON' : '⏱️ Timed OFF'}
              </button>
              
              <ProgressTracker />
              <button
                onClick={() => setShowScenarioSelector(true)}
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="Open Scenario Settings - Customize attack scenario type, stages, and noise level"
                title="Customize scenario type, attack stages, and noise level"
              >
                🧬 Scenario Settings
              </button>
              
              <a
                href="/leaderboard"
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="View Leaderboard - See top scores and timed challenge results"
                title="View leaderboard with top scores and timed challenge results"
              >
                🏆 Leaderboard
              </a>
              
              <div className="relative group">
              <button
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="Documentation Menu - View lab plans and documentation"
                aria-haspopup="true"
                aria-expanded="false"
                title="View documentation and lab plans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const menu = document.getElementById('docs-menu');
                    if (menu) {
                      menu.classList.toggle('opacity-0');
                      menu.classList.toggle('invisible');
                    }
                  }
                }}
              >
                📚 Docs
              </button>
                <div
                  id="docs-menu"
                  className="absolute top-full left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
                  role="menu"
                >
                  <a
                    href="/docs?doc=comprehensive"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-[#58a6ff] border-b border-[#30363d] first:rounded-t focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    📘 Lab Plan & Docs
                  </a>
                  <a
                    href="/docs?doc=ultimate"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-[#58a6ff] border-b border-[#30363d] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    🎯 Ultimate Free Lab
                  </a>
                  <a
                    href="/phoenix"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] hover:text-[#58a6ff] last:rounded-b focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    🔥 Phoenix Blueprint
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowTutorial(true)}
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="Replay Tutorial Walkthrough"
                title="Replay the interactive tutorial walkthrough"
              >
                🎓 Replay Tutorial
              </button>
              <button
                onClick={() => setLearningMode(!learningMode)}
                disabled={isLocked}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                  learningMode
                    ? 'bg-[#58a6ff] text-[#0d1117] border-[#58a6ff]'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff]'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-[#58a6ff]`}
                aria-label={`Toggle Learning Mode ${learningMode ? 'OFF' : 'ON'} - Show MITRE technique definitions and detection tips`}
                title={learningMode ? "Learning mode ON - Click to hide educational overlays" : "Learning mode OFF - Click to show MITRE definitions and detection tips"}
              >
                📘 Learning {learningMode ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setActiveView(activeView === 'mitre' ? 'main' : 'mitre')}
                className={`px-3 py-1.5 rounded border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  activeView === 'mitre'
                    ? 'bg-purple-900/40 text-purple-400 border-purple-800/60'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-purple-800/60'
                }`}
                aria-label={activeView === 'mitre' ? "Close MITRE ATT&CK Navigator and return to main view" : "Open MITRE ATT&CK Navigator - View attack techniques matrix"}
                title={activeView === 'mitre' ? "Close MITRE Navigator" : "View MITRE ATT&CK techniques matrix for this scenario"}
              >
                🎯 ATT&CK Navigator
              </button>
              <button
                onClick={() => setActiveView(activeView === 'purple' ? 'main' : 'purple')}
                className={`px-3 py-1.5 rounded border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  activeView === 'purple'
                    ? 'bg-orange-900/40 text-orange-400 border-orange-800/60'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-orange-800/60'
                }`}
                aria-label={activeView === 'purple' ? "Close Purple Team Mode and return to main view" : "Open Purple Team Mode - Execute attacks and test detections"}
                title={activeView === 'purple' ? "Close Purple Team Mode" : "Purple Team Mode - Execute Atomic Red Team techniques and test detections"}
              >
                🟣 Purple Team
              </button>
              <button
                onClick={() => setActiveView(activeView === 'rules' ? 'main' : 'rules')}
                className={`px-3 py-1.5 rounded border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  activeView === 'rules'
                    ? 'bg-green-900/40 text-green-400 border-green-800/60'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-green-800/60'
                }`}
                aria-label={activeView === 'rules' ? "Close Detection Rule Builder and return to main view" : "Open Detection Rule Builder - Create Sigma, YARA, and KQL rules"}
                title={activeView === 'rules' ? "Close Detection Rule Builder" : "Detection Rule Builder - Create and test detection rules (Sigma, YARA, KQL)"}
              >
                📝 Detection Rules
              </button>
              <button
                onClick={() => setActiveView(activeView === 'case' ? 'main' : 'case')}
                className={`px-3 py-1.5 rounded border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeView === 'case'
                    ? 'bg-blue-900/40 text-blue-400 border-blue-800/60'
                    : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-blue-800/60'
                }`}
                aria-label={activeView === 'case' ? "Close Case Notes and return to main view" : "Open Case Notes - Document investigation findings"}
                title={activeView === 'case' ? "Close Case Notes" : "Case Notes - Document findings, attach evidence, and export reports"}
              >
                📋 Case Notes
              </button>
              <button
                onClick={handleFinalizeInvestigation}
                disabled={isLocked || isSubmitting}
                data-tutorial="finalize-button"
                className={`px-4 py-1.5 rounded border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  isLocked
                    ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                }`}
                aria-label={isLocked ? "Investigation already finalized" : "Finalize investigation and view evaluation report with score and skill badge"}
                title={isLocked ? "Investigation has been finalized" : "Submit your investigation for evaluation and receive a score with skill badge"}
              >
                {isSubmitting ? 'Submitting...' : isLocked ? 'Locked' : '✅ Finalize Investigation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4">
        {/* Scenario Introduction Banner */}
        {showScenarioIntro && currentScenario?.narrative && (
          <div className="mb-4 siem-card border-l-4 border-[#58a6ff]" data-tutorial="scenario-intro">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold text-[#c9d1d9]">{currentScenario.name}</h2>
                  <button
                    onClick={() => setShowScenarioIntro(false)}
                    className="text-[#8b949e] hover:text-[#c9d1d9] text-sm"
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[#8b949e] font-semibold">Background: </span>
                    <span className="text-[#c9d1d9]">{currentScenario.narrative.background}</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] font-semibold">Incident: </span>
                    <span className="text-[#c9d1d9]">{currentScenario.narrative.incident}</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] font-semibold">Your Role: </span>
                    <span className="text-[#c9d1d9]">{currentScenario.narrative.yourRole}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {activeView === 'mitre' && (
          <div className="mb-4" data-tutorial="mitre-navigator">
            <MitreNavigator
              events={session.events}
              attackChains={session.attack_chains}
              detectedTechniques={detectedTechniques}
            />
          </div>
        )}

        {activeView === 'purple' && (
          <div className="mb-4">
            <PurpleTeamMode
              events={session.events}
              onExecuteAttack={async (techniqueId) => {
                try {
                  const response = await fetch('/api/simulation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'execute_attack',
                      config: {
                        technique_id: techniqueId,
                        session_id: session.session_id,
                      },
                    }),
                  });
                  const data = await response.json();
                  if (data.success && data.events) {
                    const sessionResponse = await fetch('/api/simulation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'get_session' }),
                    });
                    const sessionData = await sessionResponse.json();
                    if (sessionData.success) {
                      setSession(sessionData.session);
                    }
                  }
                } catch (err) {
                  console.error('Error executing attack:', err);
                }
              }}
              onTestDetection={(rule) => {
                rule.mitreTechniques.forEach(tech => {
                  if (!detectedTechniques.includes(tech)) {
                    setDetectedTechniques(prev => [...prev, tech]);
                  }
                });
              }}
            />
          </div>
        )}

        {activeView === 'rules' && (
          <div className="mb-4">
            <DetectionRuleBuilder
              onSave={(rule) => {
                setSavedRules(prev => [...prev, rule]);
                rule.mitreTechniques.forEach(tech => {
                  if (!detectedTechniques.includes(tech)) {
                    setDetectedTechniques(prev => [...prev, tech]);
                  }
                });
              }}
              onTest={(rule) => {
                console.log('Testing rule:', rule);
              }}
            />
          </div>
        )}

        {activeView === 'case' && session && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <CaseNotes
              scenarioId={session.session_id}
              onNotesChange={setCaseNotes}
            />
            <EvidenceBinder
              scenarioId={session.session_id}
              onEvidenceChange={setEvidence}
            />
          </div>
        )}

        {activeView === 'case' && session && (
          <div className="mb-4">
            <ReportExport
              scenarioName={currentScenario?.name || 'Active Investigation'}
              scenarioId={session.session_id}
              notes={caseNotes}
              evidence={evidence}
              events={session.events}
              evaluationResult={evaluationResult}
              iocTags={iocTags}
              onExport={(format) => {
                console.log('Exporting report in format:', format);
                // Export logic is handled in ReportExport component
              }}
            />
          </div>
        )}

        {/* Main 3-Column Layout */}
        {activeView === 'main' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column: Timeline & Navigator */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <TimelinePanel
                stages={stages}
                events={session.events}
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
              />
              <div className="siem-card p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Quick Stats</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">High Threat Events:</span>
                    <span className="text-red-400 font-semibold">
                      {session.events.filter(e => (e.threat_score || 0) >= 70).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Attack Stages:</span>
                    <span className="text-[#c9d1d9] font-semibold">{stages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Techniques Observed:</span>
                    <span className="text-[#c9d1d9] font-semibold">
                      {new Set(session.events.map(e => e.technique_id).filter(Boolean)).size}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Log Explorer & Learning Mode */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              <div data-tutorial="log-explorer">
                <LogExplorer
                  events={filteredEvents}
                  selectedStage={selectedStage}
                  onEventSelect={(event) => {
                    setSelectedEvent(event);
                  }}
                />
              </div>
              {learningMode && selectedEvent && (
                <LearningMode event={selectedEvent} enabled={learningMode} />
              )}
            </div>

            {/* Right Column: IOC Tagging & Enrichment */}
            <div className="col-span-12 lg:col-span-3 space-y-4" data-tutorial="ioc-panel">
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
              {enrichingIOC && (
                <IOCEnrichment
                  ioc={enrichingIOC.value}
                  type={enrichingIOC.type}
                  onClose={() => setEnrichingIOC(null)}
                />
              )}
            </div>
          </div>
        )}
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
            setDetectedTechniques([]);
            initializeSimulation();
          }}
        />
      )}

      {/* Investigation Guide */}
      <InvestigationGuide
        scenarioName={currentScenario?.name || 'Active Investigation'}
        attackStages={stages}
        isOpen={investigationGuideOpen}
        onOpenChange={setInvestigationGuideOpen}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        onOpenGuide={() => {
          setInvestigationGuideOpen(true);
        }}
        onStart={() => {
          // Modal will close itself
        }}
      />

      {/* Scenario Selector */}
      <ScenarioSelector
        isOpen={showScenarioSelector}
        onClose={() => setShowScenarioSelector(false)}
        onRegenerate={handleRegenerateScenario}
      />

      {/* Tutorial Walkthrough */}
      <TutorialWalkthrough
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          localStorage.setItem('walkthrough_seen', 'true');
        }}
        currentPage="simulation"
      />
    </div>
  );
}
