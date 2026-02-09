import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getUserBikes, createOrUpdateBike } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const bikes = await getUserBikes(user.id);
    return NextResponse.json(bikes);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const bike = await createOrUpdateBike({
      userId: user.id,
      name: body.name,
      brand: body.brand,
      model: body.model,
      bikeType: body.bikeType || 'road',
      weight: body.weight,
    });

    return NextResponse.json(bike);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
