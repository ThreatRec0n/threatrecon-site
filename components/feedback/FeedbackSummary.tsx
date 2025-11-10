'use client';

interface FeedbackSummaryProps {
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  completionTime?: number;
  timedMode?: boolean;
}

export default function FeedbackSummary({
  score,
  correctAnswers,
  totalAnswers,
  completionTime,
  timedMode,
}: FeedbackSummaryProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return '⭐ Excellent';
    if (score >= 70) return '👍 Good';
    if (score >= 50) return '📊 Fair';
    return '📚 Needs Improvement';
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      <h2 className="text-2xl font-bold text-[#c9d1d9] mb-6">Investigation Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score */}
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-sm text-[#8b949e] mb-1">Score</div>
          <div className="text-xs text-[#58a6ff]">{getScoreBadge(score)}</div>
        </div>

        {/* Correct Answers */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[#c9d1d9] mb-2">
            {correctAnswers}/{totalAnswers}
          </div>
          <div className="text-sm text-[#8b949e] mb-1">Correct Answers</div>
          <div className="text-xs text-[#58a6ff]">
            {totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0}% Accuracy
          </div>
        </div>

        {/* Completion Time */}
        {timedMode && completionTime !== undefined && (
          <div className="text-center">
            <div className="text-4xl font-bold text-[#c9d1d9] mb-2 font-mono">
              {formatTime(completionTime)}
            </div>
            <div className="text-sm text-[#8b949e] mb-1">Completion Time</div>
            <div className="text-xs text-[#58a6ff]">Timed Mode</div>
          </div>
        )}
      </div>

      {/* Performance Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#8b949e]">Performance</span>
          <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {getScoreBadge(score)}
          </span>
        </div>
        <div className="w-full bg-[#0d1117] rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-yellow-500' :
              score >= 50 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

