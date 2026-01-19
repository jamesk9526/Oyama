import type { Agent } from '@/types';

export const seedAgents: Agent[] = [
  {
    id: '1',
    name: 'Research Assistant',
    role: 'researcher',
    systemPrompt: 'You are a thorough research assistant. Gather comprehensive information, cite sources, and present findings in a structured format.',
    model: 'llama2',
    provider: 'ollama',
    capabilities: ['web'],
    colorTag: '#6366f1',
    icon: '🔍',
    workspaceId: '1',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Content Writer',
    role: 'writer',
    systemPrompt: 'You are a skilled content writer. Create engaging, well-structured content that is clear and compelling.',
    model: 'llama2',
    provider: 'ollama',
    capabilities: [],
    colorTag: '#8b5cf6',
    icon: '✍️',
    workspaceId: '1',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Code Reviewer',
    role: 'coder',
    systemPrompt: 'You are an expert code reviewer. Analyze code for bugs, performance issues, and best practices. Provide actionable feedback.',
    model: 'llama2',
    provider: 'ollama',
    capabilities: ['code'],
    colorTag: '#10b981',
    icon: '💻',
    workspaceId: '1',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let agents: Agent[] = [...seedAgents];

export const agentStore = {
  list: () => agents,
  getById: (id: string) => agents.find((agent) => agent.id === id),
  setAll: (next: Agent[]) => {
    agents = next;
  },
  create: (agent: Agent) => {
    agents = [...agents, agent];
    return agent;
  },
  update: (id: string, updates: Partial<Agent>) => {
    const existing = agents.find((agent) => agent.id === id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Agent;
    agents = agents.map((agent) => (agent.id === id ? updated : agent));
    return updated;
  },
  remove: (id: string) => {
    agents = agents.filter((agent) => agent.id !== id);
  },
};
