/**
 * Database Setup Script
 * Run this once to initialize your Neon Postgres database with the GhostWheel schema
 * 
 * Usage: npx tsx scripts/setup-db.ts
 */

import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...\n');

    // Read the schema file
    const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolons but keep CREATE FUNCTION statements together
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);
        await sql.query(statement + ';');
        console.log(`✅ Success\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists (skipping)\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log('✅ Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Connect your Strava account at https://ghostwheel.vercel.app');
    console.log('2. Your activities will be automatically synced\n');

  } catch (error: any) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. POSTGRES_URL is set in your environment');
    console.error('2. Your database connection is working');
    console.error('3. You have permission to create tables\n');
    process.exit(1);
  }
}

// Run the setup
setupDatabase();

