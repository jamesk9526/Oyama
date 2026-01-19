import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, closeDatabase } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
