// API route for workflow CRUD operations
import { NextRequest, NextResponse } from 'next/server';
import { workflowQueries, type WorkflowRecord } from '@/lib/db/queries';
import crypto from 'crypto';

/**
 * GET /api/workflows - List all workflows
 */
export async function GET(request: NextRequest) {
  try {
    const workflows = workflowQueries.getAll();
    
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
    const { name, description, stages, workflowType = 'sequential', crewId } = body;
    
    if (!name || !stages || !Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, stages' },
        { status: 400 }
      );
    }
    
    // Create workflow
    const workflow: WorkflowRecord = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      stages: stages.map((stage: any, index: number) => ({
        id: stage.id || `stage-${index}`,
        name: stage.name || `Stage ${index + 1}`,
        agentId: stage.agentId,
        status: 'pending',
        requiresApproval: stage.requiresApproval || false,
      })),
      workflowType,
      status: 'draft',
      crewId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    workflowQueries.create(workflow);
    
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
