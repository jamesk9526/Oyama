// API route for tool call logs
import { NextRequest, NextResponse } from 'next/server';
import { toolLogsDb } from '@/lib/db/queries';

/**
 * GET /api/tools/logs - Get tool call logs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const toolId = searchParams.get('toolId') || undefined;
    const status = searchParams.get('status') as 'success' | 'error' | 'pending' | undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Query the database for logs
    const logs = toolLogsDb.getAll({
      toolId,
      status,
      limit,
    });
    
    return NextResponse.json({
      logs,
      count: logs.length,
      filters: {
        toolId,
        status,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
