# Settings Page - Implementation Summary

## What Was Created

### 1. Settings API Endpoint
**File**: `/app/api/user/settings/route.ts`

- **GET**: Fetch current user settings (FTP, HR, weight, etc.)
- **POST**: Update user settings
- Uses session authentication (secure)
- Returns success/error messages

### 2. Settings Page UI
**File**: `/app/settings/page.tsx`

A full-featured settings page with:

#### Power Metrics
- **FTP (Functional Threshold Power)** - Used for TSS calculations
- Helpful tooltip explaining how to determine FTP

#### Heart Rate Zones
- **Max Heart Rate** - For training zone calculations
- **Resting Heart Rate** - For HR reserve calculations
- Tips on how to measure each

#### Weight & Equipment
- **Body Weight** - For power-to-weight ratio
- **Bike Weight** - For total system weight

#### Calculated Metrics Display
- **W/kg** (Power-to-Weight Ratio)
- **HR Reserve**
- **Total System Weight**

#### Features
- ✅ Real-time form validation
- ✅ Success/error messages
- ✅ Loading states
- ✅ Helpful tooltips and guidance
- ✅ Automatic metric calculations
- ✅ Info section explaining why each metric matters

### 3. Navigation Update
**File**: `/components/nav.tsx`

Added Settings gear icon to the navigation bar (next to Connect Strava button)

## How It Works

1. User clicks Settings icon in navigation
2. Page loads current settings from database
3. User updates any values (all fields optional)
4. Click "Save Settings"
5. API updates only the provided fields
6. Success message appears
7. User refreshes dashboard to see updated metrics

## What Happens After Setting FTP

Once FTP is set to 225:

1. **TSS Calculation**: All rides with power data will have TSS calculated
2. **CTL (Fitness)**: Chronic Training Load will be calculated (42-day weighted average)
3. **ATL (Fatigue)**: Acute Training Load will be calculated (7-day weighted average)
4. **TSB (Form)**: Training Stress Balance = CTL - ATL (indicates if you're fresh or fatigued)

### Charts That Will Populate:
- ✅ Training Stress Score bar chart
- ✅ Fitness, Fatigue & Form (CTL/ATL/TSB) line chart
- ✅ TSS card will show actual value instead of 0

## Deploy Instructions

```bash
git add .
git commit -m "Add user settings page for FTP, HR, and weight configuration"
git push
```

## Usage After Deployment

1. Visit `https://your-app.vercel.app/settings`
2. Enter your values:
   - FTP: **225 watts**
   - Max HR: (your max heart rate)
   - Resting HR: (optional)
   - Weight: (optional but helpful)
3. Click "Save Settings"
4. Go back to `/dashboard`
5. All TSS metrics and charts will now show data! 🎉

## Future Enhancements

Could add:
- Training zones visualization
- FTP history/tracking over time
- Auto-detect FTP from best 20min power
- Import settings from Strava
- Export settings to file
- Connect to TrainingPeaks/other platforms







