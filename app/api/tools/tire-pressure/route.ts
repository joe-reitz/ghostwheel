import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getTirePressureConfigs, saveTirePressureConfig, deleteTirePressureConfig } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const configs = await getTirePressureConfigs(user.id);
    return NextResponse.json(configs);
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

    const config = await saveTirePressureConfig({
      userId: user.id,
      bikeId: body.bikeId || undefined,
      name: body.name,
      tireWidthFront: body.tireWidthFront,
      tireWidthRear: body.tireWidthRear,
      tireType: body.tireType,
      surfaceType: body.surfaceType,
      riderWeight: body.riderWeight,
      bikeWeight: body.bikeWeight,
      frontRearSplit: body.frontRearSplit || 0.42,
      calculatedFrontPsi: body.calculatedFrontPsi,
      calculatedRearPsi: body.calculatedRearPsi,
      isDefault: body.isDefault || false,
    });

    return NextResponse.json(config);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (!configId) {
      return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
    }

    await deleteTirePressureConfig(Number(configId), user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
