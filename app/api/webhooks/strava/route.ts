import { NextResponse } from 'next/server';

/**
 * Strava Webhook Verification
 * Called when setting up the webhook subscription
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the webhook subscription
  const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'GHOSTWHEEL_VERIFY_TOKEN';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Strava Webhook Events Handler
 * Called when activities are created, updated, or deleted
 */
export async function POST(request: Request) {
  try {
    const event = await request.json();
    
    console.log('Received webhook event:', event);

    // Event structure:
    // {
    //   object_type: 'activity' | 'athlete',
    //   object_id: number,
    //   aspect_type: 'create' | 'update' | 'delete',
    //   updates: object,
    //   owner_id: number,
    //   subscription_id: number,
    //   event_time: number
    // }

    if (event.object_type === 'activity') {
      switch (event.aspect_type) {
        case 'create':
          await handleActivityCreate(event);
          break;
        case 'update':
          await handleActivityUpdate(event);
          break;
        case 'delete':
          await handleActivityDelete(event);
          break;
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Strava from retrying
    return NextResponse.json({ success: false });
  }
}

async function handleActivityCreate(event: any) {
  console.log('New activity created:', event.object_id);
  
  // TODO: Implement activity sync
  // 1. Get user from database by strava_id (event.owner_id)
  // 2. Fetch full activity details from Strava API
  // 3. Calculate metrics (TSS, NP, IF, etc.)
  // 4. Store in database
  // 5. Generate AI analysis
  // 6. Create coaching insight if needed
  
  // Example:
  // const user = await getUserByStravaId(event.owner_id);
  // if (user) {
  //   const activity = await getActivityById(user.access_token, event.object_id);
  //   const streams = await getActivityStreams(user.access_token, event.object_id);
  //   // Calculate metrics and store...
  // }
}

async function handleActivityUpdate(event: any) {
  console.log('Activity updated:', event.object_id, 'Updates:', event.updates);
  
  // Handle updates (title, type, privacy changes, etc.)
  // Usually just need to update basic fields, not recalculate metrics
}

async function handleActivityDelete(event: any) {
  console.log('Activity deleted:', event.object_id);
  
  // Mark activity as deleted in database
  // Don't actually delete to preserve historical data
  // const { sql } = await import('@/lib/db');
  // await sql`
  //   UPDATE activities 
  //   SET deleted_at = CURRENT_TIMESTAMP 
  //   WHERE strava_id = ${event.object_id}
  // `;
}

