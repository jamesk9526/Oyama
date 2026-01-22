// API route for workflow CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import { crewQueries } from '@/lib/db/queries';
import crypto from 'crypto';

/**
 * GET /api/workflows - List all workflows
 */
export async function GET(request: NextRequest) {
  try {
    // Workflows are stored as crews in the database
    const crews = crewQueries.getAll();
    
    // Transform crews to workflow format
    const workflows = crews.map(crew => ({
      id: crew.id,
      name: crew.name,
      description: crew.description,
      status: crew.status || 'draft',
      stages: crew.agentIds.map((agentId, index) => ({
        id: `stage-${index}`,
        name: `Stage ${index + 1}`,
        agentId,
        status: 'pending',
        requiresApproval: false,
      })),
      workflowType: crew.workflowType,
      createdAt: crew.createdAt,
      updatedAt: crew.updatedAt,
    }));
    
    return NextResponse.json({ workflows, count: workflows.length });
  } catch (error: any) {
    console.error('Error listing workflows:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, stages, workflowType = 'sequential' } = body;
    
    if (!name || !stages || !Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, stages' },
        { status: 400 }
      );
    }
    
    // Extract agent IDs from stages
    const agentIds = stages.map((stage: any) => stage.agentId).filter(Boolean);
    
    // Create crew (which serves as a workflow)
    const crew = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      agentIds,
      workflowType,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    crewQueries.create(crew);
    
    // Transform back to workflow format
    const workflow = {
      id: crew.id,
      name: crew.name,
      description: crew.description,
      status: crew.status,
      stages: stages.map((stage: any, index: number) => ({
        id: `stage-${index}`,
        name: stage.name || `Stage ${index + 1}`,
        agentId: stage.agentId,
        status: 'pending',
        requiresApproval: stage.requiresApproval || false,
      })),
      workflowType: crew.workflowType,
      createdAt: crew.createdAt,
      updatedAt: crew.updatedAt,
    };
    
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
