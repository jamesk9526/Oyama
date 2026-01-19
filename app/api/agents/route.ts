import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { Agent } from '@/types';

// Try to use database, fallback to in-memory storage
let useDatabase = false;
let agents: Agent[] = [];

// Seed data
const seedAgents: Agent[] = [
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

// Initialize with seed data
agents = seedAgents;

// Try to load from database
try {
  const { agentQueries } = require('@/lib/db/queries');
  const dbAgents = agentQueries.getAll();
  if (dbAgents && dbAgents.length > 0) {
    agents = dbAgents;
    useDatabase = true;
  }
} catch (err) {
  // Database not available in this environment
  console.log('Using in-memory storage for agents');
}

export async function GET() {
  try {
    if (useDatabase) {
      const { agentQueries } = require('@/lib/db/queries');
      const dbAgents = agentQueries.getAll();
      return NextResponse.json(dbAgents);
    }
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(agents);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAgent: Agent = {
      ...body,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (useDatabase) {
      const { agentQueries } = require('@/lib/db/queries');
      agentQueries.create(newAgent);
    } else {
      agents.push(newAgent);
    }

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
