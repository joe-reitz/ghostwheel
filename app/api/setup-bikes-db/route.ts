import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    console.log('Creating bikes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bikes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        strava_gear_id VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        model VARCHAR(255),
        bike_type VARCHAR(50) DEFAULT 'road',
        weight DECIMAL(5,2),
        is_active BOOLEAN DEFAULT TRUE,
        total_distance DECIMAL(12,2) DEFAULT 0,
        ride_count INTEGER DEFAULT 0,
        total_elevation DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, strava_gear_id)
      )
    `;

    console.log('Creating components table...');
    await sql`
      CREATE TABLE IF NOT EXISTS components (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
        component_type VARCHAR(50) NOT NULL,
        brand VARCHAR(255),
        model VARCHAR(255),
        install_date DATE DEFAULT CURRENT_DATE,
        install_distance DECIMAL(12,2) DEFAULT 0,
        current_distance DECIMAL(12,2) DEFAULT 0,
        expected_lifetime_distance DECIMAL(12,2),
        expected_lifetime_days INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        retirement_reason VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating component_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS component_history (
        id SERIAL PRIMARY KEY,
        component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
        event_type VARCHAR(20) NOT NULL,
        from_bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
        to_bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
        distance_at_event DECIMAL(12,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating maintenance_schedules table...');
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bike_id INTEGER REFERENCES bikes(id) ON DELETE CASCADE,
        component_type VARCHAR(50) NOT NULL,
        interval_distance DECIMAL(12,2),
        interval_days INTEGER,
        last_service_date DATE,
        last_service_distance DECIMAL(12,2) DEFAULT 0,
        email_alert BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating tire_pressure_configs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tire_pressure_configs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        tire_width_front DECIMAL(5,1) NOT NULL,
        tire_width_rear DECIMAL(5,1) NOT NULL,
        tire_type VARCHAR(20) NOT NULL,
        surface_type VARCHAR(50) NOT NULL,
        rider_weight DECIMAL(5,2) NOT NULL,
        bike_weight DECIMAL(5,2) NOT NULL,
        front_rear_split DECIMAL(4,2) DEFAULT 0.42,
        calculated_front_psi DECIMAL(5,1),
        calculated_rear_psi DECIMAL(5,1),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Adding bike columns to activities...');
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS bike_id INTEGER REFERENCES bikes(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS strava_gear_id VARCHAR(50)`;

    console.log('Creating triggers...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`DROP TRIGGER IF EXISTS update_bikes_updated_at ON bikes`;
    await sql`CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;

    await sql`DROP TRIGGER IF EXISTS update_components_updated_at ON components`;
    await sql`CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;

    await sql`DROP TRIGGER IF EXISTS update_maintenance_schedules_updated_at ON maintenance_schedules`;
    await sql`CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;

    await sql`DROP TRIGGER IF EXISTS update_tire_pressure_configs_updated_at ON tire_pressure_configs`;
    await sql`CREATE TRIGGER update_tire_pressure_configs_updated_at BEFORE UPDATE ON tire_pressure_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`;

    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('bikes', 'components', 'component_history', 'maintenance_schedules', 'tire_pressure_configs')
      ORDER BY table_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Bike & maintenance tables created successfully!',
      tables: result.rows.map(r => r.table_name)
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'If tables already exist, this is normal.'
    }, { status: 500 });
  }
}
