// Progress tracking using localStorage

import type { UserProgress } from './types';

const STORAGE_KEY = 'threat-hunt-progress';

export function getProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return {
      completedScenarios: [],
      scores: {},
      timeSpent: {},
      achievements: [],
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UserProgress;
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }

  return {
    completedScenarios: [],
    scores: {},
    timeSpent: {},
    achievements: [],
  };
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function updateScenarioScore(scenarioId: string, score: number, timeSpent: number): void {
  const progress = getProgress();
  
  if (!progress.completedScenarios.includes(scenarioId)) {
    progress.completedScenarios.push(scenarioId);
  }
  
  progress.scores[scenarioId] = score;
  progress.timeSpent[scenarioId] = timeSpent;
  
  // Check for achievements
  checkAchievements(progress);
  
  saveProgress(progress);
}

function checkAchievements(progress: UserProgress): void {
  const achievements = new Set(progress.achievements);
  
  // First completion
  if (progress.completedScenarios.length === 1 && !achievements.has('first-completion')) {
    achievements.add('first-completion');
  }
  
  // Perfect score
  const recentScore = Object.values(progress.scores).slice(-1)[0];
  if (recentScore === 100 && !achievements.has('perfect-score')) {
    achievements.add('perfect-score');
  }
  
  // Completed 5 scenarios
  if (progress.completedScenarios.length >= 5 && !achievements.has('scenario-master')) {
    achievements.add('scenario-master');
  }
  
  // Completed all difficulty levels
  // This would need scenario data to check, simplified for now
  
  progress.achievements = Array.from(achievements);
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

