// Leveling and XP System for ThreatRecon Platform

export interface UserLevel {
  level: number; // 1-50
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Junior Analyst',
  2: 'Junior Analyst',
  3: 'Junior Analyst',
  4: 'Junior Analyst',
  5: 'Junior Analyst',
  6: 'SOC Analyst',
  7: 'SOC Analyst',
  8: 'SOC Analyst',
  9: 'SOC Analyst',
  10: 'SOC Analyst',
  11: 'Senior Analyst',
  12: 'Senior Analyst',
  13: 'Senior Analyst',
  14: 'Senior Analyst',
  15: 'Senior Analyst',
  16: 'Lead Analyst',
  17: 'Lead Analyst',
  18: 'Lead Analyst',
  19: 'Lead Analyst',
  20: 'Lead Analyst',
  21: 'SOC Manager',
  22: 'SOC Manager',
  23: 'SOC Manager',
  24: 'SOC Manager',
  25: 'SOC Manager',
  26: 'Senior Manager',
  27: 'Senior Manager',
  28: 'Senior Manager',
  29: 'Senior Manager',
  30: 'Senior Manager',
  31: 'Director of SOC',
  32: 'Director of SOC',
  33: 'Director of SOC',
  34: 'Director of SOC',
  35: 'Director of SOC',
  36: 'Senior Director',
  37: 'Senior Director',
  38: 'Senior Director',
  39: 'Senior Director',
  40: 'Senior Director',
  41: 'VP of Security',
  42: 'VP of Security',
  43: 'VP of Security',
  44: 'VP of Security',
  45: 'VP of Security',
  46: 'Chief Security Officer',
  47: 'Chief Security Officer',
  48: 'Chief Security Officer',
  49: 'Chief Security Officer',
  50: 'Chief Security Officer',
};

// XP required for each level (exponential growth)
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate total XP needed to reach a level
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

// Calculate level from total XP
export function levelFromXP(totalXP: number): number {
  let level = 1;
  let currentXP = 0;
  
  while (level < 50) {
    const xpNeeded = xpForLevel(level + 1);
    if (currentXP + xpNeeded > totalXP) {
      break;
    }
    currentXP += xpNeeded;
    level++;
  }
  
  return level;
}

// XP rewards for different actions
export const XP_REWARDS = {
  completeInvestigation: 100,
  perfectScore: 50,
  achievementCommon: 25,
  achievementRare: 50,
  achievementEpic: 100,
  achievementLegendary: 200,
  dailyLogin: 10,
  consecutiveDayBonus: 5, // per day in streak
  tutorialComplete: 25,
  firstInvestigation: 50,
} as const;

// Get user level from localStorage
export function getUserLevel(): UserLevel {
  if (typeof window === 'undefined') {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXP: 0,
      title: 'Junior Analyst',
    };
  }

  const stored = localStorage.getItem('threatrecon_user_level');
  if (!stored) {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXP: 0,
      title: 'Junior Analyst',
    };
  }

  try {
    const data = JSON.parse(stored);
    const level = levelFromXP(data.totalXP || 0);
    const xpForCurrentLevel = totalXPForLevel(level);
    const xpForNextLevel = totalXPForLevel(level + 1);
    const currentXP = (data.totalXP || 0) - xpForCurrentLevel;
    const xpToNext = xpForNextLevel - (data.totalXP || 0);

    return {
      level,
      xp: currentXP,
      xpToNextLevel: xpToNext,
      totalXP: data.totalXP || 0,
      title: LEVEL_TITLES[level] || 'Junior Analyst',
    };
  } catch {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXP: 0,
      title: 'Junior Analyst',
    };
  }
}

// Add XP and update level
export function addXP(amount: number): UserLevel {
  const current = getUserLevel();
  const newTotalXP = current.totalXP + amount;
  const newLevel = levelFromXP(newTotalXP);
  
  const xpForCurrentLevel = totalXPForLevel(newLevel);
  const xpForNextLevel = totalXPForLevel(newLevel + 1);
  const currentXP = newTotalXP - xpForCurrentLevel;
  const xpToNext = xpForNextLevel - newTotalXP;

  const updated: UserLevel = {
    level: newLevel,
    xp: currentXP,
    xpToNextLevel: xpToNext,
    totalXP: newTotalXP,
    title: LEVEL_TITLES[newLevel] || 'Junior Analyst',
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('threatrecon_user_level', JSON.stringify({ totalXP: newTotalXP }));
  }

  return updated;
}

// Get title for a level
export function getTitleForLevel(level: number): string {
  return LEVEL_TITLES[level] || 'Junior Analyst';
}

