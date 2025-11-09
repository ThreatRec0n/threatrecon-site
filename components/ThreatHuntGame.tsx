'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Scenario, SecurityAlert, SIEMEvent, AlertClassification } from '@/lib/types';
import EnhancedSIEMDashboard from './EnhancedSIEMDashboard';
import { gradeInvestigation } from '@/lib/scoring';
import { GameIntegrityMonitor, validateGameStateIntegrity } from '@/lib/anti-cheat';
import { validateIP, validateAlertClassification, sanitizeInput } from '@/lib/security';

interface Props {
  scenario: Scenario;
  events: SIEMEvent[];
  onComplete: (result: any) => void;
}

export default function ThreatHuntGame({ scenario, events, onComplete }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [alertClassifications, setAlertClassifications] = useState<Record<string, AlertClassification>>({});
  const [markedIPs, setMarkedIPs] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const integrityMonitorRef = useRef<GameIntegrityMonitor | null>(null);
  const gameStartTimeRef = useRef<number>(0);

  const timeLimit = 
    scenario.difficulty === 'beginner' ? 30 * 60 :
    scenario.difficulty === 'intermediate' ? 20 * 60 :
    15 * 60;

  // Get malicious IPs from scenario (the actual answer)
  const maliciousIPs = useMemo(() => {
    const ips = new Set<string>();
    scenario.alerts.forEach(alert => {
      if (alert.correctClassification === 'true-positive' && alert.dstIp) {
        ips.add(alert.dstIp);
      }
    });
    return Array.from(ips);
  }, [scenario]);

  // Calculate found IPs - either through alert classification OR direct IP marking
  const foundIPs = useMemo(() => {
    const found = new Set<string>();
    
    // Check marked IPs
    markedIPs.forEach(ip => {
      if (maliciousIPs.includes(ip)) {
        found.add(ip);
      }
    });
    
    // Check alert classifications
    scenario.alerts.forEach(alert => {
      const userClassification = alertClassifications[alert.id] || 'unclassified';
      if (userClassification === 'true-positive' && 
          alert.correctClassification === 'true-positive' && 
          alert.dstIp) {
        found.add(alert.dstIp);
      }
    });
    
    return Array.from(found);
  }, [markedIPs, alertClassifications, scenario.alerts, maliciousIPs]);

  // Calculate incorrectly marked IPs (false positives)
  const incorrectIPs = useMemo(() => {
    const incorrect = new Set<string>();
    markedIPs.forEach(ip => {
      if (!maliciousIPs.includes(ip)) {
        incorrect.add(ip);
      }
    });
    return Array.from(incorrect);
  }, [markedIPs, maliciousIPs]);

  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning || gameOver) return;

    // Initialize integrity monitor
    if (!integrityMonitorRef.current) {
      integrityMonitorRef.current = new GameIntegrityMonitor(timeLimit);
      integrityMonitorRef.current.start();
      gameStartTimeRef.current = Date.now();
    }

    // Use server time reference to prevent client-side time manipulation
    const startTime = Date.now();
    let expectedElapsed = 0;

    const timer = setInterval(() => {
      // Calculate elapsed time based on actual system time
      const actualElapsed = (Date.now() - startTime) / 1000;
      expectedElapsed += 1;
      
      // Detect time manipulation (if actual time differs significantly from expected)
      if (Math.abs(actualElapsed - expectedElapsed) > 2) {
        console.warn('[Security] Time manipulation detected');
        setIsRunning(false);
        setGameOver(true);
        return;
      }

      // Validate integrity
      if (integrityMonitorRef.current && !integrityMonitorRef.current.validateTimeElapsed()) {
        console.warn('[Security] Game integrity violation detected');
        setIsRunning(false);
        setGameOver(true);
        return;
      }

      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsRunning(false);
          setGameOver(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (integrityMonitorRef.current) {
        integrityMonitorRef.current.stop();
      }
    };
  }, [isRunning, gameOver, timeLimit]);

  // Check win condition - must find ALL malicious IPs
  useEffect(() => {
    if (foundIPs.length === maliciousIPs.length && maliciousIPs.length > 0 && foundIPs.length > 0) {
      setGameWon(true);
      setIsRunning(false);
      setGameOver(true);
    }
  }, [foundIPs, maliciousIPs]);

  function handleAlertClassify(alertId: string, classification: AlertClassification) {
    // Validate input
    if (!alertId || typeof alertId !== 'string') return;
    if (!validateAlertClassification(classification)) {
      console.warn('[Security] Invalid alert classification');
      return;
    }
    
    // Sanitize alert ID
    const sanitizedId = sanitizeInput(alertId);
    if (sanitizedId !== alertId) {
      console.warn('[Security] Alert ID contains invalid characters');
      return;
    }
    
    setAlertClassifications(prev => ({ ...prev, [sanitizedId]: classification }));
  }

  function handleIPMarked(ip: string) {
    // Validate IP address
    if (!ip || typeof ip !== 'string') return;
    if (!validateIP(ip)) {
      console.warn('[Security] Invalid IP address format');
      return;
    }
    
    // Sanitize IP
    const sanitizedIP = sanitizeInput(ip);
    if (sanitizedIP !== ip) {
      console.warn('[Security] IP address contains invalid characters');
      return;
    }
    
    setMarkedIPs(prev => {
      const next = new Set(prev);
      if (next.has(sanitizedIP)) {
        next.delete(sanitizedIP);
      } else {
        next.add(sanitizedIP);
      }
      return next;
    });
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleComplete() {
    // Validate game state integrity before completing
    const elapsedTime = gameStartTimeRef.current > 0 
      ? (Date.now() - gameStartTimeRef.current) / 1000 
      : timeLimit - timeRemaining;
    
    const integrityCheck = validateGameStateIntegrity(
      { score: 0, foundIPs: Array.from(foundIPs), timeSpent: elapsedTime },
      gameStartTimeRef.current || Date.now(),
      timeLimit
    );
    
    if (!integrityCheck.valid) {
      console.error('[Security] Game integrity check failed:', integrityCheck.reason);
      // Still allow completion but flag the issue
    }
    
    // Enhanced scoring that accounts for both methods
    const result = gradeInvestigation(scenario, alertClassifications, {}, elapsedTime);
    
    // Calculate IP accuracy
    const correctIPs = foundIPs.length;
    const totalIPs = maliciousIPs.length;
    const falsePositives = incorrectIPs.length;
    const missedIPs = maliciousIPs.filter(ip => !foundIPs.includes(ip));
    
    // Adjust score based on IP finding accuracy
    const ipAccuracy = totalIPs > 0 ? (correctIPs / totalIPs) * 100 : 0;
    const falsePositivePenalty = Math.max(0, 100 - (falsePositives * 10)); // -10% per false positive
    const adjustedScore = Math.max(0, Math.min(100, Math.round(
      (result.percentage * 0.7) + (ipAccuracy * 0.3) * (falsePositivePenalty / 100)
    )));
    
    // Validate final score
    if (adjustedScore < 0 || adjustedScore > 100 || isNaN(adjustedScore)) {
      console.error('[Security] Invalid score calculated');
      return;
    }
    
    // Get integrity violations if any
    const violations = integrityMonitorRef.current?.getViolations() || [];
    
    onComplete({
      ...result,
      score: adjustedScore,
      percentage: adjustedScore,
      gameWon,
      timeRemaining,
      foundIPs: Array.from(foundIPs).sort(), // Sort for consistency
      totalMaliciousIPs: maliciousIPs.length,
      correctIPs,
      falsePositives: incorrectIPs.length,
      missedIPs,
      ipAccuracy: Math.round(ipAccuracy),
      integrityViolations: violations,
      integrityValid: integrityCheck.valid,
    });
    
    // Clean up
    if (integrityMonitorRef.current) {
      integrityMonitorRef.current.stop();
    }
  }

  if (!isRunning && !gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-[#c9d1d9]">Ready to Start?</h2>
          <p className="text-[#8b949e]">Click the button below to begin the timer</p>
          <button
            onClick={() => setIsRunning(true)}
            className="btn-primary px-8 py-3 text-lg"
          >
            Start Timer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Game Header with Timer */}
      <div className="siem-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Time Remaining</div>
              <div className={`text-2xl font-bold font-mono ${
                timeRemaining < 300 ? 'text-red-400 animate-pulse' :
                timeRemaining < 600 ? 'text-orange-400' :
                'text-[#3fb950]'
              }`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-1">Malicious IPs Found</div>
              <div className="text-2xl font-bold text-[#c9d1d9]">
                {foundIPs.length} / {maliciousIPs.length}
              </div>
              {incorrectIPs.length > 0 && (
                <div className="text-xs text-orange-400 mt-1">
                  {incorrectIPs.length} incorrect mark{incorrectIPs.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
            {gameWon && (
              <div className="px-4 py-2 bg-green-900/40 text-green-400 border border-green-800/60 rounded">
                ✓ All Threats Identified!
              </div>
            )}
            {gameOver && !gameWon && (
              <div className="px-4 py-2 bg-red-900/40 text-red-400 border border-red-800/60 rounded">
                ⚠ Ransomware Deployed
              </div>
            )}
          </div>
          {gameOver && (
            <button
              onClick={handleComplete}
              className="btn-primary"
            >
              View Results
            </button>
          )}
        </div>
        
        {/* Progress indicator */}
        {maliciousIPs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#30363d]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#8b949e]">Progress:</span>
              <div className="flex-1 bg-[#0d1117] rounded-full h-2">
                <div 
                  className="bg-[#3fb950] h-2 rounded-full transition-all"
                  style={{ width: `${(foundIPs.length / maliciousIPs.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#8b949e]">
                {Math.round((foundIPs.length / maliciousIPs.length) * 100)}%
              </span>
            </div>
            {scenario.difficulty === 'beginner' && foundIPs.length < maliciousIPs.length && (
              <div className="text-xs text-[#8b949e] mt-2">
                💡 Tip: Check alerts for suspicious IPs, or search logs and mark external IPs that look suspicious
              </div>
            )}
          </div>
        )}
      </div>

      {/* SIEM Dashboard */}
      <EnhancedSIEMDashboard
        scenarioId={scenario.id}
        alerts={scenario.alerts}
        events={events}
        onAlertClassify={handleAlertClassify}
        markedIPs={markedIPs}
        onIPMarked={handleIPMarked}
        maliciousIPs={maliciousIPs}
        showFeedback={scenario.showFeedback}
      />
    </div>
  );
}
