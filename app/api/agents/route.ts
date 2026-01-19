import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { Agent } from '@/types';
import { agentStore, seedAgents } from '@/lib/agents/store';

// Try to use database, fallback to in-memory storage
let useDatabase = false;

try {
  const { agentQueries } = require('@/lib/db/queries');
  useDatabase = true;

  const dbAgents = agentQueries.getAll();
  if (!dbAgents || dbAgents.length === 0) {
    seedAgents.forEach((seed) => agentQueries.create(seed));
  }
} catch (err) {
  // Database not available in this environment
  agentStore.setAll(seedAgents);
}

export async function GET() {
  try {
    if (useDatabase) {
      const { agentQueries } = require('@/lib/db/queries');
      const dbAgents = agentQueries.getAll();
      return NextResponse.json(dbAgents);
    }
    return NextResponse.json(agentStore.list());
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(agentStore.list());
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAgent: Agent = {
      ...body,
      capabilities: body.capabilities || [],
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (useDatabase) {
      const { agentQueries } = require('@/lib/db/queries');
      agentQueries.create(newAgent);
    } else {
      agentStore.create(newAgent);
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
