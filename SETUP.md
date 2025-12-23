# GhostWheel Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Link Vercel Project & Pull Env Variables
```bash
npm run setup
```

This will:
- Link your local project to Vercel
- Pull all environment variables from production

### 3. Initialize Database

#### Option A: Via Vercel Dashboard (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to "Storage" tab
3. Create a new Postgres database
4. Go to "Data" tab in the database
5. Copy and paste the entire contents of `lib/db/schema.sql`
6. Click "Run Query"

#### Option B: Via psql CLI
```bash
# Get your Postgres connection string from .env.local
psql $POSTGRES_URL < lib/db/schema.sql
```

### 4. Configure Strava OAuth

1. Go to https://www.strava.com/settings/api
2. Create a new application with these settings:
   - **Application Name**: GhostWheel
   - **Category**: Training
   - **Website**: Your Vercel URL
   - **Authorization Callback Domain**: `localhost:3000,your-domain.vercel.app`

3. Copy your credentials and add them to Vercel:
```bash
vercel env add STRAVA_CLIENT_ID
vercel env add STRAVA_CLIENT_SECRET
vercel env add STRAVA_REDIRECT_URI
```

4. Pull the updated env variables:
```bash
vercel env pull .env.local
```

### 5. Add OpenAI API Key (if not already in Vercel)

```bash
vercel env add OPENAI_API_KEY
vercel env pull .env.local
```

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 🎉

## Environment Variables Checklist

Make sure your `.env.local` has:

```env
✅ STRAVA_CLIENT_ID
✅ STRAVA_CLIENT_SECRET
✅ STRAVA_REDIRECT_URI
✅ OPENAI_API_KEY
✅ POSTGRES_URL
✅ POSTGRES_PRISMA_URL (auto-configured by Vercel)
✅ POSTGRES_URL_NON_POOLING (auto-configured by Vercel)
✅ POSTGRES_USER (auto-configured by Vercel)
✅ POSTGRES_HOST (auto-configured by Vercel)
✅ POSTGRES_PASSWORD (auto-configured by Vercel)
✅ POSTGRES_DATABASE (auto-configured by Vercel)
```

## First Time User Setup

### 1. Connect Your Strava Account
1. Click "Connect Strava" button in the nav bar
2. Authorize GhostWheel to access your Strava data
3. You'll be redirected back to the dashboard

### 2. Set Your FTP (Functional Threshold Power)
Your FTP is used to calculate training zones and metrics like TSS, IF, etc.

Methods to determine FTP:
- **20-min test**: Ride as hard as you can for 20 minutes, multiply average power by 0.95
- **Ramp test**: Many Zwift/TrainerRoad protocols available
- **From recent rides**: Check your best 20-minute power in Strava

### 3. Create Your STP Goal
1. Go to "Training" tab
2. Click "Generate STP Plan"
3. Fill in:
   - Target Date: July 12, 2025 (or your STP date)
   - Current FTP
   - Recent weekly mileage
   - Longest recent ride
   - Current average speed
4. Click "Generate Plan"

The AI will create a personalized periodized training plan!

### 4. Sync Your Ride History
Your rides will automatically sync when you connect Strava. The system will:
- Calculate advanced metrics (TSS, NP, IF, VI)
- Track your fitness (CTL), fatigue (ATL), and form (TSB)
- Generate AI insights on each ride
- Update your power curve with PRs

## Development Tips

### Hot Module Reloading
Next.js will auto-reload when you save files. Fast Refresh preserves component state.

### TypeScript
The entire codebase is TypeScript. Your IDE should provide autocomplete and type checking.

### Database Queries
All database functions are in `lib/db/index.ts`. They use Vercel Postgres with parameterized queries for security.

### Adding New Metrics
1. Add calculation function to `lib/cycling-metrics.ts`
2. Update the activities API route to calculate it
3. Add to database schema if you want to store it
4. Display in dashboard/ride analysis pages

## Troubleshooting

### "User not found" error
- Make sure you've connected your Strava account
- Check that the Strava callback URL is correct
- Verify database connection

### Environment variables not loading
```bash
# Re-pull from Vercel
vercel env pull .env.local --force
```

### Database connection errors
- Check that Postgres is running in Vercel
- Verify connection strings in `.env.local`
- Make sure schema is initialized

### Strava API rate limits
Strava limits: 100 requests per 15 minutes, 1000 per day
- The app caches data in the database to minimize API calls
- Activities are only re-fetched when needed

### OpenAI API errors
- Check your API key is valid
- Verify you have credits/quota
- OpenAI rate limits: depends on your tier

## Production Deployment

### Deploy to Vercel
```bash
# Commit your changes
git add .
git commit -m "Ready for production"
git push

# Vercel will auto-deploy from GitHub
```

### Update Strava Callback URL
After deploying, update your Strava app settings to include your production domain in the callback URLs.

### Monitor Usage
- Check Vercel dashboard for function execution times
- Monitor Postgres query performance
- Track OpenAI token usage

## Support

For issues or questions:
1. Check this guide
2. Review the README.md
3. Check code comments
4. Open an issue on GitHub

---

**Now go crush STP! 🚴‍♂️💨**






