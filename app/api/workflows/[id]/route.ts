// API route for individual workflow operations
import { NextRequest, NextResponse } from 'next/server';
import { crewQueries } from '@/lib/db/queries';

/**
 * GET /api/workflows/[id] - Get a single workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const crew = crewQueries.get(params.id);
    
    if (!crew) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Transform crew to workflow format
    const workflow = {
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
    };
    
    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('Error getting workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[id] - Update a workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, stages, workflowType, status } = body;
    
    // Get existing crew
    const existing = crewQueries.get(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Extract agent IDs from stages if provided
    const agentIds = stages 
      ? stages.map((stage: any) => stage.agentId).filter(Boolean)
      : existing.agentIds;
    
    // Update crew
    const updated = {
      ...existing,
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      agentIds,
      workflowType: workflowType || existing.workflowType,
      status: status || existing.status,
      updatedAt: new Date().toISOString(),
    };
    
    crewQueries.update(params.id, updated);
    
    // Transform back to workflow format
    const workflow = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      stages: (stages || existing.agentIds.map((agentId, index) => ({
        agentId,
        name: `Stage ${index + 1}`,
        requiresApproval: false,
      }))).map((stage: any, index: number) => ({
        id: `stage-${index}`,
        name: stage.name || `Stage ${index + 1}`,
        agentId: stage.agentId,
        status: 'pending',
        requiresApproval: stage.requiresApproval || false,
      })),
      workflowType: updated.workflowType,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
    
    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id] - Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = crewQueries.delete(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
