// Workflow rollback and error recovery system
import type { WorkflowStepResult } from './types';
import { workflowStateManager, WorkflowState } from './state-manager';

export interface RollbackAction {
  stepIndex: number;
  action: 'undo' | 'compensate' | 'skip';
  compensationData?: Record<string, unknown>;
}

export interface RecoveryStrategy {
  type: 'retry' | 'skip' | 'rollback' | 'manual';
  maxRetries?: number;
  retryDelay?: number;
  rollbackSteps?: number;
}

export interface ErrorRecoveryResult {
  recovered: boolean;
  strategy: RecoveryStrategy['type'];
  message: string;
  nextStepIndex?: number;
}

export class WorkflowRollbackManager {
  /**
   * Rollback workflow to a specific step
   */
  async rollbackToStep(
    workflowId: string,
    targetStepIndex: number
  ): Promise<WorkflowState> {
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (targetStepIndex < 0 || targetStepIndex >= state.steps.length) {
      throw new Error(`Invalid target step index: ${targetStepIndex}`);
    }

    // Get snapshots and find the one closest to target step
    const snapshots = workflowStateManager.getSnapshots(workflowId);
    let bestSnapshotIndex = -1;
    
    for (let i = snapshots.length - 1; i >= 0; i--) {
      if (snapshots[i].state.currentStepIndex <= targetStepIndex) {
        bestSnapshotIndex = i;
        break;
      }
    }

    if (bestSnapshotIndex >= 0) {
      // Restore from snapshot
      const restoredState = workflowStateManager.restoreFromSnapshot(
        workflowId,
        bestSnapshotIndex
      );
      
      // Remove steps after target
      restoredState.steps = restoredState.steps.slice(0, targetStepIndex + 1);
      restoredState.currentStepIndex = targetStepIndex;
      restoredState.status = 'paused';
      
      return restoredState;
    }

    throw new Error('No suitable snapshot found for rollback');
  }

  /**
   * Rollback to last successful step
   */
  async rollbackToLastSuccess(workflowId: string): Promise<WorkflowState> {
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Find last successful step
    let lastSuccessIndex = -1;
    for (let i = state.steps.length - 1; i >= 0; i--) {
      if (state.steps[i].success) {
        lastSuccessIndex = i;
        break;
      }
    }

    if (lastSuccessIndex >= 0) {
      return this.rollbackToStep(workflowId, lastSuccessIndex);
    }

    throw new Error('No successful step found to rollback to');
  }

  /**
   * Attempt to recover from an error
   */
  async recoverFromError(
    workflowId: string,
    failedStep: WorkflowStepResult,
    strategy: RecoveryStrategy
  ): Promise<ErrorRecoveryResult> {
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    switch (strategy.type) {
      case 'retry':
        return this.handleRetryRecovery(workflowId, failedStep, strategy);
      
      case 'skip':
        return this.handleSkipRecovery(workflowId, failedStep);
      
      case 'rollback':
        return this.handleRollbackRecovery(workflowId, failedStep, strategy);
      
      case 'manual':
        return {
          recovered: false,
          strategy: 'manual',
          message: 'Manual intervention required',
        };
      
      default:
        throw new Error(`Unknown recovery strategy: ${strategy.type}`);
    }
  }

  /**
   * Handle retry recovery
   */
  private async handleRetryRecovery(
    workflowId: string,
    failedStep: WorkflowStepResult,
    strategy: RecoveryStrategy
  ): Promise<ErrorRecoveryResult> {
    const maxRetries = strategy.maxRetries || 3;
    const retryDelay = strategy.retryDelay || 1000;

    // Check retry count in context
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const retryKey = `retry_count_${failedStep.stepIndex}`;
    const currentRetries = (state.context[retryKey] as number) || 0;

    if (currentRetries >= maxRetries) {
      return {
        recovered: false,
        strategy: 'retry',
        message: `Max retries (${maxRetries}) exceeded for step ${failedStep.stepIndex}`,
      };
    }

    // Update retry count
    workflowStateManager.updateContext(workflowId, {
      [retryKey]: currentRetries + 1,
    });

    // Add delay if specified
    if (retryDelay > 0 && currentRetries > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    return {
      recovered: true,
      strategy: 'retry',
      message: `Retrying step ${failedStep.stepIndex} (attempt ${currentRetries + 1}/${maxRetries})`,
      nextStepIndex: failedStep.stepIndex,
    };
  }

  /**
   * Handle skip recovery
   */
  private async handleSkipRecovery(
    workflowId: string,
    failedStep: WorkflowStepResult
  ): Promise<ErrorRecoveryResult> {
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Mark step as skipped in context
    workflowStateManager.updateContext(workflowId, {
      [`skipped_step_${failedStep.stepIndex}`]: true,
    });

    return {
      recovered: true,
      strategy: 'skip',
      message: `Skipped failed step ${failedStep.stepIndex}`,
      nextStepIndex: failedStep.stepIndex + 1,
    };
  }

  /**
   * Handle rollback recovery
   */
  private async handleRollbackRecovery(
    workflowId: string,
    failedStep: WorkflowStepResult,
    strategy: RecoveryStrategy
  ): Promise<ErrorRecoveryResult> {
    const rollbackSteps = strategy.rollbackSteps || 1;
    const targetStep = Math.max(0, failedStep.stepIndex - rollbackSteps);

    try {
      await this.rollbackToStep(workflowId, targetStep);
      
      return {
        recovered: true,
        strategy: 'rollback',
        message: `Rolled back ${rollbackSteps} step(s) from step ${failedStep.stepIndex}`,
        nextStepIndex: targetStep + 1,
      };
    } catch (error) {
      return {
        recovered: false,
        strategy: 'rollback',
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get rollback actions for compensating transactions
   */
  async getCompensationActions(
    workflowId: string,
    fromStepIndex: number,
    toStepIndex: number
  ): Promise<RollbackAction[]> {
    const state = workflowStateManager.getState(workflowId);
    if (!state) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const actions: RollbackAction[] = [];
    
    // Get steps to compensate (in reverse order)
    for (let i = fromStepIndex; i > toStepIndex; i--) {
      const step = state.steps[i];
      if (step && step.success) {
        actions.push({
          stepIndex: i,
          action: 'compensate',
          compensationData: {
            originalOutput: step.output,
            originalInput: step.input,
          },
        });
      }
    }

    return actions;
  }

  /**
   * Clear retry counts for a workflow
   */
  clearRetryCounters(workflowId: string): void {
    const state = workflowStateManager.getState(workflowId);
    if (!state) return;

    const newContext = { ...state.context };
    Object.keys(newContext).forEach(key => {
      if (key.startsWith('retry_count_')) {
        delete newContext[key];
      }
    });

    workflowStateManager.updateContext(workflowId, newContext);
  }
}

// Singleton instance
export const rollbackManager = new WorkflowRollbackManager();
