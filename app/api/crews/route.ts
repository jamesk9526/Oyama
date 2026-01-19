import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage (temporary - will be replaced with database)
let crews: Array<{
  id: string;
  name: string;
  description: string;
  agents: string[];
  workflowType: 'sequential' | 'parallel' | 'conditional';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}> = [];

export async function GET() {
  return NextResponse.json(crews);
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

  crews.push(crew);
  return NextResponse.json(crew, { status: 201 });
}
