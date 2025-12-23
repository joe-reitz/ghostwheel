import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getUserByStravaId, getUserGoals, createGoal } from '@/lib/db';

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

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const user = await getUserByStravaId(sessionUser.stravaId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, targetValue, targetDate, description } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' }, 
        { status: 400 }
      );
    }

    const goal = await createGoal({
      userId: user.id,
      name,
      type,
      targetValue: targetValue ? Number(targetValue) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      description: description || undefined
    });

    return NextResponse.json({
      goal,
      message: 'Goal created successfully'
    });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}







