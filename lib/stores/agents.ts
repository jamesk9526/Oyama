import { create } from 'zustand';
import { Agent } from '@/types';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (agent: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: [],
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      set({ agents: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch agents', loading: false });
    }
  },

  createAgent: async (agent) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      const newAgent = await response.json();
      set((state) => ({
        agents: [...state.agents, newAgent],
      }));
    } catch (error) {
      set({ error: 'Failed to create agent' });
    }
  },

  updateAgent: async (id, agent) => {
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent),
      });
      const updatedAgent = await response.json();
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === id ? updatedAgent : a
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update agent' });
    }
  },

  deleteAgent: async (id) => {
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete agent' });
    }
  },
}));
