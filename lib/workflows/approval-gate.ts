// Workflow approval gate system
// Enables human-in-the-loop approval for staged automation

import { workflowApprovalQueries, type WorkflowApprovalRecord } from '@/lib/db/queries';

export interface ApprovalGate {
  id: string;
  workflowId: string;
  stepIndex: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  comment?: string;
  data?: Record<string, unknown>;
}

export interface ApprovalRequest {
  stepIndex: number;
  stepName: string;
  data: Record<string, unknown>;
  timeout?: number; // milliseconds
}

export interface ApprovalDecision {
  approved: boolean;
  comment?: string;
  userId?: string;
}

export class ApprovalGateManager {
  private pendingApprovals: Map<string, ApprovalGate> = new Map();
  private approvalCallbacks: Map<string, (decision: ApprovalDecision) => void> = new Map();

  constructor() {
    // Load pending approvals from database on initialization
    this.loadPendingApprovalsFromDb();
  }

  /**
   * Request approval for a workflow step
   */
  async requestApproval(
    workflowId: string,
    request: ApprovalRequest
  ): Promise<ApprovalDecision> {
    const gateId = `${workflowId}-${request.stepIndex}`;
    
    const gate: ApprovalGate = {
      id: gateId,
      workflowId,
      stepIndex: request.stepIndex,
      status: 'pending',
      requestedAt: new Date(),
      data: request.data,
    };

    this.pendingApprovals.set(gateId, gate);
    
    // Persist to database
    this.persistApproval(gate, request.stepName);

    // Return a promise that resolves when approval is given
    return new Promise((resolve, reject) => {
      // Set timeout if specified
      let timeoutId: number | undefined;
      if (request.timeout) {
        timeoutId = setTimeout(() => {
          this.pendingApprovals.delete(gateId);
          this.approvalCallbacks.delete(gateId);
          reject(new Error('Approval timeout'));
        }, request.timeout) as unknown as number;
      }

      // Store callback
      this.approvalCallbacks.set(gateId, (decision: ApprovalDecision) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        
        gate.status = decision.approved ? 'approved' : 'rejected';
        gate.resolvedAt = new Date();
        gate.resolvedBy = decision.userId;
        gate.comment = decision.comment;

        // Update in database
        this.updateApproval(gate);

        this.pendingApprovals.delete(gateId);
        this.approvalCallbacks.delete(gateId);

        resolve(decision);
      });
    });
  }

  /**
   * Provide approval decision
   */
  async provideDecision(gateId: string, decision: ApprovalDecision): Promise<void> {
    const callback = this.approvalCallbacks.get(gateId);
    if (!callback) {
      throw new Error(`No pending approval found for gate: ${gateId}`);
    }

    callback(decision);
  }

  /**
   * Get all pending approvals
   */
  getPendingApprovals(workflowId?: string): ApprovalGate[] {
    const approvals = Array.from(this.pendingApprovals.values());
    
    if (workflowId) {
      return approvals.filter(gate => gate.workflowId === workflowId);
    }
    
    return approvals;
  }

  /**
   * Cancel a pending approval
   */
  cancelApproval(gateId: string): boolean {
    const gate = this.pendingApprovals.get(gateId);
    if (!gate) return false;

    const callback = this.approvalCallbacks.get(gateId);
    if (callback) {
      callback({ approved: false, comment: 'Approval cancelled' });
    }

    return true;
  }

  /**
   * Clear all pending approvals for a workflow
   */
  clearWorkflowApprovals(workflowId: string): void {
    const gates = this.getPendingApprovals(workflowId);
    gates.forEach(gate => this.cancelApproval(gate.id));
  }

  /**
   * Persist approval gate to database
   */
  private persistApproval(gate: ApprovalGate, stepName: string): void {
    try {
      const record: WorkflowApprovalRecord = {
        id: gate.id,
        workflowId: gate.workflowId,
        stepIndex: gate.stepIndex,
        stepName: stepName,
        status: gate.status,
        requestedAt: gate.requestedAt.toISOString(),
        resolvedAt: gate.resolvedAt?.toISOString(),
        resolvedBy: gate.resolvedBy,
        comment: gate.comment,
        data: gate.data ? JSON.stringify(gate.data) : undefined,
      };

      workflowApprovalQueries.create(record);
    } catch (error) {
      console.error('Failed to persist approval gate:', error);
    }
  }

  /**
   * Update approval gate in database
   */
  private updateApproval(gate: ApprovalGate): void {
    try {
      const updates: Partial<WorkflowApprovalRecord> = {
        status: gate.status,
        resolvedAt: gate.resolvedAt?.toISOString(),
        resolvedBy: gate.resolvedBy,
        comment: gate.comment,
      };

      workflowApprovalQueries.update(gate.id, updates);
    } catch (error) {
      console.error('Failed to update approval gate:', error);
    }
  }

  /**
   * Load pending approvals from database
   */
  private loadPendingApprovalsFromDb(): void {
    try {
      const records = workflowApprovalQueries.getPending();
      
      for (const record of records) {
        const gate: ApprovalGate = {
          id: record.id,
          workflowId: record.workflowId,
          stepIndex: record.stepIndex,
          status: record.status,
          requestedAt: new Date(record.requestedAt),
          resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : undefined,
          resolvedBy: record.resolvedBy,
          comment: record.comment,
          data: record.data ? JSON.parse(record.data) : undefined,
        };

        this.pendingApprovals.set(gate.id, gate);
      }
    } catch (error) {
      console.error('Failed to load pending approvals from database:', error);
    }
  }
}

// Singleton instance
export const approvalGateManager = new ApprovalGateManager();
