import { NextResponse } from 'next/server';
import { getStravaActivities, refreshStravaToken, getActivityStreams } from '@/lib/strava';
import { 
  getUserByStravaId, 
  createOrUpdateActivity, 
  updateTrainingLoad
} from '@/lib/db';
import {
  calculateCTL,
  calculateATL,
  calculateTSB
} from '@/lib/cycling-metrics';
import {
  calculateNormalizedPower,
  calculateIntensityFactor,
  calculateTSS,
  calculateVariabilityIndex,
  calculatePowerCurve,
  calculateTimeInZones
} from '@/lib/cycling-metrics';
import { analyzeRide } from '@/lib/ai-coach';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lookback = searchParams.get('lookback') || 'month';
  const analyze = searchParams.get('analyze') === 'true';

  try {
    // Get user from session
    const { requireAuth } = await import('@/lib/session');
    const sessionUser = await requireAuth();
    
    // Get full user data from database
    const user = await getUserByStravaId(sessionUser.stravaId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate date range based on lookback
    const now = new Date();
    let afterDate = new Date();
    
    switch(lookback) {
      case 'week':
        afterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        afterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        afterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        afterDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        afterDate = new Date(0); // Unix epoch
        break;
      default:
        afterDate.setMonth(now.getMonth() - 1);
    }

    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    // Refresh token if needed
    let accessToken = user.access_token;
    if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
      const refreshedData = await refreshStravaToken(user.refresh_token);
      accessToken = refreshedData.access_token;
      // Update tokens in DB (you'd need to implement updateUserTokens)
    }

    // Fetch activities from Strava
    const stravaActivities = await getStravaActivities(accessToken, afterTimestamp);
    
    // Filter for rides only
    const rides = stravaActivities.filter((a: any) => 
      a.type === 'Ride' || a.type === 'VirtualRide'
    );

    // Process and store activities with calculated metrics
    const processedActivities = await Promise.all(
      rides.map(async (activity: any) => {
        let calculatedMetrics: any = {};

        // If activity has power data, calculate advanced metrics
        if (activity.average_watts && user.ftp) {
          try {
            // Try to get detailed stream data for better calculations
            const streams = await getActivityStreams(accessToken, activity.id);
            
            if (streams.watts?.data) {
              const normalizedPower = calculateNormalizedPower(streams.watts.data);
              const intensityFactor = calculateIntensityFactor(normalizedPower, user.ftp);
              const tss = calculateTSS(normalizedPower, activity.moving_time, user.ftp);
              const variabilityIndex = calculateVariabilityIndex(normalizedPower, activity.average_watts);

              calculatedMetrics = {
                weightedPower: normalizedPower,
                intensityFactor,
                tss,
                variabilityIndex,
                streamData: streams // Store for future analysis
              };
            } else {
              // Fallback to basic calculation without stream data
              const normalizedPower = activity.weighted_average_watts || activity.average_watts;
              const intensityFactor = calculateIntensityFactor(normalizedPower, user.ftp);
              const tss = calculateTSS(normalizedPower, activity.moving_time, user.ftp);

              calculatedMetrics = {
                weightedPower: normalizedPower,
                intensityFactor,
                tss,
                variabilityIndex: 1.0
              };
            }
          } catch (streamError) {
            console.warn(`Could not fetch streams for activity ${activity.id}:`, streamError);
            // Use basic calculations
            const normalizedPower = activity.weighted_average_watts || activity.average_watts;
            const intensityFactor = calculateIntensityFactor(normalizedPower, user.ftp);
            const tss = calculateTSS(normalizedPower, activity.moving_time, user.ftp);

            calculatedMetrics = {
              weightedPower: normalizedPower,
              intensityFactor,
              tss,
              variabilityIndex: 1.0
            };
          }
        }

        // Store activity in database
        const storedActivity = await createOrUpdateActivity({
          userId: user.id,
          stravaId: activity.id,
          name: activity.name,
          type: activity.type,
          startDate: activity.start_date,
          distance: activity.distance,
          movingTime: activity.moving_time,
          elapsedTime: activity.elapsed_time,
          totalElevationGain: activity.total_elevation_gain,
          averageSpeed: activity.average_speed,
          maxSpeed: activity.max_speed,
          averageWatts: activity.average_watts,
          maxWatts: activity.max_watts,
          weightedPower: calculatedMetrics.weightedPower,
          averageHeartrate: activity.average_heartrate,
          maxHeartrate: activity.max_heartrate,
          averageCadence: activity.average_cadence,
          maxCadence: activity.max_cadence,
          kilojoules: activity.kilojoules,
          deviceWatts: activity.device_watts,
          hasHeartrate: activity.has_heartrate,
          tss: calculatedMetrics.tss,
          intensityFactor: calculatedMetrics.intensityFactor,
          variabilityIndex: calculatedMetrics.variabilityIndex,
          summaryPolyline: activity.map?.summary_polyline,
          mapId: activity.map?.id
        });

        // If analyze flag is set and this is a recent ride, generate AI analysis
        if (analyze && calculatedMetrics.tss) {
          const rideData = {
            name: activity.name,
            date: activity.start_date,
            distance: activity.distance,
            movingTime: activity.moving_time,
            totalElevationGain: activity.total_elevation_gain,
            averageSpeed: activity.average_speed,
            averageWatts: activity.average_watts,
            normalizedPower: calculatedMetrics.weightedPower,
            averageHeartrate: activity.average_heartrate,
            maxHeartrate: activity.max_heartrate,
            tss: calculatedMetrics.tss,
            intensityFactor: calculatedMetrics.intensityFactor,
            variabilityIndex: calculatedMetrics.variabilityIndex,
            type: activity.type
          };

          const aiAnalysis = await analyzeRide(rideData, {
            ftp: user.ftp,
            maxHR: user.max_hr,
            recentActivities: []
          });

          // Save AI analysis to database
          await saveAIAnalysis(
            storedActivity.id,
            aiAnalysis.analysis,
            aiAnalysis.feedback
          );

          return {
            ...activity,
            ...calculatedMetrics,
            aiAnalysis
          };
        }

        return {
          ...activity,
          ...calculatedMetrics
        };
      })
    );

    // Calculate and update training load (CTL/ATL/TSB)
    // Group activities by date and sum TSS
    const dailyTSS: Record<string, number> = {};
    processedActivities.forEach(activity => {
      if (activity.tss) {
        const date = new Date(activity.start_date).toISOString().split('T')[0];
        dailyTSS[date] = (dailyTSS[date] || 0) + activity.tss;
      }
    });

    // Calculate CTL/ATL/TSB for each day
    let currentCTL = 0;
    let currentATL = 0;
    
    const sortedDates = Object.keys(dailyTSS).sort();
    for (const date of sortedDates) {
      const tss = dailyTSS[date];
      currentCTL = calculateCTL(currentCTL, tss);
      currentATL = calculateATL(currentATL, tss);
      const tsb = calculateTSB(currentCTL, currentATL);

      await updateTrainingLoad(user.id, new Date(date), tss, currentCTL, currentATL, tsb);
    }

    return NextResponse.json({
      activities: processedActivities,
      summary: {
        totalRides: processedActivities.length,
        totalDistance: processedActivities.reduce((sum, a) => sum + (a.distance || 0), 0),
        totalTime: processedActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0),
        totalTSS: processedActivities.reduce((sum, a) => sum + (a.tss || 0), 0),
        ctl: currentCTL,
        atl: currentATL,
        tsb: calculateTSB(currentCTL, currentATL)
      }
    });

  } catch (error: any) {
    console.error('Error fetching Strava activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Strava activities', details: error.message }, 
      { status: 500 }
    );
  }
}

async function saveAIAnalysis(activityId: number, analysis: string, feedback: string) {
  // Import and use the function from db
  const { saveAIAnalysis: saveAnalysis } = await import('@/lib/db');
  return saveAnalysis(activityId, analysis, feedback);
}
