# Training Plan Generation - Setup Guide

## Issue
The training plan generation feature returns a 500 error because it requires OpenAI API access to generate AI-powered training plans.

## What Was Fixed

### 1. API Route (`/app/api/training-plan/route.ts`)
- ✅ Fixed to use session authentication instead of hardcoded userId
- ✅ Added better error messages
- ✅ Added specific hint when OPENAI_API_KEY is missing

### 2. Frontend (`/app/training/page.tsx`)
- ✅ Removed hardcoded `"YOUR_STRAVA_ID"` - now uses session
- ✅ Added error state and display
- ✅ Shows helpful message when OpenAI key is missing

## Required Setup

### Get an OpenAI API Key

1. **Sign up for OpenAI**: https://platform.openai.com/
2. **Create an API key**: https://platform.openai.com/api-keys
3. **Copy your key** (starts with `sk-...`)

### Add to Environment Variables

#### Local Development (`.env.local`):
```bash
OPENAI_API_KEY=sk-your-key-here
```

#### Production (Vercel):
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-key-here`
   - **Environments**: Production, Preview, Development
4. Click "Save"
5. **Redeploy** your application

## How It Works

The training plan generator:
1. Takes your current fitness stats (FTP, weekly mileage, longest ride, etc.)
2. Calls OpenAI's GPT-4 model to generate a personalized STP training plan
3. Saves the plan to your database
4. Displays the plan with weekly structure, key workouts, nutrition, and gear recommendations

## Cost Considerations

- OpenAI charges per API call
- Training plan generation uses **GPT-4o** model
- Approximate cost: **$0.01 - $0.05 per plan generation**
- You can set usage limits in your OpenAI dashboard

## Alternative: Disable AI Features

If you don't want to use OpenAI, you can:

1. **Comment out** the training plan generation in the UI
2. **Use static templates** instead of AI generation
3. **Remove the feature** entirely

To disable:
```typescript
// In app/training/page.tsx
// Comment out or hide the "Generate Plan" button
```

## Testing After Setup

1. Add `OPENAI_API_KEY` to your environment
2. Restart your development server (or redeploy to Vercel)
3. Go to `/training` page
4. Click "Generate STP Plan"
5. Fill in your details
6. Click "Generate Plan"
7. You should see a detailed training plan generated

## Error Messages

### "OPENAI_API_KEY environment variable is not set"
**Solution**: Add the API key to your environment variables

### "Failed to generate training plan"
**Possible causes**:
- Invalid API key
- OpenAI API is down
- Rate limit exceeded
- Insufficient OpenAI credits

**Check**:
- Vercel function logs for detailed error
- OpenAI dashboard for API status
- OpenAI usage page for rate limits

## Security Note

⚠️ **Never commit your OpenAI API key to git!**
- Keep it in `.env.local` (already in `.gitignore`)
- Only add it to Vercel environment variables
- Rotate your key if accidentally exposed

## Future Enhancements

Consider adding:
- Rate limiting (1 plan per day per user)
- Caching plans to reduce API calls
- Plan templates for common scenarios
- Ability to edit/customize generated plans





