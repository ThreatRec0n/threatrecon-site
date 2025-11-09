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
}

