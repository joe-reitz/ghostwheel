-- Migration: Add ride_analyses table for conversational AI coaching
-- Created: 2025-12-23

-- Ride analyses (conversation history for ride-specific AI coaching)
CREATE TABLE IF NOT EXISTS ride_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id BIGINT NOT NULL, -- Strava activity ID
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ride_analyses_user_activity 
  ON ride_analyses(user_id, activity_id, created_at DESC);



