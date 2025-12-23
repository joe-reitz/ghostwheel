# GhostWheel Troubleshooting Guide

## Common Errors After Strava Login

### Error: "Failed to load api/strava/activities" (500 Error)

This error typically occurs when the dashboard tries to fetch your Strava activities after logging in. Here are the most common causes and solutions:

#### 1. Database Not Initialized

**Symptoms:** 500 error immediately after login

**Solution:**
```bash
# Check if the database exists and has the correct schema
npm run setup-db
# or
npx ts-node scripts/setup-db.ts
```

#### 2. Missing FTP Value

**Symptoms:** Error when processing activities with power data

**What's happening:** The app tries to calculate Training Stress Score (TSS) but your FTP (Functional Threshold Power) isn't set.

**Solution:**
- Set your FTP in the database:
```sql
UPDATE users SET ftp = 250 WHERE strava_id = YOUR_STRAVA_ID;
```
- Or, the app should gracefully skip power calculations if FTP is not set (this is now handled in the latest version)

#### 3. Invalid or Expired Strava Token

**Symptoms:** Error fetching activities from Strava API

**Solution:**
- Log out and log back in through Strava
- Check that your Strava API credentials are correct in your environment variables

#### 4. Missing Environment Variables

**Required Variables:**
```env
# Strava API
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback

# Database (Vercel Postgres)
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
POSTGRES_USER=your_user
POSTGRES_HOST=your_host
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database
```

## Debugging Steps

### 1. Check Session Status

Visit `/api/debug/session` to see if your session is properly authenticated:

```bash
curl http://localhost:3000/api/debug/session
```

Expected output:
```json
{
  "authenticated": true,
  "session": {
    "stravaId": 12345678,
    "id": 1,
    "username": "yourname",
    "hasFTP": true,
    "hasMaxHR": true
  },
  "database": {
    "found": true,
    "id": 1,
    "stravaId": 12345678,
    "hasFTP": true,
    "hasMaxHR": true,
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "tokenExpiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Check Application Logs

**Local Development:**
Look at your terminal running `npm run dev` for detailed error messages.

**Vercel Production:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Deployments" → Select your deployment
4. Click "View Function Logs"
5. Look for errors in the `/api/strava/activities` endpoint

### 3. Test Strava API Connection

Try accessing your activities directly:
```bash
# Get your access token from the database
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://www.strava.com/api/v3/athlete/activities?per_page=1
```

## Recent Fixes (v0.2.0)

The following improvements have been made to handle errors more gracefully:

1. **Better error logging** - More detailed error messages in console
2. **FTP null checks** - Power calculations are skipped if FTP is not set
3. **Database error handling** - Individual activity failures won't crash the entire sync
4. **Training load error handling** - Training load calculation errors won't prevent activity display
5. **Improved error messages** - Frontend now shows specific error details

## Database Schema Issues

If you're seeing database errors, you might need to recreate your tables. Here's how:

### Option 1: Fresh Start (Development Only)
```sql
-- Drop all tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS segment_efforts CASCADE;
DROP TABLE IF EXISTS coaching_insights CASCADE;
DROP TABLE IF EXISTS personal_records CASCADE;
DROP TABLE IF EXISTS planned_workouts CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS training_load CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS training_zones CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then run the schema.sql file
```

### Option 2: Check Individual Tables
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check users table structure
\d users
```

## Still Having Issues?

If none of the above solutions work:

1. Check the browser console for client-side errors
2. Check the network tab in browser dev tools for the exact API response
3. Look at the Vercel function logs for the complete error stack trace
4. Make sure you have the latest code: `git pull origin main`
5. Clear your browser cookies and try logging in again

## Getting Help

When reporting an issue, please include:

1. The exact error message from the browser console
2. The error message from `/api/debug/session`
3. Whether this is local development or production
4. Your Node.js version: `node --version`
5. Whether the database has been initialized

## Performance Notes

- First sync after login may take 30-60 seconds if you have many activities
- The app processes up to 200 activities at a time
- Power calculations require fetching additional stream data from Strava (slower)
- You can speed up initial loads by setting `analyze=false` (which is the default)





