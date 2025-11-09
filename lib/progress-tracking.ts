// Skill progression and progress tracking

export interface SkillProgress {
  difficulty: string;
  scenariosCompleted: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number; // in seconds
  totalIPsFound: number;
  totalCorrectClassifications: number;
  totalIncorrectClassifications: number;
  achievements: string[];
  lastPlayed?: string;
}

export interface UserProgress {
  userId?: string;
  skills: Record<string, SkillProgress>;
  totalScenariosCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  level: number;
  experience: number;
}

const STORAGE_KEY = 'threat-hunt-progress';

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
  
  return getDefaultProgress();
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

export function updateProgress(
  difficulty: string,
  score: number,
  timeSpent: number,
  ipsFound: number,
  correctClassifications: number,
  incorrectClassifications: number
): UserProgress {
  const progress = loadProgress();
  
  if (!progress.skills[difficulty]) {
    progress.skills[difficulty] = {
      difficulty,
      scenariosCompleted: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      totalIPsFound: 0,
      totalCorrectClassifications: 0,
      totalIncorrectClassifications: 0,
      achievements: [],
    };
  }
  
  const skill = progress.skills[difficulty];
  skill.scenariosCompleted++;
  skill.totalTimeSpent += timeSpent;
  skill.totalIPsFound += ipsFound;
  skill.totalCorrectClassifications += correctClassifications;
  skill.totalIncorrectClassifications += incorrectClassifications;
  skill.averageScore = Math.round(
    (skill.averageScore * (skill.scenariosCompleted - 1) + score) / skill.scenariosCompleted
  );
  
  if (score > skill.bestScore) {
    skill.bestScore = score;
  }
  
  skill.lastPlayed = new Date().toISOString();
  
  // Calculate experience and level
  const experienceGain = Math.round(score * 10 + (100 - timeSpent / 60) * 5);
  progress.experience += experienceGain;
  progress.level = Math.floor(progress.experience / 1000) + 1;
  
  // Update streaks
  if (score >= 70) {
    progress.currentStreak++;
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
  } else {
    progress.currentStreak = 0;
  }
  
  // Check for achievements
  checkAchievements(progress, skill, score);
  
  progress.totalScenariosCompleted++;
  
  saveProgress(progress);
  return progress;
}

function checkAchievements(progress: UserProgress, skill: SkillProgress, score: number): void {
  const achievements = new Set(progress.badges);
  
  // Perfect score
  if (score === 100) {
    achievements.add('perfect-score');
  }
  
  // High scores
  if (score >= 90) {
    achievements.add('expert-analyst');
  }
  
  // Completion milestones
  if (progress.totalScenariosCompleted === 1) {
    achievements.add('first-hunt');
  }
  if (progress.totalScenariosCompleted === 10) {
    achievements.add('veteran-hunter');
  }
  if (progress.totalScenariosCompleted === 50) {
    achievements.add('master-hunter');
  }
  
  // Streak achievements
  if (progress.currentStreak >= 5) {
    achievements.add('hot-streak');
  }
  if (progress.currentStreak >= 10) {
    achievements.add('unstoppable');
  }
  
  // Level achievements
  if (progress.level >= 5) {
    achievements.add('level-5');
  }
  if (progress.level >= 10) {
    achievements.add('level-10');
  }
  
  // Difficulty-specific achievements
  if (skill.scenariosCompleted >= 5 && skill.averageScore >= 80) {
    achievements.add(`${skill.difficulty}-master`);
  }
  
  progress.badges = Array.from(achievements);
}

function getDefaultProgress(): UserProgress {
  return {
    skills: {},
    totalScenariosCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    level: 1,
    experience: 0,
  };
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

