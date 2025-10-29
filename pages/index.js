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
  const progressIntervalRef = useRef(null);

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
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setShiftProgress(0);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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
          {/* Title Banner */}
          <div className="title-banner fade-in mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-terminal-green font-mono tracking-wider">
              THREATRECON SOC SIMULATOR
            </h1>
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
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
          </section>

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
