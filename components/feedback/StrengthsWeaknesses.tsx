'use client';

interface Answer {
  ioc: string;
  type: string;
  isCorrect: boolean;
  stage?: string;
  technique_id?: string;
}

interface Props {
  answers: Answer[];
}

export default function StrengthsWeaknesses({ answers }: Props) {
  // Categorize by stage/technique
  const categories: Record<string, { correct: number; total: number }> = {};

  answers.forEach(answer => {
    const category = answer.stage || answer.technique_id || 'General';
    if (!categories[category]) {
      categories[category] = { correct: 0, total: 0 };
    }
    categories[category].total++;
    if (answer.isCorrect) {
      categories[category].correct++;
    }
  });

  const strengths: Array<{ category: string; percentage: number }> = [];
  const weaknesses: Array<{ category: string; percentage: number }> = [];

  Object.entries(categories).forEach(([category, stats]) => {
    const percentage = (stats.correct / stats.total) * 100;
    if (percentage >= 75) {
      strengths.push({ category, percentage });
    } else if (percentage < 50) {
      weaknesses.push({ category, percentage });
    }
  });

  const formatCategory = (cat: string) => {
    return cat
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="strengths-weaknesses grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Strengths */}
      <div className="p-6 bg-green-900/10 border border-green-800/60 rounded-lg">
        <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
          💪 Your Strengths
        </h3>
        {strengths.length > 0 ? (
          <ul className="space-y-3">
            {strengths.map((s) => (
              <li key={s.category} className="flex items-center justify-between">
                <span className="text-sm text-[#c9d1d9]">{formatCategory(s.category)}</span>
                <span className="text-sm font-semibold text-green-400">
                  {Math.round(s.percentage)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#8b949e]">Keep practicing to identify your strengths!</p>
        )}
      </div>

      {/* Weaknesses */}
      <div className="p-6 bg-red-900/10 border border-red-800/60 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          📚 Areas for Improvement
        </h3>
        {weaknesses.length > 0 ? (
          <ul className="space-y-3">
            {weaknesses.map((w) => (
              <li key={w.category} className="flex items-center justify-between">
                <span className="text-sm text-[#c9d1d9]">{formatCategory(w.category)}</span>
                <span className="text-sm font-semibold text-red-400">
                  {Math.round(w.percentage)}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#8b949e]">Great job! No major weaknesses identified.</p>
        )}
      </div>
    </div>
  );
}

