import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import OpenAI from 'openai';
import { sql } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userPrompt, conversationHistory } = await request.json();
    const activityId = params.id;

    // Fetch activity details from Strava
    const stravaResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    );

    if (!stravaResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
    }

    const activity = await stravaResponse.json();

    // Fetch user profile and training context
    const userId = user.id;
    let userContext = '';
    
    try {
      // User profile info (already have from session)
      if (user.ftp || user.maxHr) {
        userContext += '\n\nUser Profile:';
        if (user.ftp) userContext += `\n- FTP: ${user.ftp}W`;
        if (user.maxHr) userContext += `\n- Max HR: ${user.maxHr} bpm`;
      }

      // Get recent activities for context
      const recentActivities = await sql`
        SELECT name, distance, moving_time, total_elevation_gain, average_speed, 
               average_watts, average_heartrate, tss, start_date
        FROM activities 
        WHERE user_id = ${userId} AND start_date < ${activity.start_date}
        ORDER BY start_date DESC 
        LIMIT 5
      `;

      if (recentActivities.rows.length > 0) {
        userContext += '\n\nRecent Training History (5 rides before this one):';
        recentActivities.rows.forEach((ride: any, idx: number) => {
          userContext += `\n${idx + 1}. ${ride.name}: ${(ride.distance/1000).toFixed(1)}km, ${(ride.moving_time/3600).toFixed(1)}h`;
          if (ride.average_watts) userContext += `, ${Math.round(ride.average_watts)}W avg`;
          if (ride.tss) userContext += `, TSS ${Math.round(ride.tss)}`;
        });
      }

      // Get goals
      const goals = await sql`
        SELECT name, target_date, target_value, type 
        FROM goals 
        WHERE user_id = ${userId} AND status = 'active'
      `;

      if (goals.rows.length > 0) {
        userContext += '\n\nActive Goals:';
        goals.rows.forEach((goal: any) => {
          userContext += `\n- ${goal.name}`;
          if (goal.target_date) userContext += ` (${new Date(goal.target_date).toLocaleDateString()})`;
        });
      }
    } catch (error) {
      console.error('Error fetching user context:', error);
      // Continue without context
    }

    // Build the ride summary
    const rideSummary = `
Ride Details:
- Name: ${activity.name}
- Date: ${new Date(activity.start_date).toLocaleDateString()}
- Distance: ${(activity.distance / 1000).toFixed(1)} km (${(activity.distance * 0.000621371).toFixed(1)} miles)
- Moving Time: ${Math.floor(activity.moving_time / 3600)}:${(Math.floor((activity.moving_time % 3600) / 60)).toString().padStart(2, '0')}
- Elevation Gain: ${activity.total_elevation_gain}m
- Average Speed: ${(activity.average_speed * 2.23694).toFixed(1)} mph
- Max Speed: ${(activity.max_speed * 2.23694).toFixed(1)} mph
${activity.average_watts ? `- Average Power: ${activity.average_watts}W` : ''}
${activity.max_watts ? `- Max Power: ${activity.max_watts}W` : ''}
${activity.weighted_average_watts ? `- Normalized Power: ${activity.weighted_average_watts}W` : ''}
${activity.average_heartrate ? `- Average HR: ${activity.average_heartrate} bpm` : ''}
${activity.max_heartrate ? `- Max HR: ${activity.max_heartrate} bpm` : ''}
${activity.average_cadence ? `- Average Cadence: ${activity.average_cadence} rpm` : ''}
${activity.kilojoules ? `- Work: ${activity.kilojoules} kJ` : ''}
${activity.suffer_score ? `- Suffer Score: ${activity.suffer_score}` : ''}
`;

    const systemPrompt = `You are an experienced cycling coach analyzing ride data and answering questions about training. 

Be specific, actionable, and encouraging. Use the ride data and training context to provide personalized insights. When answering questions:
- Reference specific metrics from the ride
- Consider the rider's goals and recent training history
- Provide actionable advice
- Be honest but supportive
- Use cycling-specific terminology appropriately

Keep responses concise but informative (2-4 paragraphs unless more detail is specifically requested).`;

    // Build conversation with context
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Here's the ride data for context:\n\n${rideSummary}${userContext}\n\nI'll be asking questions about this ride.`
      },
      { 
        role: 'assistant', 
        content: 'I have reviewed the ride data and your training context. Feel free to ask me anything about this ride, your performance, or how it fits into your training!'
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add the new user prompt
    messages.push({ role: 'user', content: userPrompt });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content;

    // Store the interaction in the database for future reference
    try {
      await sql`
        INSERT INTO ride_analyses (user_id, activity_id, user_prompt, ai_response, created_at)
        VALUES (${userId}, ${activityId}, ${userPrompt}, ${aiResponse}, NOW())
      `;
    } catch (error) {
      console.error('Error storing analysis:', error);
      // Continue even if storage fails
    }

    return NextResponse.json({
      response: aiResponse,
      activity: {
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
      }
    });

  } catch (error) {
    console.error('Error analyzing ride:', error);
    return NextResponse.json(
      { error: 'Failed to analyze ride' },
      { status: 500 }
    );
  }
}

// Get previous conversation history for a ride
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activityId = params.id;
    const userId = user.id;

    // Get conversation history
    const result = await sql`
      SELECT user_prompt, ai_response, created_at 
      FROM ride_analyses 
      WHERE user_id = ${userId} AND activity_id = ${activityId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}

