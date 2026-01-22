// API route for tool execution
import { NextRequest, NextResponse } from 'next/server';
import { toolRegistry, initializeBuiltInTools } from '@/lib/mcp';
import { toolLogsDb } from '@/lib/db/queries';
import { ToolCallLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Ensure tools are initialized
initializeBuiltInTools();

/**
 * POST /api/tools/execute - Execute a tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, inputs, chatId, agentId, timeout } = body;
    
    if (!toolId) {
      return NextResponse.json(
        { error: 'Missing required field: toolId' },
        { status: 400 }
      );
    }
    
    if (!inputs || typeof inputs !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid field: inputs (must be an object)' },
        { status: 400 }
      );
    }
    
    // Get tool info
    const tool = toolRegistry.get(toolId);
    if (!tool) {
      return NextResponse.json(
        { error: `Tool not found: ${toolId}` },
        { status: 404 }
      );
    }
    
    // Execute tool
    const result = await toolRegistry.execute({
      toolId,
      inputs,
      chatId,
      agentId,
      timeout: timeout || 30000,
    });
    
    // Create log entry
    const log: ToolCallLog = {
      id: uuidv4(),
      toolId,
      toolName: tool.name,
      chatId,
      agentId,
      inputs,
      outputs: result.output,
      status: result.success ? 'success' : 'error',
      error: result.error,
      duration: result.metadata?.duration,
      timestamp: result.metadata?.timestamp || new Date().toISOString(),
    };
    
    // Save log to database
    try {
      toolLogsDb.create(log);
    } catch (error) {
      console.error('Failed to save tool log to database:', error);
      // Continue even if logging fails
    }
    
    return NextResponse.json({
      result: result.output,
      success: result.success,
      error: result.error,
      log,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('Error executing tool:', error);
    return NextResponse.json(
      { error: error.message || 'Tool execution failed' },
      { status: 500 }
    );
  }
}
