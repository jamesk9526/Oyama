// API route for listing tools and MCP protocol messages
import { NextRequest, NextResponse } from 'next/server';
import { toolRegistry, initializeBuiltInTools } from '@/lib/mcp';
import { mcpAdapter } from '@/lib/mcp/adapter';
import { MCPMessage } from '@/types';

// Initialize built-in tools on server startup
let initialized = false;
if (!initialized) {
  initializeBuiltInTools();
  initialized = true;
}

/**
 * GET /api/tools - List all registered tools
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filters from query params
    const filters: any = {};
    
    const category = searchParams.get('category');
    if (category) filters.category = category;
    
    const enabled = searchParams.get('enabled');
    if (enabled !== null) filters.enabled = enabled === 'true';
    
    const openSource = searchParams.get('openSource');
    if (openSource !== null) filters.openSource = openSource === 'true';
    
    const tools = toolRegistry.list(filters);
    
    return NextResponse.json({
      tools,
      count: tools.length,
    });
  } catch (error: any) {
    console.error('Error listing tools:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools - Handle MCP protocol messages
 */
export async function POST(request: NextRequest) {
  try {
    const message: MCPMessage = await request.json();
    
    // Handle MCP message
    const response = await mcpAdapter.handleMessage(message);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error handling MCP message:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message,
        },
      },
      { status: 500 }
    );
  }
}
