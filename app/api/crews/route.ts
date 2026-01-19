import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { crewQueries } from '@/lib/db/queries';

export async function GET() {
  return NextResponse.json(crewQueries.getAll());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const crew = {
    id: uuidv4(),
    name: body.name || 'New Crew',
    description: body.description || '',
    agents: body.agents || [],
    workflowType: body.workflowType || 'sequential',
    status: 'idle' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = crewQueries.create(crew);
  return NextResponse.json(created, { status: 201 });
}
