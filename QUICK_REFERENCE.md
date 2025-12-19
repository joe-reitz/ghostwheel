# GhostWheel Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Setup
npm run setup            # Link Vercel + pull env vars
npm run db:init          # Database initialization reminder

# Deployment
git push origin main     # Auto-deploys via Vercel
vercel --prod           # Manual production deploy
vercel logs --follow    # Watch logs
```

## 📊 Key Metrics Reference

### Training Stress Score (TSS)
- **< 150**: Easy day
- **150-300**: Moderate workout
- **300-450**: Hard training day
- **> 450**: Epic/race effort

### Intensity Factor (IF)
- **< 0.75**: Recovery
- **0.75-0.85**: Endurance (Zone 2)
- **0.85-0.95**: Tempo (Zone 3)
- **0.95-1.05**: Threshold (Zone 4)
- **> 1.05**: VO2 Max+ (Zone 5+)

### Training Stress Balance (TSB)
- **+25 to +10**: Well rested, race ready
- **+10 to -10**: Optimal training range
- **-10 to -30**: Fatigued, high training load
- **< -30**: Overreaching, risk of overtraining

### Variability Index (VI)
- **1.00-1.05**: Excellent pacing (steady effort)
- **1.05-1.10**: Good pacing
- **> 1.10**: Variable effort (sprints, intervals)

## 🎯 FTP Zones (Power)

Based on your Functional Threshold Power:

| Zone | % of FTP | Name | Purpose |
|------|----------|------|---------|
| 1 | 0-55% | Active Recovery | Rest while moving |
| 2 | 56-75% | Endurance | Base building, fat burning |
| 3 | 76-90% | Tempo | Muscular endurance |
| 4 | 91-105% | Lactate Threshold | Race pace, sustained efforts |
| 5 | 106-120% | VO2 Max | Hard intervals |
| 6 | 121-150% | Anaerobic | Short, hard efforts |
| 7 | 150%+ | Neuromuscular | All-out sprints |

## ❤️ Heart Rate Zones

Based on max HR:

| Zone | % of Max HR | Name | Feel |
|------|-------------|------|------|
| 1 | 50-60% | Very Light | Easy conversation |
| 2 | 60-70% | Light | Comfortable, can talk |
| 3 | 70-80% | Moderate | Breathing harder |
| 4 | 80-90% | Hard | Difficult to talk |
| 5 | 90-100% | Maximum | Can't sustain long |

## 📅 Training Plan Structure

### Base Phase (Weeks 1-8)
- **Focus**: Aerobic base, Zone 2 endurance
- **Volume**: Gradual increase, 10% per week
- **Intensity**: 80% Z2, 15% Z3, 5% Z4+
- **Long Ride**: 40-60 miles

### Build Phase (Weeks 9-16)
- **Focus**: Tempo work, sustained efforts
- **Volume**: Peak weekly volume
- **Intensity**: 60% Z2, 25% Z3, 15% Z4+
- **Long Ride**: 60-100 miles

### Peak Phase (Weeks 17-20)
- **Focus**: Race-specific intensity
- **Volume**: Maintain or slight decrease
- **Intensity**: 50% Z2, 30% Z3, 20% Z4
- **Long Ride**: 100-130 miles

### Taper Phase (Weeks 21-22)
- **Focus**: Recovery, maintaining fitness
- **Volume**: 50% reduction
- **Intensity**: Some Z4 efforts, mostly easy
- **Long Ride**: 50-70 miles

## 🍽️ Nutrition Guidelines

### Daily (Off bike)
- **Carbs**: 5-7g per kg bodyweight
- **Protein**: 1.6-2.0g per kg bodyweight
- **Fats**: 1.0g per kg bodyweight
- **Hydration**: 30-40ml per kg bodyweight

### During Rides
| Duration | Carbs/Hour | Fluids/Hour |
|----------|------------|-------------|
| < 1 hour | 0-30g | 500-750ml |
| 1-2 hours | 30-60g | 500-750ml |
| 2-3 hours | 60-90g | 750-1000ml |
| > 3 hours | 80-120g | 750-1000ml |

### STP Specific (204 miles)
- **Target**: 90-100g carbs/hour
- **Fluids**: 750-1000ml/hour
- **Sodium**: 500-1000mg/hour
- **Practice**: On all long rides (100+ miles)

## 🔧 API Endpoints

```
GET  /api/strava/activities        # Fetch & sync activities
GET  /api/training-plan            # Get training plans
POST /api/training-plan            # Generate new plan
POST /api/webhooks/strava          # Webhook handler
GET  /api/auth/strava              # Start OAuth
GET  /api/auth/strava/callback     # OAuth callback
```

## 📦 Key Files

```
lib/cycling-metrics.ts       # All metric calculations
lib/ai-coach.ts              # OpenAI integration
lib/db/index.ts              # Database functions
lib/db/schema.sql            # Database schema
app/api/strava/activities/   # Activity sync endpoint
components/power-curve.tsx   # Power curve viz
```

## 🐛 Troubleshooting

### Activities not syncing
```bash
# Check webhook is active
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=$STRAVA_CLIENT_ID \
  -d client_secret=$STRAVA_CLIENT_SECRET

# Check Vercel logs
vercel logs --follow
```

### Database connection issues
```bash
# Re-pull environment variables
vercel env pull .env.local --force

# Test connection
psql $POSTGRES_URL -c "SELECT NOW();"
```

### AI analysis not working
```bash
# Check OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check Vercel logs for errors
vercel logs --follow
```

## 📱 Page URLs

```
/                    # Home/landing page
/dashboard           # Main analytics dashboard
/rides               # All rides list
/rides/[id]          # Individual ride analysis
/training            # Training plans
/goals               # Goal tracking
```

## 🔐 Environment Variables

Required:
```env
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
STRAVA_REDIRECT_URI
OPENAI_API_KEY
POSTGRES_URL
```

Optional:
```env
STRAVA_WEBHOOK_VERIFY_TOKEN
NEXT_PUBLIC_MAPBOX_TOKEN (for maps)
```

## 💾 Database Tables

Main tables:
- `users` - User profiles and tokens
- `activities` - All ride data
- `training_load` - CTL/ATL/TSB tracking
- `goals` - User goals
- `training_plans` - AI-generated plans
- `personal_records` - Power curve PRs
- `coaching_insights` - AI recommendations

## 🎨 UI Components

```tsx
// Recharts
import { LineChart, AreaChart, BarChart, RadarChart } from 'recharts'

// Custom
import { PowerCurve } from '@/components/power-curve'
import { RouteMap } from '@/components/route-map'
import { Nav } from '@/components/nav'

// shadcn/ui
import { Button } from '@/components/ui/button'
```

## 📈 Performance Benchmarks

### FTP (Functional Threshold Power)
- **Beginner**: < 2.0 W/kg
- **Recreational**: 2.0-3.0 W/kg
- **Competitive**: 3.0-4.0 W/kg
- **Elite**: 4.0-5.0 W/kg
- **Pro**: 5.0+ W/kg

### STP Target
- **Distance**: 204 miles (328 km)
- **Time Goal**: 12 hours
- **Avg Speed**: 17 mph (27.4 km/h)
- **Estimated TSS**: 400-500
- **Recommended IF**: 0.70-0.75
- **Nutrition**: 1000-1200g carbs total

## 🚀 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database initialized with schema
- [ ] Strava OAuth app configured
- [ ] OpenAI API key valid
- [ ] Webhook subscription created
- [ ] Test activity uploaded
- [ ] Check logs for errors
- [ ] Verify metrics calculated
- [ ] Test AI analysis
- [ ] Create first goal

## 📞 Support

- **Documentation**: See README.md, SETUP.md
- **Issues**: GitHub issues
- **Metrics Reference**: This file
- **Code Comments**: Extensive inline docs

---

**Save this file for quick reference! 📎**


