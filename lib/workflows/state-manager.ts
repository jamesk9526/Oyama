// Workflow state persistence and management
import type { WorkflowExecutionResult, WorkflowStepResult, WorkflowDefinition } from './types';
import { workflowStateQueries, type WorkflowStateRecord } from '@/lib/db/queries';

export interface WorkflowState {
  id: string;
  crewId: string;
  crewName: string;
  workflowDefinition: WorkflowDefinition;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: WorkflowStepResult[];
  startTime: Date;
  endTime?: Date;
  error?: string;
  pausedAt?: Date;
  resumedAt?: Date;
  context: Record<string, unknown>;
}

export interface WorkflowSnapshot {
  state: WorkflowState;
  timestamp: Date;
}

export class WorkflowStateManager {
  private states: Map<string, WorkflowState> = new Map();
  private snapshots: Map<string, WorkflowSnapshot[]> = new Map();

  /**
   * Create a new workflow state
   */
  createState(
    workflowId: string,
    crewId: string,
    crewName: string,
    workflow: WorkflowDefinition,
    initialInput: string
  ): WorkflowState {
    // Generate a unique state ID separate from workflow ID
    // This allows multiple executions of the same workflow
    const stateId = `${workflowId}-${Date.now()}`;
    
    const state: WorkflowState = {
      id: stateId,
      crewId,
      crewName,
      workflowDefinition: workflow,
      status: 'pending',
      currentStepIndex: 0,
      steps: [],
      startTime: new Date(),
      context: { initialInput, workflowId },
    };

    this.states.set(stateId, state);
    this.createSnapshot(stateId);
    this.persistState(state, workflowId);
    
    return state;
  }

  /**
   * Get workflow state
   */
  getState(workflowId: string): WorkflowState | undefined {
    // Try in-memory first
    let state = this.states.get(workflowId);
    
    // If not in memory, try loading from database
    if (!state) {
      state = this.loadStateFromDb(workflowId);
      if (state) {
        this.states.set(workflowId, state);
      }
    }
    
    return state;
  }

  /**
   * Update workflow status
   */
  updateStatus(workflowId: string, status: WorkflowState['status']): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.status = status;
    
    if (status === 'paused') {
      state.pausedAt = new Date();
    } else if (status === 'running' && state.pausedAt) {
      state.resumedAt = new Date();
    } else if (status === 'completed' || status === 'failed') {
      state.endTime = new Date();
    }

    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Update current step
   */
  updateCurrentStep(workflowId: string, stepIndex: number): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.currentStepIndex = stepIndex;
    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Add step result
   */
  addStepResult(workflowId: string, stepResult: WorkflowStepResult): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.steps.push(stepResult);
    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Update context
   */
  updateContext(workflowId: string, context: Record<string, unknown>): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.context = { ...state.context, ...context };
    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Set error
   */
  setError(workflowId: string, error: string): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.error = error;
    state.status = 'failed';
    state.endTime = new Date();
    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Pause workflow
   */
  pauseWorkflow(workflowId: string): void {
    this.updateStatus(workflowId, 'paused');
  }

  /**
   * Resume workflow
   */
  resumeWorkflow(workflowId: string): void {
    this.updateStatus(workflowId, 'running');
  }

  /**
   * Complete workflow
   */
  completeWorkflow(workflowId: string, result: WorkflowExecutionResult): void {
    const state = this.states.get(workflowId);
    if (!state) {
      throw new Error(`Workflow state not found: ${workflowId}`);
    }

    state.status = result.success ? 'completed' : 'failed';
    state.endTime = new Date();
    state.error = result.error;
    
    this.createSnapshot(workflowId);
    this.persistState(state);
  }

  /**
   * Create a snapshot of current state
   */
  private createSnapshot(workflowId: string): void {
    const state = this.states.get(workflowId);
    if (!state) return;

    const snapshot: WorkflowSnapshot = {
      state: structuredClone(state), // Deep clone
      timestamp: new Date(),
    };

    if (!this.snapshots.has(workflowId)) {
      this.snapshots.set(workflowId, []);
    }

    const snapshots = this.snapshots.get(workflowId)!;
    snapshots.push(snapshot);

    // Keep only last 50 snapshots
    if (snapshots.length > 50) {
      snapshots.shift();
    }
  }

  /**
   * Get all snapshots for a workflow
   */
  getSnapshots(workflowId: string): WorkflowSnapshot[] {
    return this.snapshots.get(workflowId) || [];
  }

  /**
   * Restore state from a snapshot
   */
  restoreFromSnapshot(workflowId: string, snapshotIndex: number): WorkflowState {
    const snapshots = this.snapshots.get(workflowId);
    if (!snapshots || snapshotIndex >= snapshots.length) {
      throw new Error('Invalid snapshot index');
    }

    const snapshot = snapshots[snapshotIndex];
    const restoredState = structuredClone(snapshot.state);
    
    this.states.set(workflowId, restoredState);
    
    return restoredState;
  }

  /**
   * Delete workflow state
   */
  deleteState(workflowId: string): boolean {
    const deleted = this.states.delete(workflowId);
    this.snapshots.delete(workflowId);
    return deleted;
  }

  /**
   * List all workflow states
   */
  listStates(filters?: {
    status?: WorkflowState['status'];
    crewId?: string;
  }): WorkflowState[] {
    let states = Array.from(this.states.values());

    if (filters) {
      if (filters.status) {
        states = states.filter(s => s.status === filters.status);
      }
      if (filters.crewId) {
        states = states.filter(s => s.crewId === filters.crewId);
      }
    }

    return states;
  }

  /**
   * Clear all completed/failed workflows older than specified time
   */
  cleanupOldWorkflows(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let count = 0;

    for (const [workflowId, state] of this.states.entries()) {
      if (
        (state.status === 'completed' || state.status === 'failed') &&
        state.endTime &&
        state.endTime.getTime() < cutoffTime
      ) {
        this.deleteState(workflowId);
        count++;
      }
    }

    return count;
  }

  /**
   * Persist workflow state to database
   */
  private persistState(state: WorkflowState, workflowId?: string): void {
    try {
      // Extract workflowId from context if not provided
      const wfId = workflowId || (state.context.workflowId as string) || state.id;
      
      const record: WorkflowStateRecord = {
        id: state.id,
        workflowId: wfId,
        crewId: state.crewId,
        crewName: state.crewName,
        workflowDefinition: JSON.stringify(state.workflowDefinition),
        status: state.status,
        currentStepIndex: state.currentStepIndex,
        steps: JSON.stringify(state.steps),
        startTime: state.startTime.toISOString(),
        endTime: state.endTime?.toISOString(),
        pausedAt: state.pausedAt?.toISOString(),
        resumedAt: state.resumedAt?.toISOString(),
        error: state.error,
        context: JSON.stringify(state.context),
        createdAt: state.startTime.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existing = workflowStateQueries.getById(state.id);
      if (existing) {
        workflowStateQueries.update(state.id, record);
      } else {
        workflowStateQueries.create(record);
      }
    } catch (error) {
      console.error('Failed to persist workflow state:', error);
    }
  }

  /**
   * Load workflow state from database
   */
  private loadStateFromDb(workflowId: string): WorkflowState | undefined {
    try {
      const record = workflowStateQueries.getById(workflowId);
      if (!record) return undefined;

      return {
        id: record.id,
        crewId: record.crewId,
        crewName: record.crewName,
        workflowDefinition: JSON.parse(record.workflowDefinition),
        status: record.status,
        currentStepIndex: record.currentStepIndex,
        steps: JSON.parse(record.steps),
        startTime: new Date(record.startTime),
        endTime: record.endTime ? new Date(record.endTime) : undefined,
        pausedAt: record.pausedAt ? new Date(record.pausedAt) : undefined,
        resumedAt: record.resumedAt ? new Date(record.resumedAt) : undefined,
        error: record.error,
        context: JSON.parse(record.context),
      };
    } catch (error) {
      console.error('Failed to load workflow state from database:', error);
      return undefined;
    }
  }
}

// Singleton instance
export const workflowStateManager = new WorkflowStateManager();
