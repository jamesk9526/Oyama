import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Settings {
  // Workspace
  workspaceName: string;
  workspaceDescription: string;
  defaultProvider: 'ollama' | 'openai';

  // System personalization
  systemName: string;
  userName: string;

  // Ollama
  ollamaUrl: string;
  ollamaModel: string;
  ollamaAvailableModels: string[];

  // OpenAI
  openaiApiKey: string;
  openaiModel: string;

  // General LLM settings
  temperature: number;
  topP: number;
  maxTokens: number;
  contextLength: number;

  // System prompt
  systemPrompt: string;

  // Advanced
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface SettingsStore extends Settings {
  // Setters
  setWorkspaceName: (name: string) => void;
  setWorkspaceDescription: (desc: string) => void;
  setDefaultProvider: (provider: 'ollama' | 'openai') => void;

  // Personalization setters
  setSystemName: (name: string) => void;
  setUserName: (name: string) => void;

  // Ollama setters
  setOllamaUrl: (url: string) => void;
  setOllamaModel: (model: string) => void;
  setOllamaAvailableModels: (models: string[]) => void;

  // OpenAI setters
  setOpenaiApiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;

  // LLM settings
  setTemperature: (temp: number) => void;
  setTopP: (topP: number) => void;
  setMaxTokens: (tokens: number) => void;
  setContextLength: (length: number) => void;

  // System prompt
  setSystemPrompt: (prompt: string) => void;

  // Advanced
  setDebugMode: (debug: boolean) => void;
  setLogLevel: (level: 'debug' | 'info' | 'warn' | 'error') => void;

  // Bulk operations
  updateSettings: (settings: Partial<Settings>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  workspaceName: 'Default Workspace',
  workspaceDescription: 'Your default workspace for AI agent collaboration',
  defaultProvider: 'ollama',

  systemName: 'Oyama',
  userName: 'User',

  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama2',
  ollamaAvailableModels: [],

  openaiApiKey: '',
  openaiModel: 'gpt-4',

  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  contextLength: 4096,

  systemPrompt:
    'You are a helpful AI assistant. Be concise, accurate, and helpful in your responses.',

  debugMode: false,
  logLevel: 'info',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      // Workspace setters
      setWorkspaceName: (name) => set({ workspaceName: name }),
      setWorkspaceDescription: (desc) => set({ workspaceDescription: desc }),
      setDefaultProvider: (provider) => set({ defaultProvider: provider }),

      // Personalization setters
      setSystemName: (name) => set({ systemName: name }),
      setUserName: (name) => set({ userName: name }),

      // Ollama setters
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setOllamaModel: (model) => set({ ollamaModel: model }),
      setOllamaAvailableModels: (models) => set({ ollamaAvailableModels: models }),

      // OpenAI setters
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      setOpenaiModel: (model) => set({ openaiModel: model }),

      // LLM settings
      setTemperature: (temp) => set({ temperature: Math.max(0, Math.min(2, temp)) }),
      setTopP: (topP) => set({ topP: Math.max(0, Math.min(1, topP)) }),
      setMaxTokens: (tokens) => set({ maxTokens: Math.max(1, tokens) }),
      setContextLength: (length) => set({ contextLength: Math.max(512, length) }),

      // System prompt
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

      // Advanced
      setDebugMode: (debug) => set({ debugMode: debug }),
      setLogLevel: (level) => set({ logLevel: level }),

      // Bulk operations
      updateSettings: (settings) => set(settings),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'oyama-settings',
    }
  )
);
