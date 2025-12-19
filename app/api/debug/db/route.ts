import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Test basic database connectivity
    const result = await sql`SELECT NOW() as current_time`;
    
    // Test if users table exists
    const usersCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as users_exists
    `;
    
    // Test if activities table exists
    const activitiesCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activities'
      ) as activities_exists
    `;
    
    // Count users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        currentTime: result.rows[0].current_time,
        tables: {
          users: usersCheck.rows[0].users_exists,
          activities: activitiesCheck.rows[0].activities_exists
        },
        userCount: userCount.rows[0].count
      }
    });
  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

