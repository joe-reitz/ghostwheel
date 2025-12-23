#!/usr/bin/env tsx

/**
 * Migration script to add ride_analyses table
 * Run with: npx tsx scripts/migrate-ride-analyses.ts
 */

import { db } from '@/lib/db';

async function migrate() {
  console.log('Starting migration: Adding ride_analyses table...');

  try {
    // Create the ride_analyses table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ride_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_id BIGINT NOT NULL,
        user_prompt TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created ride_analyses table');

    // Create index
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ride_analyses_user_activity 
        ON ride_analyses(user_id, activity_id, created_at DESC)
    `);
    console.log('✓ Created index on ride_analyses');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();

