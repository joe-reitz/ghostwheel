import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getBikeActivities } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const activities = await getBikeActivities(Number(id));
    return NextResponse.json(activities);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
