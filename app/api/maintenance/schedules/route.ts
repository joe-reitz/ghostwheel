import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import {
  getMaintenanceSchedules,
  createMaintenanceSchedule,
  updateMaintenanceSchedule
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const bikeId = searchParams.get('bikeId');
    const schedules = await getMaintenanceSchedules(user.id, bikeId ? Number(bikeId) : undefined);
    return NextResponse.json(schedules);
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

    const schedule = await createMaintenanceSchedule({
      userId: user.id,
      bikeId: body.bikeId,
      componentType: body.componentType,
      intervalDistance: body.intervalDistance,
      intervalDays: body.intervalDays,
      lastServiceDate: body.lastServiceDate,
      lastServiceDistance: body.lastServiceDistance,
      emailAlert: body.emailAlert,
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
    }

    const schedule = await updateMaintenanceSchedule(body.id, {
      intervalDistance: body.intervalDistance,
      intervalDays: body.intervalDays,
      lastServiceDate: body.lastServiceDate,
      lastServiceDistance: body.lastServiceDistance,
      emailAlert: body.emailAlert,
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
