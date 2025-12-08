'use client';

import { useState, useEffect } from 'react';
import LogExplorer from './LogExplorer';
import IOCTaggingPanel from './IOCTaggingPanel';
import TimelinePanel from './TimelinePanel';
import LearningMode from './LearningMode';
import IOCEnrichment from './IOCEnrichment';
import EvaluationReport from './EvaluationReport';
import MitreNavigator from './MitreNavigator';
import InvestigationGuide from './InvestigationGuide';
import TutorialWalkthrough from '@/components/tutorial/TutorialWalkthrough';
import WelcomeModal from '@/components/tutorial/WelcomeModal';
import AchievementUnlockToast from '@/components/achievements/AchievementUnlockToast';
import AlertQueue from '@/components/AlertQueue';
import TechniqueExplainerPanel from '@/components/learning/TechniqueExplainerPanel';
import { DifficultySelector, type Difficulty } from '@/components/simulation/DifficultySelector';
import { MITRE_TECHNIQUES } from '@/lib/learning/mitre-knowledge';
import { getUserLevel } from '@/lib/user/leveling-system';
import ProgressDashboard from '@/components/progress/ProgressDashboard';
import { HintSystem } from '@/components/investigation/HintSystem';
import AttackTimeline from '@/components/scenarios/AttackTimeline';
import WeeklyChallengeCard from '@/components/scenarios/WeeklyChallengeCard';
import type { InvestigationSession, Alert } from '@/lib/simulation-engine';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';
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
  const [iocTags, setIocTags] = useState<Record<string, 'confirmed-threat' | 'suspicious' | 'benign'>>({});
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  const [learningMode, setLearningMode] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [userLevel, setUserLevel] = useState(getUserLevel());
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [hintPenalty, setHintPenalty] = useState(0);
  
  // Simple markScenarioCompleted function
  const markScenarioCompleted = (scenarioType: string) => {
    const progress = JSON.parse(localStorage.getItem('threatrecon_scenario_progress') || '{}');
    progress[scenarioType] = true;
    localStorage.setItem('threatrecon_scenario_progress', JSON.stringify(progress));
  };

  // Initialize simulation on mount
  useEffect(() => {
    // Check for saved difficulty
    const savedDifficulty = localStorage.getItem('selected_difficulty') as Difficulty | null;
    if (savedDifficulty) {
      setDifficulty(savedDifficulty);
      initializeSimulation();
    } else {
      setShowDifficultySelector(true);
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

  // Auto-trigger tutorial on first visit
  useEffect(() => {
    if (!session || !simulationLoaded) return;
    
    const hasCompletedTutorial = localStorage.getItem('threatrecon_tutorial_completed');
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    
    if (!hasCompletedTutorial && !hasSeenWelcome) {
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
    }
  }, [session, simulationLoaded]);

  const openTechniqueExplainer = (techniqueId: string) => {
    setSelectedTechnique(techniqueId);
    setShowExplainer(true);
  };

  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setShowDifficultySelector(false);
    localStorage.setItem('selected_difficulty', selectedDifficulty);
    initializeSimulation();
  };

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
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  }) => {
    setLoading(true);
    setError(null);
    setSelectedEvent(null);
    setSelectedAlert(null);

    try {
      const difficultyToUse = difficulty 
        ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
        : config?.difficulty || 'Intermediate';

      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize',
          config: {
            difficulty: difficultyToUse,
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
  const stages = session ? Array.from(new Set(session.events.map(e => e.stage).filter(Boolean))).sort() : [];

  // Filter events by selected stage (removed - using all events)

  // Extract IOCs from events
  const extractedIOCs = session ? extractIOCsFromEvents(session.events) : { ips: [], domains: [], hashes: [], pids: [] };

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
          
          // Add XP for achievements
          const { addXP, XP_REWARDS } = await import('@/lib/user/leveling-system');
          achievementData.unlocked.forEach((ach: any) => {
            const xpReward = ach.tier === 'platinum' ? XP_REWARDS.achievementLegendary :
                           ach.tier === 'gold' ? XP_REWARDS.achievementEpic :
                           ach.tier === 'silver' ? XP_REWARDS.achievementRare :
                           XP_REWARDS.achievementCommon;
            addXP(xpReward);
          });
          
          // Update user level display
          setUserLevel(getUserLevel());
        }
        
        // Add XP for completing investigation
        const { addXP, XP_REWARDS } = await import('@/lib/user/leveling-system');
        let xpEarned = XP_REWARDS.completeInvestigation;
        if (result.score === 100) {
          xpEarned += XP_REWARDS.perfectScore;
        }
        // Subtract hint penalty
        xpEarned = Math.max(0, xpEarned - hintPenalty);
        const newLevel = addXP(xpEarned);
        setUserLevel(newLevel);
        setHintPenalty(0); // Reset penalty
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  // No session loaded yet
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#8b949e]">Initializing session...</div>
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
              
              {/* XP Progress Bar */}
              {session && (
                <button
                  onClick={() => setShowProgressDashboard(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  title={`Level ${userLevel.level} - ${userLevel.title}`}
                >
                  <span className="text-xs">Lv {userLevel.level}</span>
                  <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min((userLevel.xp / userLevel.xpToNextLevel) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 hidden md:inline">{userLevel.xp}/{userLevel.xpToNextLevel}</span>
                </button>
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
              {difficulty && (
                <span className={`px-3 py-1.5 rounded border text-sm font-semibold ${
                  difficulty === 'beginner' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  difficulty === 'intermediate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                  difficulty === 'advanced' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                  'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('walkthrough_seen_v1');
                  localStorage.removeItem('threatrecon_tutorial_completed');
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
        {/* Weekly Challenge Card */}
        {session && !loading && (
          <div className="mb-4">
            <WeeklyChallengeCard />
          </div>
        )}
        
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
                onOpenTechnique={openTechniqueExplainer}
              />
            </div>
            
            {/* CENTER: Log Explorer */}
            <div className="lg:col-span-2 space-y-4">
              <LogExplorer
                events={session.events}
                selectedStage={selectedEvent?.stage || null}
                onEventSelect={setSelectedEvent}
                onOpenTechnique={openTechniqueExplainer}
              />
              
              {learningMode && selectedEvent && <LearningMode event={selectedEvent} enabled={learningMode} />}
              
              {/* Hint System */}
              {difficulty && selectedAlert && (
                <HintSystem
                  difficulty={difficulty}
                  alertTitle={selectedAlert.title}
                  alertType={selectedAlert.detection_rule.toLowerCase().includes('powershell') ? 'powershell' : undefined}
                  onHintUsed={(cost) => setHintPenalty(prev => prev + cost)}
                />
              )}
              
              {/* Attack Timeline */}
              <AttackTimeline
                events={session.events}
                discoveredIOCs={new Set(Object.keys(iocTags))}
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
      {showWelcomeModal && (
        <WelcomeModal
          onClose={() => setShowWelcomeModal(false)}
          onStartTutorial={() => {
            setShowWelcomeModal(false);
            setShowTutorial(true);
          }}
        />
      )}

      {/* Difficulty Selector */}
      {showDifficultySelector && (
        <DifficultySelector
          onSelect={handleDifficultySelect}
          defaultDifficulty="intermediate"
        />
      )}

      {/* Technique Explainer Panel */}
      <TechniqueExplainerPanel
        technique={selectedTechnique ? MITRE_TECHNIQUES[selectedTechnique] || null : null}
        isOpen={showExplainer}
        onClose={() => {
          setShowExplainer(false);
          setSelectedTechnique(null);
        }}
      />

      {/* Progress Dashboard */}
      {showProgressDashboard && (
        <ProgressDashboard onClose={() => setShowProgressDashboard(false)} />
      )}

      {/* Tutorial Walkthrough */}
      {showTutorial && (
        <TutorialWalkthrough
          onComplete={() => {
            setShowTutorial(false);
            localStorage.setItem('walkthrough_seen_v1', 'true');
            localStorage.setItem('threatrecon_tutorial_completed', 'true');
          }}
          onSkip={() => {
            setShowTutorial(false);
            localStorage.setItem('walkthrough_seen_v1', 'true');
          }}
        />
      )}

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
