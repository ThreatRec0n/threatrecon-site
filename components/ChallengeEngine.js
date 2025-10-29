import React, { useState } from 'react';

export default function ChallengeEngine({ 
  challenge, 
  markedPacketIds, 
  onMarkPacket, 
  onSubmit, 
  score, 
  level,
  hintsUsed,
  onUseHint,
  aiHintsEnabled,
}) {
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  if (!challenge) {
    return (
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 card-glow">
        <div className="text-center text-gray-500 text-xs font-mono py-8">
          Start a challenge to begin
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (markedPacketIds.length === 0) {
      alert('Please mark at least one packet as evidence before submitting.');
      return;
    }

    const isCorrect = markedPacketIds.includes(challenge.evidencePacketId);
    const points = isCorrect ? calculateScore(challenge.level, hintsUsed) : 0;
    
    const resultData = {
      correct: isCorrect,
      points,
      explanation: challenge.scenario.explanation(challenge.metadata),
      expectedPacketId: challenge.evidencePacketId,
      markedPackets: markedPacketIds,
    };

    setResult(resultData);
    setShowResult(true);
    onSubmit(resultData);
  };

  const calculateScore = (level, hintsUsed) => {
    const baseScores = { beginner: 100, intermediate: 200, advanced: 500 };
    const base = baseScores[level] || 100;
    const hintPenalty = hintsUsed * 10;
    return Math.max(0, base - hintPenalty);
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-red-400 shadow-neon-red pulse-alert"></span>
          Challenge
        </span>
        <span className="text-[9px] text-gray-500 font-mono uppercase">{level}</span>
      </div>

      {!showResult ? (
        <>
          {/* Scenario */}
          <div className="mb-4 p-3 bg-gray-950 border border-gray-800 rounded">
            <div className="text-[11px] font-semibold text-terminal-green mb-2 font-mono">
              {challenge.scenario.title}
            </div>
            <div className="text-[10px] font-mono text-gray-300 leading-relaxed">
              {challenge.scenario.description(challenge.metadata)}
            </div>
          </div>

          {/* Hints */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400 font-mono">Hints Available: {3 - hintsUsed}</span>
              <button
                onClick={onUseHint}
                disabled={hintsUsed >= 3}
                className="px-2 py-1 rounded text-[9px] font-mono bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500 text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                GET HINT ({3 - hintsUsed})
              </button>
            </div>
            {hintsUsed > 0 && (
              <div className="p-2 bg-blue-900/20 border border-blue-500/50 rounded text-[9px] font-mono text-blue-300">
                {typeof challenge.scenario.hints[hintsUsed - 1] === 'function'
                  ? challenge.scenario.hints[hintsUsed - 1](challenge.metadata)
                  : challenge.scenario.hints[hintsUsed - 1]}
              </div>
            )}
          </div>

          {/* Marked Packets */}
          <div className="mb-4">
            <div className="text-[10px] text-gray-400 font-mono mb-2">
              Evidence Packets Marked: {markedPacketIds.length}
            </div>
            {markedPacketIds.length > 0 && (
              <div className="space-y-1">
                {markedPacketIds.map(id => (
                  <div key={id} className="p-1 bg-yellow-900/20 border border-yellow-500/50 rounded text-[9px] font-mono text-yellow-300">
                    {id}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={markedPacketIds.length === 0}
            className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500 text-green-300 rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            SUBMIT EVIDENCE
          </button>
        </>
      ) : (
        <>
          {/* Result Display */}
          <div className={`mb-4 p-4 rounded border-2 ${
            result.correct 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-red-900/20 border-red-500'
          }`}>
            <div className={`text-center mb-2 text-lg font-bold font-mono ${
              result.correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.correct ? '✓ CORRECT' : '✗ INCORRECT'}
            </div>
            <div className="text-center text-[11px] font-mono text-gray-300 mb-3">
              Score: +{result.points} points
            </div>
            <div className="text-[10px] font-mono text-gray-300 leading-relaxed p-2 bg-gray-950 rounded">
              {result.explanation}
            </div>
          </div>

          {/* Next Challenge Button */}
          <button
            onClick={() => {
              setShowResult(false);
              setResult(null);
            }}
            className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500 text-blue-300 rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-300 hover:scale-105"
          >
            NEXT CHALLENGE
          </button>
        </>
      )}

      {/* Score Display */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-gray-400">Total Score:</span>
          <span className="text-terminal-green font-bold">{score}</span>
        </div>
      </div>
    </div>
  );
}

