import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [profile, setProfile] = useState({
    rank: 'Trainee',
    xp: 0,
    incidentsHandled: 0,
    avgContainmentTime: 0,
    difficultyTier: 'Trainee',
  });
  const [activeIncidents, setActiveIncidents] = useState(23);
  const [intelFeed, setIntelFeed] = useState([
    'ShadowCobra ransomware exploiting CVE-2025-1182.',
    'Credential stuffing from 212.14.9.201.',
    'APT29 lateral movement via LOLBins.',
  ]);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftProgress, setShiftProgress] = useState(0);
  const [motionBlur, setMotionBlur] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [realTimeScore, setRealTimeScore] = useState(1000);
  const [aiEvents, setAiEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [tickerEvents, setTickerEvents] = useState([]);
  const progressIntervalRef = useRef(null);
  const eventIntervalRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    // Fade-in on page load
    setFadeIn(true);
    
    // Load profile from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('threatReconProfile_v2');
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Progress bar animation during active shift
    if (shiftActive) {
      progressIntervalRef.current = setInterval(() => {
        setShiftProgress(prev => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, 100); // Update every 100ms (10 seconds total for 100%)
      
      // Trigger AI events during active shift (every 15-25 seconds)
      eventIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/events/trigger', { method: 'POST' });
          const event = await response.json();
          
          setAiEvents(prev => [...prev, event]);
          setTickerEvents(prev => [...prev, `${event.title} [${event.severity.toUpperCase()}]`]);
          setCurrentEvent(event);
          setShowEventModal(true);
          
          // Show toast notification
          setToast({
            id: event.id,
            title: event.title,
            severity: event.severity,
          });
          
          // Auto-fade toast after 10 seconds
          setTimeout(() => {
            setToast(null);
          }, 10000);
        } catch (error) {
          console.error('Failed to trigger event:', error);
        }
      }, 15000 + Math.random() * 10000); // Random 15-25 second intervals
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (eventIntervalRef.current) {
        clearInterval(eventIntervalRef.current);
      }
      setShiftProgress(0);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (eventIntervalRef.current) {
        clearInterval(eventIntervalRef.current);
      }
    };
  }, [shiftActive]);

  const handleClockIn = async () => {
    setLoading(true);
    setMotionBlur(true);
    setShiftActive(true);
    
    try {
      const response = await fetch('/api/session/start', { method: 'POST' });
      const sessionData = await response.json();
      
      // Brief delay for motion blur effect
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update profile from API response
      setProfile(prev => ({
        ...prev,
        rank: sessionData.rank || prev.rank,
        xp: sessionData.xp !== undefined ? sessionData.xp : prev.xp,
        incidentsHandled: sessionData.incidentsHandled || prev.incidentsHandled,
        avgContainmentTime: sessionData.avgContainmentTime || prev.avgContainmentTime,
        difficultyTier: sessionData.difficultyTier || prev.difficultyTier,
      }));
      
      // Update intel feed
      if (sessionData.intelFeed && sessionData.intelFeed.length > 0) {
        setIntelFeed(sessionData.intelFeed);
      }
      
      // Update active incidents
      if (sessionData.activeIncidents !== undefined) {
        setActiveIncidents(sessionData.activeIncidents);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('threatReconProfile_v2', JSON.stringify({
          ...profile,
          ...sessionData,
        }));
      }
      
      // Remove motion blur
      setTimeout(() => setMotionBlur(false), 200);
    } catch (error) {
      console.error('Failed to start session:', error);
      setMotionBlur(false);
      setShiftActive(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    setLoading(true);
    setShiftActive(false);
    
    try {
      const actions = ['Isolate Host', 'Block IP'];
      
      const response = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session-${Date.now()}`,
          actions: actions,
        }),
      });
      
      const apiData = await response.json();
      
      // Update profile with XP and rank
      setProfile(prev => {
        const newProfile = {
          ...prev,
          xp: prev.xp + (apiData.xpAwarded || 0),
          incidentsHandled: prev.incidentsHandled + 1,
        };
        
        if (apiData.promoted && apiData.newRank) {
          newProfile.rank = apiData.newRank;
          newProfile.difficultyTier = apiData.newRank;
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('threatReconProfile_v2', JSON.stringify(newProfile));
        }
        
        return newProfile;
      });
      
      // Show review modal with fade-in
      setReview(apiData);
      setShowReview(true);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeReview = () => {
    setShowReview(false);
    setReview(null);
  };

  const beginNewShift = () => {
    closeReview();
    setShiftProgress(0);
    setAiEvents([]);
    setTickerEvents([]);
    setRealTimeScore(1000);
  };

  const handleEventDecision = (decision) => {
    // Store decision in localStorage
    if (typeof window !== 'undefined' && currentEvent) {
      const decisions = JSON.parse(localStorage.getItem('eventDecisions_v1') || '[]');
      decisions.push({
        eventId: currentEvent.id,
        decision: decision,
        timestamp: new Date().toISOString(),
        event: currentEvent,
      });
      localStorage.setItem('eventDecisions_v1', JSON.stringify(decisions));
      
      // Update real-time score based on decision
      let scoreChange = 0;
      if (decision === 'Acknowledge' && currentEvent.severity === 'critical') {
        scoreChange = +50;
      } else if (decision === 'Escalate' && ['high', 'critical'].includes(currentEvent.severity)) {
        scoreChange = +30;
      } else if (decision === 'Ignore' && currentEvent.severity === 'critical') {
        scoreChange = -50;
      } else if (decision === 'Ignore' && currentEvent.severity === 'high') {
        scoreChange = -30;
      } else if (decision === 'Acknowledge') {
        scoreChange = +20;
      } else if (decision === 'Escalate') {
        scoreChange = +10;
      }
      
      setRealTimeScore(prev => Math.max(0, prev + scoreChange));
    }
    
    setShowEventModal(false);
    setCurrentEvent(null);
  };

  return (
    <>
      <Head>
        <title>ThreatRecon SOC Simulator</title>
        <meta name="description" content="An interactive cybersecurity operations simulation dashboard." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00FF88" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans ${fadeIn ? 'fade-in' : 'opacity-0'}`}>
        {/* Persistent Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-blue-400 font-semibold tracking-wide text-sm md:text-base">THREATRECON.IO</div>
          <div className="flex items-center gap-3 text-[10px] md:text-xs">
            <span className="text-gray-400">Rank:</span>
            <span className={`text-yellow-400 font-bold transition-all duration-300 ${motionBlur ? 'motion-blur' : ''}`}>
              {profile.rank}
            </span>
            <span className="text-gray-400">XP:</span>
            <span className={`text-terminal-green font-mono transition-all duration-300 ${motionBlur ? 'motion-blur' : ''}`}>
              {profile.xp}
            </span>
            <span className="hidden md:inline text-gray-400">Tier:</span>
            <span className="hidden md:inline text-orange-400">{profile.difficultyTier}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green pulse-glow"></span>
            </span>
            <span className="text-terminal-green font-mono text-[10px] md:text-xs">NET STATUS: ONLINE</span>
          </div>
        </header>

        <main className="flex-1 pt-[70px] pb-10 px-4 md:px-6 lg:px-8 max-w-[1400px] w-full mx-auto">
          {/* Neon Ticker for Events */}
          {tickerEvents.length > 0 && (
            <div className="mb-4 overflow-hidden bg-gray-900 border border-neon-green rounded-lg h-8 flex items-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 z-10 pointer-events-none"></div>
              <div 
                ref={tickerRef}
                className="flex items-center space-x-8 animate-ticker-scroll whitespace-nowrap text-terminal-green font-mono text-xs"
              >
                {tickerEvents.map((text, idx) => (
                  <span key={idx} className="px-4">{text} •</span>
                ))}
              </div>
            </div>
          )}

          {/* Title Banner */}
          <div className="title-banner fade-in mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-terminal-green font-mono tracking-wider">
              THREATRECON SOC SIMULATOR
            </h1>
          </div>

          {/* Real-time Score Display */}
          <div className="mb-4 text-center">
            <div className="inline-block bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2">
              <span className="text-xs text-gray-400 font-mono">Real-time Score: </span>
              <span className={`text-lg font-bold font-mono ${realTimeScore >= 1000 ? 'text-terminal-green' : realTimeScore >= 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                {realTimeScore}
              </span>
            </div>
          </div>

          {/* Progress Bar (shown during active shift) */}
          {shiftActive && (
            <div className="mb-6 fade-in">
              <div className="text-xs text-gray-400 font-mono mb-2">SHIFT PROGRESS</div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${shiftProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Dashboard Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Multiplayer Placeholder Sidebar */}
            <div className="lg:col-span-1 lg:row-span-3 bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 card-glow fade-in order-3 lg:order-1">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-400 shadow-neon-blue pulse-alert"></span>
                  Active Analysts
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-terminal-green">AI-Echo-1</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green"></span>
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">Investigating phishing campaign</div>
                </div>
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-terminal-green">AI-Echo-2</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green"></span>
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">Monitoring C2 traffic</div>
                </div>
              </div>
            </div>

            {/* Main Content Grid (2 columns on desktop) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 order-1 lg:order-2">
            {/* My Career Card */}
            <div className={`bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col min-h-[220px] card-glow fade-in ${motionBlur ? 'motion-blur' : ''}`}>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-400 shadow-neon-blue"></span>
                  My Career
                </span>
                <span className="text-[9px] text-gray-500 font-mono">internal</span>
              </div>
              <div className="flex-1 space-y-2 text-[11px] md:text-xs font-mono text-gray-300">
                <div className="flex justify-between">
                  <span>Rank</span>
                  <span className="text-blue-400 font-bold transition-all duration-300">{profile.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span>XP</span>
                  <span className="text-terminal-green transition-all duration-300">{profile.xp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Incidents</span>
                  <span className="text-purple-400 transition-all duration-300">{profile.incidentsHandled}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Time</span>
                  <span className="text-yellow-400">{profile.avgContainmentTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Tier</span>
                  <span className="text-orange-400">{profile.difficultyTier}</span>
                </div>
              </div>
            </div>

            {/* Global Threat Map Card */}
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col min-h-[220px] card-glow fade-in">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-red-400 shadow-neon-red pulse-glow"></span>
                  Global Threat Map
                </span>
              </div>
              <div className="relative flex-1 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border border-gray-700/70 overflow-hidden p-4 text-[10px] font-mono text-gray-400">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.4),transparent_60%)]"></div>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_60%,rgba(220,38,38,0.4),transparent_60%)]"></div>
                <div className="relative z-10 leading-tight tracking-tight text-gray-400">
                  WORLD NETWORK OVERLAY ACTIVE<br/>
                  [US-WEST] 5 active probes<br/>
                  [EU-CENTRAL] lateral movement suspected<br/>
                  [APAC] credential attacks observed
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-red-400 animate-pulse">
                  <span className="transition-all duration-300">{activeIncidents} ACTIVE INCIDENTS</span>
                </div>
              </div>
            </div>

            {/* Threat Intel Feed Card */}
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col min-h-[220px] md:col-span-2 card-glow fade-in">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)] pulse-glow"></span>
                  Threat Intel Feed
                </span>
              </div>
              <div className="flex-1 bg-gray-950 border border-gray-700/70 rounded-lg p-2 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-hidden text-[11px] leading-relaxed font-mono text-terminal-green space-y-2">
                  {intelFeed.map((item, idx) => (
                    <div key={idx} className="bg-red-900/20 border-l-4 border-red-500 p-2 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Analyst Feed Card */}
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 flex flex-col min-h-[220px] md:col-span-2 card-glow fade-in">
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.8)] pulse-alert"></span>
                  AI Analyst Feed
                </span>
              </div>
              <div className="flex-1 bg-gray-950 border border-gray-700/70 rounded-lg p-2 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto text-[11px] leading-relaxed font-mono text-gray-300 space-y-2 max-h-[200px]">
                  {aiEvents.length === 0 ? (
                    <div className="text-gray-500 italic text-center py-4">No events yet. Start a shift to begin receiving AI analyst alerts.</div>
                  ) : (
                    aiEvents.map((event, idx) => {
                      const severityClasses = {
                        critical: 'bg-red-900/20 border-l-4 border-red-500 text-severity-critical',
                        high: 'bg-orange-900/20 border-l-4 border-orange-500 text-severity-high',
                        medium: 'bg-yellow-900/20 border-l-4 border-yellow-500 text-severity-medium',
                        low: 'bg-blue-900/20 border-l-4 border-blue-500 text-severity-low',
                      };
                      const className = severityClasses[event.severity] || severityClasses.medium;
                      
                      return (
                        <div key={event.id || idx} className={`${className} p-2 fade-in`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{event.title}</span>
                            <span className="text-[9px] text-gray-500">{event.severity.toUpperCase()}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">{event.description}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Shift Control Card */}
            <div className="bg-gray-900/80 border-2 border-red-500 rounded-xl shadow-xl p-4 flex flex-col md:col-span-2 card-glow fade-in">
              <button
                onClick={handleClockIn}
                disabled={loading || shiftActive}
                className="w-full mt-auto bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] py-3 font-mono tracking-wide transition-all duration-300 hover:scale-105"
              >
                {loading ? 'STARTING...' : shiftActive ? 'SHIFT ACTIVE' : 'CLOCK IN FOR SHIFT'}
              </button>
              {profile.incidentsHandled > 0 && (
                <button
                  onClick={handleEndShift}
                  disabled={loading || !shiftActive}
                  className="w-full mt-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg border border-green-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] py-3 font-mono tracking-wide transition-all duration-300 hover:scale-105"
                >
                  {loading ? 'ENDING...' : 'DISMISS / END SHIFT'}
                </button>
              )}
            </div>
            </div>
          </section>

          {/* Toast Notification */}
          {toast && (
            <div className="fixed bottom-4 right-4 z-[250] animate-slide-in-toast">
              <div className={`bg-gray-900 border-2 rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md ${
                toast.severity === 'critical' ? 'border-severity-critical' :
                toast.severity === 'high' ? 'border-severity-high' :
                'border-severity-medium'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className={`font-bold text-sm font-mono ${
                      toast.severity === 'critical' ? 'text-severity-critical' :
                      toast.severity === 'high' ? 'text-severity-high' :
                      toast.severity === 'medium' ? 'text-severity-medium' :
                      'text-severity-low'
                    }`}>
                      {toast.title}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-1">Incoming Event</div>
                  </div>
                  <button
                    onClick={() => setToast(null)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (currentEvent) {
                      setShowEventModal(true);
                      setToast(null);
                    }
                  }}
                  className="w-full mt-2 bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green text-terminal-green rounded py-2 text-xs font-semibold font-mono transition-all duration-300"
                >
                  RESPOND
                </button>
              </div>
            </div>
          )}

          {/* Event Decision Modal */}
          {showEventModal && currentEvent && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 fade-in">
              <div className="w-full max-w-lg bg-gray-900 border-2 border-neon-green rounded-xl shadow-2xl p-4 flex flex-col gap-4 text-gray-200 font-mono glow-green">
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-lg font-bold mb-2 ${
                      currentEvent.severity === 'critical' ? 'text-severity-critical' :
                      currentEvent.severity === 'high' ? 'text-severity-high' :
                      currentEvent.severity === 'medium' ? 'text-severity-medium' :
                      'text-severity-low'
                    }`}>
                      {currentEvent.title}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      Severity: <span className={`font-semibold ${
                        currentEvent.severity === 'critical' ? 'text-severity-critical' :
                        currentEvent.severity === 'high' ? 'text-severity-high' :
                        currentEvent.severity === 'medium' ? 'text-severity-medium' :
                        'text-severity-low'
                      }`}>{currentEvent.severity.toUpperCase()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setCurrentEvent(null);
                    }}
                    className="text-gray-500 hover:text-gray-300 text-xl"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300 leading-relaxed">
                  {currentEvent.description}
                </div>
                {currentEvent.mitigationHint && (
                  <div className="bg-blue-900/20 border-l-4 border-blue-500 p-3 text-[10px] text-gray-300 italic">
                    <strong>Hint:</strong> {currentEvent.mitigationHint}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEventDecision('Acknowledge')}
                    className="flex-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500 text-green-300 rounded-lg py-2 text-xs font-semibold transition-all duration-300 hover:scale-105"
                  >
                    ACKNOWLEDGE
                  </button>
                  <button
                    onClick={() => handleEventDecision('Escalate')}
                    className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500 text-yellow-300 rounded-lg py-2 text-xs font-semibold transition-all duration-300 hover:scale-105"
                  >
                    ESCALATE
                  </button>
                  <button
                    onClick={() => handleEventDecision('Ignore')}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500 text-red-300 rounded-lg py-2 text-xs font-semibold transition-all duration-300 hover:scale-105"
                  >
                    IGNORE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Review Modal with fade-in */}
          {showReview && review && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 fade-in">
              <div className="w-full max-w-md bg-gray-900 border-2 border-neon-green rounded-xl shadow-2xl p-4 flex flex-col gap-4 text-gray-200 font-mono text-[11px] glow-green">
                <div className="text-center">
                  <div className="text-terminal-green font-bold text-sm tracking-wide">SHIFT COMPLETE</div>
                  <div className="text-3xl font-extrabold text-terminal-green drop-shadow-[0_0_6px_rgba(0,255,136,0.8)]">
                    {review.grade}
                  </div>
                </div>
                <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 text-[11px] text-gray-300 max-h-[140px] overflow-y-auto">
                  <div><strong>Incident:</strong> {review.summary?.incident || 'N/A'}</div>
                  <div><strong>Attacker:</strong> {review.summary?.attacker || 'N/A'}</div>
                  <div><strong>Actions:</strong> {review.summary?.actionsTaken?.join(', ') || 'None'}</div>
                  <div><strong>Containment Time:</strong> {review.summary?.containmentTime || 0}s</div>
                </div>
                <div className="text-center text-[11px] text-blue-400">
                  +{review.xpAwarded || 0} XP (Total: {profile.xp + (review.xpAwarded || 0)})
                </div>
                {review.promoted && (
                  <div className="text-center text-[10px] text-yellow-300 font-semibold">
                    🎉 PROMOTED TO {review.newRank}!
                  </div>
                )}
                <button
                  onClick={beginNewShift}
                  className="w-full bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green text-terminal-green rounded-lg py-2 text-[11px] font-semibold transition-all duration-300 hover:scale-105 glow-green"
                >
                  BEGIN NEW SHIFT
                </button>
                <button
                  onClick={closeReview}
                  className="w-full bg-blue-700/40 border border-blue-500/60 text-blue-200 rounded-lg py-2 text-[11px] font-semibold hover:bg-blue-600/40 transition-all duration-300"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
