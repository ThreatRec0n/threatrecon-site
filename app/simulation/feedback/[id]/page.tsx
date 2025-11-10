'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { EvaluationResult } from '@/lib/evaluation-engine';

// Dynamically import feedback components
const FeedbackSummary = dynamic(() => import('@/components/feedback/FeedbackSummary'), {
  loading: () => <div className="h-32 bg-[#161b22] rounded animate-pulse" />,
  ssr: false
});

const StrengthsWeaknesses = dynamic(() => import('@/components/feedback/StrengthsWeaknesses'), {
  loading: () => <div className="h-48 bg-[#161b22] rounded animate-pulse" />,
  ssr: false
});

const AnswerFeedback = dynamic(() => import('@/components/feedback/AnswerFeedback'), {
  loading: () => <div className="h-32 bg-[#161b22] rounded animate-pulse" />,
  ssr: false
});

const ActionTimeline = dynamic(() => import('@/components/feedback/ActionTimeline'), {
  loading: () => <div className="h-64 bg-[#161b22] rounded animate-pulse" />,
  ssr: false
});

interface SimulationResult {
  id: string;
  scenario_type: string;
  scenario_name: string;
  score: number;
  skill_level: string;
  completion_time?: number;
  timed_mode: boolean;
  breakdown: EvaluationResult['breakdown'];
  by_stage: EvaluationResult['byStage'];
  user_answers: Array<{
    ioc: string;
    type: string;
    userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
    actualClassification: 'malicious' | 'benign';
    isCorrect: boolean;
    explanation?: string;
    mitreAttackId?: string;
    owaspCategory?: string;
    resources?: string[];
    stage?: string;
    technique_id?: string;
    timestamp?: number;
  }>;
  missed_iocs: EvaluationResult['missedIOCs'];
  over_flagged_iocs: EvaluationResult['overFlaggedIOCs'];
  red_team_replay: EvaluationResult['redTeamReplay'];
  recommendations: string[];
  completed_at: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultId = params.id as string;
        
        // Try to fetch from API
        const response = await fetch(`/api/simulation/results/${resultId}`);
        
        if (!response.ok) {
          // Try localStorage as fallback
          if (typeof window !== 'undefined') {
            const localResults = JSON.parse(
              localStorage.getItem('threatrecon_feedback_results') || '[]'
            );
            const localResult = localResults.find((r: any) => r.id === resultId);
            
            if (localResult) {
              setResult(localResult);
              setLoading(false);
              return;
            }
          }
          
          throw new Error('Result not found');
        }

        const data = await response.json();
        setResult(data);
      } catch (err: any) {
        console.error('Error fetching feedback:', err);
        setError(err.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchResult();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[#161b22] rounded w-1/3"></div>
            <div className="h-64 bg-[#161b22] rounded"></div>
            <div className="h-48 bg-[#161b22] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#161b22] border border-red-800/40 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Feedback Not Found</h1>
            <p className="text-[#8b949e] mb-6">{error || 'The feedback you are looking for does not exist.'}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/simulation"
                className="px-6 py-3 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-[#30363d] text-[#c9d1d9] rounded hover:bg-[#484f58] transition-colors"
              >
                View Progress
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert result to EvaluationResult format for components
  const evaluationResult: EvaluationResult = {
    score: result.score,
    breakdown: result.breakdown,
    byStage: result.by_stage,
    missedIOCs: result.missed_iocs,
    overFlaggedIOCs: result.over_flagged_iocs,
    allClassifications: result.user_answers.map(a => ({
      ioc: a.ioc,
      type: a.type as 'ip' | 'domain' | 'hash' | 'pid',
      userTag: a.userTag,
      actualClassification: a.actualClassification,
      isCorrect: a.isCorrect,
      stage: a.stage,
      technique_id: a.technique_id,
    })),
    redTeamReplay: result.red_team_replay,
    recommendations: result.recommendations,
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/simulation"
            className="inline-flex items-center gap-2 text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">📊 Investigation Feedback</h1>
          <p className="text-[#8b949e]">
            Detailed analysis of your performance in: <strong className="text-[#c9d1d9]">{result.scenario_name}</strong>
          </p>
        </div>

        {/* Feedback Summary */}
        <div className="mb-6">
          <FeedbackSummary
            score={result.score}
            correctAnswers={result.breakdown.truePositives}
            totalAnswers={result.user_answers.length}
            completionTime={result.completion_time}
            timedMode={result.timed_mode}
          />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="mb-6">
          <StrengthsWeaknesses
            answers={result.user_answers.map(a => ({
              ioc: a.ioc,
              type: a.type,
              userTag: a.userTag,
              actualClassification: a.actualClassification,
              isCorrect: a.isCorrect,
            }))}
          />
        </div>

        {/* Answer Feedback */}
        <div className="mb-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Detailed Answer Feedback</h2>
            <div className="space-y-4">
              {result.user_answers.length === 0 ? (
                <p className="text-[#8b949e] text-center py-8">No answers to display.</p>
              ) : (
                result.user_answers.map((answer, index) => (
                  <AnswerFeedback
                    key={`${answer.ioc}-${index}`}
                    answer={{
                      ioc: answer.ioc,
                      type: answer.type,
                      userTag: answer.userTag,
                      actualClassification: answer.actualClassification,
                      isCorrect: answer.isCorrect,
                      explanation: answer.explanation,
                      mitreAttackId: answer.mitreAttackId || answer.technique_id,
                      owaspCategory: answer.owaspCategory,
                      resources: answer.resources,
                      stage: answer.stage,
                    }}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Timeline */}
        {result.user_answers.length > 0 && (
          <div className="mb-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-[#c9d1d9] mb-4">Investigation Timeline</h2>
              <ActionTimeline
                answers={result.user_answers.map(a => ({
                  ...a,
                  timestamp: a.timestamp || Date.now() - (result.user_answers.length - result.user_answers.indexOf(a)) * 10000,
                }))}
                startTime={result.user_answers[0]?.timestamp || Date.now() - result.user_answers.length * 10000}
              />
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">💡 Recommendations</h2>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-[#c9d1d9] flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/simulation')}
            className="px-6 py-3 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
          >
            Start New Investigation
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#30363d] text-[#c9d1d9] rounded hover:bg-[#484f58] transition-colors inline-flex items-center"
          >
            View Progress Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

