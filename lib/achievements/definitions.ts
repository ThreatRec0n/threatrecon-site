// Achievement definitions for the threat hunting platform

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'milestone' | 'skill' | 'speed' | 'consistency' | 'special';
export type RequirementType = 
  | 'login_count'
  | 'tutorial_completed'
  | 'simulation_count'
  | 'perfect_score'
  | 'scenario_type'
  | 'speed_perfect'
  | 'streak'
  | 'difficulty_complete'
  | 'help_opened'
  | 'time_of_day'
  | 'daily_simulations';

export interface AchievementDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  requirement_type: RequirementType;
  requirement_value: number;
  requirement_meta?: Record<string, any>;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Milestone Achievements
  {
    slug: 'first-login',
    name: 'Welcome Aboard',
    description: 'Complete your first login',
    icon: '👋',
    category: 'milestone',
    tier: 'bronze',
    points: 5,
    requirement_type: 'login_count',
    requirement_value: 1,
  },
  {
    slug: 'tutorial-complete',
    name: 'Quick Learner',
    description: 'Complete the onboarding tutorial',
    icon: '🎓',
    category: 'milestone',
    tier: 'bronze',
    points: 10,
    requirement_type: 'tutorial_completed',
    requirement_value: 1,
  },
  {
    slug: 'first-simulation',
    name: 'First Blood',
    description: 'Complete your first simulation',
    icon: '🎯',
    category: 'milestone',
    tier: 'bronze',
    points: 15,
    requirement_type: 'simulation_count',
    requirement_value: 1,
  },
  {
    slug: 'simulation-10',
    name: 'Getting Serious',
    description: 'Complete 10 simulations',
    icon: '🔟',
    category: 'milestone',
    tier: 'silver',
    points: 50,
    requirement_type: 'simulation_count',
    requirement_value: 10,
  },
  {
    slug: 'simulation-50',
    name: 'Half Century',
    description: 'Complete 50 simulations',
    icon: '💯',
    category: 'milestone',
    tier: 'gold',
    points: 200,
    requirement_type: 'simulation_count',
    requirement_value: 50,
  },
  {
    slug: 'simulation-100',
    name: 'Century Club',
    description: 'Complete 100 simulations',
    icon: '🏆',
    category: 'milestone',
    tier: 'platinum',
    points: 500,
    requirement_type: 'simulation_count',
    requirement_value: 100,
  },

  // Skill Achievements
  {
    slug: 'perfect-score',
    name: 'Flawless Victory',
    description: 'Achieve a perfect score on any simulation',
    icon: '⭐',
    category: 'skill',
    tier: 'silver',
    points: 30,
    requirement_type: 'perfect_score',
    requirement_value: 1,
  },
  {
    slug: 'perfect-score-5',
    name: 'Perfectionist',
    description: 'Achieve perfect scores on 5 simulations',
    icon: '🌟',
    category: 'skill',
    tier: 'gold',
    points: 150,
    requirement_type: 'perfect_score',
    requirement_value: 5,
  },
  {
    slug: 'malware-master',
    name: 'Malware Hunter',
    description: 'Complete 10 malware analysis simulations',
    icon: '🦠',
    category: 'skill',
    tier: 'silver',
    points: 75,
    requirement_type: 'scenario_type',
    requirement_value: 10,
    requirement_meta: { scenario_type: 'ransomware-deployment' },
  },
  {
    slug: 'phishing-expert',
    name: 'Phishing Detective',
    description: 'Complete 10 phishing simulations',
    icon: '🎣',
    category: 'skill',
    tier: 'silver',
    points: 75,
    requirement_type: 'scenario_type',
    requirement_value: 10,
    requirement_meta: { scenario_type: 'phishing-malware-dropper' },
  },
  {
    slug: 'apt-hunter',
    name: 'APT Hunter',
    description: 'Complete 5 APT simulations',
    icon: '🕸️',
    category: 'skill',
    tier: 'silver',
    points: 100,
    requirement_type: 'scenario_type',
    requirement_value: 5,
    requirement_meta: { scenario_type: 'apt29-cozy-bear' },
  },

  // Speed Achievements
  {
    slug: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a simulation in under 3 minutes with perfect score',
    icon: '⚡',
    category: 'speed',
    tier: 'gold',
    points: 100,
    requirement_type: 'speed_perfect',
    requirement_value: 180, // seconds
  },
  {
    slug: 'rapid-responder',
    name: 'Rapid Responder',
    description: 'Complete 5 simulations in one day',
    icon: '🚀',
    category: 'speed',
    tier: 'silver',
    points: 60,
    requirement_type: 'daily_simulations',
    requirement_value: 5,
  },

  // Consistency Achievements
  {
    slug: 'daily-grind',
    name: 'Daily Grind',
    description: 'Complete at least one simulation for 7 consecutive days',
    icon: '📅',
    category: 'consistency',
    tier: 'gold',
    points: 120,
    requirement_type: 'streak',
    requirement_value: 7,
  },
  {
    slug: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Complete at least one simulation for 30 consecutive days',
    icon: '🔥',
    category: 'consistency',
    tier: 'platinum',
    points: 500,
    requirement_type: 'streak',
    requirement_value: 30,
  },

  // Advanced Difficulty
  {
    slug: 'advanced-clear',
    name: 'Rising to the Challenge',
    description: 'Complete an Advanced difficulty simulation',
    icon: '🎖️',
    category: 'skill',
    tier: 'gold',
    points: 100,
    requirement_type: 'difficulty_complete',
    requirement_value: 1,
    requirement_meta: { difficulty: 'advanced' },
  },
  {
    slug: 'beginner-master',
    name: 'Foundation Builder',
    description: 'Complete 5 Beginner difficulty simulations',
    icon: '🌱',
    category: 'skill',
    tier: 'bronze',
    points: 40,
    requirement_type: 'scenario_type',
    requirement_value: 5,
    requirement_meta: { difficulty: 'beginner' },
  },
  {
    slug: 'intermediate-expert',
    name: 'Intermediate Expert',
    description: 'Complete 10 Intermediate difficulty simulations',
    icon: '📈',
    category: 'skill',
    tier: 'silver',
    points: 80,
    requirement_type: 'scenario_type',
    requirement_value: 10,
    requirement_meta: { difficulty: 'intermediate' },
  },

  // Special Achievements
  {
    slug: 'help-seeker',
    name: 'Knowledge Seeker',
    description: 'Open the help documentation 10 times',
    icon: '📚',
    category: 'milestone',
    tier: 'bronze',
    points: 20,
    requirement_type: 'help_opened',
    requirement_value: 10,
  },
  {
    slug: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a simulation between midnight and 4 AM',
    icon: '🦉',
    category: 'special',
    tier: 'silver',
    points: 40,
    requirement_type: 'time_of_day',
    requirement_value: 1,
  },
  {
    slug: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a simulation between 5 AM and 8 AM',
    icon: '🌅',
    category: 'special',
    tier: 'bronze',
    points: 25,
    requirement_type: 'time_of_day',
    requirement_value: 1,
    requirement_meta: { time_range: 'early_morning' },
  },
];

// Helper function to get achievement by slug
export function getAchievementBySlug(slug: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.slug === slug);
}

// Helper function to get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

// Helper function to get achievements by tier
export function getAchievementsByTier(tier: AchievementTier): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.tier === tier);
}

