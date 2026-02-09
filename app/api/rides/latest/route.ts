import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getLatestActivity } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const activity = await getLatestActivity(sessionUser.id);

    if (!activity) {
      return NextResponse.json({ error: 'No rides found' }, { status: 404 });
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
