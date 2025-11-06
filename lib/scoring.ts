// Scoring system with keyword matching

import type { Question } from './types';

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

