// Scoring system with keyword matching

import type { Question, Scenario, AlertClassification, InvestigationResult } from './types';

export function scoreAnswer(question: Question, userAnswer: string): {
  correct: boolean;
  score: number;
  matchedAnswer?: string;
} {
  if (!userAnswer.trim()) {
    return { correct: false, score: 0 };
  }

  const normalizedAnswer = userAnswer.toLowerCase().trim();
  
  // Check against all correct answers
  for (const correctAnswer of question.correctAnswers) {
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (normalizedAnswer === normalizedCorrect) {
      return { correct: true, score: question.points, matchedAnswer: correctAnswer };
    }
    
    // Contains match (for longer answers)
    if (normalizedAnswer.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedAnswer)) {
      return { correct: true, score: question.points, matchedAnswer: correctAnswer };
    }
    
    // Keyword matching (split and check)
    const userKeywords = normalizedAnswer.split(/\s+/);
    const correctKeywords = normalizedCorrect.split(/\s+/);
    
    // If user answer contains all key keywords (at least 70% match)
    const matchingKeywords = userKeywords.filter(kw => 
      correctKeywords.some(ckw => ckw.includes(kw) || kw.includes(ckw))
    );
    
    if (matchingKeywords.length >= Math.ceil(correctKeywords.length * 0.7)) {
      return { correct: true, score: question.points, matchedAnswer: correctAnswer };
    }
  }
  
  return { correct: false, score: 0 };
}

export function calculateTotalScore(questions: Question[], answers: Record<string, string>): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: Array<{ questionId: string; score: number; maxScore: number; correct: boolean }>;
} {
  let totalScore = 0;
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const breakdown: Array<{ questionId: string; score: number; maxScore: number; correct: boolean }> = [];
  
  questions.forEach(question => {
    const userAnswer = answers[question.id] || '';
    const result = scoreAnswer(question, userAnswer);
    totalScore += result.score;
    breakdown.push({
      questionId: question.id,
      score: result.score,
      maxScore: question.points,
      correct: result.correct,
    });
  });
  
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  return {
    totalScore,
    maxScore,
    percentage,
    breakdown,
  };
}

export function gradeInvestigation(
  scenario: Scenario,
  userClassifications: Record<string, AlertClassification>,
  answers: Record<string, string>,
  timeSpent: number
): InvestigationResult {
  const classificationResults = {
    correct: 0,
    incorrect: 0,
    missed: 0, // False negatives
    falseAlarms: 0, // False positives marked as true positives
  };
  
  const alertFeedback: InvestigationResult['feedback'] = {
    missedThreats: [],
    falseAlarms: [],
    correctClassifications: [],
  };
  
  // Grade each alert classification
  scenario.alerts.forEach(alert => {
    const userClassification = userClassifications[alert.id] || 'unclassified';
    const correctClassification = alert.correctClassification || 'unclassified';
    
    if (userClassification === 'unclassified' && correctClassification === 'true-positive') {
      classificationResults.missed++;
      if (scenario.showFeedback) {
        alertFeedback.missedThreats.push({
          alertId: alert.id,
          alertName: alert.ruleName,
          indicators: alert.keyIndicators || [],
          explanation: alert.explanation || 'This was a true positive that you missed.',
        });
      }
    } else if (userClassification === 'true-positive' && correctClassification === 'false-positive') {
      classificationResults.falseAlarms++;
      if (scenario.showFeedback) {
        alertFeedback.falseAlarms.push({
          alertId: alert.id,
          alertName: alert.ruleName,
          whyFalsePositive: alert.explanation || 'This was a false positive.',
          indicators: alert.keyIndicators || [],
        });
      }
    } else if (userClassification === correctClassification) {
      classificationResults.correct++;
      if (scenario.showFeedback) {
        alertFeedback.correctClassifications.push({
          alertId: alert.id,
          alertName: alert.ruleName,
          whyCorrect: alert.explanation || 'Correct classification.',
        });
      }
    } else {
      classificationResults.incorrect++;
    }
  });
  
  // Grade questions
  const questionResults = calculateTotalScore(scenario.questions, answers);
  
  // Calculate total score
  const classificationScore = scenario.alerts.length > 0 
    ? (classificationResults.correct / scenario.alerts.length) * 100 
    : 0;
  const questionScore = questionResults.percentage;
  const timeBonus = Math.max(0, 100 - (timeSpent / 60)); // Penalty for taking too long
  
  const totalScore = (
    classificationScore * scenario.gradingCriteria.classificationWeight +
    questionScore * scenario.gradingCriteria.investigationWeight +
    timeBonus * scenario.gradingCriteria.timeWeight
  ) / (
    scenario.gradingCriteria.classificationWeight +
    scenario.gradingCriteria.investigationWeight +
    scenario.gradingCriteria.timeWeight
  );
  
  return {
    scenarioId: scenario.id,
    alertClassifications: userClassifications,
    answers,
    timeSpent,
    score: Math.round(totalScore),
    maxScore: 100,
    percentage: Math.round(totalScore),
    breakdown: {
      classifications: classificationResults,
      questions: questionResults.breakdown,
    },
    feedback: scenario.showFeedback ? alertFeedback : undefined,
  };
}

