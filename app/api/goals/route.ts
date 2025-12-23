import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getUserByStravaId, getUserGoals } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const user = await getUserByStravaId(sessionUser.stravaId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const goals = await getUserGoals(user.id);

    return NextResponse.json({
      goals: goals
    });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





