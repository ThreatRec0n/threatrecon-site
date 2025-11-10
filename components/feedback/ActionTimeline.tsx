'use client';

interface Answer {
  ioc: string;
  type: string;
  userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
  actualClassification: 'malicious' | 'benign';
  isCorrect: boolean;
  timestamp?: number;
  stage?: string;
}

interface Props {
  answers: Answer[];
  startTime: number;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export default function ActionTimeline({ answers, startTime }: Props) {
  const timelineItems = answers
    .map((answer, index) => ({
      ...answer,
      index,
      timeFromStart: answer.timestamp 
        ? (answer.timestamp - startTime) / 1000 
        : index * 10, // Fallback if no timestamp
    }))
    .sort((a, b) => a.timeFromStart - b.timeFromStart);

  return (
    <div className="action-timeline p-6 bg-[#161b22] border border-[#30363d] rounded-lg">
      <h3 className="text-lg font-semibold text-[#c9d1d9] mb-6 flex items-center gap-2">
        📊 Your Investigation Timeline
      </h3>
      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#30363d]" />

        {timelineItems.map((item, idx) => (
          <div key={idx} className="relative mb-6 last:mb-0">
            {/* Timeline marker */}
            <div className={`absolute left-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              item.isCorrect
                ? 'bg-green-900/40 border-green-500 text-green-400'
                : 'bg-red-900/40 border-red-500 text-red-400'
            }`}>
              <span className="text-xs font-bold">
                {item.isCorrect ? '✓' : '✗'}
              </span>
            </div>

            {/* Content */}
            <div className="ml-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#8b949e] font-mono">
                  +{formatTime(item.timeFromStart)}
                </span>
                {item.stage && (
                  <span className="text-xs px-2 py-0.5 bg-[#0d1117] text-[#8b949e] rounded border border-[#30363d]">
                    {item.stage}
                  </span>
                )}
              </div>
              
              <div className="mb-2">
                <div className="text-sm text-[#c9d1d9] font-mono mb-1">
                  {item.ioc}
                </div>
                <div className="text-xs text-[#8b949e]">
                  Type: {item.type.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  item.isCorrect
                    ? 'bg-green-900/20 text-green-400 border border-green-800/60'
                    : 'bg-red-900/20 text-red-400 border border-red-800/60'
                }`}>
                  Your decision: <strong>{item.userTag || 'Not tagged'}</strong>
                </span>
                {!item.isCorrect && (
                  <span className="text-xs text-[#8b949e]">
                    (Should be: <span className="text-green-400">{item.actualClassification}</span>)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

