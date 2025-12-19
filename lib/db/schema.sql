-- GhostWheel Database Schema for Vercel Postgres

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  strava_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  email VARCHAR(255),
  profile_picture TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  ftp INTEGER, -- Functional Threshold Power
  max_hr INTEGER, -- Maximum Heart Rate
  resting_hr INTEGER,
  weight DECIMAL(5,2), -- in kg
  bike_weight DECIMAL(5,2), -- in kg
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training zones
CREATE TABLE IF NOT EXISTS training_zones (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  zone_type VARCHAR(20) NOT NULL, -- 'power', 'hr', 'pace'
  zone_number INTEGER NOT NULL, -- 1-7 for power, 1-5 for HR
  lower_bound INTEGER NOT NULL,
  upper_bound INTEGER NOT NULL,
  name VARCHAR(50), -- 'Active Recovery', 'Endurance', 'Tempo', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities (synced from Strava)
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strava_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255),
  type VARCHAR(50), -- 'Ride', 'VirtualRide', etc.
  start_date TIMESTAMP NOT NULL,
  distance DECIMAL(10,2), -- meters
  moving_time INTEGER, -- seconds
  elapsed_time INTEGER, -- seconds
  total_elevation_gain DECIMAL(10,2), -- meters
  average_speed DECIMAL(10,2), -- m/s
  max_speed DECIMAL(10,2), -- m/s
  average_watts DECIMAL(10,2),
  max_watts INTEGER,
  weighted_power DECIMAL(10,2), -- Normalized Power
  average_heartrate DECIMAL(6,2),
  max_heartrate INTEGER,
  average_cadence DECIMAL(6,2),
  max_cadence INTEGER,
  kilojoules DECIMAL(10,2),
  device_watts BOOLEAN, -- true if power meter data
  has_heartrate BOOLEAN,
  
  -- Calculated metrics
  tss DECIMAL(10,2), -- Training Stress Score
  intensity_factor DECIMAL(5,3), -- IF
  variability_index DECIMAL(5,3), -- VI
  
  -- Route data
  summary_polyline TEXT,
  map_id VARCHAR(255),
  
  -- Raw data (for detailed analysis)
  stream_data JSONB, -- time, distance, latlng, altitude, velocity_smooth, heartrate, cadence, watts, temp, moving, grade_smooth
  
  -- AI Analysis
  ai_analysis TEXT,
  ai_feedback TEXT,
  analyzed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for common queries
  INDEX idx_user_date (user_id, start_date DESC),
  INDEX idx_strava_id (strava_id)
);

-- Training load tracking (for CTL, ATL, TSB calculation)
CREATE TABLE IF NOT EXISTS training_load (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_tss DECIMAL(10,2) DEFAULT 0,
  ctl DECIMAL(10,2), -- Chronic Training Load (Fitness)
  atl DECIMAL(10,2), -- Acute Training Load (Fatigue)
  tsb DECIMAL(10,2), -- Training Stress Balance (Form)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, date),
  INDEX idx_user_date (user_id, date DESC)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'race', 'distance', 'speed', 'power', 'weight'
  target_value DECIMAL(10,2),
  target_date DATE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  progress DECIMAL(5,2), -- percentage
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training plan
CREATE TABLE IF NOT EXISTS training_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  plan_type VARCHAR(50), -- 'endurance', 'race_prep', 'base_building'
  weeks_total INTEGER,
  
  -- AI generated plan details
  plan_data JSONB, -- weekly structure, workouts, progressions
  
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Planned workouts
CREATE TABLE IF NOT EXISTS planned_workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  training_plan_id INTEGER REFERENCES training_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  workout_type VARCHAR(50), -- 'endurance', 'intervals', 'recovery', 'tempo'
  name VARCHAR(255),
  description TEXT,
  target_duration INTEGER, -- seconds
  target_distance DECIMAL(10,2), -- meters
  target_tss DECIMAL(10,2),
  workout_details JSONB, -- intervals, zones, instructions
  
  -- Completion tracking
  completed BOOLEAN DEFAULT FALSE,
  completed_activity_id INTEGER REFERENCES activities(id),
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_date (user_id, scheduled_date)
);

-- Personal records
CREATE TABLE IF NOT EXISTS personal_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  record_type VARCHAR(50) NOT NULL, -- 'power_5s', 'power_1min', 'power_5min', 'power_20min', 'best_km', 'longest_ride', etc.
  value DECIMAL(10,2) NOT NULL,
  duration INTEGER, -- for power curve records (in seconds)
  date_achieved DATE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, record_type, duration),
  INDEX idx_user_type (user_id, record_type)
);

-- AI coaching insights (saved insights for trend analysis)
CREATE TABLE IF NOT EXISTS coaching_insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50), -- 'weekly_summary', 'pattern_detected', 'recommendation', 'warning'
  title VARCHAR(255),
  content TEXT NOT NULL,
  severity VARCHAR(20), -- 'info', 'success', 'warning', 'critical'
  data JSONB, -- supporting data/metrics
  
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segments (Strava segments for competitive analysis)
CREATE TABLE IF NOT EXISTS segment_efforts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  segment_id BIGINT NOT NULL,
  segment_name VARCHAR(255),
  elapsed_time INTEGER,
  moving_time INTEGER,
  distance DECIMAL(10,2),
  average_watts DECIMAL(10,2),
  average_heartrate DECIMAL(6,2),
  kom_rank INTEGER,
  pr_rank INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_segment (user_id, segment_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_zones_updated_at BEFORE UPDATE ON training_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_load_updated_at BEFORE UPDATE ON training_load FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON training_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planned_workouts_updated_at BEFORE UPDATE ON planned_workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


