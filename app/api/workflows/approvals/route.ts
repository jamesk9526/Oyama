// API route for workflow approval gates
import { NextRequest, NextResponse } from 'next/server';
import { approvalGateManager } from '@/lib/workflows';
import type { ApprovalDecision } from '@/lib/workflows';

/**
 * GET /api/workflows/approvals - Get pending approvals
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');

    const approvals = workflowId
      ? approvalGateManager.getPendingApprovals(workflowId)
      : approvalGateManager.getPendingApprovals();

    return NextResponse.json({
      approvals,
      count: approvals.length,
    });
  } catch (error) {
    console.error('Error getting approvals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/approvals - Provide approval decision
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateId, decision } = body as { gateId: string; decision: ApprovalDecision };

    if (!gateId || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: gateId, decision' },
        { status: 400 }
      );
    }

    if (typeof decision.approved !== 'boolean') {
      return NextResponse.json(
        { error: 'decision.approved must be a boolean' },
        { status: 400 }
      );
    }

    await approvalGateManager.provideDecision(gateId, decision);

    return NextResponse.json({
      success: true,
      message: `Approval ${decision.approved ? 'granted' : 'denied'} for gate ${gateId}`,
    });
  } catch (error) {
    console.error('Error providing approval decision:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to provide decision' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/approvals - Cancel approval
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gateId = searchParams.get('gateId');
    const workflowId = searchParams.get('workflowId');

    if (gateId) {
      const cancelled = approvalGateManager.cancelApproval(gateId);
      
      if (!cancelled) {
        return NextResponse.json(
          { error: `Approval gate not found: ${gateId}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Approval cancelled for gate ${gateId}`,
      });
    } else if (workflowId) {
      approvalGateManager.clearWorkflowApprovals(workflowId);
      
      return NextResponse.json({
        success: true,
        message: `All approvals cleared for workflow ${workflowId}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: gateId or workflowId' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error cancelling approval:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel approval' },
      { status: 500 }
    );
  }
}
