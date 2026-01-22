// API route for tool registration
import { NextRequest, NextResponse } from 'next/server';
import { ToolDefinition } from '@/types';
import { toolRegistry, ToolHandler } from '@/lib/mcp';

/**
 * POST /api/tools/register - Register a new tool
 * 
 * Note: This endpoint is for registering tool definitions.
 * The actual handler must be provided server-side.
 * For dynamic tools, consider using a plugin system or external MCP servers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tool: ToolDefinition = body;
    
    // Validate required fields
    if (!tool.id || !tool.name || !tool.description) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, description' },
        { status: 400 }
      );
    }
    
    if (!tool.inputSchema) {
      return NextResponse.json(
        { error: 'Missing required field: inputSchema' },
        { status: 400 }
      );
    }
    
    // Set defaults
    tool.version = tool.version || '1.0.0';
    tool.enabled = tool.enabled !== undefined ? tool.enabled : true;
    tool.openSource = tool.openSource !== undefined ? tool.openSource : true;
    tool.permissions = tool.permissions || [];
    tool.createdAt = tool.createdAt || new Date().toISOString();
    tool.updatedAt = new Date().toISOString();
    
    // For now, we only support built-in tools with handlers
    // External tool registration would require a plugin system
    const existingTool = toolRegistry.get(tool.id);
    if (existingTool) {
      return NextResponse.json(
        { error: `Tool with id ${tool.id} already exists` },
        { status: 409 }
      );
    }
    
    // Create a placeholder handler for custom tools
    // In a real implementation, this would come from a plugin system
    const handler: ToolHandler = async (inputs) => {
      throw new Error('Custom tool handlers not yet implemented. Use built-in tools.');
    };
    
    toolRegistry.register(tool, handler);
    
    return NextResponse.json({
      tool,
      message: 'Tool registered successfully',
    });
  } catch (error: any) {
    console.error('Error registering tool:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register tool' },
      { status: 500 }
    );
  }
}
