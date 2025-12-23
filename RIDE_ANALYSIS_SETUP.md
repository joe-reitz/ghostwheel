# Ride Analysis with AI Coach - Setup Guide

## What's Been Built

I've created a comprehensive individual ride analysis page with a conversational AI coach. This feature allows you to:

1. **View detailed ride metrics** - All your power, heart rate, speed, and elevation data
2. **Chat with an AI coach** - Ask questions about your performance and get personalized insights
3. **Add context** - Share how you felt, weather conditions, or specific concerns
4. **Review history** - All conversations are saved per ride

## Files Created/Modified

### New API Endpoints
- `/app/api/rides/[id]/route.ts` - Fetch individual ride details from Strava
- `/app/api/rides/[id]/analyze/route.ts` - AI coaching conversation endpoint
  - POST: Send questions to the AI coach
  - GET: Retrieve conversation history for a ride

### Updated Pages
- `/app/rides/[id]/page.tsx` - Complete redesign with:
  - Real-time data fetching from Strava
  - Interactive conversation interface
  - Suggested starter questions
  - Message history with timestamps
  - Smooth scrolling and animations

### Database Changes
- `/lib/db/schema.sql` - Added `ride_analyses` table
- `/lib/db/migrations/add_ride_analyses.sql` - Migration script
- `/scripts/migrate-ride-analyses.ts` - Automated migration runner

### Documentation
- `/docs/RIDE_ANALYSIS.md` - Complete feature documentation
- `RIDE_ANALYSIS_SETUP.md` - This file

## Setup Instructions

### 1. Database Migration

Run the migration to add the `ride_analyses` table:

```bash
npx tsx scripts/migrate-ride-analyses.ts
```

Or manually run the SQL:

```sql
CREATE TABLE IF NOT EXISTS ride_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_id BIGINT NOT NULL,
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_analyses_user_activity 
  ON ride_analyses(user_id, activity_id, created_at DESC);
```

### 2. Environment Variables

Ensure your `.env.local` file has:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Test the Feature

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in with Strava

3. Navigate to any ride (e.g., `/rides/12345` where 12345 is a Strava activity ID)

4. Try asking questions like:
   - "How did I perform on this ride?"
   - "Was my pacing good?"
   - "What should I focus on improving?"

## How It Works

### Data Flow

1. **Page Load**:
   - Fetches ride details from Strava API via `/api/rides/[id]`
   - Retrieves conversation history from database
   - Displays ride metrics and charts

2. **User Asks Question**:
   - Sends question with conversation history to `/api/rides/[id]/analyze`
   - API fetches additional context (user profile, recent rides, goals)
   - Sends comprehensive data to OpenAI GPT-4o
   - Stores question and response in database
   - Returns AI response to display

3. **Conversation Context**:
   - All previous messages in the conversation
   - Complete ride metrics
   - User's FTP, max HR settings
   - Last 5 rides before this one
   - Active goals and target dates

### AI Coaching System

The AI coach is designed as an experienced cycling coach with:
- **Personality**: Encouraging, honest, specific, actionable
- **Knowledge**: Training principles, power-based training, pacing strategies
- **Context**: Your complete training history and goals
- **Style**: Concise but informative (2-4 paragraphs)

### Example Prompt Structure

The AI receives:
```
System: You are an experienced cycling coach...

User: Here's the ride data for context:
[Complete ride metrics]
[User profile: FTP, max HR]
[Recent training history]
[Active goals]
I'll be asking questions about this ride.