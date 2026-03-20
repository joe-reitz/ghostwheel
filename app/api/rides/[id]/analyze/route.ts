import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { sql } from '@/lib/db';

const model = gateway('anthropic/claude-sonnet-4-5');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userPrompt, conversationHistory } = await request.json();
    const { id: activityId } = await params;

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

    const systemPrompt = `You are an elite cycling coach with 20+ years of experience coaching professional and amateur cyclists. You specialize in power-based training, performance analysis, and race preparation.

Your expertise includes:
- Power-based training (FTP, normalized power, intensity factor, TSS, CTL/ATL/TSB)
- Training zones and periodization
- Pacing strategies for different ride types (endurance, tempo, threshold, VO2max, anaerobic)
- Race tactics and performance optimization
- Recovery and fatigue management
- Biomechanics and pedaling efficiency
- Nutrition and hydration strategies
- Mental preparation and motivation

When analyzing rides:
1. Reference specific metrics from the ride data
2. Consider the rider's FTP and training zones
3. Evaluate pacing (was it steady or variable?)
4. Assess intensity relative to their fitness level
5. Consider recent training load and fatigue
6. Provide actionable, specific recommendations
7. Be honest about areas for improvement while staying encouraging
8. Use cycling-specific terminology appropriately (FTP, NP, VI, TSS, IF)

Training Zones (based on FTP):
- Zone 1 (Active Recovery): < 55% FTP
- Zone 2 (Endurance): 56-75% FTP
- Zone 3 (Tempo): 76-90% FTP
- Zone 4 (Threshold): 91-105% FTP
- Zone 5 (VO2max): 106-120% FTP
- Zone 6 (Anaerobic): 121-150% FTP
- Zone 7 (Neuromuscular): > 150% FTP

Intensity Factor (IF) interpretation:
- < 0.75: Easy recovery ride
- 0.75-0.85: Endurance/aerobic ride
- 0.85-0.95: Tempo effort
- 0.95-1.05: Threshold/race effort
- > 1.05: Hard/criterium effort

Variability Index (VI) interpretation:
- 1.00-1.05: Very steady pacing (ideal for TTs and steady efforts)
- 1.05-1.10: Good pacing (typical for road races)
- 1.10-1.20: Variable pacing (crit racing, group rides)
- > 1.20: Very variable (stop-and-go, poor pacing)

TSS guidelines:
- < 150: Low stress, good for recovery weeks
- 150-300: Moderate training load
- 300-450: High training load, requires adequate recovery
- > 450: Very high, only for experienced riders

Keep responses concise but informative (2-4 paragraphs unless more detail is specifically requested). Be conversational and supportive while maintaining professional expertise.`;

    // Build conversation messages for the AI SDK
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
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
    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    // Store the interaction in the database for future reference
    try {
      await sql`
        INSERT INTO ride_analyses (user_id, activity_id, user_prompt, ai_response, created_at)
        VALUES (${userId}, ${activityId}, ${userPrompt}, ${text}, NOW())
      `;
    } catch (error) {
      console.error('Error storing analysis:', error);
      // Continue even if storage fails
    }

    return NextResponse.json({
      response: text,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: activityId } = await params;
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
