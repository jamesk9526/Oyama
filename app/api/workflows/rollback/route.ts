// API route for workflow rollback and error recovery
import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '@/lib/workflows';
import type { RecoveryStrategy } from '@/lib/workflows';

/**
 * POST /api/workflows/rollback - Rollback workflow or recover from error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, action, targetStepIndex, failedStep, recoveryStrategy } = body;

    if (!workflowId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: workflowId, action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'rollbackToStep':
        if (targetStepIndex === undefined) {
          return NextResponse.json(
            { error: 'Missing targetStepIndex for rollbackToStep action' },
            { status: 400 }
          );
        }
        
        const state = await rollbackManager.rollbackToStep(workflowId, targetStepIndex);
        
        return NextResponse.json({
          success: true,
          message: `Workflow rolled back to step ${targetStepIndex}`,
          state,
        });

      case 'rollbackToLastSuccess':
        const lastSuccessState = await rollbackManager.rollbackToLastSuccess(workflowId);
        
        return NextResponse.json({
          success: true,
          message: 'Workflow rolled back to last successful step',
          state: lastSuccessState,
        });

      case 'recoverFromError':
        if (!failedStep || !recoveryStrategy) {
          return NextResponse.json(
            { error: 'Missing failedStep or recoveryStrategy for recoverFromError action' },
            { status: 400 }
          );
        }
        
        const recovery = await rollbackManager.recoverFromError(
          workflowId,
          failedStep,
          recoveryStrategy as RecoveryStrategy
        );
        
        return NextResponse.json({
          success: recovery.recovered,
          recovery,
        });

      case 'clearRetryCounters':
        rollbackManager.clearRetryCounters(workflowId);
        
        return NextResponse.json({
          success: true,
          message: 'Retry counters cleared',
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing rollback action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rollback action failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/rollback - Get compensation actions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');
    const fromStepIndex = searchParams.get('fromStepIndex');
    const toStepIndex = searchParams.get('toStepIndex');

    if (!workflowId || !fromStepIndex || !toStepIndex) {
      return NextResponse.json(
        { error: 'Missing required parameters: workflowId, fromStepIndex, toStepIndex' },
        { status: 400 }
      );
    }

    const actions = await rollbackManager.getCompensationActions(
      workflowId,
      parseInt(fromStepIndex),
      parseInt(toStepIndex)
    );

    return NextResponse.json({
      actions,
      count: actions.length,
    });
  } catch (error) {
    console.error('Error getting compensation actions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get compensation actions' },
      { status: 500 }
    );
  }
}
