import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getUserByStravaId, createOrUpdateBike } from '@/lib/db';
import { getAthleteGear, refreshStravaToken } from '@/lib/strava';

export async function POST() {
  try {
    const sessionUser = await requireAuth();
    const user = await getUserByStravaId(sessionUser.stravaId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Refresh token if needed
    let accessToken = user.access_token;
    if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
      const refreshedData = await refreshStravaToken(user.refresh_token);
      accessToken = refreshedData.access_token;
    }

    const stravaBikes = await getAthleteGear(accessToken);

    const syncedBikes = await Promise.all(
      stravaBikes.map(async (bike: any) => {
        return createOrUpdateBike({
          userId: user.id,
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

    return NextResponse.json({
      success: true,
      bikes: syncedBikes,
      count: syncedBikes.length
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error syncing bikes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
