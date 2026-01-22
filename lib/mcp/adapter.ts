// MCP (Model Context Protocol) adapter
// Provides MCP-compatible interface for tool orchestration
import {
  MCPMessage,
  MCPError,
  MCPToolRegistration,
  MCPToolCall,
  MCPToolResponse,
  ToolDefinition,
} from '@/types';
import { toolRegistry } from './registry';

/**
 * MCP Protocol adapter
 * Implements JSON-RPC 2.0 based Model Context Protocol
 */
export class MCPAdapter {
  /**
   * Handle incoming MCP message
   */
  async handleMessage(message: MCPMessage): Promise<MCPMessage> {
    // Validate JSON-RPC version
    if (message.jsonrpc !== '2.0') {
      return this.errorResponse(
        message.id,
        -32600,
        'Invalid Request',
        'Invalid JSON-RPC version'
      );
    }

    // Route based on method
    if (!message.method) {
      return this.errorResponse(
        message.id,
        -32600,
        'Invalid Request',
        'Missing method field'
      );
    }

    try {
      switch (message.method) {
        case 'tools/list':
          return await this.handleToolsList(message);
        case 'tools/call':
          return await this.handleToolCall(message);
        case 'tools/register':
          return await this.handleToolRegister(message);
        case 'tools/unregister':
          return await this.handleToolUnregister(message);
        default:
          return this.errorResponse(
            message.id,
            -32601,
            'Method not found',
            `Unknown method: ${message.method}`
          );
      }
    } catch (error: any) {
      return this.errorResponse(
        message.id,
        -32603,
        'Internal error',
        error.message
      );
    }
  }

  /**
   * Handle tools/list request
   */
  private async handleToolsList(message: MCPMessage): Promise<MCPMessage> {
    const filters = message.params || {};
    const tools = toolRegistry.list(filters);

    // Convert to MCP format
    const mcpTools: MCPToolRegistration[] = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    }));

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: mcpTools,
      },
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(message: MCPMessage): Promise<MCPMessage> {
    const params = message.params as MCPToolCall;
    
    if (!params || !params.name) {
      return this.errorResponse(
        message.id,
        -32602,
        'Invalid params',
        'Missing tool name'
      );
    }

    // Find tool by name
    const tool = toolRegistry.getByName(params.name);
    if (!tool) {
      return this.errorResponse(
        message.id,
        -32602,
        'Invalid params',
        `Tool not found: ${params.name}`
      );
    }

    // Execute tool
    const result = await toolRegistry.execute({
      toolId: tool.id,
      inputs: params.arguments || {},
    });

    if (!result.success) {
      return this.errorResponse(
        message.id,
        -32000,
        'Tool execution failed',
        result.error || 'Unknown error'
      );
    }

    const response: MCPToolResponse = {
      content: result.output,
      isError: false,
    };

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: response,
    };
  }

  /**
   * Handle tools/register request (for external tools)
   */
  private async handleToolRegister(message: MCPMessage): Promise<MCPMessage> {
    // Tool registration would typically come from external MCP servers
    // For now, return not implemented
    return this.errorResponse(
      message.id,
      -32601,
      'Not implemented',
      'External tool registration not yet supported'
    );
  }

  /**
   * Handle tools/unregister request
   */
  private async handleToolUnregister(message: MCPMessage): Promise<MCPMessage> {
    return this.errorResponse(
      message.id,
      -32601,
      'Not implemented',
      'Tool unregistration not yet supported'
    );
  }

  /**
   * Create an error response
   */
  private errorResponse(
    id: string | number | undefined,
    code: number,
    message: string,
    data?: any
  ): MCPMessage {
    const error: MCPError = {
      code,
      message,
      data,
    };

    return {
      jsonrpc: '2.0',
      id,
      error,
    };
  }

  /**
   * Convert tool to MCP format
   */
  static toMCPFormat(tool: ToolDefinition): MCPToolRegistration {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
    };
  }

  /**
   * Create a tool call message
   */
  static createToolCallMessage(
    id: string | number,
    toolName: string,
    args: Record<string, any>
  ): MCPMessage {
    return {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };
  }
}

// Singleton instance
export const mcpAdapter = new MCPAdapter();
