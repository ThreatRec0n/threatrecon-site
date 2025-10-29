import React, { useState, useMemo } from 'react';
import SubmissionModal from './SubmissionModal';

export default function ChallengeEngine({ 
  profileType,
  difficulty,
  markedPacketIds, 
  selectedPacketId,
  evidencePacket,
  onMarkPacket, 
  onSubmit, 
  score, 
  level,
  packets,
}) {
  const [showResult, setShowResult] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
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

  // Get profile-specific briefing
  const getBriefing = () => {
    const profiles = {
      'http-exfil': {
        incident: 'Unusual outbound HTTP traffic detected. Large file transfers to external IPs may indicate data exfiltration.',
        objective: 'Identify the packet that proves confidential data was exfiltrated via HTTP POST.',
        indicators: ['Suspicious filename in Content-Disposition', 'External IP destination', 'HTTP POST with multipart/form-data'],
        hints: [
          'Filter HTTP traffic: proto==HTTP',
          'Look for POST requests to unusual external IPs',
          'Check for Content-Disposition headers with sensitive filenames',
        ],
      },
      'dns-exfil': {
        incident: 'Abnormal DNS query patterns detected. Unusually long domain names may contain encoded data.',
        objective: 'Identify the DNS query packet containing base64-encoded exfiltration data.',
        indicators: ['Abnormally long domain names', 'Base64-like subdomain patterns', 'High DNS query volume'],
        hints: [
          'Filter DNS traffic: proto==DNS',
          'Look for queries with very long subdomain names',
          'Check for base64-encoded patterns in domain strings',
        ],
      },
      'credential-theft': {
        incident: 'Plaintext credential transmission detected. Authentication attempts may be visible in traffic.',
        objective: 'Identify the packet containing username and password in plaintext.',
        indicators: ['HTTP Authorization headers', 'SMTP AUTH commands', 'Login form submissions'],
        hints: [
          'Filter HTTP traffic: proto==HTTP',
          'Look for POST requests to /login endpoints',
          'Check for Authorization: Basic headers or password fields in POST body',
        ],
      },
      'beaconing': {
        incident: 'Periodic outbound connections detected. Consistent timing may indicate C2 beaconing.',
        objective: 'Identify the periodic beacon packet to a C2 server.',
        indicators: ['Regular time intervals', 'Small payloads', 'External IP communication'],
        hints: [
          'Filter TCP traffic: proto==TCP',
          'Look for repeated connections to the same external IP',
          'Check timing - beacons typically occur every 60 seconds',
        ],
      },
      'lateral-movement': {
        incident: 'Unusual internal file access detected. SMB file copies between internal hosts may indicate lateral movement.',
        objective: 'Identify the SMB packet showing unauthorized file access between internal hosts.',
        indicators: ['SMB file copy commands', 'Internal-to-internal traffic', 'Sensitive filenames'],
        hints: [
          'Filter SMB traffic: port==445',
          'Look for file copy operations between internal IPs',
          'Check for unusual file access patterns',
        ],
      },
      'mixed': {
        incident: 'Mixed network traffic detected. Analyze all protocols to identify malicious activity.',
        objective: 'Identify the evidence packet across multiple protocol types.',
        indicators: ['Multiple protocols present', 'Unusual behavior patterns', 'Suspicious indicators in any protocol'],
        hints: [
          'Use multiple filters across protocols',
          'Look for anomalies in any protocol layer',
          'Correlate timing and behavior across different protocol types',
        ],
      },
    };
    return profiles[profileType] || profiles['mixed'];
  };

  const briefing = getBriefing();

  const handleOpenSubmission = () => {
    if (markedPacketIds.length === 0) {
      alert('Please mark at least one packet as evidence before submitting.');
      return;
    }
    setShowSubmissionModal(true);
  };

  const handleSubmissionSubmit = (submissionData) => {
    const correctPacketId = evidencePacket?.id;
    const isCorrect = submissionData.selectedPacketId === correctPacketId;
    
    // Score calculation
    const baseScores = { beginner: 100, intermediate: 200, advanced: 400 };
    const base = baseScores[difficulty] || 100;
    const hintPenalty = hintsUsed * 10;
    let points = isCorrect ? Math.max(0, base - hintPenalty) : -50;
    
    // Technique bonus
    const correctTechnique = evidencePacket?.teachable?.[0]?.toLowerCase() || '';
    if (isCorrect && (
      (submissionData.technique === 'data-exfiltration' && correctTechnique.includes('exfil')) ||
      (submissionData.technique === 'credential-theft' && correctTechnique.includes('credential')) ||
      (submissionData.technique === 'beaconing' && correctTechnique.includes('beacon')) ||
      (submissionData.technique === 'lateral-movement' && correctTechnique.includes('lateral'))
    )) {
      points += 50;
    }
    
    // Reasoning bonus (check if explanation mentions teachable keywords)
    if (isCorrect && evidencePacket?.teachable) {
      const explanationLower = submissionData.explanation.toLowerCase();
      const keywordMatches = evidencePacket.teachable.filter(t => 
        explanationLower.includes(t.toLowerCase())
      ).length;
      if (keywordMatches > 0) {
        points += keywordMatches * 5;
      }
    }

    const resultData = {
      correct: isCorrect,
      points,
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
        ts: new Date().toISOString(),
        objective: briefing.objective,
        answerPacketId: correctPacketId,
        selectedPacketId: submissionData.selectedPacketId,
        technique: submissionData.technique,
        explanation: submissionData.explanation,
        result: isCorrect ? 'correct' : 'wrong',
        scoreChange: points,
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
    // Reset will be handled by parent
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
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Incident Summary</div>
                <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                  {briefing.incident}
                </div>
              </section>

              {/* Objective */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Objective</div>
                <div className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3">
                  {briefing.objective}
                </div>
              </section>

              {/* Key Indicators */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Key Indicators</div>
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
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Actions</div>
                <div className="space-y-2">
                  <button
                    onClick={() => selectedPacketId && onMarkPacket(selectedPacketId)}
                    disabled={!selectedPacketId}
                    className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-yellow-500 text-yellow-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
                  >
                    Mark Selected Packet as Evidence
                  </button>
                  <button
                    onClick={handleOpenSubmission}
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
                  Hints Remaining: {3 - hintsUsed} of 3
                </div>
                {hintsUsed > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded p-2 mb-2 text-[9px] font-mono text-blue-300">
                    {briefing.hints[hintsUsed - 1]}
                  </div>
                )}
                <button
                  onClick={() => setHintsUsed(prev => Math.min(prev + 1, 3))}
                  disabled={hintsUsed >= 3}
                  className="w-full bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500 text-blue-300 rounded-lg py-1.5 text-[9px] font-mono transition-all"
                >
                  {hintsUsed < 3 ? `Reveal Hint ${hintsUsed + 1}` : 'All Hints Used'}
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
                    Score: {result.points > 0 ? '+' : ''}{result.points} points
                  </div>
                </div>
              </section>

              {/* Deep Explanation */}
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                  Here's why this packet was the smoking gun:
                </div>
                <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                  {result.explanation}
                </div>
                {result.teachable && result.teachable.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.teachable.map((t, i) => (
                      <div key={i} className="text-[9px] font-mono text-yellow-300">• {t}</div>
                    ))}
                  </div>
                )}
              </section>

              {/* What You Should've Looked For */}
              {!result.correct && result.teachable && (
                <section className="mb-4">
                  <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                    What You Should've Looked For
                  </div>
                  <ul className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                    {result.teachable.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-yellow-400 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

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

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        markedPackets={markedPacketsData}
        onSubmit={handleSubmissionSubmit}
      />
    </>
  );
}
