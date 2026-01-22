// Tool registry for managing MCP-compatible tools
import { ToolDefinition, ToolExecutionContext, ToolExecutionResult } from '@/types';

// Tool handler function type
export type ToolHandler = (inputs: Record<string, any>) => Promise<any>;

class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();
  
  // Singleton pattern to ensure one instance across all imports
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Register a new tool
   */
  register(tool: ToolDefinition, handler: ToolHandler): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with id ${tool.id} is already registered`);
    }
    
    this.tools.set(tool.id, tool);
    this.handlers.set(tool.id, handler);
  }
  
  /**
   * Unregister a tool
   */
  unregister(toolId: string): boolean {
    const deleted = this.tools.delete(toolId);
    this.handlers.delete(toolId);
    return deleted;
  }
  
  /**
   * Get a tool by ID
   */
  get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }
  
  /**
   * Get a tool by name
   */
  getByName(name: string): ToolDefinition | undefined {
    return Array.from(this.tools.values()).find(tool => tool.name === name);
  }
  
  /**
   * List all registered tools
   */
  list(filters?: {
    category?: string;
    enabled?: boolean;
    openSource?: boolean;
  }): ToolDefinition[] {
    let tools = Array.from(this.tools.values());
    
    if (filters) {
      if (filters.category) {
        tools = tools.filter(t => t.category === filters.category);
      }
      if (filters.enabled !== undefined) {
        tools = tools.filter(t => t.enabled === filters.enabled);
      }
      if (filters.openSource !== undefined) {
        tools = tools.filter(t => t.openSource === filters.openSource);
      }
    }
    
    return tools;
  }
  
  /**
   * Execute a tool
   */
  async execute(context: ToolExecutionContext): Promise<ToolExecutionResult> {
    const tool = this.tools.get(context.toolId);
    const handler = this.handlers.get(context.toolId);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool ${context.toolId} not found`,
        metadata: {
          duration: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
    
    if (!tool.enabled) {
      return {
        success: false,
        error: `Tool ${tool.name} is disabled`,
        metadata: {
          duration: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
    
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for tool ${tool.name}`,
        metadata: {
          duration: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
    
    // Validate inputs against schema
    const validationError = this.validateInputs(tool, context.inputs);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        metadata: {
          duration: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
    
    const startTime = Date.now();
    
    try {
      // Apply timeout if specified
      const timeout = context.timeout || 30000; // Default 30 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tool execution timeout')), timeout);
      });
      
      const executionPromise = handler(context.inputs);
      const output = await Promise.race([executionPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        output,
        metadata: {
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Retry logic if specified
      if (context.retryPolicy && context.retryPolicy.maxRetries > 0) {
        // Implement retry with backoff
        // For now, just return error
      }
      
      return {
        success: false,
        error: error.message || 'Tool execution failed',
        metadata: {
          duration,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
  
  /**
   * Validate tool inputs against schema
   */
  private validateInputs(tool: ToolDefinition, inputs: Record<string, any>): string | null {
    const schema = tool.inputSchema;
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in inputs)) {
          return `Missing required field: ${field}`;
        }
      }
    }
    
    // Basic type checking
    for (const [key, value] of Object.entries(inputs)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        continue; // Allow extra fields
      }
      
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (propSchema.type !== actualType && value !== null && value !== undefined) {
        return `Invalid type for field ${key}: expected ${propSchema.type}, got ${actualType}`;
      }
    }
    
    return null;
  }
  
  /**
   * Update tool status
   */
  updateStatus(toolId: string, enabled: boolean): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;
    
    tool.enabled = enabled;
    tool.updatedAt = new Date().toISOString();
    return true;
  }
  
  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.handlers.clear();
  }
}

// Singleton instance
export const toolRegistry = ToolRegistry.getInstance();

// Export the class for testing
export { ToolRegistry };
