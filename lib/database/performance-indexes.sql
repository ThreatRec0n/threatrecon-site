-- Performance indexes for ThreatRecon database
-- Run this in Supabase SQL Editor to optimize query performance

-- Simulation results indexes
CREATE INDEX IF NOT EXISTS idx_simulation_results_user_scenario 
  ON simulation_results(user_id, scenario_id);

CREATE INDEX IF NOT EXISTS idx_simulation_results_completed 
  ON simulation_results(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_results_score 
  ON simulation_results(user_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_results_scenario_score 
  ON simulation_results(scenario_id, score DESC, completed_at DESC);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress 
  ON user_achievements(user_id, unlocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement 
  ON user_achievements(achievement_id, unlocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement 
  ON user_achievements(user_id, achievement_id);

-- Leaderboard indexes (if using database for leaderboard)
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank 
  ON users(total_points DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_recent 
  ON simulation_results(completed_at DESC, score DESC)
  WHERE completed_at > NOW() - INTERVAL '30 days';

-- Audit logs indexes (for future)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON audit_logs(user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_status 
  ON audit_logs(status, created_at DESC)
  WHERE status = 'failure';

CREATE INDEX IF NOT EXISTS idx_audit_logs_created 
  ON audit_logs(created_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
  ON user_sessions(user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
  ON user_sessions(user_id, is_active, expires_at DESC)
  WHERE is_active = true;

-- Trusted devices indexes
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user 
  ON trusted_devices(user_id, created_at DESC);

-- Analyze tables for query planning
ANALYZE simulation_results;
ANALYZE user_achievements;
ANALYZE users;
ANALYZE audit_logs;
ANALYZE user_sessions;
ANALYZE trusted_devices;

