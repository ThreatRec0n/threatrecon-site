import React, { useState } from 'react';

export default function ChallengeEngine({ 
  challenge, 
  markedPacketIds, 
  selectedPacketId,
  onMarkPacket, 
  onSubmit, 
  score, 
  level,
  hintsUsed,
  onUseHint,
}) {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  if (!challenge) {
    return (
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
        <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800">
          <span className="flex items-center gap-2 text-gray-200 font-semibold">
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-neon-red"></span>
            Investigation Briefing
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 text-xs font-mono px-4">
            Start a challenge to begin investigation
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (markedPacketIds.length === 0) {
      return;
    }

    const isCorrect = markedPacketIds.includes(challenge.evidencePacketId);
    const baseScores = { beginner: 100, intermediate: 200, advanced: 500 };
    const base = baseScores[level] || 100;
    const hintPenalty = hintsUsed * 10;
    const points = isCorrect ? Math.max(0, base - hintPenalty) : -10;
    
    // Generate "What You Should've Looked For" bullets
    const shouldLookFor = [];
    if (challenge.scenario.title === 'Data Exfiltration') {
      shouldLookFor.push('Protocol clue: HTTP POST with multipart/form-data', 'Behavioral clue: Exfil to external IP on port 80', `Payload clue: Suspicious filename "${challenge.metadata.filename}"`);
    } else if (challenge.scenario.title === 'Credential Theft') {
      shouldLookFor.push('Protocol clue: HTTP POST to /login endpoint', 'Behavioral clue: Plaintext transmission (not HTTPS)', 'Payload clue: Username/password in URL or body');
    } else if (challenge.scenario.title === 'DNS Tunneling') {
      shouldLookFor.push('Protocol clue: DNS query with unusual length', 'Behavioral clue: Base64-encoded subdomain', 'Payload clue: Long domain name pattern');
    } else {
      shouldLookFor.push('Protocol-specific indicators in packet headers', 'Unusual destination IP or port patterns', 'Suspicious payload content in hex/ASCII view');
    }

    const resultData = {
      correct: isCorrect,
      points,
      explanation: challenge.scenario.explanation(challenge.metadata),
      expectedPacketId: challenge.evidencePacketId,
      markedPackets: markedPacketIds,
      shouldLookFor,
      scenarioTitle: challenge.scenario.title,
    };

    setResult(resultData);
    setShowResult(true);
    onSubmit(resultData);

    // Store transcript
    if (typeof window !== 'undefined') {
      const transcript = {
        ts: new Date().toISOString(),
        objective: challenge.scenario.description(challenge.metadata),
        answerPacketId: challenge.evidencePacketId,
        result: isCorrect ? 'correct' : 'wrong',
        scoreChange: points,
        timestamp: new Date().toISOString(),
      };
      const transcripts = JSON.parse(localStorage.getItem('threatrecon_challenge_transcripts') || '[]');
      transcripts.push(transcript);
      localStorage.setItem('threatrecon_challenge_transcripts', JSON.stringify(transcripts.slice(-50)));
    }
  };

  // Extract scope indicators from metadata
  const scopeIndicators = [];
  if (challenge.metadata.targetIp) scopeIndicators.push(`Suspect IP: ${challenge.metadata.targetIp}`);
  if (challenge.metadata.srcIp) scopeIndicators.push(`Source Host: ${challenge.metadata.srcIp}`);
  if (challenge.metadata.filename) scopeIndicators.push(`File: ${challenge.metadata.filename}`);
  if (challenge.metadata.suspiciousDomain) scopeIndicators.push(`Domain: ${challenge.metadata.suspiciousDomain}`);
  if (challenge.metadata.username) scopeIndicators.push(`Username: ${challenge.metadata.username}`);

  return (
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
            {/* A. Incident Summary */}
            <section className="mb-4">
              <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Incident Summary</div>
              <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                {challenge.metadata.srcIp 
                  ? `Unusual outbound traffic was detected from host ${challenge.metadata.srcIp}. You are tasked with identifying the packet that proves ${challenge.scenario.title.toLowerCase()}.`
                  : challenge.scenario.description(challenge.metadata)}
              </div>
            </section>

            {/* B. Objective */}
            <section className="mb-4">
              <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Objective</div>
              <div className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3">
                Identify the packet that contains evidence of {challenge.scenario.title.toLowerCase()}.
              </div>
            </section>

            {/* C. Scope */}
            {scopeIndicators.length > 0 && (
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Key Indicators</div>
                <ul className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                  {scopeIndicators.map((indicator, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-terminal-green mr-2">•</span>
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* D. Actions */}
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
                  onClick={handleSubmit}
                  disabled={markedPacketIds.length === 0}
                  className="w-full bg-green-600/20 hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed border border-green-500 text-green-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
                >
                  Submit Finding
                </button>
              </div>
            </section>

            {/* E. Hints */}
            <section className="mb-4">
              <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                Hints Remaining: {3 - hintsUsed} of 3
              </div>
              {hintsUsed > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/50 rounded p-2 mb-2 text-[9px] font-mono text-blue-300">
                  {typeof challenge.scenario.hints[hintsUsed - 1] === 'function'
                    ? challenge.scenario.hints[hintsUsed - 1](challenge.metadata)
                    : challenge.scenario.hints[hintsUsed - 1]}
                </div>
              )}
              <button
                onClick={onUseHint}
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
              <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">Deep Explanation</div>
              <div className="text-[10px] font-mono text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded p-3">
                {result.explanation}
              </div>
            </section>

            {/* What You Should've Looked For */}
            {result.shouldLookFor && result.shouldLookFor.length > 0 && (
              <section className="mb-4">
                <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">
                  What You Should've Looked For
                </div>
                <ul className="text-[10px] font-mono text-gray-300 bg-gray-950 border border-gray-800 rounded p-3 space-y-1">
                  {result.shouldLookFor.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-yellow-400 mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Next Challenge Button */}
            <button
              onClick={() => {
                setShowResult(false);
                setResult(null);
                // Reset challenge state will be handled by parent
              }}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500 text-blue-300 rounded-lg py-2 text-[10px] font-semibold font-mono transition-all"
            >
              Next Challenge
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
  );
}
