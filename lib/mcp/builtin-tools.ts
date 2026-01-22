// Built-in tools that come with Oyama
import { ToolDefinition, ToolCategory } from '@/types';
import { toolRegistry, ToolHandler } from './registry';

/**
 * Echo tool - Returns the input as output (for testing)
 */
const echoTool: ToolDefinition = {
  id: 'tool-echo',
  name: 'echo',
  description: 'Returns the input text as output. Useful for testing tool execution.',
  category: 'system' as ToolCategory,
  version: '1.0.0',
  enabled: true,
  openSource: true,
  permissions: [],
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
      },
    },
    required: ['message'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      echo: {
        type: 'string',
        description: 'The echoed message',
      },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const echoHandler: ToolHandler = async (inputs) => {
  return { echo: inputs.message };
};

/**
 * Calculator tool - Performs basic math operations
 */
const calculatorTool: ToolDefinition = {
  id: 'tool-calculator',
  name: 'calculator',
  description: 'Performs basic mathematical operations (add, subtract, multiply, divide)',
  category: 'data' as ToolCategory,
  version: '1.0.0',
  enabled: true,
  openSource: true,
  permissions: [],
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        description: 'The operation to perform',
        enum: ['add', 'subtract', 'multiply', 'divide'],
      },
      a: {
        type: 'number',
        description: 'First operand',
      },
      b: {
        type: 'number',
        description: 'Second operand',
      },
    },
    required: ['operation', 'a', 'b'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      result: {
        type: 'number',
        description: 'The calculation result',
      },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const calculatorHandler: ToolHandler = async (inputs) => {
  const { operation, a, b } = inputs;
  
  let result: number;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) {
        throw new Error('Division by zero');
      }
      result = a / b;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  return { result };
};

/**
 * Timestamp tool - Returns current timestamp
 */
const timestampTool: ToolDefinition = {
  id: 'tool-timestamp',
  name: 'timestamp',
  description: 'Returns the current timestamp in various formats',
  category: 'system' as ToolCategory,
  version: '1.0.0',
  enabled: true,
  openSource: true,
  permissions: [],
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: 'The format for the timestamp',
        enum: ['iso', 'unix', 'locale'],
        default: 'iso',
      },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      timestamp: {
        type: 'string',
        description: 'The formatted timestamp',
      },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const timestampHandler: ToolHandler = async (inputs) => {
  const format = inputs.format || 'iso';
  const now = new Date();
  
  let timestamp: string;
  switch (format) {
    case 'iso':
      timestamp = now.toISOString();
      break;
    case 'unix':
      timestamp = Math.floor(now.getTime() / 1000).toString();
      break;
    case 'locale':
      timestamp = now.toLocaleString();
      break;
    default:
      timestamp = now.toISOString();
  }
  
  return { timestamp };
};

/**
 * Text analysis tool - Analyzes text properties
 */
const textAnalysisTool: ToolDefinition = {
  id: 'tool-text-analysis',
  name: 'text_analysis',
  description: 'Analyzes text to count words, characters, sentences, and more',
  category: 'data' as ToolCategory,
  version: '1.0.0',
  enabled: true,
  openSource: true,
  permissions: [],
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to analyze',
      },
    },
    required: ['text'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      characters: { type: 'number' },
      words: { type: 'number' },
      sentences: { type: 'number' },
      lines: { type: 'number' },
    },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const textAnalysisHandler: ToolHandler = async (inputs) => {
  const text = inputs.text as string;
  
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const lines = text.split('\n').length;
  
  return { characters, words, sentences, lines };
};

/**
 * Initialize built-in tools
 */
export function initializeBuiltInTools(): void {
  toolRegistry.register(echoTool, echoHandler);
  toolRegistry.register(calculatorTool, calculatorHandler);
  toolRegistry.register(timestampTool, timestampHandler);
  toolRegistry.register(textAnalysisTool, textAnalysisHandler);
}

/**
 * Get list of all built-in tools
 */
export function getBuiltInTools(): ToolDefinition[] {
  return [
    echoTool,
    calculatorTool,
    timestampTool,
    textAnalysisTool,
  ];
}
