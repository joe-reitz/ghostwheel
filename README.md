# 🚴 GhostWheel - Elite AI Cycling Coach

The most advanced AI-powered cycling training platform. Integrated with Strava, powered by OpenAI, built for champions.

![GhostWheel Dashboard](https://img.shields.io/badge/Status-Ready%20to%20Ship-brightgreen)

## 🎯 What Makes GhostWheel World-Class

### AI Coaching
- **Post-Ride Analysis**: Get detailed AI feedback on every ride
- **Pattern Detection**: Automatically identifies training trends and areas for improvement
- **Personalized Training Plans**: AI-generated periodized plans for your specific goals
- **Weekly Insights**: Summary of your training with actionable recommendations

### Advanced Cycling Metrics
- **Normalized Power (NP)**: True metabolic cost calculation
- **Training Stress Score (TSS)**: Quantify every workout
- **Intensity Factor (IF)**: Understand ride intensity relative to FTP
- **Variability Index (VI)**: Measure pacing consistency
- **CTL/ATL/TSB**: Track fitness, fatigue, and form
- **Power Curve**: Visualize PRs across all durations

### Data Visualization
- Interactive charts with Recharts
- Power & heart rate analysis
- Elevation profiles
- Training load tracking
- Performance radar charts
- Calendar heatmaps (coming soon)

### STP (Seattle to Portland) Training
Specialized 204-mile one-day event training:
- Periodized training phases
- Progressive overload
- Endurance-focused workouts
- Nutrition guidance
- Gear recommendations

## 🚀 Setup

### Prerequisites
- Node.js 20+
- Vercel account
- Strava API credentials
- OpenAI API key

### 1. Clone & Install
```bash
git clone https://github.com/joe-reitz/ghostwheel.git
cd ghostwheel
npm install
```

### 2. Vercel Setup
```bash
# Link to your Vercel project
npx vercel link --yes

# Pull environment variables
npx vercel env pull .env.local
```

### 3. Environment Variables
Create a `.env.local` file with:

```env
# Strava API
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Vercel Postgres (auto-configured via Vercel)
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_prisma_url
POSTGRES_URL_NON_POOLING=your_non_pooling_url
POSTGRES_USER=your_user
POSTGRES_HOST=your_host
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database
```

### 4. Database Setup
```bash
# Create Vercel Postgres database via Vercel dashboard
# Then run the schema
npx vercel env pull
# Upload schema.sql to your database via Vercel dashboard or psql
```

Alternatively, use the Vercel dashboard to:
1. Create a Postgres database
2. Go to the "Data" tab
3. Run the SQL from `lib/db/schema.sql`

### 5. Strava OAuth Setup
1. Go to https://www.strava.com/settings/api
2. Create an application
3. Set callback URL to: `http://localhost:3000/api/auth/strava/callback` (for local)
4. Add production callback: `https://your-domain.vercel.app/api/auth/strava/callback`
5. Copy Client ID and Client Secret to `.env.local`

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📊 Features

### Dashboard
- Real-time activity syncing from Strava
- KPI cards (rides, distance, TSS, form)
- Interactive charts (distance, speed, power, HR)
- Training load visualization (CTL/ATL/TSB)
- Performance radar
- AI insights on recent rides

### Rides
- Complete ride history
- Filter by outdoor/Zwift
- Detailed ride analysis page
- Power/HR streams visualization
- Elevation profiles
- Advanced metrics (IF, VI, TSS)
- AI coaching feedback

### Training Plans
- AI-generated STP training plan
- Periodized phases (Base, Build, Peak, Taper)
- Weekly structure
- Key workouts
- Nutrition & gear guidance

### Goals
- Set custom goals (races, distance, speed, FTP)
- Track progress
- Countdown to events
- Visual progress bars

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **AI**: OpenAI GPT-4
- **Data Viz**: Recharts
- **UI**: Tailwind CSS + shadcn/ui
- **API Integration**: Strava API v3

## 📈 Metrics Explained

### Training Stress Score (TSS)
Quantifies the training load of a workout. 100 TSS = 1 hour at FTP.

### Normalized Power (NP)
Accounts for variability in power output. More accurate than average power for metabolic cost.

### Intensity Factor (IF)
NP divided by FTP. Represents relative intensity:
- < 0.75: Recovery
- 0.75-0.85: Endurance
- 0.85-0.95: Tempo
- 0.95-1.05: Threshold
- \> 1.05: VO2 Max+

### CTL (Chronic Training Load)
42-day exponential average of TSS. Represents fitness.

### ATL (Acute Training Load)
7-day exponential average of TSS. Represents fatigue.

### TSB (Training Stress Balance)
CTL - ATL = Form. Positive = fresh, negative = fatigued.

## 🎯 Roadmap

- [ ] Strava webhooks for real-time activity sync
- [ ] Route maps with performance overlays (Mapbox/Leaflet)
- [ ] Segment analysis and KOM tracking
- [ ] Training calendar with planned workouts
- [ ] Mobile app (React Native)
- [ ] Multi-sport support (running, swimming)
- [ ] Social features (compare with friends)
- [ ] Nutrition tracking integration
- [ ] Equipment tracking (bike maintenance)

## 🤝 Contributing

This is a personal project for crushing STP, but PRs are welcome!

## 📝 License

MIT

## 💪 Built For

Training for Seattle to Portland (STP) - 204 miles in one day at 17+ mph average. Let's fucking GO! 🚴‍♂️💨

---

**GhostWheel** - Train smarter. Ride faster. Dominate.
