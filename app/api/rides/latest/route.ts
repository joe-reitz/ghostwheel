import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getLatestActivity } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await requireAuth();

    let activity;
    try {
      activity = await getLatestActivity(sessionUser.id);
    } catch (dbError: any) {
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('relation')) {
        return NextResponse.json(
          { error: 'No rides synced yet. Go to Settings to sync your Strava rides.' },
          { status: 404 }
        );
      }
      throw dbError;
    }

    if (!activity) {
      return NextResponse.json(
        { error: 'No rides found. Sync your rides from Strava first.' },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching latest ride:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest ride', details: error.message },
      { status: 500 }
    );
  }
}
