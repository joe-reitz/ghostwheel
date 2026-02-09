import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { updateComponent, moveComponent, retireComponent, getComponentHistory } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    await requireAuth();
    const { componentId } = await params;
    const body = await request.json();

    const component = await updateComponent(Number(componentId), {
      currentDistance: body.currentDistance,
      brand: body.brand,
      model: body.model,
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    await requireAuth();
    const { componentId } = await params;
    const body = await request.json();

    if (body.action === 'move') {
      const result = await moveComponent(
        Number(componentId),
        body.toBikeId,
        body.distanceAtEvent || 0
      );
      return NextResponse.json(result);
    }

    if (body.action === 'retire') {
      const result = await retireComponent(
        Number(componentId),
        body.reason || 'Retired',
        body.distanceAtEvent || 0
      );
      return NextResponse.json(result);
    }

    if (body.action === 'history') {
      const history = await getComponentHistory(Number(componentId));
      return NextResponse.json(history);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
