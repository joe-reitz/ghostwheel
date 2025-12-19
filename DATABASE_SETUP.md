# Database Setup Guide

## The Problem

You were getting a 500 error on the dashboard because:
1. **No database tables existed** - The schema SQL hadn't been run on your Neon Postgres database
2. **No session management** - The app didn't know which user was logged in
3. **Hardcoded user ID** - The dashboard was looking for `"YOUR_STRAVA_ID"` instead of the actual logged-in user

## What I Fixed

### 1. Created Database Setup Script ✅
- Added `scripts/setup-db.ts` - Automated script to create all tables
- Added `npm run db:setup` command to run it

### 2. Implemented Session Management ✅
- Created `lib/session.ts` with secure cookie-based sessions
- Updated OAuth callback to create session after login
- Sessions last 30 days
- HttpOnly cookies for security

### 3. Updated API Routes ✅
- `/api/strava/activities` now uses session instead of query params
- Automatically gets the logged-in user
- More secure (no userId in URL)

### 4. Fixed Dashboard ✅
- Removed hardcoded `"YOUR_STRAVA_ID"`
- Now fetches activities for logged-in user automatically
- Changed `analyze=true` to `analyze=false` for faster initial load

## Setup Steps

### Option 1: Run the Automated Script (Recommended)

```bash
# Make sure you have POSTGRES_URL in your .env.local
npm run db:setup
```

This will:
- Create all 10 tables (users, activities, training_load, goals, etc.)
- Set up indexes and triggers
- Verify everything was created correctly

### Option 2: Manual Setup via Vercel Dashboard

1. Go to your Vercel project
2. Go to Storage → Your Neon Postgres database
3. Click "Query" or "Data"
4. Copy the entire contents of `lib/db/schema.sql`
5. Paste and execute it

## What Happens Now

### When you log in with Strava:
1. OAuth flow completes → `app/api/auth/strava/callback/route.ts`
2. User data is saved to the `users` table in your database
3. A secure session cookie is created with your Strava ID
4. You're redirected to `/dashboard`

### When you visit the dashboard:
1. Dashboard calls `/api/strava/activities?lookback=month`
2. API route reads your session cookie to get your Strava ID
3. Fetches your activities from Strava API
4. Calculates advanced metrics (TSS, NP, IF, VI)
5. Stores everything in the `activities` table
6. Calculates training load (CTL/ATL/TSB)
7. Returns data to the dashboard
8. Dashboard displays beautiful charts

## Database Schema Overview

Your database now has these tables:

1. **users** - Your Strava profile, tokens, FTP, max HR
2. **activities** - All your rides with metrics and AI analysis
3. **training_load** - Daily TSS, CTL, ATL, TSB tracking
4. **goals** - Your training goals (like STP!)
5. **training_plans** - AI-generated training plans
6. **planned_workouts** - Daily workout schedule
7. **personal_records** - Power curve PRs, best times, etc.
8. **coaching_insights** - AI-generated insights and recommendations
9. **training_zones** - Your power/HR zones
10. **segment_efforts** - Strava segment data for competitive analysis

## Testing

After running `npm run db:setup`:

1. Deploy to Vercel or test locally
2. Visit your site
3. Click "Connect Strava"
4. Complete OAuth flow
5. You should land on the dashboard with your data!

## Troubleshooting

### "Error connecting to database"
- Check that `POSTGRES_URL` is set in your environment
- Verify you can connect to Neon from your terminal

### "User not found"
- Clear your cookies
- Log in again with Strava

### "Failed to fetch activities"
- Check Vercel logs for detailed error
- Verify your Strava tokens are valid
- Check that the `users` table has your data

## Next Steps

Once the database is set up:
1. Test the full OAuth flow
2. Verify activities are syncing
3. Check that AI analysis works
4. Set up Strava webhooks for real-time updates (see `docs/WEBHOOKS.md`)
5. Create your first training plan!

## Security Notes

- Session cookies are **httpOnly** and **secure** in production
- Strava tokens are stored encrypted in the database
- No sensitive data is exposed in URLs
- Sessions expire after 30 days

## Local Development

For local development, make sure your `.env.local` has:

```bash
# Strava OAuth
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (from Vercel)
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NO_SSL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...

# OpenAI
OPENAI_API_KEY=sk-...
```

Run `npm run setup` to automatically pull these from Vercel!


