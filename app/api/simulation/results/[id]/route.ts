// API route to retrieve detailed simulation results for a given ID

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseEnabled } from '@/lib/supabase/server';
import { getFeedbackExplanation } from '@/lib/feedback/explanations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultId = params.id;

    // Check if it's a local result
    if (resultId.startsWith('local-')) {
      // Try to get from localStorage (client-side only)
      if (typeof window !== 'undefined') {
        const localResults = JSON.parse(
          localStorage.getItem('threatrecon_feedback_results') || '[]'
        );
        const result = localResults.find((r: any) => r.id === resultId);
        
        if (result) {
          // Enrich with full MITRE/OWASP details
          const enrichedAnswers = (result.user_answers || []).map((answer: any) => {
            const explanation = getFeedbackExplanation(
              answer.ioc,
              answer.type,
              answer.isCorrect,
              answer.actualClassification,
              result.scenario_type
            );

            return {
              ...answer,
              explanation: explanation.correct || explanation.incorrect,
              mitreAttackId: answer.technique_id || explanation.mitreAttackId,
              owaspCategory: explanation.owaspCategory,
              resources: explanation.resources,
            };
          });

          return NextResponse.json({
            ...result,
            user_answers: enrichedAnswers,
          });
        }
      }

      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // Get from database if Supabase is enabled
    if (isSupabaseEnabled()) {
      const supabase = await getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('simulation_results')
          .select('*')
          .eq('id', resultId)
          .single();

        if (error) {
          console.error('Error fetching simulation result:', error);
          return NextResponse.json(
            { error: 'Result not found' },
            { status: 404 }
          );
        }

        if (data) {
          // Enrich user answers with full MITRE/OWASP details
          const enrichedAnswers = (data.user_answers || []).map((answer: any) => {
            const explanation = getFeedbackExplanation(
              answer.ioc,
              answer.type,
              answer.isCorrect,
              answer.actualClassification,
              data.scenario_type
            );

            return {
              ...answer,
              explanation: explanation.correct || explanation.incorrect,
              mitreAttackId: answer.technique_id || explanation.mitreAttackId,
              owaspCategory: explanation.owaspCategory,
              resources: explanation.resources,
            };
          });

          return NextResponse.json({
            ...data,
            user_answers: enrichedAnswers,
          });
        }
      }
    }

    return NextResponse.json(
      { error: 'Result not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching simulation result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulation result', details: error.message },
      { status: 500 }
    );
  }
}

