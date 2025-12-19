import { NextResponse } from 'next/server';
import { generateSTPTrainingPlan } from '@/lib/ai-coach';
import { getUserByStravaId, createGoal, sql } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    // Get user from session instead of body
    const sessionUser = await requireAuth();
    
    const body = await request.json();
    const { targetDate, currentFTP, recentWeeklyMileage, longestRecentRide, currentAverageSpeed } = body;

    if (!targetDate) {
      return NextResponse.json(
        { error: 'Missing required field: targetDate' },
        { status: 400 }
      );
    }

    // Get full user from database
    const user = await getUserByStravaId(sessionUser.stravaId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Generating training plan for user:', user.id);

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
        { error: 'Failed to generate training plan. Please check that OPENAI_API_KEY is configured.' },
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
      { 
        error: 'Failed to create training plan', 
        details: error.message,
        hint: error.message.includes('OPENAI_API_KEY') 
          ? 'Please configure OPENAI_API_KEY in your environment variables'
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get user from session
    const sessionUser = await requireAuth();
    
    const user = await getUserByStravaId(sessionUser.stravaId);
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


