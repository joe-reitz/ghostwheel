import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

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

    // Fetch activity details from Strava
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 404 });
    }

    const activity = await response.json();

    // Calculate additional metrics if power data is available
    let tss, intensityFactor, variabilityIndex;
    
    if (activity.weighted_average_watts && activity.moving_time && user.ftp) {
      const np = activity.weighted_average_watts;
      const ftp = user.ftp;
      const hours = activity.moving_time / 3600;
      
      intensityFactor = np / ftp;
      tss = (activity.moving_time * np * intensityFactor) / (ftp * 36);
    }

    return NextResponse.json({
      id: activity.id,
      name: activity.name,
      start_date: activity.start_date,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_watts: activity.average_watts,
      max_watts: activity.max_watts,
      weighted_power: activity.weighted_average_watts,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      average_cadence: activity.average_cadence,
      kilojoules: activity.kilojoules,
      suffer_score: activity.suffer_score,
      calories: activity.calories,
      device_name: activity.device_name,
      summary_polyline: activity.map?.summary_polyline,
      description: activity.description,
      tss,
      intensity_factor: intensityFactor,
      variability_index: variabilityIndex,
    });

  } catch (error) {
    console.error('Error fetching ride:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ride details' },
      { status: 500 }
    );
  }
}

