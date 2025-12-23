# Fix Summary: Production 500 Error After Strava Login

## Problem
After successfully logging in via Strava, the dashboard page shows:
- "Error loading data"
- "Failed to fetch activities"
- Network error: `/api/strava/activities` returns HTTP 500

## Root Causes Identified

1. **Insufficient Error Logging** - Hard to diagnose what's failing
2. **No Null Safety for FTP** - Power calculations crash if user.ftp is undefined
3. **No Error Recovery** - One failing activity crashes the entire sync
4. **Poor Error Propagation** - Frontend doesn't show specific error details

## Changes Made

### 1. Enhanced Error Logging (`/app/api/strava/activities/route.ts`)

**Added detailed logging:**
```typescript
// Log user data for debugging
console.log('User found:', {
  id: user.id,
  stravaId: user.strava_id,
  hasFTP: !!user.ftp,
  hasMaxHR: !!user.max_hr
});

// Enhanced error catch block
console.error('Error stack:', error.stack);
```

**Better error responses:**
```typescript
return NextResponse.json({
  error: 'Failed to fetch Strava activities',
  details: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
}, { status: 500 });
```

### 2. Fixed FTP Null Safety

**Changed from:**
```typescript
if (activity.average_watts && user.ftp) {
```

**To:**
```typescript
if (activity.average_watts && user.ftp && user.ftp > 0) {
```

This ensures power calculations are only performed when FTP is properly configured.

### 3. Added Error Recovery for Individual Activities

**Wrapped database operations in try-catch:**
```typescript
try {
  const storedActivity = await createOrUpdateActivity({...});
  // ... rest of processing
} catch (dbError) {
  console.error(`Error storing activity ${activity.id}:`, dbError);
  // Continue processing even if this activity fails to save
}
```

This means if one activity fails to save, the rest will still be processed.

### 4. Added Error Recovery for Training Load Updates

**Wrapped training load updates:**
```typescript
try {
  await updateTrainingLoad(user.id, new Date(date), tss, currentCTL, currentATL, tsb);
} catch (tlError) {
  console.error(`Error updating training load for ${date}:`, tlError);
  // Continue processing even if this fails
}
```

### 5. Enhanced Session Authentication Logging (`/lib/session.ts`)

**Added debugging to requireAuth:**
```typescript
if (!user) {
  console.error('requireAuth: No user found in session');
  throw new Error('Unauthorized');
}

console.log('requireAuth: User authenticated:', { 
  stravaId: user.stravaId, 
  id: user.id 
});
```

### 6. Improved Frontend Error Handling (`/app/dashboard/page.tsx`)

**Enhanced error extraction:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
  throw new Error(errorData.error || errorData.details || 'Failed to fetch activities')
}
```

This ensures users see specific error messages instead of generic ones.

### 7. Created Debug Endpoints

**Session Debug (`/app/api/debug/session/route.ts`):**
- Check if user is authenticated
- Verify session data
- Verify database user record
- Check token expiration

**Database Debug (`/app/api/debug/db/route.ts`):**
- Test database connectivity
- Check if required tables exist
- Count users in database
- Show current database time

### 8. Created Troubleshooting Documentation (`/TROUBLESHOOTING.md`)

Comprehensive guide covering:
- Common error scenarios
- Step-by-step debugging
- Database setup verification
- Environment variable checklist
- How to read logs in Vercel

## How to Use These Fixes

### In Development:
1. Pull latest code
2. Check terminal logs when the error occurs - you'll now see detailed error messages
3. Visit `/api/debug/session` to verify authentication
4. Visit `/api/debug/db` to verify database connection

### In Production (Vercel):
1. Deploy latest code
2. Go to Vercel Dashboard → Deployments → Function Logs
3. Filter logs for `/api/strava/activities`
4. Look for the new console.log and console.error messages
5. Visit `https://your-app.vercel.app/api/debug/session` to check session
6. Visit `https://your-app.vercel.app/api/debug/db` to check database

## Most Likely Issues

Based on the code review, the 500 error is most likely caused by one of:

1. **Missing FTP value** (now fixed with null checks)
2. **Database connection issues** (can now be diagnosed with `/api/debug/db`)
3. **Session/authentication issues** (can now be diagnosed with `/api/debug/session`)
4. **Database tables not created** (check with debug endpoint)
5. **Invalid Strava tokens** (check logs for Strava API errors)

## Next Steps

1. **Deploy these changes** to production
2. **Try logging in again** and check if error persists
3. **If error persists**, check the Vercel function logs for the new detailed error messages
4. **Visit debug endpoints** to identify the exact failure point
5. **Report back** with the specific error message from the logs

## Files Changed

- ✅ `/app/api/strava/activities/route.ts` - Enhanced error handling and logging
- ✅ `/lib/session.ts` - Added session debugging
- ✅ `/app/dashboard/page.tsx` - Better error display
- ✅ `/app/api/debug/session/route.ts` - NEW: Session debugging endpoint
- ✅ `/app/api/debug/db/route.ts` - NEW: Database debugging endpoint
- ✅ `/TROUBLESHOOTING.md` - NEW: Comprehensive troubleshooting guide





