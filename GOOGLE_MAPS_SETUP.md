# Google Maps API Setup Guide

## Removing "For development purposes only" Watermark

The watermark appears when Google Maps detects your API key is not properly configured for production. Follow these steps:

### 1. Enable Billing in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Billing** → **Link a billing account**
4. Add a credit card (Google provides $200/month free credit, which is more than enough for most apps)

### 2. Enable Required APIs

Make sure these APIs are enabled in your project:

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Maps JavaScript API** ✅
   - **Maps Static API** (optional)
   - **Geocoding API** (optional)

### 3. Configure API Key Restrictions

**Important**: Restrict your API key to prevent unauthorized use:

1. Go to **APIs & Services** → **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     ```
     localhost:3000/*
     yourdomain.vercel.app/*
     yourdomain.com/*
     *.vercel.app/*
     ```

4. Under **API restrictions**:
   - Select **Restrict key**
   - Choose **Maps JavaScript API**

### 4. Update Environment Variables

Make sure your `.env.local` has:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

And in Vercel:
1. Go to your project → **Settings** → **Environment Variables**
2. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with your key
3. Redeploy

### 5. Verify Setup

After completing these steps:
1. Clear your browser cache
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Check that the watermark is gone

## Common Issues

### Watermark Still Appears
- **Cause**: Billing not enabled or API restrictions too strict
- **Fix**: Double-check billing is active and domain restrictions allow your URL

### Maps Don't Load At All
- **Cause**: API key not found or APIs not enabled
- **Fix**: Verify environment variable is set and Maps JavaScript API is enabled

### "This page can't load Google Maps correctly"
- **Cause**: API restrictions blocking your domain
- **Fix**: Add your domain to the HTTP referrers list

## Cost Estimate

With Google's free $200/month credit:
- **Maps loads**: $7 per 1,000 loads
- **Your usage**: ~3,000 loads/month = ~$21/month
- **Net cost**: $0 (covered by free credit)

Most cycling apps will stay well within the free tier!

## Support

If issues persist:
1. Check [Google Maps Platform Status](https://status.cloud.google.com/)
2. Review the [Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
3. Check browser console for specific error messages

