import { NextResponse } from 'next/server';
import { generateSTPTrainingPlan } from '@/lib/ai-coach';
import { getUserByStravaId, createGoal, sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, targetDate, currentFTP, recentWeeklyMileage, longestRecentRide, currentAverageSpeed } = body;

    if (!userId || !targetDate) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and targetDate' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByStravaId(Number(userId));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate the training plan using AI
    const plan = await generateSTPTrainingPlan({
      currentFTP: currentFTP || user.ftp,
      recentWeeklyMileage,
      longestRecentRide,
      targetDate,
      currentAverageSpeed
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Failed to generate training plan' },
        { status: 500 }
      );
    }

    // Create goal in database
    const goal = await createGoal({
      userId: user.id,
      name: 'Seattle to Portland (STP) One Day',
      type: 'race',
      targetValue: 204, // miles
      targetDate: new Date(targetDate),
      description: '204 miles at 17+ mph average'
    });

    // Store the training plan
    const result = await sql`
      INSERT INTO training_plans (user_id, goal_id, name, start_date, end_date, plan_type, weeks_total, plan_data)
      VALUES (
        ${user.id},
        ${goal.id},
        'STP Training Plan',
        CURRENT_DATE,
        ${targetDate},
        'endurance',
        ${plan.totalWeeks},
        ${JSON.stringify(plan)}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      goal,
      trainingPlan: result.rows[0],
      planDetails: plan
    });

  } catch (error: any) {
    console.error('Error creating training plan:', error);
    return NextResponse.json(
      { error: 'Failed to create training plan', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const user = await getUserByStravaId(Number(userId));
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all training plans for this user
    const result = await sql`
      SELECT 
        tp.*,
        g.name as goal_name,
        g.target_date as goal_date
      FROM training_plans tp
      LEFT JOIN goals g ON tp.goal_id = g.id
      WHERE tp.user_id = ${user.id}
      ORDER BY tp.created_at DESC
    `;

    return NextResponse.json({
      plans: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching training plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training plans', details: error.message },
      { status: 500 }
    );
  }
}


