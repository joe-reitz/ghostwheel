import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// This endpoint will set up missing database tables
// Only run this once, then you can delete this file

export async function GET() {
  try {
    console.log('Creating goals table...');
    
    // Create goals table
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        target_value DECIMAL(10,2),
        target_date DATE,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        progress DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating training_plans table...');
    
    // Create training_plans table
    await sql`
      CREATE TABLE IF NOT EXISTS training_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        plan_type VARCHAR(50),
        weeks_total INTEGER,
        plan_data JSONB,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating update trigger...');
    
    // Create trigger for goals
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_goals_updated_at ON goals
    `;
    
    await sql`
      CREATE TRIGGER update_goals_updated_at 
      BEFORE UPDATE ON goals 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans
    `;
    
    await sql`
      CREATE TRIGGER update_training_plans_updated_at 
      BEFORE UPDATE ON training_plans 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    // Verify tables exist
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('goals', 'training_plans')
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      tables: result.rows.map(r => r.table_name)
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'If tables already exist, this is normal. Try generating a training plan now.'
    }, { status: 500 });
  }
}

