// API route for updating tool status
import { NextRequest, NextResponse } from 'next/server';
import { toolRegistry } from '@/lib/mcp';

/**
 * PATCH /api/tools/[id]/status - Update tool status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid field: enabled (must be boolean)' },
        { status: 400 }
      );
    }
    
    const success = toolRegistry.updateStatus(params.id, enabled);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    const tool = toolRegistry.get(params.id);
    
    return NextResponse.json({
      tool,
      message: 'Tool status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating tool status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tool status' },
      { status: 500 }
    );
  }
}
