import { create } from 'zustand';
import { Template } from '@/types';

interface TemplatesState {
  templates: Template[];
  loading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (template: Partial<Template>) => Promise<void>;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      set({ templates: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch templates', loading: false });
    }
  },

  createTemplate: async (template) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const newTemplate = await response.json();
      set((state) => ({
        templates: [...state.templates, newTemplate],
      }));
    } catch (error) {
      set({ error: 'Failed to create template' });
    }
  },

  updateTemplate: async (id, template) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const updatedTemplate = await response.json();
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? updatedTemplate : t
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to update template' });
    }
  },

  deleteTemplate: async (id) => {
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to delete template' });
    }
  },

  toggleFavorite: async (id) => {
    const template = get().templates.find((t) => t.id === id);
    if (template) {
      await get().updateTemplate(id, { isFavorite: !template.isFavorite });
    }
  },
}));
