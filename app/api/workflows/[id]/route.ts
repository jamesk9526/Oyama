// API route for individual workflow operations
import { NextRequest, NextResponse } from 'next/server';
import { workflowQueries } from '@/lib/db/queries';

/**
 * GET /api/workflows/[id] - Get a single workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = workflowQueries.getById(params.id);
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
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
    
    // Get existing workflow
    const existing = workflowQueries.getById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    // Update workflow
    const updates = {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      stages: stages || existing.stages,
      workflowType: workflowType || existing.workflowType,
      status: status || existing.status,
    };
    
    const updated = workflowQueries.update(params.id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ workflow: updated });
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
    // Check if workflow exists
    const existing = workflowQueries.getById(params.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    workflowQueries.delete(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
