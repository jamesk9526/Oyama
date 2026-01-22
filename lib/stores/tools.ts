// Zustand store for managing tools state
import { create } from 'zustand';
import { ToolDefinition, ToolCallLog } from '@/types';

interface ToolsStore {
  // State
  tools: ToolDefinition[];
  logs: ToolCallLog[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTools: () => Promise<void>;
  registerTool: (tool: ToolDefinition) => Promise<void>;
  unregisterTool: (toolId: string) => Promise<void>;
  executeTool: (toolId: string, inputs: Record<string, any>, context?: {
    chatId?: string;
    agentId?: string;
  }) => Promise<any>;
  updateToolStatus: (toolId: string, enabled: boolean) => Promise<void>;
  fetchLogs: (filters?: {
    toolId?: string;
    status?: 'success' | 'error' | 'pending';
    limit?: number;
  }) => Promise<void>;
  clearError: () => void;
}

export const useToolsStore = create<ToolsStore>((set, get) => ({
  // Initial state
  tools: [],
  logs: [],
  loading: false,
  error: null,

  // Fetch all tools
  fetchTools: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/tools');
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      const data = await response.json();
      set({ tools: data.tools, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Register a new tool
  registerTool: async (tool: ToolDefinition) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/tools/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register tool');
      }
      
      const data = await response.json();
      set(state => ({
        tools: [...state.tools, data.tool],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Unregister a tool
  unregisterTool: async (toolId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to unregister tool');
      }
      
      set(state => ({
        tools: state.tools.filter(t => t.id !== toolId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Execute a tool
  executeTool: async (
    toolId: string,
    inputs: Record<string, any>,
    context?: { chatId?: string; agentId?: string }
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          inputs,
          chatId: context?.chatId,
          agentId: context?.agentId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Tool execution failed');
      }
      
      const data = await response.json();
      
      // Add to logs if we have a log
      if (data.log) {
        set(state => ({
          logs: [data.log, ...state.logs].slice(0, 100), // Keep last 100 logs
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      
      return data.result;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update tool status (enable/disable)
  updateToolStatus: async (toolId: string, enabled: boolean) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/tools/${toolId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tool status');
      }
      
      set(state => ({
        tools: state.tools.map(t =>
          t.id === toolId ? { ...t, enabled, updatedAt: new Date().toISOString() } : t
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch tool call logs
  fetchLogs: async (filters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.toolId) params.append('toolId', filters.toolId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/tools/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      set({ logs: data.logs, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
