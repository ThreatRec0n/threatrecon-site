'use client';

import { useState } from 'react';

type Props = {
  scenario: {
    id: string;
    title: string;
    objectives: string[];
  };
};

export default function ScenarioRunner({ scenario }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    { id: 'ioc', prompt: 'Primary indicator you would search for', icon: '🎯' },
    { id: 'hypo', prompt: 'One sentence hypothesis', icon: '💭' },
    { id: 'next', prompt: 'Next investigative step', icon: '➡️' },
  ];

  function grade() {
    const filled = questions.filter(q => (answers[q.id] || '').trim().length > 0).length;
    setScore(Math.round((filled / questions.length) * 100));
    setSubmitted(true);
  }

  function reset() {
    setAnswers({});
    setScore(null);
    setSubmitted(false);
  }

  return (
    <div className="space-y-4 pt-4 border-t border-[#30363d]">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#c9d1d9] uppercase tracking-wider">Investigation Questions</h4>
        {submitted && (
          <button
            onClick={reset}
            className="text-xs text-[#58a6ff] hover:underline"
            type="button"
          >
            Reset
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.id} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[#c9d1d9]">
              <span>{q.icon}</span>
              <span>{q.prompt}</span>
            </label>
            <textarea
              className="search-input w-full min-h-[60px] resize-y"
              value={answers[q.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Enter your response..."
              disabled={submitted}
            />
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={grade}
          disabled={submitted}
          className={`btn-primary ${submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
          type="button"
        >
          {submitted ? 'Submitted' : 'Submit Answers'}
        </button>
        
        {score !== null && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8b949e]">Score:</span>
              <span className={`text-lg font-bold ${
                score === 100 ? 'text-[#3fb950]' :
                score >= 70 ? 'text-[#58a6ff]' :
                score >= 50 ? 'text-[#d29922]' :
                'text-[#f85149]'
              }`}>
                {score}%
              </span>
            </div>
            {score === 100 && (
              <span className="px-2 py-1 text-xs font-medium bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30 rounded">
                Perfect!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
