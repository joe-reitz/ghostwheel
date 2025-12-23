import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getUserByStravaId, sql } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    const user = await getUserByStravaId(sessionUser.stravaId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      ftp: user.ftp,
      maxHr: user.max_hr,
      restingHr: user.resting_hr,
      weight: user.weight,
      bikeWeight: user.bike_weight
    });
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await requireAuth();
    const user = await getUserByStravaId(sessionUser.stravaId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { ftp, maxHr, restingHr, weight, bikeWeight } = body;

    // Update user settings
    const result = await sql`
      UPDATE users 
      SET 
        ftp = COALESCE(${ftp}, ftp),
        max_hr = COALESCE(${maxHr}, max_hr),
        resting_hr = COALESCE(${restingHr}, resting_hr),
        weight = COALESCE(${weight}, weight),
        bike_weight = COALESCE(${bikeWeight}, bike_weight),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





