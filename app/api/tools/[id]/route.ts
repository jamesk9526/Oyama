// API route for individual tool operations
import { NextRequest, NextResponse } from 'next/server';
import { toolRegistry, initializeBuiltInTools } from '@/lib/mcp';

// Ensure built-in tools are registered for this route module
let initialized = false;
if (!initialized) {
  initializeBuiltInTools();
  initialized = true;
}

/**
 * GET /api/tools/[id] - Get a specific tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    initializeBuiltInTools();
    const tool = toolRegistry.get(params.id);
    
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ tool });
  } catch (error: any) {
    console.error('Error getting tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tool' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[id] - Unregister a tool
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    initializeBuiltInTools();
    const success = toolRegistry.unregister(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Tool unregistered successfully',
    });
  } catch (error: any) {
    console.error('Error unregistering tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unregister tool' },
      { status: 500 }
    );
  }
}
