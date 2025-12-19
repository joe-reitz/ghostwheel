# Post-Login 500 Error - Quick Fix Checklist

## ✅ Immediate Actions

### Step 1: Deploy the fixes
```bash
git add .
git commit -m "Fix: Enhanced error handling and debugging for production 500 errors"
git push
```

### Step 2: Check debug endpoints in production
Once deployed, visit these URLs (replace with your actual domain):

1. **Database Status**: `https://your-app.vercel.app/api/debug/db`
   - Should show `"status": "ok"` and table existence
   
2. **Session Status**: `https://your-app.vercel.app/api/debug/session`
   - Login via Strava first
   - Should show `"authenticated": true`

### Step 3: Check Vercel Function Logs
1. Go to https://vercel.com
2. Select your GhostWheel project
3. Click "Deployments"
4. Click on your latest deployment
5. Click "Functions" tab
6. Find `/api/strava/activities` 
7. Look for the new detailed error messages

## 🔍 What to Look For in Logs

### If you see "User not found in database"
**Problem**: Session has Strava ID but database doesn't have user record

**Fix**:
```sql
-- Check if user exists
SELECT * FROM users WHERE strava_id = YOUR_STRAVA_ID;

-- If not, log out and log back in via Strava
```

### If you see "Unauthorized" or "No user found in session"
**Problem**: Session cookie isn't being set or read correctly

**Fix**:
1. Check `STRAVA_REDIRECT_URI` in environment variables
2. Make sure it matches exactly: `https://your-app.vercel.app/api/auth/strava/callback`
3. Clear browser cookies
4. Log in again

### If you see database/SQL errors
**Problem**: Tables might not exist or schema is wrong

**Fix**:
```bash
# Run the database setup
npm run setup-db
# or
npx ts-node scripts/setup-db.ts
```

### If you see "Strava API error"
**Problem**: Invalid or expired Strava tokens

**Fix**:
1. Check `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in Vercel environment variables
2. Make sure they match your Strava API application settings
3. Log out and log back in

### If you see FTP-related errors (shouldn't happen with fixes)
**Problem**: User doesn't have FTP set

**Fix**:
```sql
-- Set your FTP (Functional Threshold Power) in watts
UPDATE users SET ftp = 250 WHERE strava_id = YOUR_STRAVA_ID;
```

## 📋 Environment Variables Checklist

Make sure these are set in Vercel:
- [ ] `STRAVA_CLIENT_ID`
- [ ] `STRAVA_CLIENT_SECRET`
- [ ] `STRAVA_REDIRECT_URI` (must be exact: `https://yourdomain/api/auth/strava/callback`)
- [ ] `POSTGRES_URL`
- [ ] `POSTGRES_PRISMA_URL` (if using Vercel Postgres)
- [ ] `POSTGRES_URL_NON_POOLING` (if using Vercel Postgres)

## 🧪 Local Testing

Before deploying, test locally:

```bash
# Start the dev server
npm run dev

# In another terminal, run the health check
./scripts/health-check.sh

# Or manually check:
curl http://localhost:3000/api/debug/db
curl http://localhost:3000/api/debug/session
```

## 📊 Expected Behavior After Fixes

### Successful Flow:
1. User clicks "Connect Strava"
2. Authorizes on Strava
3. Redirected to `/dashboard`
4. Dashboard shows "Loading your rides..."
5. After 5-30 seconds, rides appear with charts

### If Still Getting 500:
The new error messages in the logs will tell you EXACTLY what's failing:
- Database connection issue
- Session/auth issue  
- Strava API issue
- Missing environment variable

## 🚨 Still Not Working?

If you still see the 500 error after deploying these fixes:

1. **Get the logs**: Go to Vercel → Your Project → Deployments → Latest → Functions
2. **Look for**: `/api/strava/activities` function logs
3. **Find the error**: Look for `console.error` messages
4. **Share the error**: Copy the full error message and stack trace

The new logging will show you the EXACT line where it's failing.

## 💡 Pro Tips

1. **Check both logs**: Browser console AND Vercel function logs
2. **Use debug endpoints**: They're specifically designed to diagnose issues
3. **Start fresh**: Sometimes clearing cookies and logging in again fixes auth issues
4. **Database first**: Make sure `/api/debug/db` returns OK before trying to sync activities

## 🎯 Most Common Issue

Based on the code analysis, the most likely issue is:
- **Missing or misconfigured FTP value** causing power calculations to crash
- This is NOW FIXED with proper null checks

If you're still seeing errors, it's likely:
- Database connection issue (check `/api/debug/db`)
- Session issue (check `/api/debug/session`)  
- Environment variable issue (check Vercel settings)

