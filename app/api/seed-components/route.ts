import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { sql } from '@vercel/postgres';
import { createComponent, calculateInstallDistanceFromActivity, getBikeComponents } from '@/lib/db';

const MI = 1609.34;

interface SeedComponent {
  componentType: string;
  brand?: string;
  model?: string;
  expectedLifetimeDistance: number;
  linkToActivity?: boolean; // only for Seigla tires
}

function makeDrivetrainComponents(groupset: string): SeedComponent[] {
  return [
    { componentType: 'chain', brand: 'SRAM', model: groupset, expectedLifetimeDistance: 2000 * MI },
    { componentType: 'cassette', brand: 'SRAM', model: groupset, expectedLifetimeDistance: 5000 * MI },
    { componentType: 'chainrings', brand: 'SRAM', model: groupset, expectedLifetimeDistance: 10000 * MI },
    { componentType: 'rear_derailleur', brand: 'SRAM', model: groupset, expectedLifetimeDistance: 15000 * MI },
  ];
}

const SHARED_COMPONENTS: SeedComponent[] = [
  { componentType: 'brake_pads', expectedLifetimeDistance: 1000 * MI },
  { componentType: 'bar_tape', expectedLifetimeDistance: 5000 * MI },
  { componentType: 'wheels', expectedLifetimeDistance: 20000 * MI },
];

export async function GET() {
  try {
    const user = await requireAuth();

    // Find Seigla and Uthald bikes
    const seiglaResult = await sql`
      SELECT * FROM bikes WHERE user_id = ${user.id} AND name ILIKE '%Seigla%' LIMIT 1
    `;
    const uthaldResult = await sql`
      SELECT * FROM bikes WHERE user_id = ${user.id} AND name ILIKE '%Uthald%' LIMIT 1
    `;

    const seigla = seiglaResult.rows[0];
    const uthald = uthaldResult.rows[0];

    if (!seigla && !uthald) {
      return NextResponse.json({ error: 'No Seigla or Uthald bikes found. Sync bikes from Strava first.' }, { status: 404 });
    }

    const results: string[] = [];

    // Update bike types (Strava doesn't have 'gravel')
    if (seigla && seigla.bike_type !== 'gravel') {
      await sql`UPDATE bikes SET bike_type = 'gravel' WHERE id = ${seigla.id}`;
      results.push('Seigla: updated bike type to gravel');
    }

    // Find Kitsap Color Classic activity for Seigla
    let kitsapActivity: any = null;
    if (seigla) {
      try {
        const kitsapResult = await sql`
          SELECT id, name, start_date FROM activities
          WHERE bike_id = ${seigla.id} AND name ILIKE '%Kitsap Color Classic%'
          ORDER BY start_date DESC LIMIT 1
        `;
        kitsapActivity = kitsapResult.rows[0];
      } catch {
        // activities table may not exist yet or no activities synced
        results.push('Note: Could not search activities (run setup-bikes-db then sync activities from Strava to enable ride linking)');
      }
    }

    // Seed Seigla
    if (seigla) {
      const existing = await getBikeComponents(seigla.id);
      if (existing.length > 0) {
        results.push(`Seigla: skipped (already has ${existing.length} active components)`);
      } else {
        const seiglaComponents: SeedComponent[] = [
          ...makeDrivetrainComponents('Rival AXS'),
          ...SHARED_COMPONENTS,
          { componentType: 'tires_front', expectedLifetimeDistance: 3500 * MI, linkToActivity: true },
          { componentType: 'tires_rear', expectedLifetimeDistance: 3000 * MI, linkToActivity: true },
        ];

        for (const comp of seiglaComponents) {
          let installDistance = 0;
          let installActivityId: number | undefined;

          if (comp.linkToActivity && kitsapActivity) {
            installActivityId = kitsapActivity.id;
            installDistance = await calculateInstallDistanceFromActivity(seigla.id, kitsapActivity.id);
          }

          await createComponent({
            userId: user.id,
            bikeId: seigla.id,
            componentType: comp.componentType,
            brand: comp.brand,
            model: comp.model,
            installDistance,
            installActivityId,
            expectedLifetimeDistance: comp.expectedLifetimeDistance,
          });
        }

        results.push(`Seigla: added ${seiglaComponents.length} components` +
          (kitsapActivity ? ` (tires linked to "${kitsapActivity.name}")` : ' (Kitsap Color Classic not found, tires tracking all time)'));
      }
    }

    // Seed Uthald
    if (uthald) {
      const existing = await getBikeComponents(uthald.id);
      if (existing.length > 0) {
        results.push(`Uthald: skipped (already has ${existing.length} active components)`);
      } else {
        const uthaldComponents: SeedComponent[] = [
          ...makeDrivetrainComponents('Force AXS'),
          ...SHARED_COMPONENTS,
          { componentType: 'tires_front', expectedLifetimeDistance: 3500 * MI },
          { componentType: 'tires_rear', expectedLifetimeDistance: 3000 * MI },
        ];

        for (const comp of uthaldComponents) {
          await createComponent({
            userId: user.id,
            bikeId: uthald.id,
            componentType: comp.componentType,
            brand: comp.brand,
            model: comp.model,
            installDistance: 0,
            expectedLifetimeDistance: comp.expectedLifetimeDistance,
          });
        }

        results.push(`Uthald: added ${uthaldComponents.length} components (all tracking all time)`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      kitsapActivity: kitsapActivity ? { id: kitsapActivity.id, name: kitsapActivity.name, date: kitsapActivity.start_date } : null,
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
