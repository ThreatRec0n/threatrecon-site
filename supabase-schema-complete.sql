-- ============================================================================
-- COMPLETE SUPABASE DATABASE SCHEMA FOR THREATRECON PLATFORM
-- ============================================================================
-- Run this in your Supabase SQL Editor to create ALL required tables
-- This is the complete schema needed for the platform to work with Supabase
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USER PROGRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_scenarios TEXT[] DEFAULT '{}',
  scores JSONB DEFAULT '[]',
  leaderboard_entries JSONB DEFAULT '[]',
  streak INTEGER DEFAULT 0,
  tutorial_completed BOOLEAN DEFAULT FALSE,
  help_opened_count INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  last_simulation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. SIMULATION RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_type VARCHAR(100) NOT NULL,
  scenario_name VARCHAR(200),
  scenario_id VARCHAR(100),
  score INTEGER NOT NULL,
  skill_level VARCHAR(50),
  completion_time INTEGER, -- in seconds
  timed_mode BOOLEAN DEFAULT FALSE,
  breakdown JSONB NOT NULL, -- { truePositives, falsePositives, falseNegatives, trueNegatives }
  by_stage JSONB NOT NULL, -- breakdown by attack stage
  user_answers JSONB NOT NULL, -- array of user's IOC classifications
  missed_iocs JSONB DEFAULT '[]',
  over_flagged_iocs JSONB DEFAULT '[]',
  red_team_replay JSONB,
  recommendations TEXT[],
  ioc_tags JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SIMULATION COMPLETIONS TABLE (for achievements/stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS simulation_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  difficulty VARCHAR(20), -- 'beginner', 'intermediate', 'advanced', 'expert'
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ACHIEVEMENTS TABLE (achievement definitions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'milestone', 'skill', 'speed', 'consistency', 'special'
  tier VARCHAR(20) NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
  points INTEGER DEFAULT 0,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  requirement_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. USER ACHIEVEMENTS TABLE (unlocked achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- 6. USER 2FA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT, -- Encrypted TOTP secret
  two_factor_backup_codes JSONB DEFAULT '[]', -- Hashed backup codes
  two_factor_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TRUSTED DEVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(200),
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 8. USER SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 9. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'warning'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- User Progress Policies
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Simulation Results Policies
CREATE POLICY "Users can view own simulation results"
  ON simulation_results FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own simulation results"
  ON simulation_results FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own simulation results"
  ON simulation_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Simulation Completions Policies
CREATE POLICY "Users can view own completions"
  ON simulation_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON simulation_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements Policies (public read, admin write)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- User Achievements Policies
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2FA Policies
CREATE POLICY "Users can view own 2FA settings"
  ON user_2fa FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON user_2fa FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings"
  ON user_2fa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trusted Devices Policies
CREATE POLICY "Users can view own trusted devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
  ON trusted_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Sessions Policies
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User Progress Indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Simulation Results Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_results_user_id ON simulation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_user_scenario ON simulation_results(user_id, scenario_type);
CREATE INDEX IF NOT EXISTS idx_simulation_results_completed ON simulation_results(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_results_score ON simulation_results(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_results_scenario_score ON simulation_results(scenario_type, score DESC, completed_at DESC);

-- Simulation Completions Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_completions_user_id ON simulation_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_completions_completed ON simulation_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_completions_scenario ON simulation_completions(scenario, completed_at DESC);

-- Achievement Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_slug ON achievements(slug);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- User Achievement Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON user_achievements(user_id, achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(user_id, unlocked_at DESC);

-- 2FA Indexes
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);

-- Trusted Devices Indexes
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_token ON trusted_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires ON trusted_devices(expires_at);

-- User Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, expires_at DESC) WHERE revoked = false;

-- Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);

-- ============================================================================
-- SEED ACHIEVEMENTS DATA (Optional - can be done via API instead)
-- ============================================================================
-- Note: Achievements are typically seeded via the application, but you can
-- also insert them here if preferred. See lib/achievements/definitions.ts
-- for the full list of achievements.

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================
-- SELECT COUNT(*) FROM user_progress;
-- SELECT COUNT(*) FROM simulation_results;
-- SELECT COUNT(*) FROM achievements;
-- SELECT COUNT(*) FROM user_achievements;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

