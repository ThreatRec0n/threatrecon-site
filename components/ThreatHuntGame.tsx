'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Scenario, SecurityAlert, SIEMEvent, AlertClassification } from '@/lib/types';
import EnhancedSIEMDashboard from './EnhancedSIEMDashboard';
import { gradeInvestigation } from '@/lib/scoring';
import { validateGameStateIntegrity } from '@/lib/anti-cheat';
import { validateIP, validateAlertClassification, sanitizeInput } from '@/lib/security';
import { updateProgress } from '@/lib/progress-tracking';

interface Props {
  scenario: Scenario;
  events: SIEMEvent[];
  onComplete: (result: any) => void;
}

export default function ThreatHuntGame({ scenario, events, onComplete }: Props) {
  const [alertClassifications, setAlertClassifications] = useState<Record<string, AlertClassification>>({});
  const [markedIPs, setMarkedIPs] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const gameStartTimeRef = useRef<number>(Date.now());

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

  // Initialize game start time
  useEffect(() => {
    if (gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }
  }, []);

  // Check win condition - must find ALL malicious IPs
  useEffect(() => {
    if (foundIPs.length === maliciousIPs.length && maliciousIPs.length > 0 && foundIPs.length > 0) {
      setGameWon(true);
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

  function handleComplete() {
    // Calculate elapsed time
    const elapsedTime = gameStartTimeRef.current > 0 
      ? (Date.now() - gameStartTimeRef.current) / 1000 
      : 0;
    
    // Simplified integrity check without time limit
    const integrityCheck = validateGameStateIntegrity(
      { score: 0, foundIPs: Array.from(foundIPs), timeSpent: elapsedTime },
      gameStartTimeRef.current || Date.now(),
      999999 // Very large time limit (effectively no limit)
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
    
    // Update progress tracking
    const correctClassifications = Object.values(alertClassifications).filter(
      (classification, idx) => {
        const alert = scenario.alerts[idx];
        return alert && classification === alert.correctClassification;
      }
    ).length;
    
    const incorrectClassifications = Object.keys(alertClassifications).length - correctClassifications;
    
    updateProgress(
      scenario.difficulty,
      adjustedScore,
      elapsedTime,
      correctIPs,
      correctClassifications,
      incorrectClassifications
    );
    
    onComplete({
      ...result,
      score: adjustedScore,
      percentage: adjustedScore,
      gameWon,
      timeRemaining: 0, // No timer
      foundIPs: Array.from(foundIPs).sort(), // Sort for consistency
      totalMaliciousIPs: maliciousIPs.length,
      correctIPs,
      falsePositives: incorrectIPs.length,
      missedIPs,
      ipAccuracy: Math.round(ipAccuracy),
      integrityViolations: [],
      integrityValid: integrityCheck.valid,
    });
  }

  return (
    <div className="space-y-4">
      {/* Game Header */}
      <div className="siem-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
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
          </div>
          <button
            onClick={handleComplete}
            className="btn-primary"
          >
            Complete Investigation
          </button>
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
                    showFeedback={false} // Never show feedback during gameplay, only at end
                  />
    </div>
  );
}
