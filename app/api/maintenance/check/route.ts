import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getOverdueMaintenanceItems } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await getOverdueMaintenanceItems(user.id);

    const overdue = items.filter(i => i.status === 'overdue');
    const dueSoon = items.filter(i => i.status === 'due_soon');
    const ok = items.filter(i => i.status === 'ok');

    return NextResponse.json({
      items,
      summary: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        ok: ok.length,
        total: items.length
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
