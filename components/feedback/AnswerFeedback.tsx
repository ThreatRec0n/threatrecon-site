'use client';

import { getMitreTechnique } from '@/lib/feedback/mitre-attack';
import { getOwaspCategory } from '@/lib/feedback/owasp-top10';
import type { FeedbackExplanation } from '@/lib/feedback/explanations';

interface UserAnswer {
  ioc: string;
  type: string;
  userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
  actualClassification: 'malicious' | 'benign';
  isCorrect: boolean;
  explanation?: string | FeedbackExplanation;
  mitreAttackId?: string;
  owaspCategory?: string;
  resources?: string[];
  stage?: string;
  technique_id?: string;
}

interface Props {
  answer: UserAnswer;
  index: number;
}

export default function AnswerFeedback({ answer, index }: Props) {
  const mitreDetails = answer.mitreAttackId ? getMitreTechnique(answer.mitreAttackId) : undefined;
  const owaspDetails = answer.owaspCategory ? getOwaspCategory(answer.owaspCategory) : undefined;
  const explanation = answer.explanation;

  const getFeedbackText = () => {
    if (!explanation) return '';
    if (typeof explanation === 'string') return explanation;
    return answer.isCorrect ? explanation.correct : explanation.incorrect;
  };

  return (
    <div className={`answer-feedback mb-6 p-6 rounded-lg border-l-4 ${
      answer.isCorrect 
        ? 'bg-green-900/10 border-green-500' 
        : 'bg-red-900/10 border-red-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-[#c9d1d9]">
            IOC #{index + 1}
          </span>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            answer.isCorrect
              ? 'bg-green-900/40 text-green-400 border border-green-800/60'
              : 'bg-red-900/40 text-red-400 border border-red-800/60'
          }`}>
            {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        </div>
        {answer.stage && (
          <span className="text-xs text-[#8b949e] px-2 py-1 bg-[#161b22] rounded border border-[#30363d]">
            {answer.stage}
          </span>
        )}
      </div>

      {/* IOC Details */}
      <div className="mb-4">
        <div className="text-sm text-[#8b949e] mb-2">Indicator of Compromise</div>
        <div className="font-mono text-[#c9d1d9] bg-[#0d1117] px-3 py-2 rounded border border-[#30363d]">
          {answer.ioc}
        </div>
        <div className="text-xs text-[#8b949e] mt-1">
          Type: <span className="text-[#c9d1d9]">{answer.type.toUpperCase()}</span>
        </div>
      </div>

      {/* User Answer vs Correct Answer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm font-semibold text-[#8b949e] mb-2">Your Classification</div>
          <div className={`px-3 py-2 rounded border ${
            answer.isCorrect
              ? 'bg-green-900/20 border-green-800/60 text-green-400'
              : 'bg-red-900/20 border-red-800/60 text-red-400'
          }`}>
            {answer.userTag || 'Not tagged'}
          </div>
        </div>
        {!answer.isCorrect && (
          <div>
            <div className="text-sm font-semibold text-[#8b949e] mb-2">Correct Classification</div>
            <div className="px-3 py-2 rounded border bg-green-900/20 border-green-800/60 text-green-400">
              {answer.actualClassification === 'malicious' ? 'Malicious' : 'Benign'}
            </div>
          </div>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-2">📝 Explanation</h4>
          <p className="text-sm text-[#8b949e] leading-relaxed">
            {getFeedbackText()}
          </p>
        </div>
      )}

      {/* MITRE ATT&CK Reference */}
      {mitreDetails && (
        <div className="mb-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            🎯 MITRE ATT&CK Reference
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                {mitreDetails.id}
              </span>
              <span className="text-sm font-semibold text-[#c9d1d9]">
                {mitreDetails.name}
              </span>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              {mitreDetails.description}
            </p>
            <div className="text-xs text-[#8b949e]">
              <strong>Tactic:</strong> <span className="text-[#c9d1d9]">{mitreDetails.tactic}</span>
            </div>
            <a
              href={mitreDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
            >
              Learn more on MITRE ATT&CK →
            </a>
          </div>
        </div>
      )}

      {/* OWASP Top 10 Reference */}
      {owaspDetails && (
        <div className="mb-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            🔒 OWASP Top 10 Reference
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#58a6ff] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                {owaspDetails.id}
              </span>
              <span className="text-sm font-semibold text-[#c9d1d9]">
                {owaspDetails.name}
              </span>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              {owaspDetails.description}
            </p>
            {owaspDetails.examples.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-[#8b949e] mb-1">Common Examples:</div>
                <ul className="list-disc list-inside text-xs text-[#8b949e] space-y-1">
                  {owaspDetails.examples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={owaspDetails.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
            >
              Learn more on OWASP →
            </a>
          </div>
        </div>
      )}

      {/* Learning Resources */}
      {answer.resources && answer.resources.length > 0 && (
        <div className="mt-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            📚 Learning Resources
          </h4>
          <ul className="space-y-2">
            {answer.resources.map((resource, i) => (
              <li key={i}>
                <a
                  href={typeof resource === 'string' ? resource : resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                >
                  → {typeof resource === 'string' ? resource : resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {explanation && typeof explanation !== 'string' && explanation.resources && explanation.resources.length > 0 && (
        <div className="mt-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            📚 Learning Resources
          </h4>
          <ul className="space-y-2">
            {explanation.resources.map((resource, i) => (
              <li key={i}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors"
                >
                  → {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

