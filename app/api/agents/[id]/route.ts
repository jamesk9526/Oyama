import { NextResponse } from 'next/server';

// Mock agents storage
let agents: any[] = [];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const agent = agents.find((a) => a.id === params.id);
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  return NextResponse.json(agent);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const index = agents.findIndex((a) => a.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }
  agents[index] = { ...agents[index], ...data, updatedAt: new Date().toISOString() };
  return NextResponse.json(agents[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  agents = agents.filter((a) => a.id !== params.id);
  return NextResponse.json({ success: true });
}
