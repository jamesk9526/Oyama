// Core domain types for Oyama

export type AgentRole = 
  | 'planner' 
  | 'researcher' 
  | 'writer' 
  | 'editor' 
  | 'critic' 
  | 'coder' 
  | 'qa' 
  | 'summarizer'
  | 'synthesizer'
  | 'custom'
  | 'debugger'
  | 'analyst'
  | 'devops'
  | 'security'
  | 'designer'
  | 'backend'
  | 'product';

export type AgentCapability = 
  | 'web' 
  | 'files' 
  | 'code' 
  | 'image';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  bio?: string; // Short description for profile view
  styleRules?: string;
  model: string;
  provider: string;
  capabilities: AgentCapability[];
  colorTag?: string;
  icon?: string;
  workspaceId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags: string[];
  body: string; // Template with {{variables}}
  variables: TemplateVariable[];
  systemAdditions?: string;
  examples?: string[];
  outputSchema?: string; // JSON schema
  workspaceId?: string | null; // null = global
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'text';
  description?: string;
  defaultValue?: string;
  required: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string; // Overrides global
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  defaultModel?: string;
  defaultProvider?: string;
  temperature?: number;
}

export interface Chat {
  id: string;
  title: string;
  workspaceId: string;
  agentId?: string; // null if crew
  crewId?: string;
  systemPromptOverrides?: string;
  metadata?: ChatMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMetadata {
  isPinned?: boolean;
  folder?: string;
  quickToggles?: {
    strictFormat?: boolean;
    shortAnswers?: boolean;
    creative?: boolean;
  };
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId?: string; // Which agent in crew
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface MessageMetadata {
  model?: string;
  provider?: string;
  tokens?: {
    prompt: number;
    completion: number;
  };
  templateId?: string;
}

export interface Crew {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  workflowType: CrewWorkflowType;
  agents: CrewAgent[];
  aggregatorConfig?: AggregatorConfig;
  createdAt: string;
  updatedAt: string;
}

export type CrewWorkflowType = 
  | 'parallel' 
  | 'pipeline' 
  | 'debate' 
  | 'planner-executor';

export interface CrewAgent {
  agentId: string;
  order: number;
  role: string; // Role in this crew
  contextRules?: string; // What this agent sees
  memoryPolicy?: 'global' | 'scratch';
}

export interface AggregatorConfig {
  agentId: string; // Which agent aggregates
  showCitations: boolean;
  mergeStrategy: 'concat' | 'summary' | 'best';
}

export interface Run {
  id: string;
  chatId?: string;
  crewId?: string;
  agentId?: string;
  inputs: Record<string, any>;
  outputs: RunOutput[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  compiledPrompt: string;
  model: string;
  provider: string;
  runtimeStats?: RuntimeStats;
  createdAt: string;
  completedAt?: string;
}

export interface RunOutput {
  agentId: string;
  agentName: string;
  content: string;
  step: number;
  timestamp: string;
}

export interface RuntimeStats {
  durationMs: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  modelInfo?: string;
}

export interface SystemPromptVersion {
  id: string;
  level: 'global' | 'workspace' | 'agent';
  entityId?: string; // null for global
  prompt: string;
  version: number;
  changeNote?: string;
  createdAt: string;
}

export interface PromptBlock {
  id: string;
  name: string;
  type: 'tone' | 'constraint' | 'formatting' | 'example' | 'checklist' | 'custom';
  content: string;
  enabled: boolean;
  order: number;
}

export interface UserProfile {
  id: string;
  name: string;
  type: 'work' | 'personal';
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

// Provider types
export type ProviderType = 'ollama' | 'openai' | 'openai-compatible';

export interface ProviderConfig {
  type: ProviderType;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  models: string[];
}

export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    model?: string;
    tokens?: number;
  };
}

export interface LLMRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
