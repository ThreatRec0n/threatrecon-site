'use client';

import { useState } from 'react';
import type { DifficultyLevel, Scenario } from '@/lib/types';
import DifficultySelector from '@/components/DifficultySelector';
import ScenarioIntroduction from '@/components/ScenarioIntroduction';
import ThreatHuntGame from '@/components/ThreatHuntGame';
import { generateRealisticScenario } from '@/lib/realistic-scenario-generator';
import { validateDifficultyLevel, validateScenario } from '@/lib/security';

// Base scenario templates
const SCENARIO_TEMPLATES: Partial<Record<DifficultyLevel, Scenario>> = {
  grasshopper: {
    id: 'ransomware-threat-grasshopper',
    title: 'Ransomware Threat - Learning Mode',
    difficulty: 'grasshopper',
    type: 'ransomware',
    order: 0,
    narrative: {
      background: 'Welcome to Learning Mode! You are a new security analyst learning the ropes. This is a safe environment where you can explore and learn without pressure. Every alert and event has detailed explanations to help you understand what to look for and why.',
      incident: 'A simulated ransomware threat has been detected in the network. This is a training scenario designed to teach you how to identify malicious IP addresses and understand security alerts. Take your time, explore the explanations, and learn at your own pace.',
      yourRole: 'Your goal is to learn how to identify malicious IPs by exploring alerts and events. Click on any alert or event to see detailed explanations, MITRE ATT&CK techniques, investigation steps, and real-world examples. There\'s no time pressure - focus on learning!',
      timeline: 'This is a learning scenario - take as much time as you need to explore and understand the concepts.',
    },
    logFiles: [],
    logTypes: ['zeek', 'suricata', 'windows-event'],
    questions: [],
    solution: {
      summary: 'Three malicious IPs were identified. In learning mode, you can see detailed explanations for each.',
      keyFindings: [],
      mitreTechniques: ['T1071.001', 'T1059.001', 'T1048'],
      recommendations: [],
      truePositives: [],
      falsePositives: [],
    },
    estimatedTime: 45,
    tags: ['ransomware', 'learning', 'tutorial'],
    showFeedback: true,
    gradingCriteria: {
      classificationWeight: 0.5,
      investigationWeight: 0.3,
      timeWeight: 0.2,
    },
    alerts: [],
  },
  beginner: {
    id: 'ransomware-threat-beginner',
    title: 'Ransomware Threat - Beginner',
    difficulty: 'beginner',
    type: 'ransomware',
    order: 1,
    narrative: {
      background: 'You are a junior security analyst at TechCorp, a mid-sized technology company. It\'s Monday morning, and you\'ve just received an alert from your SIEM about suspicious network activity detected over the weekend.',
      incident: 'Initial investigation shows that an employee clicked on a phishing email on Friday afternoon. The email contained a malicious attachment that appears to have installed malware on their workstation. Your security team has detected unusual outbound connections, but the full scope of the compromise is unknown.',
      yourRole: 'Your mission is to identify all malicious IP addresses that the malware is communicating with. These IPs are part of a ransomware command and control infrastructure. You must find and block them before the attackers deploy ransomware across the network.',
      timeline: 'Phishing email clicked: Friday, 2:30 PM | Malware detected: Saturday, 10:15 AM | Current time: Monday, 9:00 AM | Ransomware deployment estimated: Monday, 9:30 AM (30 minutes from now)',
    },
    logFiles: [],
    logTypes: ['zeek', 'suricata', 'windows-event'],
    questions: [],
    solution: {
      summary: 'Three malicious IPs were identified as part of the ransomware C2 infrastructure.',
      keyFindings: [],
      mitreTechniques: ['T1071.001', 'T1566.001'],
      recommendations: [],
      truePositives: [],
      falsePositives: [],
    },
    estimatedTime: 30,
    tags: ['ransomware', 'phishing', 'c2'],
    showFeedback: true,
    gradingCriteria: {
      classificationWeight: 0.6,
      investigationWeight: 0.3,
      timeWeight: 0.1,
    },
    alerts: [],
  },
  intermediate: {
    id: 'ransomware-threat-intermediate',
    title: 'Ransomware Threat - Intermediate',
    difficulty: 'intermediate',
    type: 'ransomware',
    order: 2,
    narrative: {
      background: 'You are a security analyst at GlobalTech Industries. Over the past 48 hours, your organization has been experiencing intermittent network issues and unusual system behavior. Initial scans have revealed nothing, but your gut tells you something is wrong.',
      incident: 'A sophisticated phishing campaign targeted multiple employees last week. While most didn\'t fall for it, security logs show that at least one workstation established connections to external IPs that don\'t match any known business services. The threat actors appear to be preparing for a ransomware deployment.',
      yourRole: 'You need to identify the malicious IP addresses that are part of the attack infrastructure. Time is critical - the attackers are likely preparing to deploy ransomware across the network. Find the IPs before it\'s too late.',
      timeline: 'Phishing campaign: Last Tuesday | First suspicious activity: Thursday, 11:00 PM | Current time: Monday, 8:00 AM | Estimated ransomware deployment: Monday, 8:20 AM (20 minutes from now)',
    },
    logFiles: [],
    logTypes: ['zeek', 'suricata', 'windows-event'],
    questions: [],
    solution: {
      summary: 'Two malicious IPs were identified as part of the ransomware C2 infrastructure.',
      keyFindings: [],
      mitreTechniques: ['T1071.001', 'T1048'],
      recommendations: [],
      truePositives: [],
      falsePositives: [],
    },
    estimatedTime: 20,
    tags: ['ransomware', 'advanced-persistent-threat'],
    showFeedback: false,
    gradingCriteria: {
      classificationWeight: 0.7,
      investigationWeight: 0.2,
      timeWeight: 0.1,
    },
    alerts: [],
  },
  advanced: {
    id: 'ransomware-threat-advanced',
    title: 'Ransomware Threat - Advanced',
    difficulty: 'advanced',
    type: 'ransomware',
    order: 3,
    narrative: {
      background: 'You are a senior security analyst at a critical infrastructure organization. Your threat intelligence team has identified indicators that a known ransomware group has been conducting reconnaissance on your network for the past two weeks.',
      incident: 'The attackers have been extremely careful, using legitimate-looking traffic patterns and rotating through multiple IP addresses. Only one IP address in your logs is actually malicious - the rest is noise. The ransomware deployment is imminent, and you have very little time to identify the threat.',
      yourRole: 'Find the single malicious IP address that is part of the ransomware infrastructure. The attackers have hidden their tracks well, and most of what you\'ll see is normal network traffic. Trust your instincts and look for the subtle indicators.',
      timeline: 'Reconnaissance began: 2 weeks ago | Current time: Monday, 7:45 AM | Estimated ransomware deployment: Monday, 8:00 AM (15 minutes from now)',
    },
    logFiles: [],
    logTypes: ['zeek', 'suricata', 'windows-event'],
    questions: [],
    solution: {
      summary: 'One malicious IP was identified as part of the ransomware C2 infrastructure.',
      keyFindings: [],
      mitreTechniques: ['T1071.001', 'T1048', 'T1021.002'],
      recommendations: [],
      truePositives: [],
      falsePositives: [],
    },
    estimatedTime: 15,
    tags: ['ransomware', 'apt', 'stealth'],
    showFeedback: false,
    gradingCriteria: {
      classificationWeight: 0.8,
      investigationWeight: 0.1,
      timeWeight: 0.1,
    },
    alerts: [],
  },
};

export default function Home() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null);
  const [gameScenario, setGameScenario] = useState<ReturnType<typeof generateRealisticScenario> | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  function handleDifficultySelect(selectedDifficulty: DifficultyLevel) {
    // Validate difficulty level
    if (!validateDifficultyLevel(selectedDifficulty)) {
      console.error('[Security] Invalid difficulty level');
      return;
    }
    
    const template = SCENARIO_TEMPLATES[selectedDifficulty];
    if (!template) return;
    
    const generated = generateRealisticScenario(template);
    
    // Validate generated scenario
    if (!validateScenario(generated.scenario)) {
      console.error('[Security] Generated scenario failed validation');
      return;
    }
    
    setDifficulty(selectedDifficulty);
    setGameScenario(generated);
  }

  function handleStartGame() {
    setGameStarted(true);
  }

  function handleGameComplete(result: any) {
    setGameResult(result);
  }

  function handleReset() {
    setDifficulty(null);
    setGameScenario(null);
    setGameStarted(false);
    setGameResult(null);
  }

  // Show difficulty selection
  if (!difficulty || !gameScenario) {
    return <DifficultySelector onSelectDifficulty={handleDifficultySelect} />;
  }

  // Show scenario introduction
  if (!gameStarted && !gameResult) {
    return <ScenarioIntroduction scenario={gameScenario.scenario} onStart={handleStartGame} />;
  }

  // Show game results
  if (gameResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full siem-card space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#c9d1d9]">
              {gameResult.gameWon ? '🎉 Mission Accomplished!' : '⚠️ Mission Failed'}
            </h1>
            <p className="text-[#8b949e]">
              {gameResult.gameWon 
                ? 'You successfully identified all malicious IPs before ransomware deployment!'
                : 'Ransomware was deployed. The organization has been encrypted.'}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#30363d]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[#8b949e] mb-1">IPs Found</div>
                <div className="text-2xl font-bold text-[#c9d1d9]">
                  {gameResult.foundIPs.length} / {gameResult.totalMaliciousIPs}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Time Remaining</div>
                <div className="text-2xl font-bold text-[#c9d1d9]">
                  {Math.floor(gameResult.timeRemaining / 60)}:{(gameResult.timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Score</div>
                <div className="text-2xl font-bold text-[#c9d1d9]">{gameResult.percentage}%</div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Correct Classifications</div>
                <div className="text-2xl font-bold text-[#c9d1d9]">
                  {gameResult.breakdown.classifications.correct}
                </div>
              </div>
            </div>

            {gameResult.foundIPs.length > 0 && (
              <div>
                <div className="text-xs text-[#8b949e] mb-2">Malicious IPs Identified:</div>
                <div className="space-y-1">
                  {gameResult.foundIPs.map((ip: string) => (
                    <div key={ip} className="font-mono text-sm text-[#58a6ff] bg-[#0d1117] p-2 rounded">
                      {ip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameResult.feedback && (
              <div className="pt-4 border-t border-[#30363d]">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">Feedback</h3>
                {gameResult.feedback.missedThreats.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-red-400 mb-2">Missed Threats:</div>
                    {gameResult.feedback.missedThreats.map((threat: any) => (
                      <div key={threat.alertId} className="text-xs text-[#8b949e] mb-1">
                        • {threat.alertName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={handleReset} className="w-full btn-primary">
            Start New Hunt
          </button>
        </div>
      </div>
    );
  }

  // Show game
  return (
    <ThreatHuntGame 
      scenario={gameScenario.scenario}
      events={gameScenario.events}
      onComplete={handleGameComplete}
    />
  );
}
