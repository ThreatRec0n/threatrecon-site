import React, { useState, useMemo } from 'react';
import { validateSubmission } from '../lib/round-engine';

export default function ChallengeEngine({ 
  scenarioId,
  difficulty,
  markedPacketIds, 
  selectedPacketId,
  onMarkPacket, 
  onValidated,
  score,
  groundTruth,
  packets,
  hints = [],
}) {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer for elapsed time
  React.useEffect(() => {
    if (!isPaused && !showResult && packets.length > 0) {
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, showResult, packets.length]);

  // IR-style neutral brief
  const getBriefing = () => {
    const profiles = {
      'http-exfil': {
        incident: 'Unusual outbound traffic was detected from host 192.168.1.140. You have been asked to review recent traffic and identify potential data theft.',
        objective: 'Identify the single packet that best proves sensitive data was exfiltrated.',
        indicators: [
          'Source host appears to be an internal workstation.',
          'Traffic may involve large payloads leaving to an external IP.',
          'Suspicious filenames in HTTP POST requests may indicate file transfers.',
        ],
        hints: [
          'Filter HTTP traffic: proto==HTTP',
          'Look for POST requests to unusual external IPs',
          'Check for Content-Disposition headers with sensitive filenames',
        ],
      },
      'dns-exfil': {
        incident: 'Anomalous DNS query patterns were observed from internal host. High-volume or unusually long queries may indicate data tunneling.',
        objective: 'Identify the DNS query packet containing encoded exfiltration data.',
        indicators: [
          'Source host appears to be an internal workstation.',
          'DNS queries may appear high-entropy or randomly generated.',
          'Abnormally long domain names may contain encoded payloads.',
        ],
        hints: [
          'Filter DNS traffic: proto==DNS',
          'Look for queries with very long subdomain names',
          'Check for base64-encoded patterns in domain strings',
        ],
      },
      'credential-theft': {
        incident: 'Suspicious authentication traffic detected. Plaintext credential transmission may be visible in protocol headers or payloads.',
        objective: 'Identify the packet containing username and password in cleartext.',
        indicators: [
          'Source host appears to be an internal workstation.',
          'HTTP or SMTP traffic may contain authentication attempts.',
          'Base64-encoded credentials may appear in Authorization headers.',
        ],
        hints: [
          'Filter HTTP traffic: proto==HTTP',
          'Look for POST requests to /login endpoints',
          'Check for Authorization: Basic headers or password fields in POST body',
        ],
      },
      'beaconing': {
        incident: 'Periodic outbound connections were detected from an internal host. Consistent timing patterns may indicate automated C2 communication.',
        objective: 'Identify the periodic beacon packet to a C2 server.',
        indicators: [
          'Source host appears to be an internal workstation.',
          'Traffic shows regular time intervals to the same external destination.',
          'Small payload sizes with consistent patterns.',
        ],
        hints: [
          'Filter TCP traffic: proto==TCP',
          'Look for repeated connections to the same external IP',
          'Check timing - beacons typically occur every 30-60 seconds',
        ],
      },
      'lateral-movement': {
        incident: 'Unusual internal file access detected between hosts. SMB file operations between internal hosts may indicate lateral movement.',
        objective: 'Identify the SMB packet showing unauthorized file access between internal hosts.',
        indicators: [
          'Traffic is between internal IP ranges (10.x, 172.x, 192.168.x).',
          'SMB file operations may show copy or write commands.',
          'Sensitive filenames may appear in protocol data.',
        ],
        hints: [
          'Filter SMB traffic: port==445',
          'Look for file copy operations between internal IPs',
          'Check for unusual file access patterns',
        ],
      },
      'mixed': {
        incident: 'Mixed network traffic was captured during an investigation. Analyze all protocols to identify malicious activity.',
        objective: 'Identify the evidence packet across multiple protocol types.',
        indicators: [
          'Multiple protocols are present in the capture.',
          'Unusual behavior patterns may span different protocol layers.',
          'Suspicious indicators can appear in any protocol type.',
        ],
        hints: [
          'Use multiple filters across protocols',
          'Look for anomalies in any protocol layer',
          'Correlate timing and behavior across different protocol types',
        ],
      },
    };
    return profiles['mixed'];
  };

  const briefing = getBriefing();

  const handleSubmit = () => {
    if (markedPacketIds.length === 0) {
      alert('Please mark at least one packet as evidence before submitting.');
      return;
    }
    const res = validateSubmission(markedPacketIds, groundTruth, { difficulty, hintsUsed });
    setResult(res);
    setShowResult(true);
    setIsPaused(true);
    onValidated && onValidated(res);
  };

  const handleSubmissionSubmit = (submissionData) => {
    const correctPacketId = evidencePacket?.id;
    const isCorrect = submissionData.selectedPacketId === correctPacketId;
    
    // Scoring logic
    const baseScores = { beginner: 100, intermediate: 200, advanced: 400 };
    const base = baseScores[difficulty] || 100;
    
    let scoreDelta = isCorrect ? base : -50;
    
    // Technique bonus (+50 if correct category matches)
    if (isCorrect && evidencePacket) {
      const packetTags = (evidencePacket.teachable || []).map(t => t.toLowerCase()).join(' ');
      const techniqueMap = {
        'data-exfiltration': ['exfil', 'exfiltration'],
        'credential-theft': ['credential', 'password', 'username', 'auth'],
        'beaconing': ['beacon', 'c2', 'command'],
        'lateral-movement': ['lateral', 'smb', 'move'],
        'dns-tunneling': ['dns', 'tunnel'],
        'recon': ['recon', 'scan'],
      };
      
      const selectedTechnique = techniqueMap[submissionData.technique] || [];
      const matches = selectedTechnique.some(tag => packetTags.includes(tag));
      if (matches) {
        scoreDelta += 50;
      }
    }
    
    // Reasoning bonus (+50 if explanation contains teachable keywords)
    if (isCorrect && evidencePacket?.teachable) {
      const explanationLower = submissionData.explanation.toLowerCase();
      const keywordMatches = evidencePacket.teachable.some(t => 
        explanationLower.includes(t.toLowerCase())
      );
      if (keywordMatches) {
        scoreDelta += 50;
      }
    }
    
    // Hint penalty
    const hintPenalty = hintsUsed * 10;
    scoreDelta = Math.max(isCorrect ? scoreDelta - hintPenalty : scoreDelta, isCorrect ? 0 : -50);

    const resultData = {
      correct: isCorrect,
      points: scoreDelta,
      explanation: evidencePacket?.explanation || 'Evidence packet analysis',
      expectedPacketId: correctPacketId,
      markedPackets: markedPacketIds,
      submission: submissionData,
      teachable: evidencePacket?.teachable || [],
      scenarioTitle: profileType,
    };

    setResult(resultData);
    setShowResult(true);
    setIsPaused(true);
    onSubmit(resultData);

    // Store transcript
    if (typeof window !== 'undefined') {
      const transcripts = JSON.parse(localStorage.getItem('threatrecon_challenge_transcripts') || '[]');
      transcripts.push({
      ts: (await import('../lib/safe-time')).safeIso(Date.now()),
        objective: briefing.objective,
        answerPacketId: correctPacketId,
        selectedPacketId: submissionData.selectedPacketId,
        technique: submissionData.technique,
        explanation: submissionData.explanation,
        result: isCorrect ? 'correct' : 'wrong',
        scoreChange: scoreDelta,
      });
      localStorage.setItem('threatrecon_challenge_transcripts', JSON.stringify(transcripts.slice(-50)));
    }
  };

  const handleNewRound = () => {
    setShowResult(false);
    setResult(null);
    setElapsedTime(0);
    setHintsUsed(0);
    setIsPaused(false);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const markedPacketsData = useMemo(() => {
    return markedPacketIds.map(id => packets.find(p => p.id === id)).filter(Boolean);
  }, [markedPacketIds, packets]);

  return (
    <>
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
        <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800">
          <span className="flex items-center gap-2 text-gray-200 font-semibold">
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-neon-red pulse-alert"></span>
            Investigation Briefing
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!showResult ? (
            <>
              {/* Incident Summary */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">INCIDENT SUMMARY</div>
                <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                  {briefing.incident}
                </div>
              </section>

              {/* Objective */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">OBJECTIVE</div>
                <div className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3">
                  {briefing.objective}
                </div>
              </section>

              {/* Key Indicators */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">KEY INDICATORS</div>
                <ul className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                  {briefing.indicators.map((ind, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-terminal-green mr-2">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Timer */}
              <div className="mb-4 p-2 bg-gray-950 border border-gray-800 rounded text-center">
                <div className="text-[9px] font-mono text-gray-400 mb-1">Elapsed Time</div>
                <div className="text-lg font-mono text-terminal-green font-bold">{formatTime(elapsedTime)}</div>
              </div>

              {/* Actions */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">ACTIONS</div>
                <div className="space-y-2">
                  <button
                    onClick={() => selectedPacketId && onMarkPacket(selectedPacketId)}
                    disabled={!selectedPacketId}
                    className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-yellow-500 text-yellow-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
                  >
                    Mark Selected Packet as Evidence
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={markedPacketIds.length === 0}
                    className="w-full bg-green-600/20 hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-green-500 text-green-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
                  >
                    Submit Finding
                  </button>
                </div>
              </section>

              {/* Hints */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                  Hints Remaining: {(hints.length - hintsUsed)} of {hints.length}
                </div>
                {hintsUsed > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded p-2 mb-2 text-[9px] font-mono text-blue-300">
                    {hints[hintsUsed - 1]}
                  </div>
                )}
                <button
                  onClick={() => setHintsUsed(prev => Math.min(prev + 1, hints.length))}
                  disabled={hintsUsed >= hints.length}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500 text-blue-300 rounded-lg py-1.5 text-[9px] font-mono transition-all"
                >
                  {hintsUsed < hints.length ? `Reveal Hint ${hintsUsed + 1}` : 'All Hints Used'}
                </button>
              </section>

              {/* Marked Packets Count */}
              <div className="text-[9px] font-mono text-gray-400">
                Evidence packets marked: <span className="text-terminal-green font-bold">{markedPacketIds.length}</span>
              </div>
            </>
          ) : (
            <>
              {/* Result Display */}
              <section className="mb-4">
                <div className={`p-4 rounded border-2 ${
                  result.correct 
                    ? 'bg-green-900/20 border-green-500' 
                    : 'bg-red-900/20 border-red-500'
                }`}>
                  <div className={`text-center mb-2 text-lg font-bold font-mono ${
                    result.correct ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.correct ? '✓ CORRECT' : '✗ INCORRECT'}
                  </div>
                  <div className={`text-center text-[11px] font-mono mb-3 ${
                    result.correct ? 'text-green-300' : 'text-red-300'
                  }`}>
                    Score: {result.scoreDelta > 0 ? '+' : ''}{result.scoreDelta} points
                  </div>
                </div>
              </section>

              {/* Debrief */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                  Result
                </div>
                <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                  {result.feedback}
                </div>
                {result.rubric && result.rubric.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.rubric.map((t, i) => (
                      <li key={i} className="text-[9px] font-mono text-yellow-300">• {t}</li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Next Round Button */}
              <button
                onClick={handleNewRound}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500 text-blue-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
              >
                New Round
              </button>
            </>
          )}
        </div>

        {/* Score Display (Fixed Footer) */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/50">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-gray-400">Total Score:</span>
            <span className="text-terminal-green font-bold">{score}</span>
          </div>
        </div>
      </div>

      {/* No modal in round mode */}
    </>
  );
}
