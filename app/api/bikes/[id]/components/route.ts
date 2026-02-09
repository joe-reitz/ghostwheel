import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getBikeComponents, createComponent, getBikeById, calculateInstallDistanceFromActivity } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const components = await getBikeComponents(Number(id));
    return NextResponse.json(components);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const bike = await getBikeById(Number(id));
    if (!bike) {
      return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    }

    // Determine install_distance:
    // 1. If installActivityId provided, calculate from that ride
    // 2. If installDistance explicitly provided, use it
    // 3. Default to 0 (all-time tracking)
    let installDistance = 0;
    let installActivityId: number | undefined;

    if (body.installActivityId) {
      installActivityId = body.installActivityId;
      installDistance = await calculateInstallDistanceFromActivity(Number(id), body.installActivityId);
    } else if (body.installDistance !== undefined && body.installDistance !== null) {
      installDistance = body.installDistance;
    }

    const component = await createComponent({
      userId: user.id,
      bikeId: Number(id),
      componentType: body.componentType,
      brand: body.brand,
      model: body.model,
      installDate: body.installDate,
      installDistance,
      installActivityId,
      expectedLifetimeDistance: body.expectedLifetimeDistance,
      expectedLifetimeDays: body.expectedLifetimeDays,
      notes: body.notes,
    });

    return NextResponse.json(component);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
