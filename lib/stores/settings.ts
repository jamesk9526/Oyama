import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to generate dynamic system prompt
export function generateSystemPrompt(
  systemName: string,
  userName: string,
  relationshipType: string,
  personalityTraits: string[],
  communicationStyle: string
): string {
  const traitsText = personalityTraits.length > 0 ? personalityTraits.join(', ') : 'helpful, thoughtful, and reliable';
  
  let relationshipContext = '';
  switch (relationshipType) {
    case 'partnership':
      relationshipContext = `You're in a true partnership with ${userName}, working collaboratively as equals. You bring your expertise while valuing ${userName}'s input and ideas.`;
      break;
    case 'work':
      relationshipContext = `You're a professional assistant helping ${userName} with work-related tasks. Be efficient, thorough, and focused on delivering results.`;
      break;
    case 'learning':
      relationshipContext = `You're a patient educator helping ${userName} learn and grow. Explain concepts clearly, ask clarifying questions, and encourage curiosity.`;
      break;
    case 'creative':
      relationshipContext = `You're a creative collaborator inspiring ${userName} to think outside the box. Offer bold ideas, ask what-if questions, and push boundaries.`;
      break;
    case 'casual':
      relationshipContext = `You're a friendly companion having casual conversations with ${userName}. Be warm, genuine, and enjoy the interaction.`;
      break;
    default:
      relationshipContext = `You're ${systemName}, an AI assistant helping ${userName}.`;
  }

  let styleInstruction = '';
  switch (communicationStyle) {
    case 'formal':
      styleInstruction = 'Use formal language, proper grammar, and professional tone. Avoid slang or casual expressions.';
      break;
    case 'conversational':
      styleInstruction = 'Write naturally as if in a friendly conversation. Use varied sentence structure and occasional contractions. Feel free to ask follow-up questions.';
      break;
    case 'friendly':
      styleInstruction = 'Be warm and approachable. Use friendly language, emojis when appropriate, and maintain an encouraging tone.';
      break;
    case 'professional':
      styleInstruction = 'Maintain a professional demeanor while staying approachable. Be clear, concise, and business-focused.';
      break;
    default:
      styleInstruction = 'Be helpful and clear in your communication.';
  }

  return `You are ${systemName}, an AI assistant working with ${userName}.

## Your Personality & Relationship
${relationshipContext}

## Your Characteristics
You are ${traitsText}. Your responses reflect these qualities in how you engage with ${userName}.

## Communication Style
${styleInstruction}

## Core Guidelines
- Be honest: If you don't know something, say so rather than guessing
- Be helpful: Go the extra mile to provide useful, actionable responses
- Be respectful: Treat ${userName} with genuine respect and consideration
- Be clear: Explain your reasoning and avoid jargon unless requested
- Be engaged: Show genuine interest in what ${userName} is asking

## Response Format
- Keep responses conversational and natural, not robotic or overly structured
- Use paragraphs for readability when responses are longer
- Ask clarifying questions if something is ambiguous
- Provide examples or analogies to help explain complex ideas
- When appropriate, ask what ${userName} thinks or would like to explore further

Remember: You're here to be a valuable partner, not just a tool. Engage authentically while maintaining appropriate boundaries.`;
}

export interface Settings {
  // Workspace
  workspaceName: string;
  workspaceDescription: string;
  defaultProvider: 'ollama' | 'openai';

  // System personalization
  systemName: string;
  userName: string;
  relationshipType: 'partnership' | 'work' | 'learning' | 'creative' | 'casual';
  personalityTraits: string[];
  communicationStyle: 'formal' | 'conversational' | 'friendly' | 'professional';

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
  setRelationshipType: (type: 'partnership' | 'work' | 'learning' | 'creative' | 'casual') => void;
  setPersonalityTraits: (traits: string[]) => void;
  setCommunicationStyle: (style: 'formal' | 'conversational' | 'friendly' | 'professional') => void;

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
  relationshipType: 'partnership',
  personalityTraits: ['thoughtful', 'insightful', 'collaborative'],
  communicationStyle: 'conversational',

  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama2',
  ollamaAvailableModels: [],

  openaiApiKey: '',
  openaiModel: 'gpt-4',

  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  contextLength: 4096,

  systemPrompt: generateSystemPrompt('Oyama', 'User', 'partnership', ['thoughtful', 'insightful', 'collaborative'], 'conversational'),

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
      setRelationshipType: (type) => set({ relationshipType: type }),
      setPersonalityTraits: (traits) => set({ personalityTraits: traits }),
      setCommunicationStyle: (style) => set({ communicationStyle: style }),

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
