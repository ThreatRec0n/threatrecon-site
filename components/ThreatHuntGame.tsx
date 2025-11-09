'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Scenario, SecurityAlert, SIEMEvent, AlertClassification } from '@/lib/types';
import EnhancedSIEMDashboard from './EnhancedSIEMDashboard';
import { gradeInvestigation } from '@/lib/scoring';

interface Props {
  scenario: Scenario;
  events: SIEMEvent[];
  onComplete: (result: any) => void;
}

export default function ThreatHuntGame({ scenario, events, onComplete }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [alertClassifications, setAlertClassifications] = useState<Record<string, AlertClassification>>({});
  const [foundIPs, setFoundIPs] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const timeLimit = 
    scenario.difficulty === 'beginner' ? 30 * 60 :
    scenario.difficulty === 'intermediate' ? 20 * 60 :
    15 * 60;

  // Get malicious IPs from scenario
  const maliciousIPs = useMemo(() => {
    const ips = new Set<string>();
    scenario.alerts.forEach(alert => {
      if (alert.correctClassification === 'true-positive' && alert.dstIp) {
        ips.add(alert.dstIp);
      }
    });
    return Array.from(ips);
  }, [scenario]);

  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning || gameOver) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, gameOver]);

  // Check win condition
  useEffect(() => {
    if (foundIPs.size === maliciousIPs.length && maliciousIPs.length > 0) {
      setGameWon(true);
      setIsRunning(false);
      setGameOver(true);
    }
  }, [foundIPs, maliciousIPs]);

  function handleAlertClassify(alertId: string, classification: AlertClassification) {
    setAlertClassifications(prev => ({ ...prev, [alertId]: classification }));
    
    // Check if this is a malicious IP
    const alert = scenario.alerts.find(a => a.id === alertId);
    if (alert && alert.dstIp && classification === 'true-positive' && alert.correctClassification === 'true-positive') {
      setFoundIPs(prev => new Set([...prev, alert.dstIp!]));
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleComplete() {
    const result = gradeInvestigation(scenario, alertClassifications, {}, timeLimit - timeRemaining);
    onComplete({
      ...result,
      gameWon,
      timeRemaining,
      foundIPs: Array.from(foundIPs),
      totalMaliciousIPs: maliciousIPs.length,
    });
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
                {foundIPs.size} / {maliciousIPs.length}
              </div>
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
      </div>

      {/* SIEM Dashboard */}
      <EnhancedSIEMDashboard
        scenarioId={scenario.id}
        alerts={scenario.alerts}
        events={events}
        onAlertClassify={handleAlertClassify}
      />
    </div>
  );
}

