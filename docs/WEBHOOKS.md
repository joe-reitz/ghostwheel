# Setting Up Strava Webhooks

Strava webhooks enable real-time activity syncing. When you upload a ride to Strava, GhostWheel automatically processes it, calculates metrics, and generates AI insights.

## Setup Steps

### 1. Deploy Your App to Vercel
Webhooks require a public HTTPS URL. Deploy to Vercel first:
```bash
git push origin main
# Vercel will auto-deploy
```

### 2. Add Webhook Verify Token to Env Variables
```bash
vercel env add STRAVA_WEBHOOK_VERIFY_TOKEN
# Enter a random string, e.g., "GHOSTWHEEL_2025_SECURE_TOKEN"
```

### 3. Create Webhook Subscription via Strava API

Use this curl command (replace placeholders):

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=YOUR_STRAVA_CLIENT_ID \
  -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
  -F callback_url=https://your-app.vercel.app/api/webhooks/strava \
  -F verify_token=GHOSTWHEEL_2025_SECURE_TOKEN
```

Response:
```json
{
  "id": 12345,
  "resource_state": 2,
  "application_id": 67890,
  "callback_url": "https://your-app.vercel.app/api/webhooks/strava",
  "created_at": "2025-12-18T...",
  "updated_at": "2025-12-18T..."
}
```

**Save the subscription ID!** You'll need it to manage the webhook.

### 4. Verify Webhook is Active

List your subscriptions:
```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=YOUR_STRAVA_CLIENT_ID \
  -d client_secret=YOUR_STRAVA_CLIENT_SECRET
```

### 5. Test the Webhook

Upload a test ride to Strava and check your Vercel logs:
```bash
vercel logs --follow
```

You should see webhook events logged.

## Event Types

Strava sends these events:

### Activity Created
```json
{
  "object_type": "activity",
  "object_id": 123456789,
  "aspect_type": "create",
  "owner_id": 987654,
  "subscription_id": 12345,
  "event_time": 1640000000
}
```

### Activity Updated
```json
{
  "object_type": "activity",
  "object_id": 123456789,
  "aspect_type": "update",
  "updates": {
    "title": "New Title",
    "type": "Ride"
  },
  "owner_id": 987654,
  "subscription_id": 12345,
  "event_time": 1640000000
}
```

### Activity Deleted
```json
{
  "object_type": "activity",
  "object_id": 123456789,
  "aspect_type": "delete",
  "owner_id": 987654,
  "subscription_id": 12345,
  "event_time": 1640000000
}
```

## What Happens When You Upload a Ride

1. **Strava sends webhook** to your app
2. **GhostWheel receives event** at `/api/webhooks/strava`
3. **Fetches full activity data** from Strava API
4. **Calculates advanced metrics**:
   - Normalized Power (NP)
   - Training Stress Score (TSS)
   - Intensity Factor (IF)
   - Variability Index (VI)
5. **Stores in database** with all metrics
6. **Generates AI analysis** using OpenAI
7. **Updates training load** (CTL/ATL/TSB)
8. **Checks for PRs** and updates power curve
9. **Creates coaching insight** if patterns detected

All of this happens automatically in the background!

## Managing Webhooks

### View Current Subscription
```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET
```

### Delete Subscription
```bash
curl -X DELETE https://www.strava.com/api/v3/push_subscriptions/SUBSCRIPTION_ID \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET
```

## Troubleshooting

### Webhook not receiving events
1. Check Vercel logs: `vercel logs --follow`
2. Verify subscription is active (curl command above)
3. Check callback URL is correct and HTTPS
4. Ensure verify token matches in env variables

### Events received but not processing
1. Check user is in database with valid tokens
2. Verify Strava API token hasn't expired
3. Check OpenAI API key is valid
4. Review Vercel function logs for errors

### Rate Limiting
- Strava: 100 requests/15 min, 1000/day per app
- OpenAI: Varies by tier
- Use database caching to minimize API calls

## Rate Limits & Best Practices

### Strava API Limits
- **100 requests per 15 minutes**
- **1,000 requests per day**

To stay within limits:
- Cache activity data in database
- Only fetch streams when needed
- Batch operations when possible

### Webhook Best Practices
1. **Always return 200** - Even if processing fails
2. **Process async** - Don't block the webhook response
3. **Idempotent** - Handle duplicate events gracefully
4. **Log everything** - Essential for debugging

## Security

### Verify Request Authenticity
The webhook handler verifies:
1. Token matches during subscription setup
2. All requests come from Strava IPs (optional enhancement)

### Protect Sensitive Data
- Never log access tokens
- Use environment variables for secrets
- Rotate tokens regularly

## Development Testing

For local testing, use ngrok:
```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000

# Use ngrok URL for callback_url when creating subscription
```

Note: You'll need to recreate the subscription with the ngrok URL.

## Going Live

Once deployed to production:
1. ✅ Webhook subscription created
2. ✅ Verify token in env variables
3. ✅ Test with a real activity upload
4. ✅ Monitor logs for first 24 hours
5. ✅ Check database for processed activities

---

**Now your rides automatically sync and analyze themselves! 🤖🚴‍♂️**






