import { create } from 'zustand';

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents: string[]; // Agent IDs
  workflowType: 'sequential' | 'parallel' | 'conditional';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

interface CrewsStore {
  crews: Crew[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCrews: () => Promise<void>;
  createCrew: (crew: Partial<Crew>) => Promise<void>;
  updateCrew: (id: string, crew: Partial<Crew>) => Promise<void>;
  deleteCrew: (id: string) => Promise<void>;
}

export const useCrewsStore = create<CrewsStore>((set, get) => ({
  crews: [],
  loading: false,
  error: null,

  fetchCrews: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/crews');
      if (!response.ok) throw new Error('Failed to fetch crews');
      const crews = await response.json();
      set({ crews });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createCrew: async (crew: Partial<Crew>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crew),
      });
      if (!response.ok) throw new Error('Failed to create crew');
      const newCrew = await response.json();
      set({ crews: [...get().crews, newCrew] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateCrew: async (id: string, crew: Partial<Crew>) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/crews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crew),
      });
      if (!response.ok) throw new Error('Failed to update crew');
      const updatedCrew = await response.json();
      set({
        crews: get().crews.map((c) => (c.id === id ? updatedCrew : c)),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deleteCrew: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/crews/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete crew');
      set({ crews: get().crews.filter((c) => c.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
}));
