import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getUserByStravaId } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No session found'
      });
    }

    const dbUser = await getUserByStravaId(sessionUser.stravaId);

    return NextResponse.json({
      authenticated: true,
      session: {
        stravaId: sessionUser.stravaId,
        id: sessionUser.id,
        username: sessionUser.username,
        hasFTP: !!sessionUser.ftp,
        hasMaxHR: !!sessionUser.maxHr
      },
      database: {
        found: !!dbUser,
        id: dbUser?.id,
        stravaId: dbUser?.strava_id,
        hasFTP: !!dbUser?.ftp,
        hasMaxHR: !!dbUser?.max_hr,
        hasAccessToken: !!dbUser?.access_token,
        hasRefreshToken: !!dbUser?.refresh_token,
        tokenExpiresAt: dbUser?.token_expires_at
      }
    });
  } catch (error: any) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}







