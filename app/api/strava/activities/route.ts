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
      console.error('User not found in database:', sessionUser.stravaId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log user data for debugging (without sensitive tokens)
    console.log('User found:', {
      id: user.id,
      stravaId: user.strava_id,
      hasFTP: !!user.ftp,
      hasMaxHR: !!user.max_hr
    });

    // Calculate date range based on lookback
    const now = new Date();
    let afterDate = new Date();
    
    switch(lookback) {
      case 'week':
        afterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        afterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        afterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        afterDate = new Date(0); // Unix epoch
        break;
      default:
        afterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
    
    console.log('Date range for activities:', {
      lookback,
      now: now.toISOString(),
      afterDate: afterDate.toISOString(),
      afterTimestamp,
      daysSince: Math.floor((now.getTime() - afterDate.getTime()) / (24 * 60 * 60 * 1000))
    });

    // Refresh token if needed
    let accessToken = user.access_token;
    if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
      const refreshedData = await refreshStravaToken(user.refresh_token);
      accessToken = refreshedData.access_token;
      // Update tokens in DB (you'd need to implement updateUserTokens)
    }

    // Fetch activities from Strava
    const stravaActivities = await getStravaActivities(accessToken, afterTimestamp);
    
    console.log(`Fetched ${stravaActivities.length} activities from Strava`);
    if (stravaActivities.length > 0) {
      console.log('First activity date:', stravaActivities[0].start_date);
      console.log('Last activity date:', stravaActivities[stravaActivities.length - 1].start_date);
    }
    
    // Filter for rides only
    const rides = stravaActivities.filter((a: any) => 
      a.type === 'Ride' || a.type === 'VirtualRide'
    );
    
    console.log(`Filtered to ${rides.length} rides`);

    // Process and store activities with calculated metrics
    const processedActivities = await Promise.all(
      rides.map(async (activity: any) => {
        let calculatedMetrics: any = {};

        // If activity has power data AND user has FTP configured, calculate advanced metrics
        if (activity.average_watts && user.ftp && user.ftp > 0) {
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
        try {
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
        } catch (dbError) {
          console.error(`Error storing activity ${activity.id}:`, dbError);
          // Continue processing even if this activity fails to save
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

      try {
        await updateTrainingLoad(user.id, new Date(date), tss, currentCTL, currentATL, tsb);
      } catch (tlError) {
        console.error(`Error updating training load for ${date}:`, tlError);
        // Continue processing even if this fails
      }
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
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Strava activities', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

async function saveAIAnalysis(activityId: number, analysis: string, feedback: string) {
  // Import and use the function from db
  const { saveAIAnalysis: saveAnalysis } = await import('@/lib/db');
  return saveAnalysis(activityId, analysis, feedback);
}
