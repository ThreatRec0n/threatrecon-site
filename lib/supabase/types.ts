export interface UserProgress {
  id?: string;
  user_id: string;
  completed_scenarios: string[];
  scores: Array<{
    scenario: string;
    score: number;
    timestamp: string;
    skill_level: string;
  }>;
  leaderboard_entries: Array<{
    score: number;
    time: number;
    scenario: string;
    timestamp: string;
    skill_level: string;
  }>;
  updated_at?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  role?: 'user' | 'admin' | 'moderator'; // RBAC role
}

// RBAC role definitions
export type UserRole = 'user' | 'admin' | 'moderator';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  user: ['view_simulation', 'complete_scenarios', 'view_leaderboard', 'sync_progress'],
  moderator: ['view_simulation', 'complete_scenarios', 'view_leaderboard', 'sync_progress', 'moderate_content', 'view_analytics'],
  admin: ['view_simulation', 'complete_scenarios', 'view_leaderboard', 'sync_progress', 'moderate_content', 'view_analytics', 'manage_users', 'system_config'],
};

