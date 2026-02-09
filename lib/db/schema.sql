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

-- Ride analyses (conversation history for ride-specific AI coaching)
CREATE TABLE IF NOT EXISTS ride_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id BIGINT NOT NULL, -- Strava activity ID
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_activity (user_id, activity_id, created_at DESC)
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

-- Bikes (synced from Strava or manually added)
CREATE TABLE IF NOT EXISTS bikes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strava_gear_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  model VARCHAR(255),
  bike_type VARCHAR(50) DEFAULT 'road', -- road, gravel, mountain, tt, track, cx, hybrid
  weight DECIMAL(5,2), -- in kg
  is_active BOOLEAN DEFAULT TRUE,
  total_distance DECIMAL(12,2) DEFAULT 0, -- cached, in meters
  ride_count INTEGER DEFAULT 0,
  total_elevation DECIMAL(10,2) DEFAULT 0, -- cached, in meters
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, strava_gear_id)
);

-- Components (trackable parts on a bike)
CREATE TABLE IF NOT EXISTS components (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
  component_type VARCHAR(50) NOT NULL, -- chain, cassette, chainrings, tires_front, tires_rear, brake_pads, bar_tape, chain_wax, chain_lube, cables
  brand VARCHAR(255),
  model VARCHAR(255),
  install_date DATE DEFAULT CURRENT_DATE,
  install_distance DECIMAL(12,2) DEFAULT 0, -- bike distance at install time (meters)
  current_distance DECIMAL(12,2) DEFAULT 0, -- distance on this component (meters)
  expected_lifetime_distance DECIMAL(12,2), -- in meters
  expected_lifetime_days INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- active, retired, moved
  retirement_reason VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Component history (install/move/retire/service events)
CREATE TABLE IF NOT EXISTS component_history (
  id SERIAL PRIMARY KEY,
  component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL, -- installed, moved, retired, serviced
  from_bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
  to_bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
  distance_at_event DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance schedules (reminders for periodic service)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bike_id INTEGER REFERENCES bikes(id) ON DELETE CASCADE,
  component_type VARCHAR(50) NOT NULL,
  interval_distance DECIMAL(12,2), -- meters between services
  interval_days INTEGER, -- days between services
  last_service_date DATE,
  last_service_distance DECIMAL(12,2) DEFAULT 0, -- bike distance at last service
  email_alert BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tire pressure configurations (saved calculator setups)
CREATE TABLE IF NOT EXISTS tire_pressure_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  tire_width_front DECIMAL(5,1) NOT NULL, -- mm
  tire_width_rear DECIMAL(5,1) NOT NULL,
  tire_type VARCHAR(20) NOT NULL, -- tubeless, clincher, tubular
  surface_type VARCHAR(50) NOT NULL,
  rider_weight DECIMAL(5,2) NOT NULL, -- kg
  bike_weight DECIMAL(5,2) NOT NULL, -- kg
  front_rear_split DECIMAL(4,2) DEFAULT 0.42, -- fraction on front
  calculated_front_psi DECIMAL(5,1),
  calculated_rear_psi DECIMAL(5,1),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tire_pressure_configs_updated_at BEFORE UPDATE ON tire_pressure_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add bike association to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS strava_gear_id VARCHAR(50);




