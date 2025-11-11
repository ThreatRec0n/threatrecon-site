// API route to submit simulation results and generate feedback

import { NextRequest, NextResponse } from 'next/server';
import type { EvaluationResult } from '@/lib/evaluation-engine';
import { getFeedbackExplanation, generateFeedbackKey } from '@/lib/feedback/explanations';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';

interface SubmitRequest {
  evaluationResult: EvaluationResult;
  scenarioType: string;
  scenarioName: string;
  iocTags: Record<string, 'confirmed-threat' | 'suspicious' | 'benign'>;
  completionTime?: number;
  timedMode?: boolean;
  userAnswers?: Array<{
    ioc: string;
    type: string;
    userTag: 'confirmed-threat' | 'suspicious' | 'benign' | null;
    actualClassification: 'malicious' | 'benign';
    isCorrect: boolean;
    stage?: string;
    technique_id?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { evaluationResult, scenarioType, scenarioName, iocTags, completionTime, timedMode, userAnswers } = body;

    // Require authentication for saving results
    let userId: string | null = null;
    if (isSupabaseEnabled()) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required. Please sign in to save your progress.' },
            { status: 401 }
          );
        }
        userId = session.user.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Authentication not available' },
          { status: 503 }
        );
      }
    } else {
      // If Supabase is not enabled, allow local-only saves
      // But warn that progress won't persist
    }

    // Enrich user answers with detailed feedback
    const enrichedAnswers = (userAnswers || evaluationResult.allClassifications || []).map(answer => {
      const feedbackKey = generateFeedbackKey(
        answer.ioc,
        answer.type,
        answer.isCorrect,
        answer.actualClassification,
        scenarioType
      );
      const explanation = getFeedbackExplanation(feedbackKey);

      return {
        ...answer,
        explanation: answer.isCorrect ? explanation.correct : explanation.incorrect,
        mitreAttackId: answer.technique_id || explanation.mitreAttackId,
        owaspCategory: explanation.owaspCategory,
        resources: explanation.resources,
      };
    });

    // Calculate skill level
    const skillLevel = evaluationResult.score >= 90 ? 'Incident Commander' :
                      evaluationResult.score >= 70 ? 'Threat Hunter' :
                      evaluationResult.score >= 50 ? 'SOC Analyst' : 'Analyst in Training';

    // Prepare result data
    const resultData = {
      user_id: userId,
      scenario_type: scenarioType,
      scenario_name: scenarioName,
      score: evaluationResult.score,
      skill_level: skillLevel,
      completion_time: completionTime || null,
      timed_mode: timedMode || false,
      breakdown: evaluationResult.breakdown,
      by_stage: evaluationResult.byStage,
      user_answers: enrichedAnswers,
      missed_iocs: evaluationResult.missedIOCs,
      over_flagged_iocs: evaluationResult.overFlaggedIOCs,
      red_team_replay: evaluationResult.redTeamReplay,
      recommendations: evaluationResult.recommendations,
      ioc_tags: iocTags,
      completed_at: new Date().toISOString(),
    };

    // Save to database if Supabase is enabled
    let resultId: string | null = null;
    if (isSupabaseEnabled() && userId) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('simulation_results')
          .insert(resultData)
          .select('id')
          .single();

        if (error) {
          console.error('Error saving simulation result:', error);
        } else {
          resultId = data.id;
        }
      }
    }

    // Generate a local ID if no database
    if (!resultId) {
      resultId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Save to localStorage as fallback
    if (typeof window === 'undefined') {
      // Server-side: return the result
      return NextResponse.json({
        success: true,
        result: {
          id: resultId,
          ...resultData,
        },
      });
    }

    // Client-side: also save locally
    const localResults = JSON.parse(
      typeof window !== 'undefined' ? localStorage.getItem('threatrecon_feedback_results') || '[]' : '[]'
    );
    localResults.push({
      id: resultId,
      ...resultData,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('threatrecon_feedback_results', JSON.stringify(localResults.slice(-50))); // Keep last 50
    }

    // Check and unlock achievements
    try {
      if (userId) {
        const achievementResponse = await fetch(`${request.nextUrl.origin}/api/achievements/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'simulation_complete',
            eventData: {
              score: evaluationResult.score,
              time: completionTime,
              difficulty: scenarioType,
              scenario: scenarioType,
            },
          }),
        });
        // Don't await - fire and forget
        achievementResponse.json().catch(console.error);
      }
    } catch (achievementErr) {
      console.error('Error checking achievements:', achievementErr);
    }

    return NextResponse.json({
      success: true,
      result: {
        id: resultId,
        ...resultData,
      },
    });
  } catch (error: any) {
    console.error('Error submitting simulation result:', error);
    return NextResponse.json(
      { error: 'Failed to submit simulation result', details: error.message },
      { status: 500 }
    );
  }
}

