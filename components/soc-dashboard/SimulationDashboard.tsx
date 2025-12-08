'use client';

import { useState, useEffect, useMemo } from 'react';
import LogExplorer from './LogExplorer';
import IOCTaggingPanel from './IOCTaggingPanel';
import TimelinePanel from './TimelinePanel';
import LearningMode from './LearningMode';
import IOCEnrichment from './IOCEnrichment';
import EvaluationReport from './EvaluationReport';
import MitreNavigator from './MitreNavigator';
import InvestigationGuide from './InvestigationGuide';
import ProgressTracker, { markScenarioCompleted } from './ProgressTracker';
import TutorialWalkthrough from '@/components/tutorial/TutorialWalkthrough';
import WelcomeModal from '@/components/tutorial/WelcomeModal';
import { HelpSidebar } from '@/components/ui/ContextualHelp';
import { SkeletonCard, SkeletonTable, SkeletonIOCPanel } from '@/components/ui/SkeletonLoader';
import AchievementUnlockToast from '@/components/achievements/AchievementUnlockToast';
import AlertQueue from '@/components/AlertQueue';
import type { Alert, SimulatedEvent, InvestigationSession } from '@/lib/simulation-engine/core-types';
import type { EvaluationResult } from '@/lib/evaluation-engine';
import { extractIOCsFromEvents } from '@/lib/ioc-extractor';

export default function SimulationDashboard() {
  const [session, setSession] = useState<InvestigationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SimulatedEvent | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [simulationLoaded, setSimulationLoaded] = useState(false);
  
  // Timed mode state
  const [timedMode, setTimedMode] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iocTags, setIocTags] = useState<Record<string, string>>({});
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);

  // Initialize simulation on mount
  useEffect(() => {
    initializeSimulation();
    
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

  // Check if tutorial should be shown after simulation loads
  useEffect(() => {
    if (!session || !simulationLoaded) return;

    // Check URL param for forced tutorial
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tutorial') === 'true') {
        setShowWelcomeModal(true);
        window.history.replaceState({}, '', '/simulation');
        return;
      }
    }

    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('walkthrough_seen_v1') === 'true';
    if (!hasSeenTutorial) {
      // Small delay to ensure UI is fully rendered
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
    }
  }, [session, simulationLoaded]);

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
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  }) => {
    setLoading(true);
    setError(null);
    setSelectedEvent(null);
    setSelectedAlert(null);

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          config: {
            difficulty: config?.difficulty || 'Intermediate',
            scenario_type: config?.story_type || 'ransomware',
          },
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize');
      }

      setSession(data.session);
      setSimulationLoaded(true);
    } catch (err: any) {
      setError(err.message);
      console.error('Simulation error:', err);
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

  // Filter events by selected stage (removed - using all events)

  // Extract IOCs from events using comprehensive extractor
  const extractedIOCs = useMemo(() => {
    if (!session) return { ips: [], domains: [], hashes: [], pids: [] };

    // Use the comprehensive IOC extractor
    return extractIOCsFromEvents(session.events);
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
        attack_chains: [session.attack_chain],
        alerts: session.alerts,
      });

      setEvaluationResult(result);
      
      // Mark scenario as completed
      const scenarioType = session.scenario_name;
      markScenarioCompleted(scenarioType);
      
      // Save progress to localStorage
      const progress = JSON.parse(localStorage.getItem('threatrecon_scenario_progress') || '{}');
      progress[scenarioType] = true;
      localStorage.setItem('threatrecon_scenario_progress', JSON.stringify(progress));

      // Save score
      const scores = JSON.parse(localStorage.getItem('threatrecon_scores') || '[]');
      const skillLevel = result.score >= 90 ? 'Incident Commander' :
                        result.score >= 70 ? 'Threat Hunter' :
                        result.score >= 50 ? 'SOC Analyst' : 'Analyst in Training';
      
      scores.push({
        scenario: scenarioType,
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
          scenario: scenarioType,
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

      // Submit to API
      await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          config: { ioc_tags: iocTags },
        }),
      });

      // Submit results to feedback API
      const submitResponse = await fetch('/api/simulation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationResult: result,
          scenarioType: scenarioType,
          scenarioName: session.scenario_name,
          iocTags: iocTags,
          completionTime: timedMode && startTime ? elapsedTime : undefined,
          timedMode: timedMode,
          userAnswers: result.allClassifications,
        }),
      });

      if (submitResponse.ok) {
        const submitData = await submitResponse.json();
        if (submitData.success && submitData.result?.id) {
          // Store feedback ID for later access
          setLastFeedbackId(submitData.result.id);
          
          // Redirect to feedback page
          window.location.href = `/simulation/feedback/${submitData.result.id}`;
          return; // Exit early to prevent showing modal
        }
      }

      // Check and unlock achievements
      try {
        const achievementResponse = await fetch('/api/achievements/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'simulation_complete',
            eventData: {
              score: result.score,
              time: timedMode && startTime ? elapsedTime : undefined,
              difficulty: session.difficulty.toLowerCase() || 'intermediate',
              scenario: scenarioType,
            },
          }),
        });
        const achievementData = await achievementResponse.json();
        if (achievementData.unlocked && achievementData.unlocked.length > 0) {
          setUnlockedAchievements(achievementData.unlocked);
        }
      } catch (achievementErr) {
        console.error('Error checking achievements:', achievementErr);
        // Don't fail the investigation if achievement check fails
      }
    } catch (err: any) {
      console.error('Error finalizing investigation:', err);
      alert('Error finalizing investigation: ' + err.message);
      setIsLocked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <SkeletonCard />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SkeletonTable />
            <SkeletonTable />
            <SkeletonIOCPanel />
          </div>
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
              
              <a
                href="/leaderboard"
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="View Leaderboard - See top scores and timed challenge results"
                title="View leaderboard with top scores and timed challenge results"
              >
                🏆 Leaderboard
              </a>
              <a
                href="/achievements"
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="View Achievements - See unlocked badges and progress"
                title="View your achievements, badges, and progress"
              >
                🏅 Achievements
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
                onClick={() => {
                  localStorage.removeItem('walkthrough_seen_v1');
                  setShowWelcomeModal(true);
                }}
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                aria-label="Replay Tutorial Walkthrough"
                title="Replay the interactive tutorial walkthrough"
              >
                🎓 Replay Tutorial
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
        {/* Main Layout: Alert Queue + Log Explorer */}
        {session && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-2rem)]">
            {/* LEFT: Alert Queue */}
            <div className="lg:col-span-1">
              <AlertQueue
                alerts={session.alerts}
                onSelectAlert={(alert) => {
                  setSelectedAlert(alert);
                  alert.status = 'Investigating';
                  alert.viewed_at = new Date();
                }}
              />
            </div>
            
            {/* CENTER: Log Explorer */}
            <div className="lg:col-span-2">
              <LogExplorer
                events={session.events}
                selectedEvent={selectedEvent}
                onSelectEvent={setSelectedEvent}
              />
              
              <IOCTaggingPanel
                iocs={extractedIOCs}
                tags={iocTags}
                onTag={(ioc, tag) => setIocTags({ ...iocTags, [ioc]: tag })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Report Modal */}
      {evaluationResult && (
        <EvaluationReport
          result={evaluationResult}
          feedbackId={lastFeedbackId}
          onClose={() => setEvaluationResult(null)}
          onNewInvestigation={() => {
            setEvaluationResult(null);
            setIsLocked(false);
            setIocTags({});
            setSelectedEvent(null);
            setLastFeedbackId(null);
            initializeSimulation();
          }}
        />
      )}

      {/* Investigation Guide */}
      <InvestigationGuide
        scenarioName={session?.scenario_name || 'Active Investigation'}
        attackStages={stages}
        isOpen={false}
        onOpenChange={() => {}}
      />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onStartTutorial={() => {
          setShowWelcomeModal(false);
          // Small delay to ensure modal closes before tutorial opens
          setTimeout(() => {
            setShowTutorial(true);
          }, 200);
        }}
        onSkip={() => {
          setShowWelcomeModal(false);
          localStorage.setItem('walkthrough_seen_v1', 'true');
        }}
      />

      {/* Tutorial Walkthrough */}
      <TutorialWalkthrough
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          localStorage.setItem('walkthrough_seen_v1', 'true');
        }}
        currentPage="simulation"
      />

      {/* Help Sidebar */}
      <HelpSidebar
        isOpen={helpSidebarOpen}
        onClose={() => setHelpSidebarOpen(false)}
      />

      {/* Achievement Unlock Toasts */}
      {unlockedAchievements.map((achievement, index) => (
        <div key={achievement.slug} style={{ top: `${80 + index * 120}px` }} className="fixed right-4 z-[10001]">
          <AchievementUnlockToast
            achievement={achievement}
            onClose={() => {
              setUnlockedAchievements(prev => prev.filter(a => a.slug !== achievement.slug));
            }}
          />
        </div>
      ))}
    </div>
  );
}
