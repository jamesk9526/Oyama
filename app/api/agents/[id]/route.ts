import { NextResponse } from 'next/server';
import { agentStore } from '@/lib/agents/store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { agentQueries } = require('@/lib/db/queries');
    const agent = agentQueries.getById(params.id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(agent);
  } catch {
    const agent = agentStore.getById(params.id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(agent);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  try {
    const { agentQueries } = require('@/lib/db/queries');
    const updated = agentQueries.update(params.id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    const updated = agentStore.update(params.id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { agentQueries } = require('@/lib/db/queries');
    const agent = agentQueries.getById(params.id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    agentQueries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    const agent = agentStore.getById(params.id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    agentStore.remove(params.id);
    return NextResponse.json({ success: true });
  }
}
