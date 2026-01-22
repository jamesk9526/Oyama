// API route for workflow state management
import { NextRequest, NextResponse } from 'next/server';
import { workflowStateManager } from '@/lib/workflows';

/**
 * GET /api/workflows/state - Get workflow states or specific state
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const crewId = searchParams.get('crewId');

    if (workflowId) {
      // Get specific workflow state
      const state = workflowStateManager.getState(workflowId);
      
      if (!state) {
        return NextResponse.json(
          { error: `Workflow state not found: ${workflowId}` },
          { status: 404 }
        );
      }

      // Get snapshots if requested
      const includeSnapshots = searchParams.get('includeSnapshots') === 'true';
      const snapshots = includeSnapshots 
        ? workflowStateManager.getSnapshots(workflowId)
        : undefined;

      return NextResponse.json({
        state,
        snapshots,
      });
    } else {
      // List workflow states
      const filters: {
        status?: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
        crewId?: string;
      } = {};
      
      if (status) {
        filters.status = status as 'pending' | 'running' | 'paused' | 'completed' | 'failed';
      }
      if (crewId) {
        filters.crewId = crewId;
      }

      const states = workflowStateManager.listStates(filters);

      return NextResponse.json({
        states,
        count: states.length,
      });
    }
  } catch (error) {
    console.error('Error getting workflow state:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get workflow state' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/state - Update workflow state
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, action, data } = body;

    if (!workflowId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'pause':
        workflowStateManager.pauseWorkflow(workflowId);
        return NextResponse.json({
          success: true,
          message: `Workflow ${workflowId} paused`,
        });

      case 'resume':
        workflowStateManager.resumeWorkflow(workflowId);
        return NextResponse.json({
          success: true,
          message: `Workflow ${workflowId} resumed`,
        });

      case 'updateContext':
        if (!data) {
          return NextResponse.json(
            { error: 'Missing context data for updateContext action' },
            { status: 400 }
          );
        }
        workflowStateManager.updateContext(workflowId, data);
        return NextResponse.json({
          success: true,
          message: 'Workflow context updated',
        });

      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Missing status for updateStatus action' },
            { status: 400 }
          );
        }
        workflowStateManager.updateStatus(workflowId, data.status);
        return NextResponse.json({
          success: true,
          message: `Workflow status updated to ${data.status}`,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating workflow state:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workflow state' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/state - Delete workflow state
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing required parameter: workflowId' },
        { status: 400 }
      );
    }

    const deleted = workflowStateManager.deleteState(workflowId);

    if (!deleted) {
      return NextResponse.json(
        { error: `Workflow state not found: ${workflowId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Workflow state deleted: ${workflowId}`,
    });
  } catch (error) {
    console.error('Error deleting workflow state:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workflow state' },
      { status: 500 }
    );
  }
}
