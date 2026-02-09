import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { createOrUpdateBike, updateUserTokens, linkActivitiesToBikes, updateBikeStats } from '@/lib/db';
import { getAthleteGear, refreshStravaToken } from '@/lib/strava';

export async function POST() {
  try {
    const sessionUser = await requireAuth();

    // Refresh token if expired
    let accessToken = sessionUser.accessToken;
    if (sessionUser.tokenExpiresAt && new Date(sessionUser.tokenExpiresAt) < new Date()) {
      const refreshed = await refreshStravaToken(sessionUser.refreshToken);
      accessToken = refreshed.access_token;
      // Save refreshed tokens back to DB
      await updateUserTokens(
        sessionUser.id,
        refreshed.access_token,
        refreshed.refresh_token,
        new Date(refreshed.expires_at * 1000)
      );
    }

    const stravaBikes = await getAthleteGear(accessToken);

    if (!stravaBikes || stravaBikes.length === 0) {
      return NextResponse.json({
        success: true,
        bikes: [],
        count: 0,
        message: 'No bikes found on your Strava profile. Add bikes in Strava settings first, or use "Add Bike" to create one manually.'
      });
    }

    const syncedBikes = await Promise.all(
      stravaBikes.map(async (bike: any) => {
        return createOrUpdateBike({
          userId: sessionUser.id,
          stravaGearId: bike.id,
          name: bike.name || 'Unnamed Bike',
          brand: bike.brand_name || undefined,
          model: bike.model_name || undefined,
          bikeType: bike.frame_type === 3 ? 'tt' :
                    bike.frame_type === 4 ? 'gravel' :
                    bike.frame_type === 2 ? 'mountain' :
                    bike.frame_type === 5 ? 'cx' : 'road',
          totalDistance: bike.distance || 0,
        });
      })
    );

    // Link any existing activities to bikes via strava_gear_id and recalculate stats
    await linkActivitiesToBikes(sessionUser.id);
    for (const bike of syncedBikes) {
      await updateBikeStats(bike.id);
    }

    return NextResponse.json({
      success: true,
      bikes: syncedBikes,
      count: syncedBikes.length
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized — please log in again' }, { status: 401 });
    }
    console.error('Error syncing bikes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
